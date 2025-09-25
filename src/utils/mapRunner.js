/**
 * 맵 러너 유틸리티 함수들
 * GPS 추적, 경로 분석, 운동 통계 등을 위한 헬퍼 함수들
 */

/**
 * 두 지점 간의 거리를 계산 (하버사인 공식)
 * @param {Object} pos1 - 첫 번째 위치 {lat, lng}
 * @param {Object} pos2 - 두 번째 위치 {lat, lng}
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (pos1, pos2) => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * 경로의 총 거리 계산
 * @param {Array} path - 위치 배열 [{lat, lng}, ...]
 * @returns {number} 총 거리 (미터)
 */
export const calculateTotalDistance = path => {
  if (path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const pos1 = { lat: path[i - 1].lat(), lng: path[i - 1].lng() };
    const pos2 = { lat: path[i].lat(), lng: path[i].lng() };
    totalDistance += calculateDistance(pos1, pos2);
  }

  return totalDistance;
};

/**
 * 평균 속도 계산
 * @param {number} distance - 거리 (미터)
 * @param {number} time - 시간 (밀리초)
 * @returns {number} 평균 속도 (m/s)
 */
export const calculateAverageSpeed = (distance, time) => {
  if (time === 0) return 0;
  return distance / (time / 1000);
};

/**
 * 페이스 계산 (분/km)
 * @param {number} distance - 거리 (미터)
 * @param {number} time - 시간 (밀리초)
 * @returns {number} 페이스 (분/km)
 */
export const calculatePace = (distance, time) => {
  if (distance === 0) return 0;
  const distanceInKm = distance / 1000;
  const timeInMinutes = time / (1000 * 60);
  return timeInMinutes / distanceInKm;
};

/**
 * 칼로리 소모량 계산
 * @param {number} distance - 거리 (미터)
 * @param {number} weight - 체중 (kg, 기본값: 70kg)
 * @param {string} activity - 활동 타입 ('walking', 'running', 'cycling')
 * @returns {number} 소모 칼로리
 */
export const calculateCalories = (
  distance,
  weight = 70,
  activity = 'running'
) => {
  const distanceInKm = distance / 1000;

  const caloriesPerKm = {
    walking: 50,
    running: 70,
    cycling: 40,
  };

  const baseCalories = caloriesPerKm[activity] || 70;
  const weightFactor = weight / 70; // 70kg 기준으로 조정

  return Math.round(distanceInKm * baseCalories * weightFactor);
};

/**
 * 운동 강도 분석
 * @param {Array} speedHistory - 속도 히스토리 배열 (m/s)
 * @returns {Object} 운동 강도 분석 결과
 */
export const analyzeWorkoutIntensity = speedHistory => {
  if (speedHistory.length === 0) {
    return {
      intensity: 'low',
      avgSpeed: 0,
      maxSpeed: 0,
      variability: 0,
    };
  }

  const avgSpeed =
    speedHistory.reduce((sum, speed) => sum + speed, 0) / speedHistory.length;
  const maxSpeed = Math.max(...speedHistory);

  // 속도 변동성 계산 (표준편차)
  const variance =
    speedHistory.reduce(
      (sum, speed) => sum + Math.pow(speed - avgSpeed, 2),
      0
    ) / speedHistory.length;
  const variability = Math.sqrt(variance);

  // 운동 강도 분류 (m/s 기준)
  let intensity = 'low';
  if (avgSpeed > 2.5) intensity = 'medium'; // 약 9km/h 이상
  if (avgSpeed > 4.0) intensity = 'high'; // 약 14.4km/h 이상

  return {
    intensity,
    avgSpeed,
    maxSpeed,
    variability,
  };
};

/**
 * 경로 데이터 압축 (Douglas-Peucker 알고리즘 간소화 버전)
 * @param {Array} path - 원본 경로 배열
 * @param {number} tolerance - 허용 오차 (미터, 기본값: 5m)
 * @returns {Array} 압축된 경로 배열
 */
export const compressPath = (path, tolerance = 5) => {
  if (path.length <= 2) return path;

  const compressedPath = [path[0]]; // 시작점 추가
  let lastAddedIndex = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const distance = calculateDistance(path[lastAddedIndex], path[i]);

    if (distance >= tolerance) {
      compressedPath.push(path[i]);
      lastAddedIndex = i;
    }
  }

  compressedPath.push(path[path.length - 1]); // 끝점 추가

  return compressedPath;
};

/**
 * 러닝 기록 요약 생성
 * @param {Object} runningData - 러닝 데이터
 * @returns {Object} 러닝 기록 요약
 */
