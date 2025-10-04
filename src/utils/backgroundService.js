/**
 * 백그라운드 서비스 유틸리티
 * 화면이 꺼지거나 다른 앱으로 이동해도 러닝 추적이 계속되도록 함
 */

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
