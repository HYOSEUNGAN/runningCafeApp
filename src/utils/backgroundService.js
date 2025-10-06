/**
 * 백그라운드 서비스 유틸리티
 * 화면이 꺼지거나 다른 앱으로 이동해도 러닝 추적이 계속되도록 함
 */

// Service Worker 관련 변수
let serviceWorker = null;
let isServiceWorkerReady = false;

/**
 * Wake Lock API를 사용한 화면 꺼짐 방지
 */
let wakeLock = null;

export const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock 활성화됨');

      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock 해제됨');
      });

      return true;
    } else {
      console.warn('Wake Lock API가 지원되지 않습니다.');
      return false;
    }
  } catch (error) {
    console.error('Wake Lock 요청 실패:', error);
    return false;
  }
};

export const releaseWakeLock = async () => {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock 해제 완료');
    }
  } catch (error) {
    console.error('Wake Lock 해제 실패:', error);
  }
};

/**
 * 페이지 가시성 변경 감지 및 백그라운드 추적 강화
 */
let visibilityChangeHandler = null;
let backgroundTrackingInterval = null;
let isBackgroundTracking = false;

export const setupBackgroundTracking = (
  onVisibilityChange,
  trackingCallbacks = {}
) => {
  // 페이지 가시성 변경 이벤트 리스너
  visibilityChangeHandler = () => {
    if (document.hidden) {
      console.log('앱이 백그라운드로 이동됨');
      isBackgroundTracking = true;

      // 백그라운드에서도 추적 계속
      if (trackingCallbacks.onBackgroundStart) {
        trackingCallbacks.onBackgroundStart();
      }

      // 백그라운드 알림 표시
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('러닝 추적 중', {
          body: '백그라운드에서 러닝을 계속 추적하고 있습니다.',
          icon: '/favicon.svg',
          tag: 'running-tracking',
          silent: true,
        });
      }

      // 백그라운드에서 주기적으로 위치 업데이트
      backgroundTrackingInterval = setInterval(() => {
        if (trackingCallbacks.onBackgroundUpdate) {
          trackingCallbacks.onBackgroundUpdate();
        }
      }, 5000); // 5초마다 업데이트
    } else {
      console.log('앱이 포그라운드로 복귀됨');
      isBackgroundTracking = false;

      // 백그라운드 추적 중단
      if (backgroundTrackingInterval) {
        clearInterval(backgroundTrackingInterval);
        backgroundTrackingInterval = null;
      }

      if (trackingCallbacks.onForegroundReturn) {
        trackingCallbacks.onForegroundReturn();
      }
    }

    if (onVisibilityChange) {
      onVisibilityChange(!document.hidden);
    }
  };

  document.addEventListener('visibilitychange', visibilityChangeHandler);

  // 페이지 언로드 시에도 데이터 저장
  const beforeUnloadHandler = event => {
    if (trackingCallbacks.onBeforeUnload) {
      trackingCallbacks.onBeforeUnload();
    }
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  window.addEventListener('pagehide', beforeUnloadHandler);
};

export const cleanupBackgroundTracking = () => {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }

  if (backgroundTrackingInterval) {
    clearInterval(backgroundTrackingInterval);
    backgroundTrackingInterval = null;
  }

  isBackgroundTracking = false;
};

/**
 * 백그라운드 상태 확인
 */
export const isInBackground = () => {
  return isBackgroundTracking;
};

/**
 * 알림 권한 요청
 */
export const requestNotificationPermission = async () => {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('알림 권한:', permission);
      return permission === 'granted';
    }
    return false;
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return false;
  }
};

/**
 * 백그라운드 알림 표시
 */
export const showBackgroundNotification = (title, body, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'running-notification',
      requireInteraction: false,
      silent: true,
      ...options,
    });
  }
  return null;
};

/**
 * 러닝 완료 알림
 */
export const showRunningCompleteNotification = (distance, time) => {
  const distanceText =
    distance > 0 ? `${(distance / 1000).toFixed(1)}km` : '운동';
  return showBackgroundNotification(
    '🏃‍♀️ 러닝 완료!',
    `${distanceText} - ${time} 동안 수고하셨습니다!`,
    {
      tag: 'running-complete',
      requireInteraction: true,
      silent: false,
    }
  );
};

/**
 * 로컬 스토리지에 러닝 데이터 임시 저장
 */
