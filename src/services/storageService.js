/**
 * 통합 로컬 저장소 서비스
 * 웹과 네이티브 환경 모두 지원 (Capacitor Preferences와 웹 localStorage 통합)
 */

import platformUtils from '../utils/platformUtils';

// Capacitor imports - 동적으로 로드
let Preferences, Device;

// Capacitor 플러그인 동적 로드
async function loadCapacitorPlugins() {
  try {
    if (await platformUtils.isNative()) {
      const preferencesModule = await import('@capacitor/preferences');
      const deviceModule = await import('@capacitor/device');

      Preferences = preferencesModule.Preferences;
      Device = deviceModule.Device;
    }
  } catch (error) {
    console.log('Capacitor 플러그인 로드 실패 (웹 환경에서는 정상):', error);
  }
}

class StorageService {
  constructor() {
    this.isNativeEnvironment = false;
    this.initPromise = this.initialize();
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      // Capacitor 플러그인 로드
      await loadCapacitorPlugins();

      // 플랫폼 확인
      this.isNativeEnvironment = await platformUtils.isNative();

      console.log('저장소 서비스 초기화:', {
        platform: await platformUtils.getPlatform(),
        isNative: this.isNativeEnvironment,
      });

      return true;
    } catch (error) {
      console.error('저장소 서비스 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 값 저장
   * @param {string} key - 저장할 키
   * @param {any} value - 저장할 값
   * @returns {Promise<boolean>} 성공 여부
   */
  async set(key, value) {
    try {
      await this.initPromise;

      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);

      return await platformUtils.safeApiCall(
        // 웹 환경: localStorage 사용
        () => {
          localStorage.setItem(key, stringValue);
          return true;
        },
        // 네이티브 환경: Capacitor Preferences 사용
        async () => {
          await Preferences.set({
            key,
            value: stringValue,
          });
          return true;
        }
      );
    } catch (error) {
      console.error('저장소 저장 실패:', error);
      return false;
    }
  }

  /**
   * 값 조회
   * @param {string} key - 조회할 키
   * @param {any} defaultValue - 기본값
   * @returns {Promise<any>} 조회된 값
   */
  async get(key, defaultValue = null) {
    try {
      await this.initPromise;

      let value;

      if (this.isNativeEnvironment) {
        // 네이티브 환경: Capacitor Preferences 사용
        const result = await Preferences.get({ key });
        value = result.value;
      } else {
        // 웹 환경: localStorage 사용
        value = localStorage.getItem(key);
      }

      if (value === null) {
        return defaultValue;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('저장소 조회 실패:', error);
      return defaultValue;
    }
  }

  /**
   * 값 삭제
   * @param {string} key - 삭제할 키
   * @returns {Promise<boolean>} 성공 여부
   */
  async remove(key) {
    try {
      await this.initPromise;

      if (this.isNativeEnvironment) {
        // 네이티브 환경: Capacitor Preferences 사용
        await Preferences.remove({ key });
      } else {
        // 웹 환경: localStorage 사용
        localStorage.removeItem(key);
      }

      return true;
    } catch (error) {
      console.error('저장소 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 모든 키 조회
   * @returns {Promise<Array<string>>} 키 목록
   */
  async keys() {
    try {
      await this.initPromise;

      if (this.isNativeEnvironment) {
        // 네이티브 환경: Capacitor Preferences 사용
        const result = await Preferences.keys();
        return result.keys;
      } else {
        // 웹 환경: localStorage 사용
        return Object.keys(localStorage);
      }
    } catch (error) {
      console.error('저장소 키 조회 실패:', error);
      return [];
    }
  }

  /**
   * 모든 데이터 삭제
   * @returns {Promise<boolean>} 성공 여부
   */
  async clear() {
    try {
      await this.initPromise;

      if (this.isNativeEnvironment) {
        // 네이티브 환경: Capacitor Preferences 사용
        await Preferences.clear();
      } else {
        // 웹 환경: localStorage 사용
        localStorage.clear();
      }

      return true;
    } catch (error) {
      console.error('저장소 전체 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 러닝 기록 저장
   * @param {Object} record - 러닝 기록
   * @returns {Promise<boolean>} 성공 여부
   */
  async saveRunningRecord(record) {
    const key = `running_record_${record.id || Date.now()}`;
    return await this.set(key, {
      ...record,
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * 러닝 기록 조회
   * @returns {Promise<Array>} 러닝 기록 목록
   */
  async getRunningRecords() {
    try {
      const keys = await this.keys();
      const runningKeys = keys.filter(key => key.startsWith('running_record_'));

      const records = await Promise.all(runningKeys.map(key => this.get(key)));

      return records.filter(record => record !== null);
    } catch (error) {
      console.error('러닝 기록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 사용자 설정 저장
   * @param {Object} settings - 사용자 설정
   * @returns {Promise<boolean>} 성공 여부
   */
  async saveUserSettings(settings) {
    return await this.set('user_settings', settings);
  }

  /**
   * 사용자 설정 조회
   * @returns {Promise<Object>} 사용자 설정
   */
  async getUserSettings() {
    return await this.get('user_settings', {
      notifications: true,
      hapticFeedback: true,
      autoSync: true,
      theme: 'light',
      units: 'metric',
    });
  }

  /**
   * 오프라인 데이터 저장
   * @param {string} type - 데이터 타입
   * @param {any} data - 저장할 데이터
   * @returns {Promise<boolean>} 성공 여부
   */
  async saveOfflineData(type, data) {
    const key = `offline_${type}_${Date.now()}`;
    return await this.set(key, {
      type,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 오프라인 데이터 조회
   * @param {string} type - 데이터 타입
   * @returns {Promise<Array>} 오프라인 데이터 목록
   */
  async getOfflineData(type) {
    try {
      const keys = await this.keys();
      const offlineKeys = keys.filter(key =>
        key.startsWith(`offline_${type}_`)
      );

      const data = await Promise.all(offlineKeys.map(key => this.get(key)));

      return data.filter(item => item !== null);
    } catch (error) {
      console.error('오프라인 데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 오프라인 데이터 삭제
   * @param {string} type - 데이터 타입
   * @returns {Promise<boolean>} 성공 여부
   */
  async clearOfflineData(type) {
    try {
      const keys = await this.keys();
      const offlineKeys = keys.filter(key =>
        key.startsWith(`offline_${type}_`)
      );

      await Promise.all(offlineKeys.map(key => this.remove(key)));

      return true;
    } catch (error) {
      console.error('오프라인 데이터 삭제 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const storageService = new StorageService();

export default storageService;
export { StorageService };
