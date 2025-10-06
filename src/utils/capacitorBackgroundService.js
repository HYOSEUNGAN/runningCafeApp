/**
 * Capacitor 앱 환경에서의 백그라운드 서비스 유틸리티
 * 네이티브 앱에서 백그라운드 위치 추적을 지원
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';

// 백그라운드 추적 상태
let isBackgroundTracking = false;
let backgroundWatchId = null;
let runningSession = null;

/**
 * Capacitor 환경 확인
 */
export const isCapacitorEnvironment = () => {
  return Capacitor.isNativePlatform();
};

/**
 * 위치 권한 요청
 */
export const requestLocationPermissions = async () => {
  try {
    if (!isCapacitorEnvironment()) {
      return true; // 웹 환경에서는 브라우저 권한 사용
    }

    const permissions = await Geolocation.requestPermissions();
    console.log('위치 권한 상태:', permissions);

    return permissions.location === 'granted';
  } catch (error) {
    console.error('위치 권한 요청 실패:', error);
    return false;
  }
};

/**
 * Capacitor 백그라운드 추적 초기화
 */
export const initializeCapacitorBackgroundTracking = async () => {
  try {
    if (!isCapacitorEnvironment()) {
      console.log('웹 환경: Capacitor 백그라운드 추적 건너뜀');
      return false;
    }

    // 위치 권한 확인
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      console.error('위치 권한이 없어 백그라운드 추적을 시작할 수 없습니다.');
      return false;
    }

    // 앱 상태 변경 리스너 등록
    App.addListener('appStateChange', handleAppStateChange);

    console.log('Capacitor 백그라운드 추적 초기화 완료');
    return true;
  } catch (error) {
    console.error('Capacitor 백그라운드 추적 초기화 실패:', error);
    return false;
  }
};

/**
 * 앱 상태 변경 처리
 */
const handleAppStateChange = state => {
  console.log('앱 상태 변경:', state);

  if (state.isActive) {
    console.log('앱이 포그라운드로 복귀');
    handleForegroundReturn();
  } else {
    console.log('앱이 백그라운드로 이동');
    handleBackgroundEntry();
  }
};

/**
 * 백그라운드 진입 처리
 */
const handleBackgroundEntry = () => {
  if (runningSession && runningSession.isTracking && !runningSession.isPaused) {
    console.log('백그라운드에서 위치 추적 계속');
    startBackgroundLocationTracking();
  }
};

/**
 * 포그라운드 복귀 처리
 */
const handleForegroundReturn = () => {
  if (isBackgroundTracking) {
    console.log('포그라운드 복귀: 백그라운드 추적 중지');
    stopBackgroundLocationTracking();
  }
};

/**
 * 백그라운드 위치 추적 시작
 */
const startBackgroundLocationTracking = async () => {
  try {
    if (isBackgroundTracking || !isCapacitorEnvironment()) {
      return;
    }

    console.log('백그라운드 위치 추적 시작');
    isBackgroundTracking = true;

    // 고정밀 위치 추적 시작
    backgroundWatchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
      position => {
        handleBackgroundLocationUpdate(position);
      },
      error => {
        console.error('백그라운드 위치 추적 오류:', error);
      }
    );

    console.log('백그라운드 위치 추적 시작됨, Watch ID:', backgroundWatchId);
  } catch (error) {
    console.error('백그라운드 위치 추적 시작 실패:', error);
    isBackgroundTracking = false;
  }
};

/**
 * 백그라운드 위치 추적 중지
 */
const stopBackgroundLocationTracking = async () => {
  try {
    if (!isBackgroundTracking) {
      return;
    }

    console.log('백그라운드 위치 추적 중지');
    isBackgroundTracking = false;

    if (backgroundWatchId) {
      await Geolocation.clearWatch({ id: backgroundWatchId });
      backgroundWatchId = null;
      console.log('백그라운드 위치 추적 중지됨');
    }
  } catch (error) {
    console.error('백그라운드 위치 추적 중지 실패:', error);
  }
};

/**
 * 백그라운드 위치 업데이트 처리
 */
