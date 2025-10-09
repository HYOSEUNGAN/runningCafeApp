/**
 * 다중 센서 융합 위치 추적 서비스
 * GPS, 가속도계, 자이로스코프, 나침반을 융합하여 정확도 향상
 */

class SensorFusionService {
  constructor() {
    this.sensors = {
      accelerometer: null,
      gyroscope: null,
      magnetometer: null,
      gps: null,
    };

    this.isCalibrated = false;
    this.calibrationData = {
      accelerometer: { x: 0, y: 0, z: 0 },
      gyroscope: { x: 0, y: 0, z: 0 },
      magnetometer: { x: 0, y: 0, z: 0 },
    };

    this.sensorHistory = {
      accelerometer: [],
      gyroscope: [],
      magnetometer: [],
      step: [],
    };

    this.stepCounter = 0;
    this.lastStepTime = 0;
    this.averageStepLength = 0.75; // 평균 보폭 (미터)
    this.currentHeading = 0;
    this.velocity = { x: 0, y: 0 };
    this.position = { lat: 0, lng: 0 };
    this.lastGPSUpdate = 0;

    // 필터 설정
    this.lowPassAlpha = 0.8;
    this.highPassAlpha = 0.1;
    this.stepThreshold = 12; // 걸음 감지 임계값
    this.maxGPSInterval = 10000; // 10초 이상 GPS 없으면 센서 융합 모드

    this.isRunning = false;
    this.callbacks = [];
  }

