/**
 * 캐시 관리 유틸리티
 * Service Worker와 통신하여 캐시를 관리하고 업데이트를 처리합니다.
 */

class CacheManager {
  constructor() {
    this.serviceWorker = null;
    this.updateAvailable = false;
    this.listeners = new Set();

    this.init();
  }

  /**
   * 캐시 매니저 초기화
   */
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        // Service Worker 등록 확인
        const registration = await navigator.serviceWorker.ready;
        this.serviceWorker = registration;

        // Service Worker 메시지 수신 대기
        navigator.serviceWorker.addEventListener(
          'message',
          this.handleMessage.bind(this)
        );

        // Service Worker 업데이트 확인
        this.checkForUpdates();

        console.log('[CacheManager] 초기화 완료');
      } catch (error) {
        console.error('[CacheManager] 초기화 실패:', error);
      }
    }
  }

  /**
   * Service Worker로부터 메시지 처리
   */
  handleMessage(event) {
    const { type, version, message } = event.data;

    switch (type) {
      case 'SW_UPDATED':
        this.updateAvailable = true;
        this.notifyListeners('updateAvailable', { version, message });
        break;

      case 'CACHE_CLEARED':
        this.notifyListeners('cacheCleared', { message });
        break;

      case 'VERSION_INFO':
        this.notifyListeners('versionInfo', { version });
        break;

      default:
        console.log('[CacheManager] 알 수 없는 메시지:', event.data);
    }
  }

  /**
   * 리스너에게 이벤트 알림
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(eventType, data);
      }
    });
  }

  /**
   * 이벤트 리스너 추가
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Service Worker 업데이트 확인
   */
  async checkForUpdates() {
    if (!this.serviceWorker) return;

    try {
      // Service Worker 업데이트 확인
      await this.serviceWorker.update();

      // 새 Service Worker가 대기 중인지 확인
      if (this.serviceWorker.waiting) {
        this.updateAvailable = true;
        this.notifyListeners('updateAvailable', {
          message: '새 버전이 준비되었습니다.',
        });
      }
    } catch (error) {
      console.error('[CacheManager] 업데이트 확인 실패:', error);
    }
  }

  /**
   * 새 Service Worker로 전환
   */
  async applyUpdate() {
    if (!this.serviceWorker || !this.serviceWorker.waiting) {
      console.warn('[CacheManager] 적용할 업데이트가 없습니다.');
      return false;
    }

    try {
      // 새 Service Worker에게 활성화 요청
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

      // 페이지 새로고침으로 새 버전 적용
      window.location.reload();
      return true;
    } catch (error) {
      console.error('[CacheManager] 업데이트 적용 실패:', error);
      return false;
    }
  }

  /**
   * 모든 캐시 강제 삭제
   */
  async clearAllCaches() {
    try {
      // Service Worker에게 캐시 삭제 요청
      if (this.serviceWorker && this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({ type: 'CLEAR_CACHE' });
      }

      // 브라우저 캐시도 삭제
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // localStorage와 sessionStorage 정리
      localStorage.clear();
      sessionStorage.clear();

      console.log('[CacheManager] 모든 캐시 삭제 완료');
      return true;
    } catch (error) {
      console.error('[CacheManager] 캐시 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 강제 새로고침 (캐시 무시)
   */
  forceReload() {
    // 캐시를 무시하고 서버에서 새로 로드
    window.location.reload(true);
  }

  /**
   * 현재 Service Worker 버전 확인
   */
  async getCurrentVersion() {
    return new Promise(resolve => {
      if (!this.serviceWorker || !this.serviceWorker.active) {
        resolve(null);
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        if (event.data.type === 'VERSION_INFO') {
          resolve(event.data.version);
        } else {
          resolve(null);
        }
      };

      this.serviceWorker.active.postMessage({ type: 'GET_VERSION' }, [
        messageChannel.port2,
      ]);
    });
  }

  /**
   * 업데이트 가능 여부 확인
   */
  isUpdateAvailable() {
    return this.updateAvailable;
  }

  /**
   * 앱 버전 정보 가져오기
   */
  getAppVersion() {
    // package.json의 버전 정보 (빌드 시 환경변수로 주입 가능)
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  /**
   * 캐시 상태 진단
   */
  async diagnostics() {
    const diagnostics = {
      serviceWorker: !!this.serviceWorker,
      updateAvailable: this.updateAvailable,
      appVersion: this.getAppVersion(),
      swVersion: await this.getCurrentVersion(),
      cacheSupport: 'caches' in window,
      storageUsage: null,
    };

    // 스토리지 사용량 확인 (지원되는 경우)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        diagnostics.storageUsage = {
          used: estimate.usage,
          quota: estimate.quota,
          usedMB: Math.round((estimate.usage / 1024 / 1024) * 100) / 100,
          quotaMB: Math.round((estimate.quota / 1024 / 1024) * 100) / 100,
        };
      } catch (error) {
        console.warn('[CacheManager] 스토리지 정보 확인 실패:', error);
      }
    }

    return diagnostics;
  }
}

// 싱글톤 인스턴스 생성
const cacheManager = new CacheManager();

export default cacheManager;

// 편의 함수들
export const checkForUpdates = () => cacheManager.checkForUpdates();
export const applyUpdate = () => cacheManager.applyUpdate();
export const clearAllCaches = () => cacheManager.clearAllCaches();
export const forceReload = () => cacheManager.forceReload();
export const isUpdateAvailable = () => cacheManager.isUpdateAvailable();
export const addUpdateListener = callback => cacheManager.addListener(callback);
export const removeUpdateListener = callback =>
  cacheManager.removeListener(callback);