const handleBackgroundLocationUpdate = position => {
  if (
    !runningSession ||
    !runningSession.isTracking ||
    runningSession.isPaused
  ) {
    return;
  }

  console.log('백그라운드 위치 업데이트:', position);

  const newPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    timestamp: Date.now(),
    accuracy: position.coords.accuracy,
    speed: position.coords.speed || 0,
    heading: position.coords.heading || 0,
  };

  // 러닝 세션 데이터 업데이트
  if (runningSession.path) {
    runningSession.path.push(newPosition);

    // 거리 계산
    if (runningSession.path.length > 1) {
      const prevPos = runningSession.path[runningSession.path.length - 2];
      const distance = calculateDistance(prevPos, newPosition);

      // GPS 정확도가 좋을 때만 거리 추가
      if (position.coords.accuracy <= 20) {
        runningSession.distance += distance;
      }
    }

    // 시간 업데이트
    runningSession.duration = Date.now() - runningSession.startTime;
  }

  // 로컬 스토리지에 백업
  saveBackgroundSessionData();

  // 메인 앱에 업데이트 알림 (앱이 활성 상태일 때)
  if (window.capacitorBackgroundUpdateCallback) {
    window.capacitorBackgroundUpdateCallback({
      position: newPosition,
      distance: runningSession.distance,
      duration: runningSession.duration,
      path: runningSession.path,
    });
  }
};

/**
 * 백그라운드 세션 데이터 저장
 */
const saveBackgroundSessionData = () => {
  try {
    if (runningSession) {
      const dataToSave = {
        ...runningSession,
        lastBackgroundUpdate: Date.now(),
        isBackgroundSession: true,
      };

      localStorage.setItem(
        'capacitor_running_session',
        JSON.stringify(dataToSave)
      );
    }
  } catch (error) {
    console.error('백그라운드 세션 데이터 저장 실패:', error);
  }
};

/**
 * Capacitor 러닝 세션 시작
 */
export const startCapacitorRunningSession = async sessionData => {
  try {
    if (!isCapacitorEnvironment()) {
      return false;
    }

    console.log('Capacitor 러닝 세션 시작:', sessionData);

    runningSession = {
      ...sessionData,
      isTracking: true,
      isPaused: false,
      path: sessionData.path || [],
      distance: sessionData.distance || 0,
      startTime: sessionData.startTime || Date.now(),
    };

    // 세션 데이터 저장
    saveBackgroundSessionData();

    return true;
  } catch (error) {
    console.error('Capacitor 러닝 세션 시작 실패:', error);
    return false;
  }
};

/**
 * Capacitor 러닝 세션 중지
 */
export const stopCapacitorRunningSession = async () => {
  try {
    if (!isCapacitorEnvironment()) {
      return false;
    }

    console.log('Capacitor 러닝 세션 중지');

    // 백그라운드 추적 중지
    await stopBackgroundLocationTracking();

    // 세션 데이터 정리
    runningSession = null;
    localStorage.removeItem('capacitor_running_session');

    return true;
  } catch (error) {
    console.error('Capacitor 러닝 세션 중지 실패:', error);
    return false;
  }
};

/**
 * 저장된 Capacitor 세션 복구
 */
export const restoreCapacitorRunningSession = () => {
  try {
    const savedData = localStorage.getItem('capacitor_running_session');
    if (savedData) {
      const sessionData = JSON.parse(savedData);

      // 세션이 너무 오래되었으면 무시 (1시간)
      const maxAge = 60 * 60 * 1000; // 1시간
      if (Date.now() - sessionData.lastBackgroundUpdate > maxAge) {
        localStorage.removeItem('capacitor_running_session');
        return null;
      }

      runningSession = sessionData;
      return sessionData;
    }

    return null;
  } catch (error) {
    console.error('Capacitor 세션 복구 실패:', error);
    return null;
  }
};

/**
 * 백그라운드 업데이트 콜백 설정
 */
export const setCapacitorBackgroundUpdateCallback = callback => {
  window.capacitorBackgroundUpdateCallback = callback;
};

/**
 * 두 지점 간의 거리 계산 (Haversine formula)
 */
const calculateDistance = (pos1, pos2) => {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = toRadians(pos2.lat - pos1.lat);
  const dLng = toRadians(pos2.lng - pos1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pos1.lat)) *
      Math.cos(toRadians(pos2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 도를 라디안으로 변환
 */
const toRadians = degrees => {
  return degrees * (Math.PI / 180);
};

/**
 * 정리 함수
 */
export const cleanupCapacitorBackgroundService = async () => {
  try {
    if (isCapacitorEnvironment()) {
      // 앱 상태 리스너 제거
      App.removeAllListeners();

      // 백그라운드 추적 중지
      await stopBackgroundLocationTracking();

      // 세션 데이터 정리
      runningSession = null;
    }
  } catch (error) {
    console.error('Capacitor 백그라운드 서비스 정리 실패:', error);
  }
};
