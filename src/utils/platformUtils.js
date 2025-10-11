/**
 * 플랫폼 감지 및 호환성 유틸리티
 * 웹과 네이티브 환경을 자동으로 감지하고 적절한 API를 사용하도록 도움
 */

import { Device } from '@capacitor/device';

class PlatformUtils {
  constructor() {
    this.platform = null;
    this.isInitialized = false;
    this.initPromise = this.initialize();
  }

  /**
   * 플랫폼 초기화
   */
  async initialize() {
    try {
      // Capacitor가 사용 가능한지 확인
      if (typeof Device !== 'undefined') {
        const deviceInfo = await Device.getInfo();
        this.platform = deviceInfo.platform;
      } else {
        this.platform = 'web';
      }

      this.isInitialized = true;
      console.log('플랫폼 감지 완료:', this.platform);
      return this.platform;
    } catch (error) {
      // Capacitor가 없거나 오류가 발생한 경우 웹으로 간주
      console.log('Capacitor 미사용 환경, 웹 모드로 설정');
      this.platform = 'web';
      this.isInitialized = true;
      return this.platform;
    }
  }

  /**
   * 현재 플랫폼 반환
   */
  async getPlatform() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
    return this.platform;
  }

  /**
   * 웹 환경 여부 확인
   */
  async isWeb() {
    const platform = await this.getPlatform();
    return platform === 'web';
  }

  /**
   * 네이티브 환경 여부 확인
   */
  async isNative() {
    const platform = await this.getPlatform();
    return platform !== 'web';
  }

  /**
   * iOS 환경 여부 확인
   */
  async isIOS() {
    const platform = await this.getPlatform();
    return platform === 'ios';
  }

  /**
   * Android 환경 여부 확인
   */
  async isAndroid() {
    const platform = await this.getPlatform();
    return platform === 'android';
  }

  /**
   * Capacitor 플러그인 사용 가능 여부 확인
   */
  async isCapacitorAvailable() {
    try {
      await this.initPromise;
      return this.platform !== 'web' && typeof Device !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * 특정 웹 API 사용 가능 여부 확인
   */
  isWebAPIAvailable(apiName) {
    switch (apiName) {
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'devicemotion':
        return 'DeviceMotionEvent' in window;
      case 'deviceorientation':
        return 'DeviceOrientationEvent' in window;
      case 'serviceworker':
        return 'serviceWorker' in navigator;
      case 'broadcastchannel':
        return 'BroadcastChannel' in window;
      case 'localstorage':
        return 'localStorage' in window;
      case 'camera':
        return (
          'mediaDevices' in navigator &&
          'getUserMedia' in navigator.mediaDevices
        );
      default:
        return false;
    }
  }

  /**
   * 안전한 API 호출 래퍼
   * 웹에서는 웹 API, 네이티브에서는 Capacitor API 사용
   */
  async safeApiCall(webFn, nativeFn, fallbackFn = null) {
    try {
      const isNative = await this.isNative();

      if (isNative && nativeFn) {
        return await nativeFn();
      } else if (webFn) {
        return await webFn();
      } else if (fallbackFn) {
        return await fallbackFn();
      } else {
        throw new Error('사용 가능한 API가 없습니다');
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
      if (fallbackFn) {
        return await fallbackFn();
      }
      throw error;
    }
  }

  /**
   * 플랫폼별 설정 반환
   */
  async getPlatformConfig() {
    const platform = await this.getPlatform();
    const isNative = platform !== 'web';

    return {
      platform,
      isNative,
      isWeb: !isNative,
      features: {
        geolocation: isNative || this.isWebAPIAvailable('geolocation'),
        deviceMotion: isNative || this.isWebAPIAvailable('devicemotion'),
        camera: isNative || this.isWebAPIAvailable('camera'),
        storage: true, // 항상 사용 가능
        notifications: isNative || 'Notification' in window,
        haptics: isNative, // 네이티브에서만 지원
        backgroundSync: isNative || this.isWebAPIAvailable('serviceworker'),
      },
      apis: {
        // 위치 서비스
        geolocation: isNative ? 'capacitor' : 'web',
        // 저장소
        storage: isNative ? 'preferences' : 'localstorage',
        // 카메라
        camera: isNative ? 'capacitor' : 'webrtc',
        // 알림
        notifications: isNative ? 'capacitor' : 'web',
      },
    };
  }
}

// 싱글톤 인스턴스
const platformUtils = new PlatformUtils();

export default platformUtils;
export { PlatformUtils };
