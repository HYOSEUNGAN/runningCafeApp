/**
 * 러닝 앱 성능 최적화 서비스
 * 메모리, 배터리, CPU 사용량을 최적화하여 장시간 러닝 추적을 지원
 */

class PerformanceOptimizer {
  constructor() {
    this.batteryLevel = 1;
    this.isLowPowerMode = false;
    this.memoryUsage = 0;
    this.cpuUsage = 0;
    this.networkStatus = 'online';

    // 적응형 설정
    this.optimizationSettings = {
      high: {
        gpsUpdateInterval: 1000,
        polylineUpdateInterval: 500,
        backgroundSyncInterval: 5000,
        memoryCleanupInterval: 30000,
        maxPathPoints: 10000,
        imageQuality: 0.9,
      },
      medium: {
        gpsUpdateInterval: 2000,
        polylineUpdateInterval: 1000,
        backgroundSyncInterval: 10000,
        memoryCleanupInterval: 20000,
        maxPathPoints: 5000,
        imageQuality: 0.7,
      },
      low: {
        gpsUpdateInterval: 5000,
        polylineUpdateInterval: 2000,
        backgroundSyncInterval: 30000,
        memoryCleanupInterval: 10000,
        maxPathPoints: 2000,
        imageQuality: 0.5,
      },
    };

    this.currentSettings = this.optimizationSettings.high;
    this.performanceMonitor = null;
    this.memoryCleanupTimer = null;

    this.init();
  }

  /**
   * 성능 최적화 서비스 초기화
   */
  async init() {
    try {
      // 배터리 API 지원 확인 및 초기화
      await this.initBatteryMonitoring();

      // 네트워크 상태 모니터링
      this.initNetworkMonitoring();

      // 메모리 사용량 모니터링
      this.initMemoryMonitoring();

      // 성능 모니터링 시작
      this.startPerformanceMonitoring();

      // 메모리 정리 스케줄링
      this.scheduleMemoryCleanup();

      console.log('성능 최적화 서비스 초기화 완료');
    } catch (error) {
      console.error('성능 최적화 서비스 초기화 실패:', error);
    }
  }

  /**
   * 배터리 모니터링 초기화
   */
  async initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();

        this.batteryLevel = battery.level;
        this.isLowPowerMode = battery.level < 0.2;

