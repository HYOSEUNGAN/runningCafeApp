/**
 * GPS 설정 상수 및 유틸리티
 * 모든 GPS 관련 설정을 중앙화하여 일관성 유지
 */

// 기본 GPS 옵션 (캐시 사용 안 함)
export const GPS_OPTIONS = {
  // 러닝 추적용 - 최고 정확도
  RUNNING: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0, // 캐시 사용 안 함
  },

  // 일반 위치 확인용 - 빠른 응답
  QUICK: {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0, // 캐시 사용 안 함
  },

  // 백그라운드 추적용 - 배터리 절약
  BACKGROUND: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0, // 캐시 사용 안 함
  },

  // 테스트/개발용 - 빠른 응답
  DEVELOPMENT: {
    enableHighAccuracy: false,
    timeout: 3000,
    maximumAge: 0, // 캐시 사용 안 함
  },
};

// GPS 품질 기준
export const GPS_QUALITY_THRESHOLDS = {
  EXCELLENT: 10, // 10m 이하
  GOOD: 20, // 20m 이하
  FAIR: 50, // 50m 이하
  POOR: 100, // 100m 이하
};

// 거리 필터링 기준
export const DISTANCE_FILTERS = {
  MIN_MOVEMENT: 1, // 최소 이동 거리 (m)
  MAX_MOVEMENT: 50, // 최대 이동 거리 (m) - 이상치 제거
  OUTLIER_THRESHOLD: 200, // 이상치 임계값 (m)
};

// GPS 오류 코드
export const GPS_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

// GPS 오류 메시지
export const GPS_ERROR_MESSAGES = {
  [GPS_ERROR_CODES.PERMISSION_DENIED]:
    '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.',
  [GPS_ERROR_CODES.POSITION_UNAVAILABLE]: '위치 정보를 사용할 수 없습니다.',
  [GPS_ERROR_CODES.TIMEOUT]: '위치 정보 요청 시간이 초과되었습니다.',
  DEFAULT: '알 수 없는 오류가 발생했습니다.',
};

/**
 * GPS 품질 평가
 * @param {number} accuracy - GPS 정확도 (미터)
 * @returns {string} 품질 등급
 */
export const evaluateGPSQuality = accuracy => {
  if (accuracy <= GPS_QUALITY_THRESHOLDS.EXCELLENT) return 'excellent';
  if (accuracy <= GPS_QUALITY_THRESHOLDS.GOOD) return 'good';
  if (accuracy <= GPS_QUALITY_THRESHOLDS.FAIR) return 'fair';
  return 'poor';
};

/**
 * GPS 품질에 따른 색상 반환
 * @param {string} quality - 품질 등급
 * @returns {string} CSS 색상
 */
export const getGPSQualityColor = quality => {
  const colors = {
    excellent: '#4CAF50', // 녹색
    good: '#8BC34A', // 연녹색
    fair: '#FF9800', // 주황색
    poor: '#F44336', // 빨간색
  };
  return colors[quality] || '#9E9E9E'; // 기본 회색
};

/**
 * GPS 품질에 따른 한글 텍스트 반환
 * @param {string} quality - 품질 등급
 * @returns {string} 한글 텍스트
 */
export const getGPSQualityText = quality => {
  const texts = {
    excellent: '우수',
    good: '양호',
    fair: '보통',
    poor: '불량',
  };
  return texts[quality] || '알 수 없음';
};

/**
 * 거리 계산 유틸리티
 * @param {number} lat1 - 위도1
 * @param {number} lng1 - 경도1
 * @param {number} lat2 - 위도2
 * @param {number} lng2 - 경도2
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
};

/**
 * GPS 데이터 유효성 검사
 * @param {Object} position - GPS 위치 객체
 * @returns {boolean} 유효성 여부
 */
export const isValidGPSPosition = position => {
  if (!position || !position.coords) return false;

  const { latitude, longitude, accuracy } = position.coords;

  // 기본 유효성 검사
  if (typeof latitude !== 'number' || typeof longitude !== 'number')
    return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;

  // 좌표 범위 검사
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;

  // 정확도 검사
  if (accuracy && accuracy > GPS_QUALITY_THRESHOLDS.POOR) return false;

  return true;
};

/**
 * GPS 위치 요청 래퍼 함수
 * @param {Object} options - GPS 옵션
 * @param {Function} onSuccess - 성공 콜백
 * @param {Function} onError - 오류 콜백
 * @returns {Promise} 위치 정보 Promise
 */
export const requestGPSPosition = (
  options = GPS_OPTIONS.QUICK,
  onSuccess,
  onError
) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error = new Error(
        '이 브라우저에서는 위치 서비스를 지원하지 않습니다.'
      );
      if (onError) onError(error);
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        if (isValidGPSPosition(position)) {
          if (onSuccess) onSuccess(position);
          resolve(position);
        } else {
          const error = new Error('유효하지 않은 GPS 위치 데이터입니다.');
          if (onError) onError(error);
          reject(error);
        }
      },
      error => {
        const errorMessage =
          GPS_ERROR_MESSAGES[error.code] || GPS_ERROR_MESSAGES.DEFAULT;
        const enhancedError = new Error(errorMessage);
        enhancedError.code = error.code;

        if (onError) onError(enhancedError);
        reject(enhancedError);
      },
      options
    );
  });
};

/**
 * GPS 위치 추적 래퍼 함수
 * @param {Function} onSuccess - 성공 콜백
 * @param {Function} onError - 오류 콜백
 * @param {Object} options - GPS 옵션
 * @returns {number} watchId
 */
export const watchGPSPosition = (
  onSuccess,
  onError,
  options = GPS_OPTIONS.RUNNING
) => {
  if (!navigator.geolocation) {
    const error = new Error(
      '이 브라우저에서는 위치 서비스를 지원하지 않습니다.'
    );
    if (onError) onError(error);
    return null;
  }

  return navigator.geolocation.watchPosition(
    position => {
      if (isValidGPSPosition(position)) {
        onSuccess(position);
      } else {
        console.warn('유효하지 않은 GPS 위치 데이터 무시:', position);
      }
    },
    error => {
      const errorMessage =
        GPS_ERROR_MESSAGES[error.code] || GPS_ERROR_MESSAGES.DEFAULT;
      const enhancedError = new Error(errorMessage);
      enhancedError.code = error.code;

      if (onError) onError(enhancedError);
    },
    options
  );
};

export default {
  GPS_OPTIONS,
  GPS_QUALITY_THRESHOLDS,
  DISTANCE_FILTERS,
  GPS_ERROR_CODES,
  GPS_ERROR_MESSAGES,
  evaluateGPSQuality,
  getGPSQualityColor,
  getGPSQualityText,
  calculateDistance,
  isValidGPSPosition,
  requestGPSPosition,
  watchGPSPosition,
};
