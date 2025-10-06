import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  Share2,
  MapPin,
  Coffee,
  Save,
  ZoomIn,
  ZoomOut,
  Layers,
  Navigation,
  Target,
  Settings,
  Camera,
} from 'lucide-react';
import { formatDistance, formatTime, formatCalories } from '../utils/format';
import {
  calculateDistance,
  calculateCalories,
  generateSNSShareText,
  evaluateGPSAccuracy,
  calculateGoalAchievement,
  compressPath as compressPathUtil,
} from '../utils/mapRunner';
import {
  captureRunningPhoto,
  downloadRunningPhoto,
  shareRunningPhoto,
} from '../utils/photoOverlay';
import { searchNearbyCafesWithNaver } from '../services/cafeService';
import { saveRunningRecord, compressPath } from '../services/runningService';
import { createFeedPost } from '../services/feedService';
import { createRunningRecordMapImage } from '../services/mapImageService';
import CreatePostModal from '../components/feed/CreatePostModal';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/app';
import {
  playCountdownBeep,
  playStartBeep,
  playSuccessBeep,
  resumeAudioContext,
} from '../utils/audioUtils';
import {
  requestWakeLock,
  releaseWakeLock,
  setupBackgroundTracking,
  cleanupBackgroundTracking,
  requestNotificationPermission,
  showRunningCompleteNotification,
  saveRunningDataToLocal,
  restoreRunningDataFromLocal,
  clearTemporaryRunningData,
  isInBackground,
  initializeServiceWorker,
  startBackgroundRunningTracking,
  stopBackgroundRunningTracking,
  setBackgroundLocationCallback,
  setSyncRunningDataCallback,
  getRunningSessionFromServiceWorker,
  isServiceWorkerActive,
} from '../utils/backgroundService';
import {
  isCapacitorEnvironment,
  initializeCapacitorBackgroundTracking,
  startCapacitorRunningSession,
  stopCapacitorRunningSession,
  restoreCapacitorRunningSession,
  setCapacitorBackgroundUpdateCallback,
  cleanupCapacitorBackgroundService,
} from '../utils/capacitorBackgroundService';

