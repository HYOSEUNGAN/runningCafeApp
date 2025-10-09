/**
 * 고급 위치 추적 서비스
 * GPS, 센서 융합, 칼만 필터를 통합하여 최적의 위치 정확도 제공
 */

import gpsAccuracyService from './gpsAccuracyService';
import sensorFusionService from './sensorFusionService';

class AdvancedLocationService {
  constructor() {
    this.isActive = false;
    this.currentPosition = null;
    this.trackingMode = 'auto'; // auto, gps_only, sensor_fusion
    this.locationHistory = [];
    this.maxHistorySize = 1000;

    // 위치 품질 메트릭
    this.qualityMetrics = {
      accuracy: 0,
      confidence: 0,
      consistency: 0,
      reliability: 0,
    };

    // 환경 감지
    this.environmentDetector = {
      current: 'unknown',
      detectionHistory: [],
      signalStrength: 0,
      satelliteCount: 0,
    };

    // 콜백 관리
    this.callbacks = {
      onLocationUpdate: [],
      onQualityChange: [],
      onEnvironmentChange: [],
      onError: [],
    };

    // 성능 모니터링
    this.performanceMonitor = {
      updateCount: 0,
      averageAccuracy: 0,
      lastUpdateTime: 0,
      processingTime: [],
    };

    // 지능형 설정
    this.adaptiveSettings = {
      updateInterval: 1000, // 기본 1초
      accuracyThreshold: 20, // 20m
      confidenceThreshold: 0.7,
      maxSensorFallbackTime: 30000, // 30초
    };

    this.watchId = null;
    this.updateTimer = null;

    this.initializeServices();
  }

  /**
   * 서비스 초기화
   */
  async initializeServices() {
    try {
      // GPS 정확도 서비스 초기화
      gpsAccuracyService.reset();

      // 센서 융합 서비스 초기화
      const sensorInitialized = await sensorFusionService.initialize();

      // 센서 융합 콜백 등록
      sensorFusionService.addCallback(this.handleSensorFusionUpdate.bind(this));

      console.log('고급 위치 서비스 초기화 완료');
      console.log(`센서 융합 사용 가능: ${sensorInitialized}`);

      return true;
    } catch (error) {
      console.error('고급 위치 서비스 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 위치 추적 시작
   */
  async startTracking(options = {}) {
    if (this.isActive) {
      console.warn('이미 위치 추적이 활성화되어 있습니다');
      return;
    }

    try {
      // 옵션 설정
      this.trackingMode = options.mode || 'auto';
      this.adaptiveSettings = { ...this.adaptiveSettings, ...options.settings };

      // 환경 감지 시작
      this.startEnvironmentDetection();

      // GPS 추적 시작
      await this.startGPSTracking();

      // 센서 융합 시작 (사용 가능한 경우)
      if (this.trackingMode !== 'gps_only') {
        await this.startSensorFusionTracking();
      }

      // 주기적 업데이트 시작
      this.startPeriodicUpdates();

      this.isActive = true;
      console.log(`고급 위치 추적 시작 (모드: ${this.trackingMode})`);

      return true;
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
      this.notifyCallbacks('onError', { type: 'start_failed', error });
      return false;
    }
  }

  /**
   * 위치 추적 중지
   */
  stopTracking() {
    if (!this.isActive) return;

    // GPS 추적 중지
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // 센서 융합 중지
    sensorFusionService.stopTracking();

    // 주기적 업데이트 중지
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.isActive = false;
    console.log('고급 위치 추적 중지');
  }

  /**
   * GPS 추적 시작
   */
  async startGPSTracking() {
    const options = this.getOptimizedGPSOptions();

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        position => {
          this.handleGPSUpdate(position);
          resolve();
        },
        error => {
          console.error('GPS 추적 오류:', error);
          this.notifyCallbacks('onError', { type: 'gps_error', error });
          reject(error);
        },
        options
      );
    });
  }

  /**
   * 센서 융합 추적 시작
   */
  async startSensorFusionTracking() {
    if (this.currentPosition) {
      sensorFusionService.startTracking(this.currentPosition);
    }
  }

