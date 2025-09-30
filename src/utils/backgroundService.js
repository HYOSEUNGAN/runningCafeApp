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
 * 페이지 가시성 변경 감지
 */
let visibilityChangeHandler = null;

export const setupBackgroundTracking = (onVisibilityChange) => {
  // 페이지 가시성 변경 이벤트 리스너
  visibilityChangeHandler = () => {
    if (document.hidden) {
      console.log('앱이 백그라운드로 이동됨');
      // 백그라운드 알림 표시
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('러닝 추적 중', {
          body: '백그라운드에서 러닝을 계속 추적하고 있습니다.',
          icon: '/favicon.ico',
          tag: 'running-tracking'
        });
      }
    } else {
      console.log('앱이 포그라운드로 복귀됨');
    }
    
    if (onVisibilityChange) {
      onVisibilityChange(!document.hidden);
    }
  };
  
  document.addEventListener('visibilitychange', visibilityChangeHandler);
};

export const cleanupBackgroundTracking = () => {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
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
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'running-notification',
      requireInteraction: false,
      ...options
    });
  }
  return null;
};

/**
 * 러닝 완료 알림
 */
export const showRunningCompleteNotification = (distance, time) => {
  const distanceText = distance > 0 ? `${(distance / 1000).toFixed(1)}km` : '운동';
  return showBackgroundNotification(
    '🏃‍♀️ 러닝 완료!',
    `${distanceText} - ${time} 동안 수고하셨습니다!`,
    {
      tag: 'running-complete',
      requireInteraction: true
    }
  );
};