export const saveRunningDataToLocal = data => {
  try {
    const key = `running_session_${Date.now()}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        timestamp: Date.now(),
        isBackup: true,
      })
    );
    localStorage.setItem('current_running_session', key);
    console.log('러닝 데이터 로컬 저장 완료:', key);
  } catch (error) {
    console.error('로컬 저장 실패:', error);
  }
};

/**
 * 로컬 스토리지에서 러닝 데이터 복구
 */
export const restoreRunningDataFromLocal = () => {
  try {
    const currentSessionKey = localStorage.getItem('current_running_session');
    if (currentSessionKey) {
      const data = localStorage.getItem(currentSessionKey);
      if (data) {
        return JSON.parse(data);
      }
    }
    return null;
  } catch (error) {
    console.error('로컬 데이터 복구 실패:', error);
    return null;
  }
};

/**
 * 임시 러닝 데이터 정리
 */
export const clearTemporaryRunningData = () => {
  try {
    const currentSessionKey = localStorage.getItem('current_running_session');
    if (currentSessionKey) {
      localStorage.removeItem(currentSessionKey);
      localStorage.removeItem('current_running_session');
    }
  } catch (error) {
    console.error('임시 데이터 정리 실패:', error);
  }
};

/**
 * Service Worker 등록 및 초기화
 */
export const initializeServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker 등록 시작...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker 등록 성공:', registration.scope);

      // Service Worker 상태 확인
      if (registration.installing) {
        console.log('Service Worker 설치 중...');
        serviceWorker = registration.installing;
      } else if (registration.waiting) {
        console.log('Service Worker 대기 중...');
        serviceWorker = registration.waiting;
      } else if (registration.active) {
        console.log('Service Worker 활성화됨');
        serviceWorker = registration.active;
        isServiceWorkerReady = true;
      }

      // Service Worker 상태 변경 감지
      registration.addEventListener('updatefound', () => {
        console.log('새로운 Service Worker 발견');
        serviceWorker = registration.installing;

        serviceWorker.addEventListener('statechange', () => {
          if (serviceWorker.state === 'activated') {
            console.log('새 Service Worker 활성화됨');
            isServiceWorkerReady = true;
          }
        });
      });

      // Service Worker 메시지 수신
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage
      );

      return registration;
    } else {
      console.warn('Service Worker가 지원되지 않습니다.');
      return null;
    }
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
};

/**
 * Service Worker 메시지 처리
 */
const handleServiceWorkerMessage = event => {
  const { type, data } = event.data;

  switch (type) {
    case 'BACKGROUND_TRACKING_STARTED':
      console.log('백그라운드 추적 시작됨:', data);
      break;

    case 'BACKGROUND_TRACKING_STOPPED':
      console.log('백그라운드 추적 중지됨:', data);
      break;

    case 'LOCATION_UPDATE':
      console.log('백그라운드 위치 업데이트:', data);
      // 메인 앱의 상태 업데이트 콜백 호출
      if (window.backgroundLocationCallback) {
        window.backgroundLocationCallback(data);
      }
      break;

    case 'LOCATION_ERROR':
      console.error('백그라운드 위치 오류:', data.error);
      break;

    case 'SYNC_RUNNING_DATA':
      console.log('러닝 데이터 동기화 요청:', data);
      if (window.syncRunningDataCallback) {
        window.syncRunningDataCallback(data);
      }
      break;

    default:
      console.log('알 수 없는 Service Worker 메시지:', type, data);
  }
};

/**
 * Service Worker에게 메시지 전송
 */
export const sendMessageToServiceWorker = async message => {
  try {
    if (!isServiceWorkerReady || !serviceWorker) {
      console.warn('Service Worker가 준비되지 않음');
      return false;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
      return true;
    } else {
      console.warn('Service Worker 컨트롤러가 없음');
      return false;
    }
  } catch (error) {
    console.error('Service Worker 메시지 전송 실패:', error);
    return false;
  }
};

/**
 * 백그라운드 러닝 추적 시작 (Service Worker 사용)
 */
export const startBackgroundRunningTracking = async sessionData => {
  try {
    const success = await sendMessageToServiceWorker({
      type: 'START_BACKGROUND_TRACKING',
      data: sessionData,
    });

    if (success) {
      console.log('백그라운드 러닝 추적 시작 요청 전송됨');
      return true;
    } else {
      console.warn('Service Worker를 사용할 수 없음, 폴백 모드 사용');
      return false;
    }
  } catch (error) {
    console.error('백그라운드 추적 시작 실패:', error);
    return false;
  }
};

/**
 * 백그라운드 러닝 추적 중지 (Service Worker 사용)
 */
export const stopBackgroundRunningTracking = async () => {
  try {
    const success = await sendMessageToServiceWorker({
      type: 'STOP_BACKGROUND_TRACKING',
    });

    if (success) {
      console.log('백그라운드 러닝 추적 중지 요청 전송됨');
      return true;
    }
    return false;
  } catch (error) {
    console.error('백그라운드 추적 중지 실패:', error);
    return false;
  }
};

/**
 * Service Worker에서 러닝 세션 데이터 가져오기
 */
export const getRunningSessionFromServiceWorker = async () => {
  try {
    if (!isServiceWorkerReady || !navigator.serviceWorker.controller) {
      return null;
    }

    return new Promise(resolve => {
      const channel = new MessageChannel();

      channel.port1.onmessage = event => {
        if (event.data.type === 'RUNNING_SESSION_DATA') {
          resolve(event.data.data);
        } else {
          resolve(null);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_RUNNING_SESSION' },
        [channel.port2]
      );

      // 타임아웃 설정 (5초)
      setTimeout(() => resolve(null), 5000);
    });
  } catch (error) {
    console.error('Service Worker 세션 데이터 가져오기 실패:', error);
    return null;
  }
};

/**
 * 백그라운드 위치 업데이트 콜백 설정
 */
export const setBackgroundLocationCallback = callback => {
  window.backgroundLocationCallback = callback;
};

/**
 * 러닝 데이터 동기화 콜백 설정
 */
export const setSyncRunningDataCallback = callback => {
  window.syncRunningDataCallback = callback;
};

/**
 * Service Worker 준비 상태 확인
 */
export const isServiceWorkerActive = () => {
  return (
    isServiceWorkerReady && serviceWorker && serviceWorker.state === 'activated'
  );
};
