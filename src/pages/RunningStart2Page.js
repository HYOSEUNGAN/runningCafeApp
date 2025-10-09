import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  Target,
  Layers,
  Navigation,
  Settings,
  Coffee,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import {
  getCurrentWeather,
  getWeatherConditionEmoji,
} from '../services/weatherService';
import CreatePostModal from '../components/feed/CreatePostModal';
import { createRunningRecord } from '../services/runningRecordService';

/**
 * RUNNING START2 페이지
 * 폴리라인 기능이 구현된 지도 페이지
 */
const RunningStart2Page = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  // 지도 관련 refs
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const markersRef = useRef([]);

  // 러닝 상태
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(15);

  // 날씨 상태
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    condition: '로딩 중...',
    emoji: '🌤️',
    loading: true,
  });

  // 모달 상태
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // 피드 작성 모달 상태
  const [createPostModal, setCreatePostModal] = useState({
    isOpen: false,
    runningRecord: null,
  });

  // 러닝 완료 확인 모달 상태
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  // 뒤로가기 (러닝 중이면 경고)
  const handleGoBack = () => {
    if (isTracking && !isPaused) {
      setShowExitWarning(true);
      setPendingNavigation(() => () => navigate(-1));
    } else {
      navigate(-1);
    }
  };

  // 날씨 정보 가져오기
  const fetchWeatherData = useCallback(async (lat, lng) => {
    try {
      const weather = await getCurrentWeather(lat, lng);
      setWeatherData({
        temperature: weather.temperature,
        condition: weather.condition,
        emoji: getWeatherConditionEmoji(weather.condition),
        loading: false,
      });
    } catch (error) {
      console.error('날씨 정보 가져오기 실패:', error);
      setWeatherData({
        temperature: 22,
        condition: '맑음',
        emoji: '☀️',
        loading: false,
      });
    }
  }, []);

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
          // 러닝에 최적화된 지도 스타일
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [{ saturation: -20 }, { lightness: 10 }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#ffffff' }, { weight: 2 }],
            },
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ visibility: 'simplified' }],
            },
            {
              featureType: 'poi',
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

              // 현재 위치 기반 날씨 정보 가져오기
              fetchWeatherData(
                position.coords.latitude,
                position.coords.longitude
              );

              // 현재 위치 마커 추가
              const currentUserMarker = new window.naver.maps.Marker({
                position: currentPos,
                map: naverMapRef.current,
                title: '현재 위치',
                icon: {
                  content: `
                    <div style="position: relative;">
                      <!-- 펄스 애니메이션 -->
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 40px;
                        height: 40px;
                        background: rgba(139, 92, 246, 0.3);
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                      "></div>
                      <!-- 중앙 마커 -->
                      <div style="
                        position: relative;
                        width: 20px; 
                        height: 20px; 
                        background: #8b5cf6; 
                        border: 3px solid #ffffff; 
                        border-radius: 50%; 
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                      ">
                        <div style="
                          color: white;
                          font-size: 10px;
                          font-weight: bold;
                        ">●</div>
                      </div>
                    </div>
                    <style>
                      @keyframes pulse {
                        0% {
                          transform: translate(-50%, -50%) scale(0.8);
                          opacity: 1;
                        }
                        100% {
                          transform: translate(-50%, -50%) scale(1.5);
                          opacity: 0;
                        }
                      }
                    </style>
                  `,
                  anchor: new window.naver.maps.Point(10, 10),
                },
              });

              markersRef.current.push(currentUserMarker);
            },
            error => {
              console.error('위치 정보를 가져올 수 없습니다:', error);
              showToast('위치 정보를 가져올 수 없습니다.', 'error');
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
    };
  }, [showToast, fetchWeatherData]);

  // 폴리라인 업데이트
  const updatePolyline = useCallback(pathArray => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (pathArray.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: pathArray,
        strokeColor: '#8b5cf6', // 메인 컬러 (purple-600)
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        // 그라데이션 효과를 위한 추가 스타일
        strokeGradient: [
          { offset: '0%', color: '#8b5cf6' },
          { offset: '50%', color: '#a855f7' },
          { offset: '100%', color: '#c084fc' },
        ],
      });
    }
  }, []);

  // 거리 계산 함수
  const calculateDistance = useCallback((pos1, pos2) => {
    const R = 6371e3; // 지구 반지름 (미터)

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
  }, []);

  // 러닝 시작
  const startTracking = async () => {
    if (!navigator.geolocation) {
      showToast('이 브라우저는 위치 서비스를 지원하지 않습니다.', 'error');
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPath([]);
    setTotalDistance(0);
    setElapsedTime(0);

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

        if (!isPaused) {
          setPath(prevPath => {
            const newPath = [...prevPath, newPos];

            // 거리 계산
            if (prevPath.length > 0) {
              const lastPos = prevPath[prevPath.length - 1];
              const distance = calculateDistance(lastPos, newPos);

              // 5m 이상 이동했을 때만 거리 추가 (GPS 오차 최소화)
              if (distance > 5) {
                setTotalDistance(prev => prev + distance);
              }
            }

            // 폴리라인 업데이트
            updatePolyline(newPath);

            return newPath;
          });

          // 지도 중심을 현재 위치로 이동
          naverMapRef.current.panTo(newPos);
        }
      },
      error => {
        console.error('위치 추적 오류:', error);
        showToast('위치 추적에 실패했습니다.', 'error');
      },
      options
    );

    showToast('러닝 추적을 시작합니다! 🏃‍♀️', 'success');
  };

  // 러닝 일시정지/재개
  const togglePause = () => {
    setIsPaused(!isPaused);
    showToast(
      isPaused ? '러닝을 재개합니다!' : '러닝을 일시정지합니다.',
      'info'
    );
  };

  // 러닝 정지 (확인 모달 표시)
  const stopTracking = () => {
    setShowCompletionConfirm(true);
  };

  // 러닝 완료 확인 후 처리
  const handleConfirmStopTracking = async () => {
    try {
      setShowCompletionConfirm(false);
      setIsTracking(false);
      setIsPaused(false);

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // 러닝 기록 저장
      const runningRecord = {
        user_id: user?.id,
        distance: totalDistance,
        duration: elapsedTime,
        pace:
          totalDistance > 0 ? elapsedTime / 1000 / (totalDistance / 1000) : 0,
        calories_burned: Math.floor((totalDistance / 1000) * 60), // 대략 1km당 60kcal
        start_time: startTime
          ? new Date(startTime).toISOString()
          : new Date().toISOString(),
        end_time: new Date().toISOString(),
        path: path,
        nearbyCafes: [], // 자유러닝에서는 카페 정보 없음
        weather: {
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          location: '현재 위치',
        },
        gps_accuracy: null,
      };

      // 러닝 기록 저장 (실제 거리나 시간이 있는 경우에만)
      let savedRecord = null;
      if (totalDistance > 0 || elapsedTime > 30000) {
        // 30초 이상 러닝한 경우
        const saveResult = await createRunningRecord(runningRecord);
        if (saveResult.success) {
          savedRecord = saveResult.data;
        }
      }

      showToast('러닝이 완료되었습니다! 🎉', 'success');

      // 피드 작성 모달 열기
      setCreatePostModal({
        isOpen: true,
        runningRecord: savedRecord,
      });
    } catch (error) {
      console.error('러닝 완료 처리 실패:', error);
      showToast('러닝 완료 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 러닝 완료 취소
  const handleCancelStopTracking = () => {
    setShowCompletionConfirm(false);
  };

  // 피드 작성 모달 닫기
  const handleClosePostModal = (posted = false) => {
    setCreatePostModal({
      isOpen: false,
      runningRecord: null,
    });

    if (posted) {
      // 피드 작성 완료 후 홈으로 이동
      navigate(ROUTES.HOME);
    }
  };

  // 시간 업데이트
  useEffect(() => {
    let interval;
    if (isTracking && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, isPaused, startTime]);

  // 시간 포맷팅
  const formatTime = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 거리 포맷팅
  const formatDistance = meters => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // 줌 컨트롤
  const handleZoomIn = () => {
    if (naverMapRef.current && currentZoom < 19) {
      const newZoom = currentZoom + 1;
      naverMapRef.current.setZoom(newZoom, true);
      setCurrentZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (naverMapRef.current && currentZoom > 10) {
      const newZoom = currentZoom - 1;
      naverMapRef.current.setZoom(newZoom, true);
      setCurrentZoom(newZoom);
    }
  };

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (naverMapRef.current && currentPosition) {
      naverMapRef.current.setCenter(currentPosition);
      naverMapRef.current.setZoom(16, true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      {/* 지도 배경 */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Run View 상단 헤더 - 메인 컬러 적용 */}
        <div className="absolute top-0 left-0 right-0 pt-12 pb-4 z-10">
          {/* Run View 로고 및 상태 */}
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
              {/* 헤더 */}
              <div className="px-4 py-3 border-b border-primary-200/50 bg-primary-gradient rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                      <span className="text-white text-sm font-bold">🏃</span>
                    </div>
                    <span className="text-white font-bold text-base">
                      런 뷰
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse"></div>
                    <span className="text-white/90 text-sm font-medium">
                      준비완료
                    </span>
                  </div>
                </div>
              </div>

              {/* 상태 정보 */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* 날씨 */}
                  <div className="flex items-center bg-white/70 rounded-xl px-3 py-2 border border-primary-200/30 shadow-sm">
                    <span className="text-orange-500 text-sm mr-2">
                      {weatherData.loading ? '🌤️' : weatherData.emoji}
                    </span>
                    <span className="text-primary-700 text-sm font-medium">
                      {weatherData.loading
                        ? '로딩...'
                        : `${weatherData.temperature}°C`}
                    </span>
                  </div>

                  {/* GPS 상태 */}
                  <div className="flex items-center bg-white/70 rounded-xl px-3 py-2 border border-primary-200/30 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-primary-700 text-sm font-medium">
                      GPS 연결됨
                    </span>
                  </div>

                  {/* 배터리 */}
                  <div className="flex items-center bg-white/70 rounded-xl px-3 py-2 border border-primary-200/30 shadow-sm">
                    <div className="w-6 h-3 border border-primary-400 rounded-sm relative bg-white mr-2">
                      <div className="absolute inset-0.5 bg-green-500 rounded-sm"></div>
                      <div className="absolute -right-0.5 top-0.5 w-0.5 h-2 bg-primary-400 rounded-r-sm"></div>
                    </div>
                    <span className="text-primary-700 text-sm">📶</span>
                  </div>
                </div>
              </div>

              {/* 지도 패턴 배경 장식 */}
              <div className="absolute inset-0 pointer-events-none opacity-10 rounded-2xl overflow-hidden">
                <div className="absolute top-2 right-2 w-12 h-12 border-2 border-primary-300 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-2 border-primary-400 rounded-full"></div>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="grid-start2"
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 8 0 L 0 0 0 8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.3"
                        className="text-primary-300"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid-start2)" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 지도 컨트롤 버튼들 */}
        <div className="absolute top-24 right-4 flex flex-col gap-3 z-10">
          {/* 줌 컨트롤 */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <button
              onClick={handleZoomIn}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border-b border-gray-100/50"
              disabled={currentZoom >= 19}
            >
              <ZoomIn
                size={20}
                className={
                  currentZoom >= 19 ? 'text-gray-300' : 'text-primary-600'
                }
              />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
              disabled={currentZoom <= 10}
            >
              <ZoomOut
                size={20}
                className={
                  currentZoom <= 10 ? 'text-gray-300' : 'text-primary-600'
                }
              />
            </button>
          </div>

          {/* 현재 위치로 이동 */}
          <button
            onClick={moveToCurrentLocation}
            className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-white/20"
            disabled={!currentPosition}
          >
            <Target
              size={20}
              className={
                !currentPosition ? 'text-gray-300' : 'text-primary-600'
              }
            />
          </button>
        </div>

        {/* 메인 시간 표시 - 중앙 상단 */}
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-br from-primary-50/95 via-primary-100/95 to-primary-200/95 rounded-3xl shadow-xl border border-white/60 backdrop-blur-md px-8 py-6">
            <div className="text-center">
              <div className="text-primary-600 text-xs mb-2 font-medium flex items-center justify-center">
                <span className="mr-2">⏱️</span>
                경과 시간
              </div>
              <div className="text-primary-800 text-6xl font-bold tracking-tight mb-2">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-primary-600 text-sm font-medium">
                {isTracking
                  ? isPaused
                    ? '일시정지됨'
                    : '러닝 중'
                  : '준비 완료'}
              </div>
            </div>
          </div>
        </div>

        {/* 통계 정보 - 하단 */}
        <div className="absolute bottom-32 left-0 right-0 px-6 z-10">
          <div className="bg-gradient-to-br from-primary-50/95 via-primary-100/95 to-primary-200/95 rounded-2xl shadow-lg border border-white/60 backdrop-blur-md p-4">
            <div className="flex justify-between items-center">
              {/* 평균 페이스 */}
              <div className="text-center bg-white/70 rounded-xl p-3 border border-primary-200/40 shadow-sm flex-1 mx-1">
                <div className="text-primary-600 text-xs mb-1 flex items-center justify-center">
                  <span className="mr-1">🏃</span>
                  평균 페이스
                </div>
                <div className="text-primary-800 text-lg font-bold">0'00"</div>
              </div>

              {/* 현재 거리 */}
              <div className="text-center bg-white/70 rounded-xl p-3 border border-primary-200/40 shadow-sm flex-1 mx-1">
                <div className="text-primary-600 text-xs mb-1 flex items-center justify-center">
                  <span className="mr-1">📏</span>
                  거리
                </div>
                <div className="text-primary-800 text-lg font-bold">
                  {formatDistance(totalDistance)}
                </div>
              </div>

              {/* 칼로리 */}
              <div className="text-center bg-white/70 rounded-xl p-3 border border-primary-200/40 shadow-sm flex-1 mx-1">
                <div className="text-orange-600 text-xs mb-1 flex items-center justify-center">
                  <span className="mr-1">🔥</span>
                  칼로리
                </div>
                <div className="text-orange-800 text-lg font-bold">0 kcal</div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="absolute bottom-8 left-0 right-0 px-8 z-10">
          <div className="flex items-center justify-between">
            {!isTracking ? (
              <>
                {/* 뒤로가기 버튼 */}
                <button
                  onClick={handleGoBack}
                  className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-primary-200 shadow-lg hover:bg-white hover:border-primary-300 transition-all duration-300"
                >
                  <ArrowLeft size={20} className="text-primary-600" />
                </button>

                {/* 시작 버튼 */}
                <button
                  onClick={startTracking}
                  className="w-20 h-20 bg-primary-gradient hover:shadow-xl rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-white font-bold text-lg drop-shadow-md">
                    START
                  </div>
                </button>

                {/* 빈 공간 */}
                <div className="w-16 h-16"></div>
              </>
            ) : (
              <>
                {/* 지도 버튼 */}
                <button
                  onClick={handleGoBack}
                  className="w-16 h-16 bg-primary-gradient hover:shadow-xl rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-white font-bold text-xs drop-shadow-md">
                    ≫
                  </div>
                </button>

                {/* 일시정지/재생 버튼 */}
                <button
                  onClick={togglePause}
                  className="w-20 h-20 bg-primary-gradient hover:shadow-xl rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  {isPaused ? (
                    <Play
                      size={32}
                      className="text-white ml-1 drop-shadow-md"
                    />
                  ) : (
                    <div className="text-white font-bold text-lg drop-shadow-md">
                      PAUSE
                    </div>
                  )}
                </button>

                {/* 정지 버튼 */}
                <button
                  onClick={stopTracking}
                  className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-primary-200 shadow-lg hover:bg-white hover:border-primary-300 transition-all duration-300"
                >
                  <Square size={20} className="text-primary-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 하단 홈 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-32 h-1 bg-primary-300 rounded-full"></div>
        </div>
      </div>

      {/* 러닝 중 종료 경고 모달 */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-primary-gradient p-6 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-white text-xl font-bold">러닝 중단 경고</h3>
            </div>

            {/* 내용 */}
            <div className="p-6 text-center">
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                현재 러닝이 진행 중입니다.
                <br />
                페이지를 나가면{' '}
                <strong className="text-primary-600">러닝 기록이 종료</strong>
                됩니다.
              </p>

              <div className="bg-primary-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-primary-600 font-medium">
                      ⏱️ 경과시간
                    </div>
                    <div className="text-primary-800 font-bold">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-primary-600 font-medium">📏 거리</div>
                    <div className="text-primary-800 font-bold">
                      {formatDistance(totalDistance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    setPendingNavigation(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  계속 러닝하기
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    stopTracking(); // 러닝 종료
                    if (pendingNavigation) {
                      pendingNavigation();
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  종료하고 나가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 러닝 완료 확인 모달 */}
      {showCompletionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Square size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                러닝을 종료하시겠습니까?
              </h3>
              <p className="text-gray-600 text-sm">
                오늘의 러닝을 실제로 종료하고
                <br />
                피드에 기록을 공유하시겠습니까?
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelStopTracking}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                계속하기
              </button>
              <button
                onClick={handleConfirmStopTracking}
                className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 피드 작성 모달 */}
      <CreatePostModal
        isOpen={createPostModal.isOpen}
        onClose={handleClosePostModal}
        runningRecord={createPostModal.runningRecord}
      />
    </div>
  );
};

export default RunningStart2Page;