export const generateRunningSummary = runningData => {
  const {
    distance,
    duration,
    maxSpeed,
    averageSpeed,
    calories,
    path,
    startTime,
    endTime,
  } = runningData;

  const pace = calculatePace(distance, duration);
  const speedInKmh = averageSpeed * 3.6;
  const maxSpeedInKmh = maxSpeed * 3.6;

  return {
    summary: {
      distance: `${(distance / 1000).toFixed(2)}km`,
      duration: formatDuration(duration),
      avgSpeed: `${speedInKmh.toFixed(1)}km/h`,
      maxSpeed: `${maxSpeedInKmh.toFixed(1)}km/h`,
      pace: `${Math.floor(pace)}:${String(Math.floor((pace % 1) * 60)).padStart(2, '0')}/km`,
      calories: `${calories}kcal`,
    },
    stats: {
      totalPoints: path.length,
      startTime: new Date(startTime).toLocaleString('ko-KR'),
      endTime: new Date(endTime).toLocaleString('ko-KR'),
      efficiency: distance > 0 ? (calories / (distance / 1000)).toFixed(1) : 0,
    },
  };
};

/**
 * 지도 경계 영역 계산
 * @param {Array} path - 경로 배열
 * @param {number} padding - 패딩 (기본값: 0.001도)
 * @returns {Object} 경계 영역 {north, south, east, west}
 */
export const calculateMapBounds = (path, padding = 0.001) => {
  if (path.length === 0) return null;

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  path.forEach(point => {
    const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
    const lng = typeof point.lng === 'function' ? point.lng() : point.lng;

    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  });

  return {
    north: north + padding,
    south: south - padding,
    east: east + padding,
    west: west - padding,
  };
};

/**
 * SNS 공유용 텍스트 생성
 * @param {Object} summary - 러닝 요약 데이터
 * @param {Array} nearbyCafes - 주변 카페 정보
 * @returns {string} SNS 공유용 텍스트
 */
export const generateSNSShareText = (summary, nearbyCafes = []) => {
  const { distance, duration, avgSpeed, calories } = summary;

  let shareText = `🏃‍♂️ Running View에서 달렸어요!\n\n`;
  shareText += `⏱️ 시간: ${duration}\n`;
  shareText += `📏 거리: ${distance}\n`;
  shareText += `🔥 칼로리: ${calories}\n`;
  shareText += `⚡ 평균 속도: ${avgSpeed}\n\n`;

  if (nearbyCafes.length > 0) {
    shareText += `☕ 주변 카페 ${nearbyCafes.length}곳 발견!\n`;
    shareText += `추천 카페: ${nearbyCafes
      .slice(0, 2)
      .map(cafe => cafe.name)
      .join(', ')}\n\n`;
  }

  shareText += `#러닝 #운동 #RunningCafe #건강한일상`;

  return shareText;
};

/**
 * 시간 포맷팅 (밀리초 -> HH:MM:SS)
 * @param {number} milliseconds - 밀리초
 * @returns {string} 포맷된 시간 문자열
 */
export const formatDuration = milliseconds => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * GPS 정확도 평가
 * @param {number} accuracy - GPS 정확도 (미터)
 * @returns {Object} 정확도 평가 결과
 */
export const evaluateGPSAccuracy = accuracy => {
  let quality = 'poor';
  let color = '#EF4444'; // red
  let message = 'GPS 신호가 약합니다';

  if (accuracy <= 5) {
    quality = 'excellent';
    color = '#10B981'; // green
    message = 'GPS 신호가 매우 좋습니다';
  } else if (accuracy <= 10) {
    quality = 'good';
    color = '#059669'; // green-600
    message = 'GPS 신호가 좋습니다';
  } else if (accuracy <= 20) {
    quality = 'fair';
    color = '#F59E0B'; // yellow
    message = 'GPS 신호가 보통입니다';
  }

  return { quality, color, message, accuracy };
};

/**
 * 운동 목표 달성도 계산
 * @param {Object} current - 현재 운동 데이터
 * @param {Object} goal - 목표 데이터
 * @returns {Object} 달성도 정보
 */
export const calculateGoalAchievement = (current, goal) => {
  const achievements = {};

  if (goal.distance) {
    achievements.distance = {
      percentage: Math.min((current.distance / goal.distance) * 100, 100),
      achieved: current.distance >= goal.distance,
    };
  }

  if (goal.duration) {
    achievements.duration = {
      percentage: Math.min((current.duration / goal.duration) * 100, 100),
      achieved: current.duration >= goal.duration,
    };
  }

  if (goal.calories) {
    achievements.calories = {
      percentage: Math.min((current.calories / goal.calories) * 100, 100),
      achieved: current.calories >= goal.calories,
    };
  }

  return achievements;
};