  /**
   * 센서 초기화 및 시작
   */
  async initialize() {
    try {
      // 권한 요청
      if (typeof DeviceMotionEvent?.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Motion sensor permission denied');
        }
      }

      // 가속도계 시작
      if (window.DeviceMotionEvent) {
        window.addEventListener(
          'devicemotion',
          this.handleDeviceMotion.bind(this)
        );
        console.log('가속도계 센서 활성화');
      }

      // 자이로스코프 및 나침반 시작
      if (window.DeviceOrientationEvent) {
        window.addEventListener(
          'deviceorientation',
          this.handleDeviceOrientation.bind(this)
        );
        console.log('자이로스코프/나침반 센서 활성화');
      }

      // 보폭 캘리브레이션 시작
      this.startCalibration();

      return true;
    } catch (error) {
      console.error('센서 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 센서 융합 추적 시작
   */
  startTracking(initialPosition) {
    this.isRunning = true;
    this.position = { ...initialPosition };
    this.lastGPSUpdate = Date.now();
    this.stepCounter = 0;

    console.log('다중 센서 융합 추적 시작');
  }

  /**
   * 센서 융합 추적 중지
   */
  stopTracking() {
    this.isRunning = false;
    this.clearSensorHistory();
    console.log('다중 센서 융합 추적 중지');
  }

  /**
   * 가속도계 데이터 처리
   */
  handleDeviceMotion(event) {
    if (!this.isRunning) return;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const now = Date.now();
    const accelData = {
      x: acceleration.x || 0,
      y: acceleration.y || 0,
      z: acceleration.z || 0,
      timestamp: now,
    };

    // 저역 통과 필터 적용 (노이즈 제거)
    const filteredAccel = this.applyLowPassFilter(accelData, 'accelerometer');

    // 걸음 감지
    this.detectStep(filteredAccel);

    // 속도 추정 (GPS 없을 때)
    if (now - this.lastGPSUpdate > this.maxGPSInterval) {
      this.estimateVelocityFromAccel(filteredAccel);
    }

    this.updateSensorHistory('accelerometer', filteredAccel);
  }

  /**
   * 자이로스코프/나침반 데이터 처리
   */
  handleDeviceOrientation(event) {
    if (!this.isRunning) return;

    const orientationData = {
      alpha: event.alpha || 0, // 나침반 (0-360도)
      beta: event.beta || 0, // 좌우 기울기
      gamma: event.gamma || 0, // 앞뒤 기울기
      timestamp: Date.now(),
    };

    // 나침반 방향 업데이트
    this.currentHeading = this.normalizeHeading(orientationData.alpha);

    this.updateSensorHistory('gyroscope', orientationData);
  }

  /**
   * 걸음 감지 알고리즘
   */
  detectStep(accelData) {
    const magnitude = Math.sqrt(
      accelData.x * accelData.x +
        accelData.y * accelData.y +
        accelData.z * accelData.z
    );

    const now = accelData.timestamp;
    const timeSinceLastStep = now - this.lastStepTime;

    // 최소 걸음 간격 (300ms) 및 임계값 검사
    if (timeSinceLastStep > 300 && magnitude > this.stepThreshold) {
      this.stepCounter++;
      this.lastStepTime = now;

      // 보폭 기반 위치 추정 (GPS 없을 때)
      if (now - this.lastGPSUpdate > this.maxGPSInterval) {
        this.updatePositionFromStep();
      }

      this.updateSensorHistory('step', {
        count: this.stepCounter,
        magnitude,
        timestamp: now,
      });

      // 콜백 호출
      this.notifyCallbacks('step', {
        stepCount: this.stepCounter,
        estimatedDistance: this.stepCounter * this.averageStepLength,
      });
    }
  }

  /**
   * 보폭 기반 위치 업데이트
   */
  updatePositionFromStep() {
    const stepDistance = this.averageStepLength;
    const headingRad = (this.currentHeading * Math.PI) / 180;

    // 위도/경도 변화량 계산
    const deltaLat = (stepDistance * Math.cos(headingRad)) / 111320; // 1도 = 약 111.32km
    const deltaLng =
      (stepDistance * Math.sin(headingRad)) /
      (111320 * Math.cos((this.position.lat * Math.PI) / 180));

    this.position.lat += deltaLat;
    this.position.lng += deltaLng;

    this.notifyCallbacks('position_estimated', {
      position: { ...this.position },
      source: 'step_counting',
      confidence: 0.3, // 낮은 신뢰도
    });
  }

  /**
   * 가속도계 기반 속도 추정
   */
  estimateVelocityFromAccel(accelData) {
    const dt = 0.1; // 100ms 간격 가정

    // 중력 제거 (간단한 방법)
    const linearAccel = {
      x: accelData.x - this.calibrationData.accelerometer.x,
      y: accelData.y - this.calibrationData.accelerometer.y,
      z: accelData.z - this.calibrationData.accelerometer.z,
    };

    // 속도 적분
    this.velocity.x += linearAccel.x * dt;
    this.velocity.y += linearAccel.y * dt;

    // 속도 감쇠 (드리프트 방지)
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;

    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
    );

    this.notifyCallbacks('velocity_estimated', {
      velocity: { ...this.velocity },
      speed,
      source: 'accelerometer',
    });
  }

  /**
   * GPS 위치 업데이트
   */
  updateGPSPosition(position, accuracy) {
    this.position = { lat: position.lat, lng: position.lng };
    this.lastGPSUpdate = Date.now();

    // GPS 정확도가 좋으면 보폭 캘리브레이션
    if (accuracy < 20 && this.stepCounter > 10) {
      this.calibrateStepLength(position);
    }

    this.notifyCallbacks('gps_updated', {
      position: { ...this.position },
      accuracy,
      source: 'gps',
    });
  }

  /**
   * 보폭 캘리브레이션
   */
  calibrateStepLength(currentPosition) {
    const stepHistory = this.sensorHistory.step.slice(-20); // 최근 20걸음
    if (stepHistory.length < 10) return;

    const firstStep = stepHistory[0];
    const lastStep = stepHistory[stepHistory.length - 1];

    // 실제 이동 거리 계산
    const actualDistance =
      this.calculateDistance(
        this.position.lat,
        this.position.lng,
        currentPosition.lat,
        currentPosition.lng
      ) * 1000; // 미터 단위

    const stepCount = lastStep.count - firstStep.count;

    if (stepCount > 0) {
      const newStepLength = actualDistance / stepCount;

      // 합리적인 범위 내에서만 업데이트 (0.4m ~ 1.2m)
      if (newStepLength >= 0.4 && newStepLength <= 1.2) {
        this.averageStepLength =
          this.averageStepLength * 0.8 + newStepLength * 0.2;
        console.log(`보폭 캘리브레이션: ${this.averageStepLength.toFixed(2)}m`);
      }
    }
  }

  /**
   * 센서 캘리브레이션
   */
  startCalibration() {
    console.log('센서 캘리브레이션 시작 (5초간 정지 상태 유지)');

    const calibrationSamples = {
      accelerometer: [],
      gyroscope: [],
      magnetometer: [],
    };

    const calibrationDuration = 5000; // 5초
    const startTime = Date.now();

    const calibrationInterval = setInterval(() => {
      if (Date.now() - startTime > calibrationDuration) {
        // 캘리브레이션 완료
        this.finishCalibration(calibrationSamples);
        clearInterval(calibrationInterval);
      }
    }, 100);
  }

  finishCalibration(samples) {
    // 평균값으로 캘리브레이션 데이터 설정
    Object.keys(samples).forEach(sensorType => {
      const sensorSamples = samples[sensorType];
      if (sensorSamples.length > 0) {
        const avg = sensorSamples.reduce(
          (acc, sample) => ({
            x: acc.x + (sample.x || 0),
            y: acc.y + (sample.y || 0),
            z: acc.z + (sample.z || 0),
          }),
          { x: 0, y: 0, z: 0 }
        );

        this.calibrationData[sensorType] = {
          x: avg.x / sensorSamples.length,
          y: avg.y / sensorSamples.length,
          z: avg.z / sensorSamples.length,
        };
      }
    });

    this.isCalibrated = true;
    console.log('센서 캘리브레이션 완료');
  }

  /**
   * 저역 통과 필터
   */
  applyLowPassFilter(newData, sensorType) {
    const history = this.sensorHistory[sensorType];
    if (history.length === 0) return newData;

    const lastData = history[history.length - 1];

    return {
      x: this.lowPassAlpha * lastData.x + (1 - this.lowPassAlpha) * newData.x,
      y: this.lowPassAlpha * lastData.y + (1 - this.lowPassAlpha) * newData.y,
      z: this.lowPassAlpha * lastData.z + (1 - this.lowPassAlpha) * newData.z,
      timestamp: newData.timestamp,
    };
  }

  /**
   * 나침반 방향 정규화
   */
  normalizeHeading(alpha) {
    let heading = alpha;
    if (heading < 0) heading += 360;
    if (heading >= 360) heading -= 360;
    return heading;
  }

  /**
   * 센서 히스토리 업데이트
   */
  updateSensorHistory(sensorType, data) {
    if (!this.sensorHistory[sensorType]) {
      this.sensorHistory[sensorType] = [];
    }

    this.sensorHistory[sensorType].push(data);

    // 히스토리 크기 제한
    const maxSize = sensorType === 'step' ? 100 : 50;
    if (this.sensorHistory[sensorType].length > maxSize) {
      this.sensorHistory[sensorType].shift();
    }
  }

  /**
   * 센서 히스토리 초기화
   */
  clearSensorHistory() {
    Object.keys(this.sensorHistory).forEach(key => {
      this.sensorHistory[key] = [];
    });
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
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  /**
   * 콜백 제거
   */
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 콜백 알림
   */
  notifyCallbacks(type, data) {
    this.callbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('콜백 실행 오류:', error);
      }
    });
  }

  /**
   * 현재 상태 반환
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isCalibrated: this.isCalibrated,
      stepCount: this.stepCounter,
      averageStepLength: this.averageStepLength,
      currentHeading: this.currentHeading,
      position: { ...this.position },
      lastGPSUpdate: this.lastGPSUpdate,
      sensorHistory: Object.keys(this.sensorHistory).reduce((acc, key) => {
        acc[key] = this.sensorHistory[key].length;
        return acc;
      }, {}),
    };
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    this.stopTracking();

    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
    }

    if (window.DeviceOrientationEvent) {
      window.removeEventListener(
        'deviceorientation',
        this.handleDeviceOrientation
      );
    }

    this.callbacks = [];
    console.log('센서 융합 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
const sensorFusionService = new SensorFusionService();

export default sensorFusionService;
export { SensorFusionService };
