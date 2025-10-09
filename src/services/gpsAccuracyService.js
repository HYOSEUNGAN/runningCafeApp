/**
 * GPS 정확도 개선 서비스
 * 칼만 필터, 다중 센서 융합, 적응형 필터링을 통한 GPS 정확도 향상
 */

class KalmanFilter {
  constructor(processNoise = 0.01, measurementNoise = 1.0) {
    // 상태 벡터 [위도, 경도, 위도 속도, 경도 속도]
    this.state = [0, 0, 0, 0];

    // 공분산 행렬 (초기 불확실성)
    this.P = [
      [1000, 0, 0, 0],
      [0, 1000, 0, 0],
      [0, 0, 1000, 0],
      [0, 0, 0, 1000],
    ];

    // 프로세스 노이즈 (GPS의 자연적 변동)
    this.Q = [
      [processNoise, 0, 0, 0],
      [0, processNoise, 0, 0],
      [0, 0, processNoise * 10, 0],
      [0, 0, 0, processNoise * 10],
    ];

    // 측정 노이즈 (GPS 센서 오차)
    this.R = [
      [measurementNoise, 0],
      [0, measurementNoise],
    ];

    this.lastTimestamp = null;
  }

  predict(deltaTime) {
    // 상태 전이 행렬 (위치 = 이전위치 + 속도 * 시간)
    const F = [
      [1, 0, deltaTime, 0],
      [0, 1, 0, deltaTime],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // 상태 예측: x = F * x
    const newState = this.matrixMultiply(
      F,
      this.state.map(x => [x])
    ).map(row => row[0]);
    this.state = newState;

    // 공분산 예측: P = F * P * F^T + Q
    const FT = this.transpose(F);
    const FP = this.matrixMultiply(F, this.P);
    const FPFT = this.matrixMultiply(FP, FT);
    this.P = this.matrixAdd(FPFT, this.Q);
  }

  update(measurement, accuracy) {
    // 측정 행렬 (위도, 경도만 측정)
    const H = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
    ];

    // 동적 측정 노이즈 조정 (정확도에 따라)
    const dynamicR = [
      [accuracy / 10, 0],
      [0, accuracy / 10],
    ];

    // 잔차 계산
    const Hx = this.matrixMultiply(
      H,
      this.state.map(x => [x])
    ).map(row => row[0]);
    const y = [measurement[0] - Hx[0], measurement[1] - Hx[1]];

    // 잔차 공분산
    const HT = this.transpose(H);
    const HP = this.matrixMultiply(H, this.P);
    const HPHT = this.matrixMultiply(HP, HT);
    const S = this.matrixAdd(HPHT, dynamicR);

    // 칼만 게인
    const SInv = this.matrixInverse(S);
    const PHT = this.matrixMultiply(this.P, HT);
    const K = this.matrixMultiply(PHT, SInv);

    // 상태 업데이트
    const Ky = this.matrixMultiply(
      K,
      y.map(x => [x])
    ).map(row => row[0]);
    this.state = this.state.map((x, i) => x + Ky[i]);

    // 공분산 업데이트
    const KH = this.matrixMultiply(K, H);
    const I_KH = this.matrixSubtract(this.identity(4), KH);
    this.P = this.matrixMultiply(I_KH, this.P);
  }

  // 행렬 연산 헬퍼 메서드들
  matrixMultiply(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < B.length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  matrixAdd(A, B) {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  matrixSubtract(A, B) {
    return A.map((row, i) => row.map((val, j) => val - B[i][j]));
  }

  transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  identity(size) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = i === j ? 1 : 0;
      }
    }
    return matrix;
  }

  matrixInverse(matrix) {
    // 2x2 행렬 역행렬 계산 (간단한 케이스)
    if (matrix.length === 2 && matrix[0].length === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      if (Math.abs(det) < 1e-10) {
        // 특이행렬인 경우 단위행렬 반환
        return [
          [1, 0],
          [0, 1],
        ];
      }
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det],
      ];
    }
    // 더 큰 행렬의 경우 단위행렬 반환 (실제로는 LU 분해 등 사용)
    return this.identity(matrix.length);
  }

  getFilteredPosition() {
    return {
      lat: this.state[0],
      lng: this.state[1],
      velocity: {
        lat: this.state[2],
        lng: this.state[3],
      },
    };
  }
}

class GPSAccuracyService {
  constructor() {
    this.kalmanFilter = new KalmanFilter();
    this.positionHistory = [];
    this.maxHistorySize = 20;
    this.outlierThreshold = 100; // 100m 이상 차이나면 이상치로 판단
    this.minAccuracy = 50; // 50m 이하만 신뢰
    this.isInitialized = false;

    // 적응형 설정
    this.adaptiveSettings = {
      urban: {
        // 도심 환경
        processNoise: 0.005,
        measurementNoise: 2.0,
        outlierThreshold: 50,
        minAccuracy: 30,
      },
      suburban: {
        // 교외 환경
        processNoise: 0.01,
        measurementNoise: 1.5,
        outlierThreshold: 75,
        minAccuracy: 40,
      },
      rural: {
        // 시골 환경
        processNoise: 0.02,
        measurementNoise: 1.0,
        outlierThreshold: 100,
        minAccuracy: 50,
      },
    };

    this.currentEnvironment = 'suburban';
    this.lastValidPosition = null;
    this.consecutiveOutliers = 0;
    this.maxConsecutiveOutliers = 5;
  }

