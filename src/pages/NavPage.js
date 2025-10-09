import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Play,
  Pause,
  Square,
  Music,
  SkipForward,
  SkipBack,
  Cloud,
  Sun,
  CloudRain,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import CreatePostModal from '../components/feed/CreatePostModal';
import { createRunningRecord } from '../services/runningRecordService';
import { formatDistance, formatTime } from '../utils/format';

/**
 * 네비게이션 페이지 - 프로젝트 메인 컬러 적용 및 실제 날씨/GPS 추적
 * 러닝 중 화면의 상세 정보 및 컨트롤을 제공
 */
const NavPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  // 러닝 상태
  const [runningData, setRunningData] = useState({
    isRunning: true,
    isPaused: false,
    duration: 0, // 00:00 시작
    distance: 0, // 0.00km 시작
    avgPace: '0\'00"',
    currentPace: '00:00',
    calories: 0,
    gpsStatus: 'connected',
  });

  // 날씨 및 위치 상태
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    condition: 'loading', // 'sunny', 'cloudy', 'rainy', 'loading'
    location: '위치 확인 중...',
  });

  const [gpsData, setGpsData] = useState({
    accuracy: null,
    speed: 0,
    heading: 0,
    altitude: null,
  });

  const [startTime, setStartTime] = useState(Date.now());

  // 피드 작성 모달 상태
  const [createPostModal, setCreatePostModal] = useState({
    isOpen: false,
    runningRecord: null,
  });

  // 러닝 완료 확인 모달 상태
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  // 목표 러닝 관련 상태
  const [runningGoals, setRunningGoals] = useState(null);
  const [goalAchieved, setGoalAchieved] = useState(false);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);

  // GPS 추적 관련 상태
  const [previousPosition, setPreviousPosition] = useState(null);
  const [totalRealDistance, setTotalRealDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // 모달 상태
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // 뒤로가기 핸들러 (러닝 중이면 경고)
  const handleGoBack = () => {
    if (runningData.isRunning && !runningData.isPaused) {
      setShowExitWarning(true);
      setPendingNavigation(() => () => navigate(-1));
    } else {
      navigate(-1);
    }
  };

  // 두 GPS 좌표 간의 거리 계산 (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 미터 단위
    return distance;
  };

  // 목표 러닝 설정 로드
  useEffect(() => {
    const loadRunningConfig = () => {
      try {
        const savedConfig = localStorage.getItem('runningConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.mode === 'goal' && config.goals) {
            setRunningGoals(config.goals);
            console.log('목표 러닝 설정 로드:', config.goals);
          }
          // 설정 사용 후 localStorage에서 제거
          localStorage.removeItem('runningConfig');
        }
      } catch (error) {
        console.error('러닝 설정 로드 실패:', error);
      }
    };

    loadRunningConfig();
  }, []);

  // 목표 달성 확인
  useEffect(() => {
    if (!runningGoals || goalAchieved) return;

    const checkGoalAchievement = () => {
      let achieved = false;

      if (runningGoals.type === 'distance') {
        // 거리 목표 확인 (미터를 km로 변환)
        const currentDistanceKm = runningData.distance / 1000;
        console.log('거리 목표 확인:', {
          currentDistanceMeters: runningData.distance,
          currentDistanceKm: currentDistanceKm,
          targetDistance: runningGoals.targetDistance,
          achieved: currentDistanceKm >= runningGoals.targetDistance,
        });
        if (currentDistanceKm >= runningGoals.targetDistance) {
          achieved = true;
        }
      } else if (runningGoals.type === 'time') {
        // 시간 목표 확인 (분 단위)
        const currentTimeMinutes = runningData.duration / 60000; // 밀리초를 분으로 변환
        console.log('시간 목표 확인:', {
          currentDurationMs: runningData.duration,
          currentTimeMinutes: currentTimeMinutes,
          targetTime: runningGoals.targetTime,
          achieved: currentTimeMinutes >= runningGoals.targetTime,
        });
        if (currentTimeMinutes >= runningGoals.targetTime) {
          achieved = true;
        }
      }

      if (achieved && !goalAchieved) {
        setGoalAchieved(true);
        setShowGoalCelebration(true);

        // 축하 알림 표시
        const goalText =
          runningGoals.type === 'distance'
            ? `${runningGoals.targetDistance}km`
            : `${runningGoals.targetTime}분`;

        showToast(`🎉 축하합니다! ${goalText} 목표를 달성했습니다!`, 'success');

        // 햅틱 피드백
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    };

    checkGoalAchievement();
  }, [
    runningData.distance,
    runningData.duration,
    runningGoals,
    goalAchieved,
    showToast,
  ]);

  // 실제 날씨 정보 가져오기
  useEffect(() => {
    const fetchWeatherData = async (lat, lng) => {
      try {
        // OpenWeatherMap API 사용 (실제 구현 시 API 키 필요)
        // 임시로 랜덤 날씨 데이터 생성
        const conditions = ['sunny', 'cloudy', 'rainy'];
        const randomCondition =
          conditions[Math.floor(Math.random() * conditions.length)];
        const randomTemp = Math.floor(Math.random() * 15) + 15; // 15-30도

        setTimeout(() => {
          setWeatherData({
            temperature: randomTemp,
            condition: randomCondition,
            location: '서울특별시 강남구',
          });
        }, 1000);
      } catch (error) {
        console.error('날씨 정보 가져오기 실패:', error);
        setWeatherData({
          temperature: 22,
          condition: 'sunny',
          location: '위치 정보 없음',
        });
      }
    };

    // GPS 위치 추적
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude, accuracy, speed, heading, altitude } =
            position.coords;

          setGpsData({
            accuracy: Math.round(accuracy),
            speed: speed || 0,
            heading: heading || 0,
            altitude: altitude || null,
          });

          // 현재 속도 업데이트 (m/s를 km/h로 변환)
          const speedKmh = (speed || 0) * 3.6;
          setCurrentSpeed(speedKmh);

          // 러닝 중일 때만 거리 계산
          if (
            runningData.isRunning &&
            !runningData.isPaused &&
            previousPosition
          ) {
            const distanceMeters = calculateDistance(
              previousPosition.latitude,
              previousPosition.longitude,
              latitude,
              longitude
            );

            // 최소 이동 거리 필터링 (GPS 오차 제거)
            if (distanceMeters > 2 && distanceMeters < 100) {
              // 2m 이상 100m 이하만 유효
              setTotalRealDistance(prev => prev + distanceMeters);
              console.log(
                '실제 이동 거리:',
                distanceMeters.toFixed(2),
                'm, 총 거리:',
                (totalRealDistance + distanceMeters).toFixed(2),
                'm'
              );
            }
          }

          // 현재 위치를 이전 위치로 저장
          if (runningData.isRunning) {
            setPreviousPosition({ latitude, longitude });
          }

          // GPS 상태 업데이트
          setRunningData(prev => ({
            ...prev,
            gpsStatus:
              accuracy <= 10 ? 'excellent' : accuracy <= 20 ? 'good' : 'fair',
          }));

          // 날씨 정보 가져오기 (위치 기반)
          if (weatherData.condition === 'loading') {
            fetchWeatherData(latitude, longitude);
          }
        },
        error => {
          console.error('GPS 추적 오류:', error);
          setRunningData(prev => ({
            ...prev,
            gpsStatus: 'disconnected',
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [weatherData.condition]);

  // 시간 업데이트 및 러닝 데이터 시뮬레이션
  useEffect(() => {
    let interval;
    if (runningData.isRunning && !runningData.isPaused) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        // 칼로리 계산 (실제 거리 기반, 대략 1km당 60kcal)
        const calculatedCalories = Math.floor((totalRealDistance / 1000) * 60);

        // 평균 페이스 계산 (분:초/km) - 실제 거리 기반
        let avgPace = '0\'00"';
        if (totalRealDistance > 0) {
          const distanceKm = totalRealDistance / 1000;
          const timeMinutes = elapsedSeconds / 60;
          const paceMinutesPerKm = timeMinutes / distanceKm;
          const paceMinutes = Math.floor(paceMinutesPerKm);
          const paceSeconds = Math.floor((paceMinutesPerKm - paceMinutes) * 60);
          avgPace = `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}"`;
        }

        // 현재 페이스 계산 (즉시 속도 기반)
        let currentPace = '0\'00"';
        if (currentSpeed > 0) {
          const speedKmh = currentSpeed;
          const paceMinutesPerKm = 60 / speedKmh;
          const paceMinutes = Math.floor(paceMinutesPerKm);
          const paceSeconds = Math.floor((paceMinutesPerKm - paceMinutes) * 60);
          currentPace = `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}"`;
        }

        setRunningData(prev => ({
          ...prev,
          duration: currentTime - startTime,
          distance: totalRealDistance, // 실제 GPS 거리 사용
          calories: calculatedCalories,
          avgPace: avgPace,
          currentPace: currentPace,
        }));
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    runningData.isRunning,
    runningData.isPaused,
    startTime,
    totalRealDistance,
    currentSpeed,
  ]);

  // 시간 포맷팅 (MM,SS)
  const formatTime = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')},${seconds.toString().padStart(2, '0')}`;
  };

  // 거리 포맷팅 (0.00)
  const formatDistance = meters => {
    return (meters / 1000).toFixed(2);
  };

  // 페이스 포맷팅 (0'00")
  const formatPace = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  // 날씨 아이콘 가져오기
  const getWeatherIcon = condition => {
    switch (condition) {
      case 'sunny':
        return <Sun size={16} className="text-yellow-500" />;
      case 'cloudy':
        return <Cloud size={16} className="text-gray-500" />;
      case 'rainy':
        return <CloudRain size={16} className="text-blue-500" />;
      default:
        return <Sun size={16} className="text-yellow-500" />;
    }
  };

  // GPS 상태 색상
  const getGpsStatusColor = status => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-yellow-500';
      case 'fair':
        return 'bg-orange-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // GPS 상태 텍스트
  const getGpsStatusText = status => {
    switch (status) {
      case 'excellent':
        return '정확함';
      case 'good':
        return '양호';
      case 'fair':
        return '보통';
      case 'disconnected':
        return '연결 끊김';
      default:
        return '확인 중';
    }
  };

  // 러닝 시작
  const startRunning = () => {
    if (!runningData.isRunning) {
      setRunningData(prev => ({
        ...prev,
        isRunning: true,
        isPaused: false,
      }));
      setStartTime(Date.now());
      setTotalRealDistance(0);
      setPreviousPosition(null);
      showToast('러닝을 시작합니다! 🏃‍♀️', 'success');
    }
  };

  // 러닝 컨트롤
  const togglePause = () => {
    setRunningData(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));

    if (runningData.isPaused) {
      showToast('러닝을 재개합니다! ▶️', 'info');
    } else {
      showToast('러닝을 일시정지합니다! ⏸️', 'info');
    }
  };

  const stopRunning = () => {
    // 러닝 완료 확인 모달 표시
    setShowCompletionConfirm(true);
  };

  // 러닝 완료 확인 후 처리
  const handleConfirmCompletion = async () => {
    try {
      setShowCompletionConfirm(false);

      // 러닝 상태 업데이트
      setRunningData(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
      }));

      // 러닝 기록 저장
      const runningRecord = {
        user_id: user?.id,
        distance: totalRealDistance / 1000, // 미터를 km로 변환
        duration: runningData.duration,
        pace: runningData.avgPace,
        calories_burned: runningData.calories,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        path: [], // NavPage에서는 경로 데이터가 없으므로 빈 배열
        nearbyCafes: [], // 주변 카페 정보도 없으므로 빈 배열
        weather: {
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          location: weatherData.location,
        },
        gps_accuracy: gpsData.accuracy,
      };

      // 러닝 기록 저장 (실제 거리나 시간이 있는 경우에만)
      let savedRecord = null;
      if (runningData.distance > 0 || runningData.duration > 30000) {
        // 30초 이상 러닝한 경우
        const saveResult = await createRunningRecord(runningRecord);
        if (saveResult.success) {
          savedRecord = saveResult.data;
        }
      }

      showToast('러닝이 완료되었습니다!', 'success');

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
  const handleCancelCompletion = () => {
    setShowCompletionConfirm(false);
  };

  // 종료 경고 모달 처리 함수들
  const handleCancelExit = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    stopRunning(); // 러닝 종료 처리
    if (pendingNavigation) {
      // 종료 처리 후 네비게이션 실행은 피드 작성 모달에서 처리
    }
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
    } else if (pendingNavigation) {
      // 종료 경고에서 온 경우 대기 중인 네비게이션 실행
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 relative overflow-hidden">
      {/* 지도 배경 */}
      <div className="absolute inset-0">
        {/* 지도 패턴 배경 */}
        <div
          className="w-full h-full opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5cf6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* 현재 위치 점 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-lg"></div>
        </div>
      </div>

      {/* 상단 상태바 영역 */}
      <div className="relative z-10 pt-12 pb-8">
        {/* 상단 정보 바 */}
        <div className="px-6 flex items-center justify-between mb-8">
          {/* 날씨 정보 */}
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
            {getWeatherIcon(weatherData.condition)}
            <span className="text-gray-700 text-sm font-medium ml-2">
              {weatherData.temperature
                ? `${weatherData.temperature}°C`
                : '로딩...'}
            </span>
          </div>

          {/* GPS 상태 */}
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${getGpsStatusColor(runningData.gpsStatus)}`}
            ></div>
            <span className="text-gray-700 text-sm font-medium">
              GPS {getGpsStatusText(runningData.gpsStatus)}
            </span>
          </div>
        </div>

        {/* 메인 거리 표시 */}
        <div className="text-center mb-8">
          <div className="text-gray-900 text-8xl font-bold tracking-tight mb-2">
            {formatDistance(runningData.distance)}
          </div>
          <div className="text-gray-600 text-lg font-medium">거리 (km)</div>
        </div>

        {/* 목표 진행률 (목표 러닝일 때만 표시) */}
        {runningGoals && (
          <div className="px-6 mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-purple-700">
                  🎯 목표 진행률
                </span>
                <span className="text-xs text-purple-600">
                  {runningGoals.type === 'distance'
                    ? `${runningGoals.targetDistance}km 목표`
                    : `${runningGoals.targetTime}분 목표`}
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="w-full bg-purple-100 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    goalAchieved
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-purple-400 to-purple-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      runningGoals.type === 'distance'
                        ? (runningData.distance /
                            1000 /
                            runningGoals.targetDistance) *
                            100
                        : (runningData.duration /
                            60000 /
                            runningGoals.targetTime) *
                            100
                    )}%`,
                  }}
                />
              </div>

              {/* 현재 값 / 목표 값 */}
              <div className="text-center">
                <span
                  className={`text-sm font-bold ${goalAchieved ? 'text-green-700' : 'text-purple-700'}`}
                >
                  {runningGoals.type === 'distance'
                    ? `${(runningData.distance / 1000).toFixed(2)}km / ${runningGoals.targetDistance}km`
                    : `${Math.floor(runningData.duration / 60000)}분 / ${runningGoals.targetTime}분`}
                </span>
                {goalAchieved && (
                  <span className="ml-2 text-green-600">🎉 달성!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="px-8 flex justify-between items-center mb-8">
          {/* 평균 페이스 */}
          <div className="text-center">
            <div className="text-gray-500 text-xs mb-1">평균 페이스</div>
            <div className="text-gray-900 text-lg font-bold">
              {runningData.avgPace}
            </div>
          </div>

          {/* 시간 */}
          <div className="text-center">
            <div className="text-gray-500 text-xs mb-1">시간</div>
            <div className="text-gray-900 text-lg font-bold">
              {formatTime(runningData.duration)}
            </div>
          </div>

          {/* 칼로리 */}
          <div className="text-center">
            <div className="text-gray-500 text-xs mb-1">칼로리</div>
            <div className="text-gray-900 text-lg font-bold">
              {runningData.calories} kcal
            </div>
          </div>
        </div>

        {/* 음악 플레이어 - 베타 서비스 */}
        <div className="mx-6 mb-8">
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-4 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                  <Music size={20} className="text-gray-500" />
                </div>
                <div>
                  <div className="text-gray-600 font-bold text-sm flex items-center">
                    음악 재생
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                      베타 서비스
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    곧 출시 예정입니다
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <button
                  className="w-8 h-8 flex items-center justify-center"
                  disabled
                >
                  <SkipBack size={16} className="text-gray-400" />
                </button>
                <button
                  className="w-8 h-8 flex items-center justify-center"
                  disabled
                >
                  <SkipForward size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="px-8 flex items-center justify-between">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={handleGoBack}
            className="w-16 h-16 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>

          {/* 러닝 시작/일시정지/재생 버튼 */}
          {!runningData.isRunning ? (
            <button
              onClick={startRunning}
              className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <Play size={32} className="text-white ml-1" />
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="w-20 h-20 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              {runningData.isPaused ? (
                <Play size={32} className="text-white ml-1" />
              ) : (
                <Pause size={32} className="text-white" />
              )}
            </button>
          )}

          {/* 정지 버튼 (러닝 중일 때만 표시) */}
          {runningData.isRunning && (
            <button
              onClick={stopRunning}
              className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-gray-200 shadow-lg hover:bg-white transition-all"
            >
              <Square size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* 하단 홈 인디케이터 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-purple-300 rounded-full"></div>
      </div>

      {/* 러닝 중 종료 경고 모달 */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-white text-xl font-bold">러닝 중단 경고</h3>
            </div>

            {/* 내용 */}
            <div className="p-6 text-center">
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                현재 러닝이 진행 중입니다.
                <br />
                페이지를 나가면{' '}
                <strong className="text-purple-600">러닝 기록이 종료</strong>
                됩니다.
              </p>

              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-purple-600 font-medium">
                      ⏱️ 경과시간
                    </div>
                    <div className="text-purple-800 font-bold">
                      {formatTime(runningData.duration)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-600 font-medium">📏 거리</div>
                    <div className="text-purple-800 font-bold">
                      {formatDistance(runningData.distance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelExit}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  계속 러닝하기
                </button>
                <button
                  onClick={handleConfirmExit}
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
                onClick={handleCancelCompletion}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                계속하기
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 목표 달성 축하 모달 */}
      {showGoalCelebration && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-bounce">
            <div className="text-center">
              {/* 축하 이모지 애니메이션 */}
              <div className="text-6xl mb-4 animate-pulse">🎉🏆🎉</div>

              {/* 축하 메시지 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                축하합니다!
              </h2>

              <p className="text-lg text-gray-700 mb-6">
                {runningGoals?.type === 'distance'
                  ? `${runningGoals.targetDistance}km`
                  : `${runningGoals.targetTime}분`}{' '}
                목표를 달성했습니다!
              </p>

              {/* 현재 기록 표시 */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {(runningData.distance / 1000).toFixed(2)}km
                    </div>
                    <div className="text-sm text-gray-600">거리</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      {Math.floor(runningData.duration / 60000)}분
                    </div>
                    <div className="text-sm text-gray-600">시간</div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowGoalCelebration(false);
                    // 러닝 완료 처리 후 피드 작성
                    handleConfirmCompletion();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                >
                  🎊 완료하고 피드 작성하기
                </button>

                <button
                  onClick={() => setShowGoalCelebration(false)}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  계속 러닝하기
                </button>
              </div>
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

export default NavPage;
