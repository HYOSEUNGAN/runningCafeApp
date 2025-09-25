import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { searchNearbyCafesWithNaver } from '../services/cafeService';
import { saveRunningRecord, compressPath } from '../services/runningService';
import { createFeedPost } from '../services/feedService';
import CreatePostModal from '../components/feed/CreatePostModal';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

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

  // 스토어
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  // 지도 관련 refs
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);

  // 네이버 지도 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (window.naver && window.naver.maps) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
          zoom: 15,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
          scaleControl: true,
          logoControl: false,
          mapDataControl: false,
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

              // 현재 위치 마커 추가
              const currentUserMarker = new window.naver.maps.Marker({
                position: currentPos,
                map: naverMapRef.current,
                title: '현재 위치',
                icon: {
                  content: `
                    <div style="
                      width: 20px; 
                      height: 20px; 
                      background: #3B82F6; 
                      border: 3px solid white; 
                      border-radius: 50%; 
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      position: relative;
                    ">
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                      "></div>
                    </div>
                  `,
                  anchor: new window.naver.maps.Point(10, 10),
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
              background: linear-gradient(135deg, #FF6B35, #F97316); 
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

  // 위치 추적 시작
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPath([]);
    setTotalDistance(0);

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
        setCurrentSpeed(speed);
        setMaxSpeed(prev => Math.max(prev, speed));

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

  // 위치 추적 중지
  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    setEndTime(Date.now());

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // 러닝 기록 저장
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

    // 경로가 없거나 너무 짧은 경우만 체크 (거리 0은 허용)
    if (path.length < 2) {
      showToast({
        type: 'error',
        message:
          '러닝 경로가 기록되지 않았습니다. 최소 2개 이상의 위치가 필요합니다.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const runningData = {
        userId: user.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime || Date.now()).toISOString(),
        duration: elapsedTime,
        distance: totalDistance,
        calories: getCalculatedCalories(),
        averageSpeed:
          totalDistance > 0 ? totalDistance / (elapsedTime / 1000) : 0,
        maxSpeed: maxSpeed,
        path: compressPath(
          path.map(pos => ({
            lat: typeof pos.lat === 'function' ? pos.lat() : pos.lat,
            lng: typeof pos.lng === 'function' ? pos.lng() : pos.lng,
          }))
        ),
        nearbyCafes: nearbyCafes.map(cafe => ({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          coordinates: cafe.coordinates,
          distanceText: cafe.distanceText,
        })),
      };

      console.log('저장할 러닝 데이터:', runningData);

      const savedRecord = await saveRunningRecord(runningData);
      console.log('저장된 기록:', savedRecord);

      if (savedRecord) {
        showToast({
          type: 'success',
          message: '러닝 기록이 저장되었습니다!',
        });

        // 피드 공유 옵션 제공
        const shareOptions = await showShareOptions(savedRecord);

        if (shareOptions === 'modal') {
          // 모달을 통한 커스텀 포스트 작성
          setCreatePostModal({
            isOpen: true,
            runningRecord: savedRecord,
          });
        } else if (shareOptions === 'auto') {
          // 자동 생성된 포스트로 공유
          await handleShareToFeed(savedRecord);
        }

        // 상태 초기화
        resetTrackingState();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('러닝 기록 저장 실패:', error);
      showToast({
        type: 'error',
        message: `러닝 기록 저장에 실패했습니다: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
      console.log('=== 러닝 기록 저장 완료 ===');
    }
  };

  // 공유 옵션 선택 모달
  const showShareOptions = savedRecord => {
    return new Promise(resolve => {
      // 커스텀 모달 대신 confirm을 사용하여 간단하게 구현
      const shareChoice = window.confirm(
        `🎉 러닝 기록이 저장되었습니다!\n\n피드에 공유하시겠습니까?\n\n✅ 확인: 사진과 함께 커스텀 포스트 작성\n❌ 취소: 공유하지 않음`
      );

      if (shareChoice) {
        // 추가 옵션 선택
        const customPost = window.confirm(
          `공유 방법을 선택해주세요:\n\n✅ 확인: 사진과 글을 직접 작성 (추천)\n❌ 취소: 자동 생성된 포스트로 바로 공유`
        );

        resolve(customPost ? 'modal' : 'auto');
      } else {
        resolve('none');
      }
    });
  };

  // 포스트 작성 모달 닫기
  const handleCloseCreatePostModal = () => {
    setCreatePostModal({
      isOpen: false,
      runningRecord: null,
    });
  };

  // 피드에 러닝 기록 공유
  const handleShareToFeed = async savedRecord => {
    try {
      // 자동 생성된 캡션
      const distance = (savedRecord.distance / 1000).toFixed(1);
      const duration = formatTime(savedRecord.duration);
      const pace = Math.round(
        savedRecord.duration / 1000 / 60 / (savedRecord.distance / 1000)
      );

      const caption = `오늘 ${distance}km 러닝 완주! 🏃‍♀️\n시간: ${duration}\n페이스: ${pace}'00"/km\n\n#러닝 #운동 #건강 #러닝기록 #RunningCafe`;

      const postData = {
        user_id: user.id,
        running_record_id: savedRecord.id,
        caption: caption,
        hashtags: ['러닝', '운동', '건강', '러닝기록', 'RunningCafe'],
        location: nearbyCafes.length > 0 ? nearbyCafes[0].address : '',
        is_achievement: savedRecord.distance >= 5000, // 5km 이상이면 달성 기록으로 표시
      };

      const result = await createFeedPost(postData);

      if (result.success) {
        showToast({
          type: 'success',
          message: '피드에 공유되었습니다! 🎉',
        });
      } else {
        throw new Error(result.error);
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
  };

  // 폴리라인 업데이트
  const updatePolyline = pathArray => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (pathArray.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: pathArray,
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
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

  // SNS 공유
  const shareToSNS = async () => {
    if (totalDistance === 0) {
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
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* 헤더 */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#4c1d95]">Running Map</h1>
        {/* 
        <button
          onClick={shareToSNS}
          disabled={totalDistance === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={16} />
          공유
        </button> 
        */}
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* 지도 컨트롤 버튼들 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* 줌 컨트롤 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-b"
              disabled={currentZoom >= 19}
            >
              <ZoomIn
                size={18}
                className={
                  currentZoom >= 19 ? 'text-gray-300' : 'text-gray-700'
                }
              />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={currentZoom <= 10}
            >
              <ZoomOut
                size={18}
                className={
                  currentZoom <= 10 ? 'text-gray-300' : 'text-gray-700'
                }
              />
            </button>
          </div>

          {/* 지도 타입 변경 */}
          <button
            onClick={handleMapTypeChange}
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            title={`현재: ${mapType === 'normal' ? '일반' : mapType === 'satellite' ? '위성' : '하이브리드'}`}
          >
            <Layers size={18} className="text-gray-700" />
          </button>

          {/* 현재 위치로 이동 */}
          <button
            onClick={moveToCurrentLocation}
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            disabled={!currentPosition}
          >
            <Target
              size={18}
              className={!currentPosition ? 'text-gray-300' : 'text-blue-600'}
            />
          </button>

          {/* 카페 정보 토글 */}
          <button
            onClick={toggleCafeInfo}
            className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
              showCafeInfo
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Coffee size={18} />
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          {/* GPS 정확도 표시 */}
          {gpsAccuracy !== null && (
            <div className="mb-3 flex items-center justify-center">
              {(() => {
                const accuracyInfo = evaluateGPSAccuracy(gpsAccuracy);
                return (
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: accuracyInfo.color }}
                    ></div>
                    <span className="text-gray-600">
                      GPS: {accuracyInfo.message} ({Math.round(gpsAccuracy)}m)
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-500">시간</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(totalDistance)}
              </div>
              <div className="text-xs text-gray-500">거리</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {getCalculatedCalories()}
              </div>
              <div className="text-xs text-gray-500">칼로리</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(currentSpeed * 3.6).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">km/h</div>
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

      {/* 러닝 컨트롤 하단바 */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 safe-area-bottom z-50">
        {/* 디버깅용 상태 표시 */}
        <div className="text-xs text-gray-500 text-center py-2 border-b border-gray-100">
          상태: {isTracking ? (isPaused ? '일시정지됨' : '추적중') : '대기중'} |
          거리: {totalDistance.toFixed(0)}m | 시간:{' '}
          {Math.floor(elapsedTime / 1000)}초
        </div>

        <div className="flex justify-around items-center h-16 px-4">
          {!isTracking ? (
            <>
              {/* 시작 버튼 */}
              <button
                onClick={startTracking}
                className="flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors text-green-600 hover:text-green-800"
                aria-label="러닝 시작"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 transition-colors">
                  <Play size={20} className="text-white" />
                </div>
                <span className="text-xs font-bold">시작</span>
              </button>

              {/* 공유 버튼 */}
              <button
                onClick={shareToSNS}
                disabled={totalDistance === 0}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors ${
                  totalDistance === 0
                    ? 'text-gray-300'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                aria-label="SNS 공유"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    totalDistance === 0
                      ? 'bg-gray-200'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Share2 size={20} className="text-white" />
                </div>
                <span className="text-xs font-bold">공유</span>
              </button>

              {/* 저장 버튼 */}
              {totalDistance > 0 && (
                <button
                  onClick={saveRecord}
                  disabled={isSaving}
                  className="flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors text-indigo-600 hover:text-indigo-800"
                  aria-label="기록 저장"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 transition-colors">
                    <Save size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-bold">
                    {isSaving ? '저장중' : '저장'}
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* 일시정지/재개 버튼 */}
              <button
                onClick={togglePause}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors ${
                  isPaused
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-yellow-600 hover:text-yellow-800'
                }`}
                aria-label={isPaused ? '러닝 재개' : '러닝 일시정지'}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isPaused
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {isPaused ? (
                    <Play size={20} className="text-white" />
                  ) : (
                    <Pause size={20} className="text-white" />
                  )}
                </div>
                <span className="text-xs font-bold">
                  {isPaused ? '재개' : '일시정지'}
                </span>
              </button>

              {/* 정지 버튼 */}
              <button
                onClick={stopTracking}
                className="flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors text-red-600 hover:text-red-800"
                aria-label="러닝 정지"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors">
                  <Square size={20} className="text-white" />
                </div>
                <span className="text-xs font-bold">정지</span>
              </button>

              {/* 현재 위치로 이동 버튼 */}
              <button
                onClick={moveToCurrentLocation}
                disabled={!currentPosition}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[80px] transition-colors ${
                  !currentPosition
                    ? 'text-gray-300'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                aria-label="현재 위치로 이동"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    !currentPosition
                      ? 'bg-gray-200'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Target size={20} className="text-white" />
                </div>
                <span className="text-xs font-bold">위치</span>
              </button>
            </>
          )}
        </div>

        {/* 추가 정보 표시 */}
        {totalDistance > 0 && !isTracking && (
          <div className="px-4 py-2 text-center border-t border-gray-100">
            <div className="text-xs text-gray-600">
              운동 완료! 기록을 저장하거나 SNS에 공유해보세요 🎉
            </div>
          </div>
        )}

        {/* 개발용 테스트 버튼 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 text-center border-t border-gray-100">
            <button
              onClick={createTestRecord}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              테스트 기록 생성
            </button>
          </div>
        )}
      </nav>

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