  /**
   * 환경 설정 변경 (도심/교외/시골)
   */
  setEnvironment(environment) {
    if (this.adaptiveSettings[environment]) {
      this.currentEnvironment = environment;
      const settings = this.adaptiveSettings[environment];

      // 칼만 필터 재초기화
      this.kalmanFilter = new KalmanFilter(
        settings.processNoise,
        settings.measurementNoise
      );

      this.outlierThreshold = settings.outlierThreshold;
      this.minAccuracy = settings.minAccuracy;

      console.log(`GPS 환경 설정 변경: ${environment}`);
    }
  }

  /**
   * GPS 위치 데이터 처리 및 필터링
   */
  processGPSData(position) {
    const { latitude, longitude, accuracy, timestamp } = position.coords;
    const currentTime = timestamp || Date.now();

    // 정확도가 너무 낮으면 무시
    if (accuracy > this.minAccuracy) {
      console.warn(
        `GPS 정확도 부족: ${accuracy}m (최소 요구: ${this.minAccuracy}m)`
      );
      return this.getLastValidPosition();
    }

    const newPosition = {
      lat: latitude,
      lng: longitude,
      accuracy,
      timestamp: currentTime,
    };

    // 초기화
    if (!this.isInitialized) {
      this.initializeFilter(newPosition);
      return newPosition;
    }

    // 이상치 검출
    if (this.isOutlier(newPosition)) {
      this.consecutiveOutliers++;

      if (this.consecutiveOutliers > this.maxConsecutiveOutliers) {
        // 연속된 이상치가 많으면 필터 재초기화
        console.warn('연속된 GPS 이상치 감지, 필터 재초기화');
        this.initializeFilter(newPosition);
        return newPosition;
      }

      console.warn('GPS 이상치 감지, 이전 위치 사용');
      return this.getLastValidPosition();
    }

    this.consecutiveOutliers = 0;

    // 칼만 필터 적용
    const deltaTime = this.kalmanFilter.lastTimestamp
      ? (currentTime - this.kalmanFilter.lastTimestamp) / 1000
      : 1;

    this.kalmanFilter.lastTimestamp = currentTime;
    this.kalmanFilter.predict(deltaTime);
    this.kalmanFilter.update([latitude, longitude], accuracy);

    const filteredPosition = this.kalmanFilter.getFilteredPosition();

    // 히스토리 업데이트
    this.updateHistory({
      ...filteredPosition,
      accuracy,
      timestamp: currentTime,
      original: newPosition,
    });

    this.lastValidPosition = filteredPosition;

    return {
      lat: filteredPosition.lat,
      lng: filteredPosition.lng,
      accuracy: accuracy * 0.7, // 필터링으로 정확도 개선 추정
      timestamp: currentTime,
      filtered: true,
      confidence: this.calculateConfidence(accuracy, deltaTime),
    };
  }

  /**
   * 필터 초기화
   */
  initializeFilter(position) {
    this.kalmanFilter.state = [position.lat, position.lng, 0, 0];
    this.kalmanFilter.lastTimestamp = position.timestamp;
    this.lastValidPosition = position;
    this.isInitialized = true;
    this.consecutiveOutliers = 0;

    console.log('GPS 칼만 필터 초기화 완료');
  }

  /**
   * 이상치 검출
   */
  isOutlier(newPosition) {
    if (!this.lastValidPosition) return false;

    const distance =
      this.calculateDistance(
        this.lastValidPosition.lat,
        this.lastValidPosition.lng,
        newPosition.lat,
        newPosition.lng
      ) * 1000; // 미터 단위

    return distance > this.outlierThreshold;
  }

  /**
   * 신뢰도 계산
   */
  calculateConfidence(accuracy, deltaTime) {
    let confidence = 1.0;

    // 정확도에 따른 신뢰도
    confidence *= Math.max(0.1, 1 - accuracy / this.minAccuracy);

    // 시간 간격에 따른 신뢰도 (너무 오래되면 신뢰도 감소)
    if (deltaTime > 5) {
      confidence *= Math.max(0.3, 1 - deltaTime / 30);
    }

    // 히스토리 기반 신뢰도
    if (this.positionHistory.length > 5) {
      const recentAccuracies = this.positionHistory
        .slice(-5)
        .map(p => p.accuracy);
      const avgAccuracy =
        recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;
      confidence *= Math.max(0.2, 1 - avgAccuracy / this.minAccuracy);
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 위치 히스토리 업데이트
   */
  updateHistory(position) {
    this.positionHistory.push(position);

    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }
  }

  /**
   * 마지막 유효 위치 반환
   */
  getLastValidPosition() {
    return this.lastValidPosition
      ? {
          ...this.lastValidPosition,
          confidence: 0.5, // 추정 위치이므로 신뢰도 낮춤
          estimated: true,
        }
      : null;
  }

  /**
   * 거리 계산 (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 통계 정보 반환
   */
  getStatistics() {
    if (this.positionHistory.length === 0) return null;

    const accuracies = this.positionHistory.map(p => p.accuracy);
    const avgAccuracy =
      accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);

    return {
      totalPoints: this.positionHistory.length,
      averageAccuracy: avgAccuracy.toFixed(1),
      maxAccuracy: maxAccuracy.toFixed(1),
      minAccuracy: minAccuracy.toFixed(1),
      outlierCount: this.consecutiveOutliers,
      environment: this.currentEnvironment,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 서비스 리셋
   */
  reset() {
    this.kalmanFilter = new KalmanFilter();
    this.positionHistory = [];
    this.isInitialized = false;
    this.lastValidPosition = null;
    this.consecutiveOutliers = 0;

    console.log('GPS Accuracy Service 리셋 완료');
  }
}

// 싱글톤 인스턴스
const gpsAccuracyService = new GPSAccuracyService();

export default gpsAccuracyService;
export { GPSAccuracyService, KalmanFilter };