        // 배터리 레벨 변경 이벤트
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.isLowPowerMode = battery.level < 0.2;
          this.adaptToPerformanceConditions();
        });

        // 충전 상태 변경 이벤트
        battery.addEventListener('chargingchange', () => {
          this.adaptToPerformanceConditions();
        });

        console.log(
          `배터리 모니터링 시작 - 현재 레벨: ${(battery.level * 100).toFixed(0)}%`
        );
      } catch (error) {
        console.warn('배터리 API 사용 불가:', error);
      }
    }
  }

  /**
   * 네트워크 상태 모니터링
   */
  initNetworkMonitoring() {
    // 온라인/오프라인 상태 모니터링
    window.addEventListener('online', () => {
      this.networkStatus = 'online';
      this.adaptToPerformanceConditions();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline';
      this.adaptToPerformanceConditions();
    });

    // 연결 정보 모니터링 (지원되는 경우)
    if ('connection' in navigator) {
      const connection = navigator.connection;

      connection.addEventListener('change', () => {
        this.adaptToPerformanceConditions();
      });
    }
  }

  /**
   * 메모리 사용량 모니터링
   */
  initMemoryMonitoring() {
    if ('memory' in performance) {
      this.memoryUsage = performance.memory.usedJSHeapSize;

      // 주기적으로 메모리 사용량 체크
      setInterval(() => {
        this.memoryUsage = performance.memory.usedJSHeapSize;

        // 메모리 사용량이 높으면 최적화 모드 전환
        const memoryLimitMB = 100; // 100MB
        if (this.memoryUsage > memoryLimitMB * 1024 * 1024) {
          this.adaptToPerformanceConditions();
        }
      }, 10000);
    }
  }

  /**
   * 성능 모니터링 시작
   */
  startPerformanceMonitoring() {
    this.performanceMonitor = setInterval(() => {
      this.monitorPerformance();
    }, 5000);
  }

  /**
   * 성능 모니터링 실행
   */
  monitorPerformance() {
    // CPU 사용량 추정 (프레임 드롭 체크)
    const startTime = performance.now();

    requestAnimationFrame(() => {
      const endTime = performance.now();
      const frameDuration = endTime - startTime;

      // 16.67ms (60fps)보다 오래 걸리면 성능 저하로 판단
      if (frameDuration > 16.67) {
        this.cpuUsage = Math.min(100, (frameDuration / 16.67) * 100);
      } else {
        this.cpuUsage = Math.max(0, this.cpuUsage - 5);
      }

      // 성능 조건에 따른 적응
      this.adaptToPerformanceConditions();
    });
  }

  /**
   * 성능 조건에 따른 적응형 최적화
   */
  adaptToPerformanceConditions() {
    let performanceLevel = 'high';

    // 배터리 레벨 체크
    if (this.batteryLevel < 0.2) {
      performanceLevel = 'low';
    } else if (this.batteryLevel < 0.5) {
      performanceLevel = 'medium';
    }

    // 메모리 사용량 체크
    if (this.memoryUsage > 80 * 1024 * 1024) {
      // 80MB
      performanceLevel = 'low';
    } else if (this.memoryUsage > 50 * 1024 * 1024) {
      // 50MB
      performanceLevel = 'medium';
    }

    // CPU 사용량 체크
    if (this.cpuUsage > 80) {
      performanceLevel = 'low';
    } else if (this.cpuUsage > 50) {
      performanceLevel = 'medium';
    }

    // 네트워크 상태 체크
    if (this.networkStatus === 'offline') {
      // 오프라인 시에는 동기화 간격을 늘림
      this.currentSettings.backgroundSyncInterval *= 2;
    }

    // 설정 적용
    const newSettings = this.optimizationSettings[performanceLevel];
    if (JSON.stringify(this.currentSettings) !== JSON.stringify(newSettings)) {
      this.currentSettings = newSettings;
      this.notifyPerformanceChange(performanceLevel);

      console.log(`성능 최적화 레벨 변경: ${performanceLevel}`, {
        battery: `${(this.batteryLevel * 100).toFixed(0)}%`,
        memory: `${(this.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        cpu: `${this.cpuUsage.toFixed(0)}%`,
        network: this.networkStatus,
      });
    }
  }

  /**
   * 성능 변경 알림
   */
  notifyPerformanceChange(level) {
    // 커스텀 이벤트 발생
    window.dispatchEvent(
      new CustomEvent('performanceOptimizationChange', {
        detail: {
          level,
          settings: this.currentSettings,
          conditions: {
            battery: this.batteryLevel,
            memory: this.memoryUsage,
            cpu: this.cpuUsage,
            network: this.networkStatus,
          },
        },
      })
    );
  }

  /**
   * 메모리 정리 스케줄링
   */
  scheduleMemoryCleanup() {
    this.memoryCleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, this.currentSettings.memoryCleanupInterval);
  }

  /**
   * 메모리 정리 실행
   */
  performMemoryCleanup() {
    try {
      // 가비지 컬렉션 힌트 (Chrome에서만 작동)
      if (window.gc) {
        window.gc();
      }

      // 사용하지 않는 이미지 URL 정리
      this.cleanupImageUrls();

      // 오래된 위치 데이터 정리
      this.cleanupOldLocationData();

      console.log('메모리 정리 완료');
    } catch (error) {
      console.error('메모리 정리 실패:', error);
    }
  }

  /**
   * 이미지 URL 정리
   */
  cleanupImageUrls() {
    // 생성된 Blob URL들을 정리
    const urlsToRevoke = [];

    // DOM에서 사용되지 않는 blob URL 찾기
    document.querySelectorAll('img[src^="blob:"]').forEach(img => {
      if (!img.parentNode || img.parentNode.style.display === 'none') {
        urlsToRevoke.push(img.src);
      }
    });

    urlsToRevoke.forEach(url => {
      URL.revokeObjectURL(url);
    });
  }

  /**
   * 오래된 위치 데이터 정리
   */
  cleanupOldLocationData() {
    // 로컬 스토리지의 오래된 데이터 정리
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일

    keys.forEach(key => {
      if (
        key.startsWith('running_session_') ||
        key.startsWith('temp_running_')
      ) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.timestamp && now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // 파싱 실패한 데이터는 제거
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * GPS 정확도 최적화
   */
  getOptimizedGPSSettings() {
    const baseSettings = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    // 성능 레벨에 따른 GPS 설정 조정
    switch (this.getCurrentPerformanceLevel()) {
      case 'low':
        return {
          ...baseSettings,
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        };
      case 'medium':
        return {
          ...baseSettings,
          timeout: 12000,
          maximumAge: 7000,
        };
      default:
        return baseSettings;
    }
  }

  /**
   * 현재 성능 레벨 반환
   */
  getCurrentPerformanceLevel() {
    if (this.currentSettings === this.optimizationSettings.low) return 'low';
    if (this.currentSettings === this.optimizationSettings.medium)
      return 'medium';
    return 'high';
  }

  /**
   * 현재 설정 반환
   */
  getCurrentSettings() {
    return { ...this.currentSettings };
  }

  /**
   * 성능 메트릭 반환
   */
  getPerformanceMetrics() {
    return {
      batteryLevel: this.batteryLevel,
      isLowPowerMode: this.isLowPowerMode,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      networkStatus: this.networkStatus,
      performanceLevel: this.getCurrentPerformanceLevel(),
    };
  }

  /**
   * 서비스 정리
   */
  cleanup() {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }

    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
    }

    // 마지막 메모리 정리
    this.performMemoryCleanup();
  }
}

// 싱글톤 인스턴스
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;
export { PerformanceOptimizer };