  /**
   * GPS 업데이트 처리
   */
  handleGPSUpdate(position) {
    const startTime = performance.now();

    try {
      // GPS 정확도 서비스를 통한 필터링
      const filteredPosition = gpsAccuracyService.processGPSData(position);

      if (!filteredPosition) {
        console.warn('GPS 위치 필터링 실패');
        return;
      }

      // 환경 감지 업데이트
      this.updateEnvironmentDetection(position);

      // 센서 융합에 GPS 데이터 전달
      if (this.trackingMode !== 'gps_only') {
        sensorFusionService.updateGPSPosition(
          filteredPosition,
          position.coords.accuracy
        );
      }

      // 위치 품질 평가
      const quality = this.evaluateLocationQuality(filteredPosition, position);

      // 최종 위치 결정
      const finalPosition = this.determineFinalPosition(
        filteredPosition,
        quality
      );

      // 위치 업데이트
      this.updateCurrentPosition(finalPosition, quality);

      // 성능 메트릭 업데이트
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime, finalPosition.accuracy);
    } catch (error) {
      console.error('GPS 업데이트 처리 오류:', error);
      this.notifyCallbacks('onError', { type: 'gps_processing_error', error });
    }
  }

  /**
   * 센서 융합 업데이트 처리
   */
  handleSensorFusionUpdate(type, data) {
    switch (type) {
      case 'position_estimated':
        if (this.shouldUseSensorEstimate()) {
          this.updateCurrentPosition(data.position, {
            confidence: data.confidence,
          });
        }
        break;

      case 'step':
        // 걸음 수 정보 콜백 전달
        this.notifyCallbacks('onLocationUpdate', {
          type: 'step_update',
          stepCount: data.stepCount,
          estimatedDistance: data.estimatedDistance,
        });
        break;

      case 'velocity_estimated':
        // 속도 정보 콜백 전달
        this.notifyCallbacks('onLocationUpdate', {
          type: 'velocity_update',
          velocity: data.velocity,
          speed: data.speed,
        });
        break;
    }
  }

  /**
   * 센서 추정 위치 사용 여부 결정
   */
  shouldUseSensorEstimate() {
    const now = Date.now();
    const timeSinceLastGPS =
      now - (this.performanceMonitor.lastUpdateTime || 0);

    // GPS 신호가 오래 끊어진 경우에만 센서 추정 사용
    return (
      timeSinceLastGPS > this.adaptiveSettings.maxSensorFallbackTime &&
      this.trackingMode !== 'gps_only'
    );
  }

  /**
   * 환경 감지 시작
   */
  startEnvironmentDetection() {
    // GPS 신호 강도 기반 환경 감지는 handleGPSUpdate에서 수행
    console.log('환경 감지 시작');
  }

  /**
   * 환경 감지 업데이트
   */
  updateEnvironmentDetection(position) {
    const accuracy = position.coords.accuracy;
    let detectedEnvironment = 'unknown';

    // 정확도 기반 환경 추정
    if (accuracy <= 10) {
      detectedEnvironment = 'rural'; // 시골/개방 지역
    } else if (accuracy <= 30) {
      detectedEnvironment = 'suburban'; // 교외
    } else {
      detectedEnvironment = 'urban'; // 도심
    }

    // 환경 변화 감지
    if (detectedEnvironment !== this.environmentDetector.current) {
      console.log(
        `환경 변화 감지: ${this.environmentDetector.current} → ${detectedEnvironment}`
      );

      this.environmentDetector.current = detectedEnvironment;

      // GPS 정확도 서비스 환경 설정 업데이트
      gpsAccuracyService.setEnvironment(detectedEnvironment);

      // 콜백 알림
      this.notifyCallbacks('onEnvironmentChange', {
        environment: detectedEnvironment,
        accuracy,
      });
    }

    this.environmentDetector.signalStrength = Math.max(0, 100 - accuracy);
  }

  /**
   * 위치 품질 평가
   */
  evaluateLocationQuality(position, rawPosition) {
    const accuracy = rawPosition.coords.accuracy;
    const confidence = position.confidence || 0.5;

    // 정확도 점수 (0-1)
    const accuracyScore = Math.max(0, 1 - accuracy / 100);

    // 일관성 점수 (이전 위치와의 일관성)
    let consistencyScore = 1.0;
    if (this.currentPosition) {
      const distance =
        this.calculateDistance(
          this.currentPosition.lat,
          this.currentPosition.lng,
          position.lat,
          position.lng
        ) * 1000; // 미터

      const timeInterval =
        (Date.now() - this.performanceMonitor.lastUpdateTime) / 1000; // 초
      const maxReasonableSpeed = 20; // 20m/s (약 72km/h)
      const expectedMaxDistance = maxReasonableSpeed * timeInterval;

      if (distance > expectedMaxDistance) {
        consistencyScore = Math.max(0.1, expectedMaxDistance / distance);
      }
    }

    // 신뢰도 점수
    const reliabilityScore = confidence;

    // 종합 품질 점수
    const overallQuality =
      accuracyScore * 0.4 + consistencyScore * 0.3 + reliabilityScore * 0.3;

    return {
      accuracy: accuracyScore,
      confidence: reliabilityScore,
      consistency: consistencyScore,
      reliability: overallQuality,
      rawAccuracy: accuracy,
    };
  }

  /**
   * 최종 위치 결정
   */
  determineFinalPosition(position, quality) {
    // 품질이 임계값 이하인 경우 이전 위치 사용 고려
    if (
      quality.reliability < this.adaptiveSettings.confidenceThreshold &&
      this.currentPosition
    ) {
      console.warn(
        `위치 품질 부족 (${quality.reliability.toFixed(2)}), 이전 위치 유지`
      );
      return {
        ...this.currentPosition,
        timestamp: Date.now(),
        estimated: true,
      };
    }

    return {
      ...position,
      timestamp: Date.now(),
      quality,
    };
  }

  /**
   * 현재 위치 업데이트
   */
  updateCurrentPosition(position, quality) {
    this.currentPosition = position;
    this.qualityMetrics = quality;

    // 히스토리 업데이트
    this.updateLocationHistory(position);

    // 성능 모니터 업데이트
    this.performanceMonitor.lastUpdateTime = Date.now();

    // 콜백 알림
    this.notifyCallbacks('onLocationUpdate', {
      position: { ...position },
      quality: { ...quality },
      timestamp: Date.now(),
    });

    // 품질 변화 알림
    this.notifyCallbacks('onQualityChange', {
      metrics: { ...this.qualityMetrics },
      environment: this.environmentDetector.current,
    });
  }

  /**
   * 위치 히스토리 업데이트
   */
  updateLocationHistory(position) {
    this.locationHistory.push({
      ...position,
      timestamp: Date.now(),
    });

    if (this.locationHistory.length > this.maxHistorySize) {
      this.locationHistory.shift();
    }
  }

  /**
   * 주기적 업데이트 시작
   */
  startPeriodicUpdates() {
    this.updateTimer = setInterval(() => {
      this.performPeriodicMaintenance();
    }, this.adaptiveSettings.updateInterval);
  }

  /**
   * 주기적 유지보수
   */
  performPeriodicMaintenance() {
    // 적응형 설정 조정
    this.adjustAdaptiveSettings();

    // 성능 통계 업데이트
    this.updatePerformanceStatistics();

    // 메모리 정리
    this.cleanupMemory();
  }

  /**
   * 적응형 설정 조정
   */
  adjustAdaptiveSettings() {
    const avgAccuracy = this.performanceMonitor.averageAccuracy;
    const environment = this.environmentDetector.current;

    // 환경과 성능에 따른 업데이트 간격 조정
    if (environment === 'urban' && avgAccuracy > 30) {
      this.adaptiveSettings.updateInterval = 2000; // 도심에서 정확도 낮으면 느리게
    } else if (environment === 'rural' && avgAccuracy < 15) {
      this.adaptiveSettings.updateInterval = 500; // 시골에서 정확도 높으면 빠르게
    } else {
      this.adaptiveSettings.updateInterval = 1000; // 기본값
    }
  }

  /**
   * 성능 메트릭 업데이트
   */
  updatePerformanceMetrics(processingTime, accuracy) {
    this.performanceMonitor.updateCount++;

    // 평균 정확도 계산
    this.performanceMonitor.averageAccuracy =
      (this.performanceMonitor.averageAccuracy *
        (this.performanceMonitor.updateCount - 1) +
        accuracy) /
      this.performanceMonitor.updateCount;

    // 처리 시간 기록
    this.performanceMonitor.processingTime.push(processingTime);
    if (this.performanceMonitor.processingTime.length > 100) {
      this.performanceMonitor.processingTime.shift();
    }
  }

  /**
   * 성능 통계 업데이트
   */
  updatePerformanceStatistics() {
    const stats = this.getPerformanceStatistics();

    // 성능이 저하되면 설정 조정
    if (stats.averageProcessingTime > 50) {
      // 50ms 이상
      console.warn('위치 처리 성능 저하 감지, 설정 조정');
      this.adaptiveSettings.updateInterval = Math.min(
        3000,
        this.adaptiveSettings.updateInterval * 1.2
      );
    }
  }

  /**
   * 메모리 정리
   */
  cleanupMemory() {
    // 오래된 히스토리 제거
    const cutoffTime = Date.now() - 60 * 60 * 1000; // 1시간 전
    this.locationHistory = this.locationHistory.filter(
      location => location.timestamp > cutoffTime
    );
  }

  /**
   * 최적화된 GPS 옵션 반환
   */
  getOptimizedGPSOptions() {
    const environment = this.environmentDetector.current;

    const baseOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    // 환경별 최적화
    switch (environment) {
      case 'urban':
        return {
          ...baseOptions,
          timeout: 15000,
          maximumAge: 3000,
        };
      case 'rural':
        return {
          ...baseOptions,
          timeout: 8000,
          maximumAge: 2000,
        };
      default:
        return baseOptions;
    }
  }

  /**
   * 거리 계산
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 콜백 등록
   */
  addCallback(type, callback) {
    if (this.callbacks[type]) {
      this.callbacks[type].push(callback);
    }
  }

  /**
   * 콜백 제거
   */
  removeCallback(type, callback) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].indexOf(callback);
      if (index > -1) {
        this.callbacks[type].splice(index, 1);
      }
    }
  }

  /**
   * 콜백 알림
   */
  notifyCallbacks(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`콜백 실행 오류 (${type}):`, error);
        }
      });
    }
  }

  /**
   * 현재 위치 반환
   */
  getCurrentPosition() {
    return this.currentPosition ? { ...this.currentPosition } : null;
  }

  /**
   * 위치 품질 메트릭 반환
   */
  getQualityMetrics() {
    return { ...this.qualityMetrics };
  }

  /**
   * 환경 정보 반환
   */
  getEnvironmentInfo() {
    return {
      current: this.environmentDetector.current,
      signalStrength: this.environmentDetector.signalStrength,
    };
  }

  /**
   * 성능 통계 반환
   */
  getPerformanceStatistics() {
    const processingTimes = this.performanceMonitor.processingTime;
    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    return {
      updateCount: this.performanceMonitor.updateCount,
      averageAccuracy: this.performanceMonitor.averageAccuracy.toFixed(1),
      averageProcessingTime: avgProcessingTime.toFixed(2),
      locationHistorySize: this.locationHistory.length,
      trackingMode: this.trackingMode,
      isActive: this.isActive,
    };
  }

  /**
   * 서비스 상태 반환
   */
  getStatus() {
    return {
      isActive: this.isActive,
      trackingMode: this.trackingMode,
      currentPosition: this.getCurrentPosition(),
      qualityMetrics: this.getQualityMetrics(),
      environmentInfo: this.getEnvironmentInfo(),
      performanceStats: this.getPerformanceStatistics(),
      gpsStats: gpsAccuracyService.getStatistics(),
      sensorStats: sensorFusionService.getStatus(),
    };
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    this.stopTracking();
    sensorFusionService.cleanup();
    gpsAccuracyService.reset();

    // 콜백 제거
    Object.keys(this.callbacks).forEach(type => {
      this.callbacks[type] = [];
    });

    console.log('고급 위치 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
const advancedLocationService = new AdvancedLocationService();

export default advancedLocationService;
export { AdvancedLocationService };