const NavigationPage = () => {
  // 상태 관리
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [path, setPath] = useState([]);
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [mapType, setMapType] = useState('normal'); // 'normal', 'satellite', 'hybrid'
  const [showCafeInfo, setShowCafeInfo] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [cafeMarkers, setCafeMarkers] = useState([]);
  const [userMarker, setUserMarker] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [createPostModal, setCreatePostModal] = useState({
    isOpen: false,
    runningRecord: null,
  });

  // 카운트다운 상태
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(0);

  // 스토어
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();
  const navigate = useNavigate();

  // 지도 관련 refs
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const startMarkerRef = useRef(null);
  const directionMarkerRef = useRef(null);

  // Service Worker 및 백그라운드 서비스 초기화
  useEffect(() => {
    const initializeBackgroundServices = async () => {
      try {
        // 환경별 백그라운드 서비스 초기화
        if (isCapacitorEnvironment()) {
          console.log('Capacitor 환경: 네이티브 백그라운드 서비스 초기화');
          await initializeCapacitorBackgroundTracking();

          // Capacitor 백그라운드 업데이트 콜백 설정
          setCapacitorBackgroundUpdateCallback(data => {
            console.log('Capacitor 백그라운드 위치 업데이트:', data);

            if (data.position) {
              const newPos = new window.naver.maps.LatLng(
                data.position.lat,
                data.position.lng
              );
              setCurrentPosition(newPos);

              // 경로 및 거리 업데이트
              if (data.path) setPath(data.path);
              if (data.distance !== undefined) setTotalDistance(data.distance);
              if (data.duration !== undefined) setElapsedTime(data.duration);
            }
          });

          // Capacitor 세션 복구 시도
          const capacitorSession = restoreCapacitorRunningSession();
          if (capacitorSession && capacitorSession.isTracking) {
            console.log('Capacitor 러닝 세션 복구:', capacitorSession);

            if (capacitorSession.path) setPath(capacitorSession.path);
            if (capacitorSession.distance !== undefined)
              setTotalDistance(capacitorSession.distance);
            if (capacitorSession.startTime)
              setStartTime(capacitorSession.startTime);
            if (capacitorSession.duration !== undefined)
              setElapsedTime(capacitorSession.duration);

            setIsTracking(true);
            showToast('이전 러닝 세션이 복구되었습니다.', 'success');
          }
        } else {
          console.log('웹 환경: Service Worker 백그라운드 서비스 초기화');
          // Service Worker 초기화
          await initializeServiceWorker();
        }

        // 알림 권한 요청
        await requestNotificationPermission();

        // 백그라운드 위치 업데이트 콜백 설정
        setBackgroundLocationCallback(data => {
          console.log('백그라운드 위치 업데이트 수신:', data);

          // 메인 앱 상태 업데이트
          if (data.position) {
            const newPos = new window.naver.maps.LatLng(
              data.position.lat,
              data.position.lng
            );
            setCurrentPosition(newPos);

            // 경로 업데이트
            if (data.path && data.path.length > 0) {
              setPath(data.path);
              updatePolyline(data.path);
            }

            // 거리 및 시간 업데이트
            if (data.distance !== undefined) {
              setTotalDistance(data.distance);
            }

            if (data.duration !== undefined) {
              setElapsedTime(data.duration);
            }
          }
        });

        // 러닝 데이터 동기화 콜백 설정
        setSyncRunningDataCallback(async data => {
          console.log('러닝 데이터 동기화 요청 수신:', data);

          // 백그라운드에서 수집된 데이터를 메인 앱에 동기화
          if (data.path) setPath(data.path);
          if (data.distance !== undefined) setTotalDistance(data.distance);
          if (data.duration !== undefined) setElapsedTime(data.duration);

          // 로컬 스토리지에도 백업
          saveRunningDataToLocal(data);
        });

        // 페이지 로드 시 이전 세션 복구 시도
        const savedSession = await getRunningSessionFromServiceWorker();
        if (savedSession && savedSession.isBackgroundMode) {
          console.log('백그라운드 세션 복구:', savedSession);

          // 세션 데이터 복구
          if (savedSession.path) setPath(savedSession.path);
          if (savedSession.distance !== undefined)
            setTotalDistance(savedSession.distance);
          if (savedSession.startTime) setStartTime(savedSession.startTime);
          if (savedSession.duration !== undefined)
            setElapsedTime(savedSession.duration);

          // 추적 상태 복구
          setIsTracking(true);

          showToast('이전 러닝 세션이 복구되었습니다.', 'success');
        }
      } catch (error) {
        console.error('백그라운드 서비스 초기화 실패:', error);
      }
    };

    initializeBackgroundServices();
  }, [showToast]);

  // 네이버 지도 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (window.naver && window.naver.maps) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
          zoom: 15,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: false,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          // 어두운 테마 스타일 적용
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [
                { invert_lightness: true },
                { saturation: -70 },
                { lightness: -80 },
                { gamma: 0.5 },
              ],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a1a' }, { lightness: -50 }],
            },
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ color: '#4a5568' }, { visibility: 'simplified' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f1419' }],
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#2d3748' }, { lightness: -60 }],
            },
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'transit',
              elementType: 'all',
              stylers: [{ visibility: 'off' }],
            },
          ],
        };

        naverMapRef.current = new window.naver.maps.Map(
          mapRef.current,
          mapOptions
        );

        // 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const currentPos = new window.naver.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              setCurrentPosition(currentPos);
              naverMapRef.current.setCenter(currentPos);

              // 현재 위치 마커 추가 (러닝 테마로 역동적으로)
              const currentUserMarker = new window.naver.maps.Marker({
                position: currentPos,
                map: naverMapRef.current,
                title: '현재 위치',
                icon: {
                  content: `
                    <div style="position: relative;">
                      <!-- 펄스 애니메이션 원형 -->
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 60px;
                        height: 60px;
                        background: rgba(239, 68, 68, 0.2);
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                      "></div>
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 40px;
                        height: 40px;
                        background: rgba(239, 68, 68, 0.3);
                        border-radius: 50%;
                        animation: pulse 2s infinite 0.5s;
                      "></div>
                      <!-- 중앙 러너 마커 -->
                      <div style="
                        position: relative;
                        width: 28px; 
                        height: 28px; 
                        background: #ef4444; 
                        border: 3px solid #ffffff; 
                        border-radius: 50%; 
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                      ">
                        <div style="
                          color: white;
                          font-size: 14px;
                          font-weight: bold;
                        ">🏃</div>
                      </div>
                      <!-- 방향 표시 화살표 -->
                      <div style="
                        position: absolute;
                        top: -6px;
                        right: -6px;
                        width: 18px;
                        height: 18px;
                        background: #10b981;
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                        z-index: 11;
                      ">
                        <div style="
                          color: white;
                          font-size: 10px;
                          transform: rotate(45deg);
                        ">➤</div>
                      </div>
                    </div>
                    <style>
                      @keyframes pulse {
                        0% {
                          transform: translate(-50%, -50%) scale(0.8);
                          opacity: 1;
                        }
                        100% {
                          transform: translate(-50%, -50%) scale(1.2);
                          opacity: 0;
                        }
                      }
                    </style>
                  `,
                  anchor: new window.naver.maps.Point(14, 14),
                },
              });

              setUserMarker(currentUserMarker);
              markersRef.current.push(currentUserMarker);

              // 주변 카페 검색
              searchNearbyCafes(
                position.coords.latitude,
                position.coords.longitude
              );
            },
            error => {
              console.error('위치 정보를 가져올 수 없습니다:', error);
            }
          );
        }
      }
    };

    // 네이버 지도 스크립트 로드
    if (!window.naver) {
      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // 시간 업데이트
  useEffect(() => {
    if (isTracking && !isPaused) {
      intervalIdRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isTracking, isPaused, startTime]);

  // 컴포넌트 언마운트 시 정리 작업
  useEffect(() => {
    return () => {
      // 백그라운드 서비스 정리
      cleanupBackgroundTracking();

      // Capacitor 백그라운드 서비스 정리
      if (isCapacitorEnvironment()) {
        cleanupCapacitorBackgroundService();
      }

      // Wake Lock 해제
      releaseWakeLock();

      console.log('NavigationPage 정리 작업 완료');
    };
  }, []);

  // 기존 마커들 제거
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
    infoWindowsRef.current = [];
  }, []);

  // 개선된 카페 마커 생성
  const createCafeMarkers = useCallback(
    cafes => {
      if (!naverMapRef.current || !window.naver?.maps) return;

      // 기존 카페 마커들만 제거 (사용자 마커는 유지)
      markersRef.current
        .filter(marker => marker.getTitle() !== '현재 위치')
        .forEach(marker => marker.setMap(null));

      markersRef.current = markersRef.current.filter(
        marker => marker.getTitle() === '현재 위치'
      );

      cafes.forEach(cafe => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            cafe.coordinates.lat,
            cafe.coordinates.lng
          ),
          map: naverMapRef.current,
          title: cafe.name,
          icon: {
            content: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: linear-gradient(135deg, #dc2626, #b91c1c); 
              border: 3px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              cursor: pointer;
              position: relative;
              transition: all 0.2s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <span style="color: white; font-size: 18px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">☕</span>
              <div style="
                position: absolute;
                top: -3px;
                right: -3px;
                width: 12px;
                height: 12px;
                background: #10B981;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
            </div>
          `,
            anchor: new window.naver.maps.Point(20, 20),
          },
        });

        // 정보창 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
          <div style="
            padding: 12px; 
            min-width: 200px; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1F2937; flex: 1;">${cafe.name}</h4>
              <span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">OPEN</span>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #F59E0B; margin-right: 4px;">⭐</span>
              <span style="font-size: 13px; font-weight: 600; color: #374151; margin-right: 8px;">4.5</span>
              <span style="font-size: 13px; color: #6B7280;">${cafe.distanceText || '거리 정보 없음'}</span>
            </div>
            
            ${
              cafe.address
                ? `
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280; line-height: 1.4;">
                📍 ${cafe.address}
              </p>
            `
                : ''
            }
            
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
              <span style="background: #F3F4F6; color: #4B5563; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 500;">WiFi</span>
              <span style="background: #F3F4F6; color: #4B5563; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 500;">러너 친화</span>
            </div>
            
            <div style="
              margin-top: 8px; 
              padding: 6px 0; 
              border-top: 1px solid #E5E7EB; 
              font-size: 11px; 
              color: #6B7280; 
              text-align: center;
            ">
              클릭하여 상세 정보 보기 ☕
            </div>
          </div>
        `,
          borderWidth: 0,
          anchorSize: new window.naver.maps.Size(0, 0),
          pixelOffset: new window.naver.maps.Point(0, -15),
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, 'click', () => {
          setSelectedCafe(cafe);
          showToast({
            type: 'info',
            message: `${cafe.name} 정보를 확인하세요.`,
          });
        });

        // 마커 호버 이벤트
        window.naver.maps.Event.addListener(marker, 'mouseover', () => {
          infoWindow.open(naverMapRef.current, marker);
        });

        window.naver.maps.Event.addListener(marker, 'mouseout', () => {
          infoWindow.close();
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
      });
    },
    [showToast]
  );

  // 주변 카페 검색
  const searchNearbyCafes = useCallback(
    async (lat, lng) => {
      try {
        // 네이버 검색 API를 통한 카페 검색 (1km 반경)
        const cafes = await searchNearbyCafesWithNaver(lat, lng, 1000, '카페');

        setNearbyCafes(cafes);
        createCafeMarkers(cafes);

        showToast({
          type: 'success',
          message: `주변 카페 ${cafes.length}곳을 찾았습니다.`,
        });
      } catch (error) {
        console.error('카페 검색 실패:', error);
        // 실패 시 샘플 데이터 사용
        const sampleCafes = [
          {
            id: 'sample_1',
            name: '스타벅스 강남점',
            address: '서울특별시 강남구 테헤란로',
            coordinates: { lat: lat + 0.001, lng: lng + 0.001 },
            distanceText: '100m',
            phone: '02-1234-5678',
            rating: 4.5,
            isOpen: true,
          },
          {
            id: 'sample_2',
            name: '블루보틀 청담점',
            address: '서울특별시 강남구 청담동',
            coordinates: { lat: lat - 0.001, lng: lng + 0.002 },
            distanceText: '200m',
            phone: '02-2345-6789',
            rating: 4.7,
            isOpen: true,
          },
          {
            id: 'sample_3',
            name: '러너스 카페',
            address: '서울특별시 강남구 역삼동',
            coordinates: { lat: lat + 0.002, lng: lng - 0.001 },
            distanceText: '150m',
            phone: '02-3456-7890',
            rating: 4.8,
            isOpen: true,
          },
        ];
        setNearbyCafes(sampleCafes);
        createCafeMarkers(sampleCafes);

        showToast({
          type: 'warning',
          message: '카페 검색 실패. 샘플 데이터를 표시합니다.',
        });
      }
    },
    [createCafeMarkers, showToast]
  );

  // 출발점 마커 생성
  const createStartMarker = position => {
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
    }

    startMarkerRef.current = new window.naver.maps.Marker({
      position: position,
      map: naverMapRef.current,
      title: '출발점',
      icon: {
        content: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: linear-gradient(135deg, #059669, #047857); 
            border: 3px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
          ">
            <span style="
              color: white; 
              font-size: 16px; 
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">🏃</span>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              background: #43e97b;
              color: white;
              padding: 2px 6px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">START</div>
          </div>
        `,
        anchor: new window.naver.maps.Point(16, 16),
      },
    });
  };

  // 방향 화살표 업데이트
  const updateDirectionMarker = (position, heading = 0) => {
    if (userMarker) {
      const directionIcon = {
        content: `
          <div style="
            width: 24px; 
            height: 24px; 
            background: #8b3dff; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: white;
              font-size: 12px;
              font-weight: bold;
              text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            ">📍</div>
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 16px;
              height: 16px;
              background: #43e97b;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transform: rotate(${heading}deg);
            ">
              <div style="
                color: white;
                font-size: 8px;
              ">➤</div>
            </div>
          </div>
        `,
        anchor: new window.naver.maps.Point(12, 12),
      };
      userMarker.setIcon(directionIcon);
      userMarker.setPosition(position);
    }
  };

  // 카운트다운 시작
  const startCountdown = async () => {
    try {
      // 오디오 컨텍스트 활성화 (사용자 상호작용 필요)
      await resumeAudioContext();

      // 알림 권한 요청
      await requestNotificationPermission();

      // Wake Lock 요청 (화면 꺼짐 방지)
      await requestWakeLock();

      setIsCountingDown(true);

      // 3-2-1 카운트다운
      for (let i = 3; i >= 1; i--) {
        setCountdownNumber(i);
        playCountdownBeep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 시작 효과음
      playStartBeep();
      setCountdownNumber(0);
      setIsCountingDown(false);

      // 실제 추적 시작
      startTracking();
    } catch (error) {
      console.error('카운트다운 시작 실패:', error);
      setIsCountingDown(false);
      showToast({
        type: 'error',
        message: '러닝 시작에 실패했습니다.',
      });
    }
  };

  // 위치 추적 시작
  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    const currentTime = Date.now();
    setIsTracking(true);
    setIsPaused(false);
    setStartTime(currentTime);
    setPath([]);
    setTotalDistance(0);

    // 환경별 백그라운드 추적 시작
    const sessionData = {
      startTime: currentTime,
      path: [],
      distance: 0,
      duration: 0,
      currentSpeed: 0,
      maxSpeed: 0,
      isTracking: true,
      isPaused: false,
    };

    let backgroundTrackingStarted = false;

    if (isCapacitorEnvironment()) {
      // Capacitor 환경: 네이티브 백그라운드 추적
      backgroundTrackingStarted =
        await startCapacitorRunningSession(sessionData);
      if (backgroundTrackingStarted) {
        console.log('Capacitor 백그라운드 추적 시작됨');
        showToast('네이티브 백그라운드 추적이 활성화되었습니다.', 'success');
      }
    } else {
      // 웹 환경: Service Worker 백그라운드 추적
      backgroundTrackingStarted =
        await startBackgroundRunningTracking(sessionData);
      if (backgroundTrackingStarted) {
        console.log('Service Worker 백그라운드 추적 시작됨');
        showToast('웹 백그라운드 추적이 활성화되었습니다.', 'success');
      }
    }

    if (!backgroundTrackingStarted) {
      console.log('백그라운드 추적 시작 실패, 기본 모드 사용');
      showToast('기본 추적 모드로 시작합니다.', 'info');
    }

    // 기존 백그라운드 추적 설정 (폴백)
    setupBackgroundTracking(
      isVisible => {
        console.log('페이지 가시성 변경:', isVisible ? '보임' : '숨김');

        if (!isVisible && isTracking && !isPaused) {
          // 백그라운드로 이동 시 현재 데이터 저장
          const currentSessionData = {
            startTime,
            elapsedTime,
            totalDistance,
            path,
            currentSpeed,
            maxSpeed,
            speedHistory,
            isTracking: true,
            isPaused: false,
          };

          saveRunningDataToLocal(currentSessionData);

          // Service Worker가 활성화되어 있지 않으면 폴백 모드 사용
          if (!isServiceWorkerActive()) {
            console.log('Service Worker 비활성화, 폴백 백그라운드 추적 사용');
          }
        }
      },
      {
        onBackgroundStart: () => {
          console.log('폴백 백그라운드 추적 시작');
        },
        onBackgroundUpdate: () => {
          // 백그라운드에서 주기적으로 위치 업데이트
          if (isTracking && !isPaused && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              position => {
                const newPosition = new window.naver.maps.LatLng(
                  position.coords.latitude,
                  position.coords.longitude
                );

                if (currentPosition) {
                  const distance = calculateDistance(
                    currentPosition,
                    newPosition
                  );
                  if (distance > 5) {
                    // 5m 이상 이동 시에만 업데이트
                    setCurrentPosition(newPosition);

                    // GPS 정확도 업데이트
                    const accuracy = position.coords.accuracy;
                    setGpsAccuracy(accuracy);

                    const speed = position.coords.speed || 0;
                    setCurrentSpeed(speed);
                    setMaxSpeed(prev => Math.max(prev, speed));

                    // 경로 업데이트
                    setPath(prevPath => {
                      const newPath = [...prevPath, newPosition];

                      // 거리 계산
                      if (prevPath.length > 0) {
                        const lastPos = prevPath[prevPath.length - 1];
                        const distanceCalc = calculateDistanceForNaverMap(
                          lastPos,
                          newPosition
                        );

                        if (accuracy <= 20) {
                          setTotalDistance(prev => prev + distanceCalc);
                        }
                      }

                      return newPath;
                    });
                  }
                }
              },
              error => console.error('백그라운드 위치 추적 오류:', error),
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
              }
            );
          }
        },
        onForegroundReturn: () => {
          console.log('포그라운드 복귀');
          // 로컬에 저장된 데이터가 있다면 복구
          const savedData = restoreRunningDataFromLocal();
          if (savedData && savedData.isBackup) {
            console.log('백그라운드 데이터 복구:', savedData);
            // 필요시 데이터 동기화
          }
        },
        onBeforeUnload: () => {
          // 페이지 종료 전 데이터 저장
          if (isTracking) {
            saveRunningDataToLocal({
              startTime,
              elapsedTime,
              totalDistance,
              path,
              currentSpeed,
              maxSpeed,
              speedHistory,
              isEmergencyBackup: true,
            });
          }
        },
      }
    );

    // 출발점 마커 생성
    if (currentPosition) {
      createStartMarker(currentPosition);
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const newPos = new window.naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );

        setCurrentPosition(newPos);

        // GPS 정확도 업데이트
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);

        const speed = position.coords.speed || 0;
        const heading = position.coords.heading || 0;
        setCurrentSpeed(speed);
        setMaxSpeed(prev => Math.max(prev, speed));

        // 방향 화살표가 포함된 현재 위치 마커 업데이트
        updateDirectionMarker(newPos, heading);

        // 속도 히스토리 업데이트
        setSpeedHistory(prev => {
          const newHistory = [...prev, speed];
          // 최근 100개 데이터만 유지
          return newHistory.length > 100 ? newHistory.slice(-100) : newHistory;
        });

        if (!isPaused) {
          setPath(prevPath => {
            const newPath = [...prevPath, newPos];

            // 거리 계산 (네이버 지도 LatLng 객체용 함수 사용)
            if (prevPath.length > 0) {
              const lastPos = prevPath[prevPath.length - 1];
              const distance = calculateDistanceForNaverMap(lastPos, newPos);

              // GPS 정확도가 낮을 때는 거리 계산을 더 보수적으로
              if (accuracy <= 20) {
                setTotalDistance(prev => prev + distance);
              }
            }

            // 폴리라인 업데이트
            updatePolyline(newPath);

            return newPath;
          });

          // 지도 중심을 현재 위치로 이동 (부드럽게)
          naverMapRef.current.panTo(newPos);
        }
      },
      error => {
        console.error('위치 추적 오류:', error);
      },
      options
    );
  };

  // 위치 추적 일시정지/재개
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 러닝 사진 촬영
  const handleRunningPhotoCapture = async () => {
    try {
      const runningData = {
        distance: totalDistance,
        duration: elapsedTime,
        pace: totalDistance > 0 ? elapsedTime / 60 / (totalDistance / 1000) : 0,
        calories: calculateCalories(totalDistance, elapsedTime),
        date: new Date(),
      };

      showToast('사진을 촬영해주세요', 'info');

      const photoBlob = await captureRunningPhoto(runningData, {
        position: 'bottom',
        theme: 'dark',
        showLogo: true,
        customText: isTracking ? '러닝 중! 💪' : '러닝 완료! 🎉',
      });

      // 사진 공유 또는 다운로드
      const shared = await shareRunningPhoto(photoBlob, runningData);
      if (shared) {
        showToast('사진이 공유되었습니다!', 'success');
      } else {
        showToast('사진이 저장되었습니다!', 'success');
      }
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      showToast('사진 촬영에 실패했습니다', 'error');
    }
  };

  // 위치 추적 중지
  const stopTracking = async () => {
    setIsTracking(false);
    setIsPaused(false);
    setEndTime(Date.now());

    // 환경별 백그라운드 추적 중지
    let backgroundTrackingStopped = false;

    if (isCapacitorEnvironment()) {
      // Capacitor 환경: 네이티브 백그라운드 추적 중지
      backgroundTrackingStopped = await stopCapacitorRunningSession();
      if (backgroundTrackingStopped) {
        console.log('Capacitor 백그라운드 추적 중지됨');
      }
    } else {
      // 웹 환경: Service Worker 백그라운드 추적 중지
      backgroundTrackingStopped = await stopBackgroundRunningTracking();
      if (backgroundTrackingStopped) {
        console.log('Service Worker 백그라운드 추적 중지됨');
      }
    }

    // 임시 저장된 러닝 데이터 정리
    clearTemporaryRunningData();

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // 백그라운드 서비스 정리
    cleanupBackgroundTracking();
    await releaseWakeLock();

    // 성공 효과음
    if (totalDistance > 0 || elapsedTime > 0) {
      playSuccessBeep();

      // 완료 알림
      const timeText = formatTime(elapsedTime);
      showRunningCompleteNotification(totalDistance, timeText);
    }
  };

  // 러닝 기록 저장 (개선된 버전)
  const saveRecord = async () => {
    console.log('=== 러닝 기록 저장 시작 ===');
    console.log('인증 상태:', isAuthenticated());
    console.log('사용자 정보:', user);
    console.log('총 거리:', totalDistance);
    console.log('경로 점 개수:', path.length);

    if (!isAuthenticated() || !user) {
      showToast({
        type: 'error',
        message: '로그인이 필요합니다.',
      });
      return;
    }

    // 기본 유효성 검사 (거리 0도 허용, 경로 없어도 허용)
    // 시간이 없으면 최소 기본값 설정
    if (elapsedTime === 0 && (!startTime || !endTime)) {
      showToast({
        type: 'error',
        message: '러닝 시간이 기록되지 않았습니다. 시작 버튼을 눌러주세요.',
      });
      return;
    }

    setIsSaving(true);

    // 타임아웃 설정 (30초)
    const timeoutId = setTimeout(() => {
      setIsSaving(false);
      showToast({
        type: 'error',
        message: '저장 시간이 초과되었습니다. 다시 시도해주세요.',
      });
    }, 30000);

    try {
      // 시간 및 거리 기본값 설정
      const actualDuration =
        elapsedTime || (endTime && startTime ? endTime - startTime : 30000); // 최소 30초
      const actualDistance = totalDistance || 0; // 거리 0 허용
      const actualPath = path && path.length > 0 ? path : []; // 경로 비어있어도 허용

      // 경로 데이터 압축 (성능 향상)
      const compressedPath =
        actualPath.length > 0
          ? compressPath(
              actualPath.map(pos => ({
                lat: typeof pos.lat === 'function' ? pos.lat() : pos.lat,
                lng: typeof pos.lng === 'function' ? pos.lng() : pos.lng,
              })),
              0.0005 // 더 큰 허용 오차로 압축률 높임
            )
          : [];

      const runningData = {
        userId: user.id,
        startTime: new Date(
          startTime || Date.now() - actualDuration
        ).toISOString(),
        endTime: new Date(endTime || Date.now()).toISOString(),
        duration: actualDuration,
        distance: actualDistance,
        calories: actualDistance > 0 ? getCalculatedCalories() : 50, // 기본 50 칼로리
        averageSpeed:
          actualDistance > 0 && actualDuration > 0
            ? actualDistance / (actualDuration / 1000)
            : 0,
        maxSpeed: maxSpeed || 0,
        path: compressedPath,
        nearbyCafes: nearbyCafes
          ? nearbyCafes.slice(0, 5).map(cafe => ({
              // 최대 5개만 저장
              id: cafe.id,
              name: cafe.name,
              address: cafe.address,
              coordinates: cafe.coordinates,
              distanceText: cafe.distanceText,
            }))
          : [],
      };

      console.log('저장할 러닝 데이터:', runningData);
      console.log('압축된 경로 점 개수:', compressedPath.length);

      // 단계별 진행 상황 표시
      showToast({
        type: 'info',
        message: '러닝 기록을 저장하는 중...',
      });

      const savedRecord = await saveRunningRecord(runningData);
      console.log('저장된 기록:', savedRecord);

      // 타임아웃 해제
      clearTimeout(timeoutId);

      if (savedRecord) {
        showToast({
          type: 'success',
          message: '🎉 러닝 기록이 성공적으로 저장되었습니다!',
        });

        // 바로 업로드 모달 열기 (허락 모달 없이)
        setCreatePostModal({
          isOpen: true,
          runningRecord: savedRecord,
        });

        // 상태 초기화
        resetTrackingState();
      } else {
        throw new Error('저장된 기록이 없습니다');
      }
    } catch (error) {
      console.error('러닝 기록 저장 실패:', error);
      clearTimeout(timeoutId);

      // 더 구체적인 에러 메시지 제공
      let errorMessage = '러닝 기록 저장에 실패했습니다.';
      if (error.message.includes('network')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '저장 시간이 초과되었습니다. 다시 시도해주세요.';
      } else if (error.message.includes('storage')) {
        errorMessage = '저장 공간이 부족합니다.';
      }

      showToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
      console.log('=== 러닝 기록 저장 완료 ===');
    }
  };

  // 공유 옵션 선택 모달 (사용하지 않음 - 바로 모달 열기로 변경)
  const showShareOptions = savedRecord => {
    // 더 이상 사용하지 않음 - 바로 'modal' 반환
    return Promise.resolve('modal');
  };

  // 포스트 작성 모달 닫기
  const handleCloseCreatePostModal = (isPosted = false) => {
    setCreatePostModal({
      isOpen: false,
      runningRecord: null,
    });

    // 포스트가 성공적으로 작성되었으면 피드 페이지로 이동
    if (isPosted) {
      showToast({
        type: 'success',
        message: '🎉 피드에 성공적으로 공유되었습니다!',
      });

      setTimeout(() => {
        navigate('/feed');
      }, 1500); // 1.5초 후 이동
    }
  };

  // 피드에 러닝 기록 공유
  const handleShareToFeed = async savedRecord => {
    try {
      showToast({
        type: 'info',
        message: '지도 이미지를 생성하고 있습니다...',
      });

      // 자동 생성된 캡션
      const distance = (savedRecord.distance / 1000).toFixed(1);
      const duration = formatTime(savedRecord.duration);
      const pace = Math.round(
        savedRecord.duration / 1000 / 60 / (savedRecord.distance / 1000)
      );

      const caption = `오늘 ${distance}km 러닝 완주! 🏃‍♀️\n시간: ${duration}\n페이스: ${pace}'00"/km\n\n#러닝 #운동 #건강 #러닝기록 #RunningCafe`;

      // 지도 이미지 생성 개선
      let mapImage = null;
      try {
        if (savedRecord.path && savedRecord.path.length > 0) {
          console.log('지도 이미지 생성 시작...');
          console.log('저장된 경로 데이터:', savedRecord.path);
          console.log('주변 카페 데이터:', savedRecord.nearbyCafes);

          mapImage = await createRunningRecordMapImage({
            path: savedRecord.path,
            nearbyCafes: savedRecord.nearbyCafes || [],
            distance: savedRecord.distance,
            duration: savedRecord.duration,
          });

          console.log('지도 이미지 생성 완료:', mapImage);
          console.log('이미지 파일 크기:', mapImage.size, 'bytes');
        } else {
          console.warn('경로 데이터가 비어있음 - 기본 이미지 생성');
          // 경로가 비어있어도 의미있는 기본 이미지 생성
          mapImage = await createRunningRecordMapImage({
            path: [],
            nearbyCafes: savedRecord.nearbyCafes || [],
            distance: savedRecord.distance,
            duration: savedRecord.duration,
            title:
              savedRecord.distance > 0
                ? `${(savedRecord.distance / 1000).toFixed(1)}km 러닝`
                : '러닝 기록',
            isEmptyPath: true, // 빈 경로 플래그
          });
        }
      } catch (imageError) {
        console.error('지도 이미지 생성 실패:', imageError);
        // 이미지 생성 실패해도 포스트는 계속 진행
        mapImage = null;
      }

      const postData = {
        user_id: user.id,
        running_record_id: savedRecord.id,
        caption: caption,
        images: mapImage ? [mapImage] : [], // 생성된 지도 이미지 포함
        hashtags: ['러닝', '운동', '건강', '러닝기록', 'RunningCafe'],
        location: nearbyCafes.length > 0 ? nearbyCafes[0].address : '',
        is_achievement: savedRecord.distance >= 5000, // 5km 이상이면 달성 기록으로 표시
      };

      console.log('피드 포스트 데이터 상세:', {
        ...postData,
        images: postData.images.map(img => ({
          name: img.name,
          size: img.size,
          type: img.type,
        })),
      });

      // 이미지가 제대로 생성되었는지 추가 검증
      if (mapImage) {
        console.log('지도 이미지 최종 검증:', {
          isFile: mapImage instanceof File,
          hasBlob: mapImage instanceof Blob,
          size: mapImage.size,
          type: mapImage.type,
          name: mapImage.name,
        });
      }

      console.log('피드 포스트 데이터:', postData);

      const result = await createFeedPost(postData);

      if (result.success) {
        const successMessage = mapImage
          ? `🗺️ 지도 이미지와 함께 피드에 공유되었습니다! 🎉`
          : `피드에 공유되었습니다! 🎉`;

        showToast({
          type: 'success',
          message: successMessage,
        });

        console.log('피드 공유 성공:', result);

        // 피드 공유 성공 시 피드 페이지로 이동
        setTimeout(() => {
          navigate('/feed');
        }, 1500); // 1.5초 후 이동 (토스트 메시지 확인 시간)
      } else {
        console.error('피드 공유 실패 결과:', result);
        throw new Error(result.error || '피드 공유에 실패했습니다.');
      }
    } catch (error) {
      console.error('피드 공유 실패:', error);
      showToast({
        type: 'error',
        message: '피드 공유에 실패했습니다.',
      });
    }
  };

  // 테스트용 더미 데이터 생성 (개발용)
  const createTestRecord = async () => {
    if (!isAuthenticated() || !user) {
      showToast({
        type: 'error',
        message: '로그인이 필요합니다.',
      });
      return;
    }

    try {
      const testData = {
        userId: user.id,
        startTime: new Date(Date.now() - 1800000).toISOString(), // 30분 전
        endTime: new Date().toISOString(),
        duration: 1800000, // 30분 (밀리초)
        distance: 5000, // 5km (미터)
        calories: 300,
        averageSpeed: 2.78, // 약 10km/h
        maxSpeed: 4.17, // 약 15km/h
        path: [
          { lat: 37.5665, lng: 126.978 },
          { lat: 37.5675, lng: 126.979 },
          { lat: 37.5685, lng: 126.98 },
        ],
        nearbyCafes: [],
      };

      console.log('테스트 데이터 생성 중...');
      const savedRecord = await saveRunningRecord(testData);

      if (savedRecord) {
        showToast({
          type: 'success',
          message: '테스트 러닝 기록이 생성되었습니다!',
        });
      }
    } catch (error) {
      console.error('테스트 기록 생성 실패:', error);
      showToast({
        type: 'error',
        message: `테스트 기록 생성 실패: ${error.message}`,
      });
    }
  };

  // 추적 상태 초기화
  const resetTrackingState = () => {
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
    setTotalDistance(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setPath([]);
    setSpeedHistory([]);
    setGpsAccuracy(null);

    // 폴리라인 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 출발점 마커 제거
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
      startMarkerRef.current = null;
    }
  };

  // 폴리라인 업데이트 (메인 컬러 적용)
  const updatePolyline = pathArray => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (pathArray.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: pathArray,
        strokeColor: '#8b3dff', // 프로젝트 메인 컬러 (primary-500)
        strokeWeight: 5,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
      });
    }
  };

  // 두 지점 간 거리 계산 (미터) - 네이버 지도 LatLng 객체용
  const calculateDistanceForNaverMap = (pos1, pos2) => {
    const R = 6371e3; // 지구 반지름 (미터)

    // 네이버 지도 LatLng 객체인지 확인하고 적절히 처리
    const lat1 = typeof pos1.lat === 'function' ? pos1.lat() : pos1.lat;
    const lng1 = typeof pos1.lng === 'function' ? pos1.lng() : pos1.lng;
    const lat2 = typeof pos2.lat === 'function' ? pos2.lat() : pos2.lat;
    const lng2 = typeof pos2.lng === 'function' ? pos2.lng() : pos2.lng;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 개선된 칼로리 계산
  const getCalculatedCalories = useCallback(() => {
    return calculateCalories(totalDistance, 70, 'running');
  }, [totalDistance]);

  // 지도 줌 컨트롤
  const handleZoomIn = useCallback(() => {
    if (naverMapRef.current && currentZoom < 19) {
      const newZoom = currentZoom + 1;
      naverMapRef.current.setZoom(newZoom, true);
      setCurrentZoom(newZoom);
    }
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    if (naverMapRef.current && currentZoom > 10) {
      const newZoom = currentZoom - 1;
      naverMapRef.current.setZoom(newZoom, true);
      setCurrentZoom(newZoom);
    }
  }, [currentZoom]);

  // 지도 타입 변경
  const handleMapTypeChange = useCallback(() => {
    if (!naverMapRef.current) return;

    const nextType = {
      normal: 'satellite',
      satellite: 'hybrid',
      hybrid: 'normal',
    };

    const newMapType = nextType[mapType];
    setMapType(newMapType);

    // 네이버 지도 타입 설정
    const naverMapType = {
      normal: window.naver.maps.MapTypeId.NORMAL,
      satellite: window.naver.maps.MapTypeId.SATELLITE,
      hybrid: window.naver.maps.MapTypeId.HYBRID,
    };

    naverMapRef.current.setMapTypeId(naverMapType[newMapType]);

    const typeNames = {
      normal: '일반 지도',
      satellite: '위성 지도',
      hybrid: '하이브리드 지도',
    };

    showToast({
      type: 'info',
      message: `${typeNames[newMapType]}로 변경되었습니다.`,
    });
  }, [mapType, showToast]);

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (naverMapRef.current && currentPosition) {
      naverMapRef.current.setCenter(currentPosition);
      naverMapRef.current.setZoom(16, true);
      showToast({
        type: 'info',
        message: '현재 위치로 이동했습니다.',
      });
    }
  }, [currentPosition, showToast]);

  // 카페 정보 토글
  const toggleCafeInfo = useCallback(() => {
    setShowCafeInfo(!showCafeInfo);
    showToast({
      type: 'info',
      message: showCafeInfo
        ? '카페 정보를 숨겼습니다.'
        : '카페 정보를 표시합니다.',
    });
  }, [showCafeInfo, showToast]);

  // 지도 캡처 기능
  const captureMapWithRunningRecord = useCallback(async () => {
    if (!naverMapRef.current) {
      showToast({
        type: 'error',
        message: '지도가 준비되지 않았습니다.',
      });
      return;
    }

    try {
      showToast({
        type: 'info',
        message: '📸 지도를 캡처하는 중...',
      });

      // html2canvas 동적 import
      const html2canvas = (await import('html2canvas')).default;

      // 지도 컨테이너 캡처
      const mapElement = mapRef.current;
      if (!mapElement) {
        throw new Error('지도 요소를 찾을 수 없습니다.');
      }

      // 캡처 옵션 설정
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 고해상도
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Canvas를 Blob으로 변환
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 0.9);
      });

      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다.');
      }

      // 러닝 기록 정보를 오버레이로 추가
      const overlayCanvas = document.createElement('canvas');
      const ctx = overlayCanvas.getContext('2d');

      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;

      // 원본 지도 이미지 그리기
      ctx.drawImage(canvas, 0, 0);

      // 러닝 기록 정보 오버레이 추가
      if (totalDistance > 0 || elapsedTime > 0) {
        const padding = 40;
        const boxWidth = 320;
        const boxHeight = 160;
        const x = overlayCanvas.width - boxWidth - padding;
        const y = padding;

        // 반투명 배경 박스
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

        // roundRect 폴리필 (브라우저 호환성)
        const drawRoundRect = (ctx, x, y, width, height, radius) => {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
          );
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        };

        drawRoundRect(ctx, x, y, boxWidth, boxHeight, 12);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트 스타일 설정
        ctx.fillStyle = '#1F2937';
        ctx.textAlign = 'left';

        // 제목
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('🏃‍♀️ 러닝 기록', x + 20, y + 35);

        // 기록 정보
        ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
        const lineHeight = 25;
        let currentY = y + 70;

        const records = [
          `⏱️ 시간: ${formatTime(elapsedTime)}`,
          `📏 거리: ${formatDistance(totalDistance)}`,
          `🔥 칼로리: ${getCalculatedCalories()}kcal`,
          `⚡ 속도: ${(currentSpeed * 3.6).toFixed(1)}km/h`,
        ];

        records.forEach((record, index) => {
          ctx.fillText(record, x + 20, currentY + index * lineHeight);
        });

        // 날짜 및 시간
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#6B7280';
        const now = new Date();
        const dateStr = now.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        ctx.fillText(dateStr, x + 20, y + boxHeight - 15);
      }

      // 최종 이미지를 Blob으로 변환
      const finalBlob = await new Promise(resolve => {
        overlayCanvas.toBlob(resolve, 'image/png', 0.9);
      });

      // 파일명 생성
      const now = new Date();
      const fileName = `running_record_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.png`;

      // 다운로드 링크 생성
      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        message: '📸 러닝 기록이 캡처되어 저장되었습니다!',
      });

      // 공유 옵션 제공
      if (
        navigator.share &&
        navigator.canShare({
          files: [new File([finalBlob], fileName, { type: 'image/png' })],
        })
      ) {
        setTimeout(async () => {
          try {
            const file = new File([finalBlob], fileName, { type: 'image/png' });
            await navigator.share({
              title: '러닝 기록',
              text: `🏃‍♀️ ${formatDistance(totalDistance)} 러닝 완주! ${formatTime(elapsedTime)}`,
              files: [file],
            });
          } catch (shareError) {
            console.log('공유 취소됨:', shareError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('지도 캡처 실패:', error);
      showToast({
        type: 'error',
        message: '지도 캡처에 실패했습니다. 다시 시도해주세요.',
      });
    }
  }, [
    naverMapRef,
    totalDistance,
    elapsedTime,
    currentSpeed,
    getCalculatedCalories,
    showToast,
  ]);

  // Instagram 공유를 위한 이미지 및 텍스트 준비
  const shareToInstagram = async () => {
    if (totalDistance === 0 && elapsedTime === 0) {
      showToast({
        type: 'error',
        message: '공유할 러닝 기록이 없습니다.',
      });
      return;
    }

    try {
      showToast({
        type: 'info',
        message: 'Instagram 공유를 준비하고 있습니다...',
      });

      const runningTime = formatTime(elapsedTime);
      const distance = formatDistance(totalDistance);
      const calories = getCalculatedCalories();
      const avgSpeed =
        totalDistance > 0
          ? (totalDistance / 1000 / (elapsedTime / 3600000)).toFixed(1)
          : '0.0';

      // Instagram용 해시태그와 쪽션 생성
      const instagramCaption =
        totalDistance > 0
          ? `🏃‍♀️ 오늘 ${distance} 러닝 완주! 💪\n\n⏱️ 시간: ${runningTime}\n📏 거리: ${distance}\n🔥 칼로리: ${calories}kcal\n⚡ 평균 속도: ${avgSpeed}km/h\n\n${nearbyCafes.length > 0 ? `☕ 주변 카페 ${nearbyCafes.length}곳 발견!\n` : ''}🏃 #러닝 #운동 #건강 #러닝기록 #RunningCafe #오늘도달리기 #피트니스 #운동스타그램 #러닝맨 #러닝우먼`
          : `🏃‍♀️ 오늘 러닝 운동 완료! 💪\n\n⏱️ 시간: ${runningTime}\n💪 운동 기록을 남겼어요!\n\n${nearbyCafes.length > 0 ? `☕ 주변 카페 ${nearbyCafes.length}곳 발견!\n` : ''}🏃 #러닝 #운동 #건강 #러닝기록 #RunningCafe #오늘도달리기 #피트니스 #운동스타그램 #러닝맨 #러닝우먼`;

      // 클립보드에 쪽션 복사
      await navigator.clipboard.writeText(instagramCaption);

      // Instagram 웹 사이트 열기
      const instagramUrl = 'https://www.instagram.com/';
      const newWindow = window.open(instagramUrl, '_blank');

      showToast({
        type: 'success',
        message:
          '📱 Instagram이 열렸습니다! 쪽션이 복사되었으니 붙여넣기 하세요.',
      });

      // 추가 안내 메시지
      setTimeout(() => {
        showToast({
          type: 'info',
          message:
            '📝 새 게시물 작성 → 쪽션 붙여넣기 → 사진 추가 후 게시하세요!',
        });
      }, 2000);
    } catch (error) {
      console.error('Instagram 공유 준비 실패:', error);

      // 폴백: 수동 복사 안내
      const fallbackText =
        totalDistance > 0
          ? `🏃‍♀️ 오늘 ${formatDistance(totalDistance)} 러닝 완주! 💪\n\n⏱️ ${formatTime(elapsedTime)} | 🔥 ${getCalculatedCalories()}kcal\n\n#러닝 #운동 #건강 #RunningCafe`
          : `🏃‍♀️ 오늘 러닝 운동! 💪\n\n⏱️ ${formatTime(elapsedTime)} 동안 운동했어요!\n\n#러닝 #운동 #건강 #RunningCafe`;

      if (window.prompt) {
        window.prompt(
          '아래 내용을 복사해서 Instagram에 공유하세요:',
          fallbackText
        );
      } else {
        showToast({
          type: 'error',
          message: 'Instagram 공유를 준비할 수 없습니다.',
        });
      }
    }
  };

  // 일반 SNS 공유 (기존 기능)
  const shareToSNS = async () => {
    if (totalDistance === 0 && elapsedTime === 0) {
      showToast({
        type: 'error',
        message: '공유할 러닝 기록이 없습니다.',
      });
      return;
    }

    const runningTime = formatTime(elapsedTime);
    const distance = formatDistance(totalDistance);
    const calories = getCalculatedCalories();
    const avgSpeed =
      totalDistance > 0
        ? (totalDistance / 1000 / (elapsedTime / 3600000)).toFixed(1)
        : '0.0';

    const summary = {
      distance,
      duration: runningTime,
      avgSpeed: `${avgSpeed}km/h`,
      calories: `${calories}kcal`,
    };

    const shareText = generateSNSShareText(summary, nearbyCafes);

    const shareData = {
      title: 'Running View - 내 러닝 기록',
      text: shareText,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // 폴백: 클립보드에 복사
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);

        showToast({
          type: 'success',
          message: '공유 내용이 클립보드에 복사되었습니다!',
        });
      }
    } catch (error) {
      console.error('공유 실패:', error);

      // 최종 폴백: 텍스트 선택 가능한 모달 표시
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;

      // 간단한 프롬프트로 폴백
      if (window.prompt) {
        window.prompt('아래 내용을 복사해서 공유하세요:', shareText);
      } else {
        showToast({
          type: 'error',
          message: '공유 기능을 사용할 수 없습니다.',
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      {/* 트렌디한 모바일 헤더 */}
      <div className="bg-white shadow-sm relative">
        {/* 그라데이션 상단 라인 */}
        <div className="h-1 bg-gray-700" />

        <div className="px-4 py-3 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center space-x-3">
            {/* 미니 로고 */}
            {/* <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🗺️</span>
            </div> */}
            <div>
              <h1 className="text-lg font-bold text-gray-900">러닝 맵</h1>
              <p className="text-xs text-purple-600 font-medium -mt-1">
                Run View
              </p>
            </div>
          </Link>

          {/* 상태 표시 */}
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isTracking
                  ? isPaused
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isTracking
                ? isPaused
                  ? '⏸️ 일시정지'
                  : '🏃‍♀️ 추적중'
                : '⏹️ 대기중'}
            </div>
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        />

        {/* 지도 컨트롤 버튼들 - 개선된 디자인 */}
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          {/* 사진 촬영 버튼 */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <button
              onClick={handleRunningPhotoCapture}
              className="w-12 h-12 flex items-center justify-center hover:bg-red-50 transition-all duration-200 text-red-600"
              title="러닝 사진 촬영"
            >
              <Camera size={20} />
            </button>
          </div>

          {/* 줌 컨트롤 */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <button
              onClick={handleZoomIn}
              className="w-12 h-12 flex items-center justify-center hover:bg-purple-50 transition-all duration-200 border-b border-gray-100/50"
              disabled={currentZoom >= 19}
            >
              <ZoomIn
                size={20}
                className={
                  currentZoom >= 19 ? 'text-gray-300' : 'text-purple-600'
                }
              />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-12 h-12 flex items-center justify-center hover:bg-purple-50 transition-all duration-200"
              disabled={currentZoom <= 10}
            >
              <ZoomOut
                size={20}
                className={
                  currentZoom <= 10 ? 'text-gray-300' : 'text-purple-600'
                }
              />
            </button>
          </div>

          {/* 지도 타입 변경 */}
          {/* <button
            onClick={handleMapTypeChange}
            className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center hover:bg-purple-50 transition-all duration-200 border border-white/20"
            title={`현재: ${mapType === 'normal' ? '일반' : mapType === 'satellite' ? '위성' : '하이브리드'}`}
          >
            <Layers size={20} className="text-purple-600" />
          </button> */}

          {/* 현재 위치로 이동 */}
          <button
            onClick={moveToCurrentLocation}
            className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-50 transition-all duration-200 border border-white/20"
            disabled={!currentPosition}
          >
            <Target
              size={20}
              className={!currentPosition ? 'text-gray-300' : 'text-blue-500'}
            />
          </button>

          {/* 카페 정보 토글 */}
          <button
            onClick={toggleCafeInfo}
            className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 border border-white/20 ${
              showCafeInfo
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-white/90 backdrop-blur-md text-orange-500 hover:bg-orange-50'
            }`}
          >
            <Coffee size={20} />
          </button>
        </div>

        {/* 간단한 통계 카드 */}
        <div className="absolute top-4 left-4 right-20 bg-white rounded-lg shadow-md">
          <div className="p-3">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-black">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-xs text-black">시간</div>
              </div>
              <div>
                <div className="text-lg font-bold text-black">
                  {formatDistance(totalDistance)}
                </div>
                <div className="text-xs text-black">거리</div>
              </div>
              <div>
                <div className="text-lg font-bold text-black">
                  {getCalculatedCalories()}
                </div>
                <div className="text-xs text-black">칼로리</div>
              </div>
              <div>
                <div className="text-lg font-bold text-black">
                  {(currentSpeed * 3.6).toFixed(1)}
                </div>
                <div className="text-xs text-black">km/h</div>
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 카페 상세 정보 */}
        {selectedCafe && (
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coffee size={20} className="text-orange-500" />
                  <h3 className="font-bold text-lg">{selectedCafe.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedCafe(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">
                    {selectedCafe.rating || '4.5'}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-600">
                    {selectedCafe.distanceText || '거리 정보 없음'}
                  </span>
                </div>

                {selectedCafe.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      {selectedCafe.address}
                    </span>
                  </div>
                )}

                {selectedCafe.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📞</span>
                    <span className="text-sm text-blue-600">
                      {selectedCafe.phone}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedCafe.phone && (
                  <button
                    onClick={() => window.open(`tel:${selectedCafe.phone}`)}
                    className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    📞 전화하기
                  </button>
                )}
                <button
                  onClick={() => {
                    const url = `https://map.naver.com/v5/search/${encodeURIComponent(selectedCafe.name)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  🗺️ 네이버지도
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: selectedCafe.name,
                          text: `${selectedCafe.name} - 러닝 후 추천 카페`,
                          url: window.location.href,
                        })
                        .catch(console.error);
                    } else {
                      navigator.clipboard.writeText(
                        `${selectedCafe.name} - ${selectedCafe.address}`
                      );
                      showToast({
                        type: 'success',
                        message: '카페 정보가 클립보드에 복사되었습니다.',
                      });
                    }
                  }}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 주변 카페 리스트 */}
        {!selectedCafe && nearbyCafes.length > 0 && showCafeInfo && (
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg max-h-40 overflow-y-auto">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee size={16} className="text-orange-500" />
                  <span className="font-medium text-sm">
                    주변 카페 ({nearbyCafes.length}곳)
                  </span>
                </div>
                <button
                  onClick={() => setShowCafeInfo(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            {nearbyCafes.map(cafe => (
              <div
                key={cafe.id}
                className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedCafe(cafe)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{cafe.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cafe.address}
                    </div>
                    {cafe.phone && (
                      <div className="text-xs text-blue-500 mt-1">
                        {cafe.phone}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 text-right">
                    {cafe.distanceText && (
                      <div className="text-xs text-gray-400 mb-1">
                        {cafe.distanceText}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs text-gray-600">
                        {cafe.rating || '4.5'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 간단한 러닝 컨트롤 하단바 */}
      <nav
        className="fixed left-1/2 transform -translate-x-1/2 w-full max-w-[390px] z-50"
        style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-center items-center h-20 px-6">
          {!isTracking ? (
            <>
              {/* 시작 버튼 - 원형 디자인 */}
              <button
                onClick={startCountdown}
                disabled={isCountingDown}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isCountingDown
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                }`}
                aria-label="러닝 시작"
              >
                <Play size={28} />
              </button>

              {/* 저장 버튼 - 기록이 있을 때만 표시 */}
              {(totalDistance > 0 || elapsedTime > 0) && (
                <button
                  onClick={saveRecord}
                  disabled={isSaving}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 ml-4"
                  aria-label="기록 저장"
                >
                  <Save size={20} />
                </button>
              )}
            </>
          ) : (
            <>
              {/* 일시정지/재개 버튼 */}
              <button
                onClick={togglePause}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isPaused
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl'
                }`}
                aria-label={isPaused ? '러닝 재개' : '러닝 일시정지'}
              >
                {isPaused ? <Play size={28} /> : <Pause size={28} />}
              </button>

              {/* 정지 버튼 */}
              <button
                onClick={stopTracking}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl ml-4"
                aria-label="러닝 정지"
              >
                <Square size={20} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 카운트다운 오버레이 */}
      {isCountingDown && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-4 animate-pulse">
              {countdownNumber > 0 ? countdownNumber : 'GO!'}
            </div>
            <div className="text-xl text-white opacity-80">
              {countdownNumber > 0 ? '준비하세요...' : '러닝 시작!'}
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-1000 ease-linear"
                  style={{
                    width:
                      countdownNumber > 0
                        ? `${((4 - countdownNumber) / 3) * 100}%`
                        : '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포스트 작성 모달 */}
      <CreatePostModal
        isOpen={createPostModal.isOpen}
        onClose={handleCloseCreatePostModal}
        runningRecord={createPostModal.runningRecord}
      />
    </div>
  );
};

export default NavigationPage;
