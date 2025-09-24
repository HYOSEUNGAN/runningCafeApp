/**
 * 위치 관련 유틸리티 함수들
 * GPS 좌표 계산, 거리 측정, 주변 장소 검색 등을 처리
 */

/**
 * 두 좌표 간의 거리를 계산 (Haversine formula)
 * @param {number} lat1 - 첫 번째 위치의 위도
 * @param {number} lng1 - 첫 번째 위치의 경도
 * @param {number} lat2 - 두 번째 위치의 위도
 * @param {number} lng2 - 두 번째 위치의 경도
 * @returns {number} 거리 (킬로미터)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구의 반지름 (킬로미터)
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * 도를 라디안으로 변환
 * @param {number} degrees - 도 단위 각도
 * @returns {number} 라디안 단위 각도
 */
const toRadians = degrees => {
  return degrees * (Math.PI / 180);
};

/**
 * 거리를 사용자 친화적인 문자열로 변환
 * @param {number} distance - 거리 (킬로미터)
 * @returns {string} 포맷된 거리 문자열
 */
export const formatDistance = distance => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
};

/**
 * 사용자 위치 기준으로 카페 목록을 거리순으로 정렬하고 거리 정보를 추가
 * @param {Array} cafes - 카페 목록
 * @param {Object} userLocation - 사용자 위치 {lat, lng}
 * @returns {Array} 거리 정보가 추가되고 정렬된 카페 목록
 */
export const sortCafesByDistance = (cafes, userLocation) => {
  if (!userLocation || !cafes.length) return cafes;

  return cafes
    .map(cafe => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        cafe.coordinates.lat,
        cafe.coordinates.lng
      );

      return {
        ...cafe,
        distance: distance,
        distanceText: formatDistance(distance),
      };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * 특정 반경 내의 카페만 필터링
 * @param {Array} cafes - 카페 목록
 * @param {Object} userLocation - 사용자 위치 {lat, lng}
 * @param {number} radiusKm - 반경 (킬로미터)
 * @returns {Array} 필터링된 카페 목록
 */
export const filterCafesWithinRadius = (cafes, userLocation, radiusKm = 5) => {
  if (!userLocation || !cafes.length) return cafes;

  return cafes.filter(cafe => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      cafe.coordinates.lat,
      cafe.coordinates.lng
    );

    return distance <= radiusKm;
  });
};

/**
 * 현재 시간 기준으로 카페 영업 상태 확인
 * @param {Object} cafe - 카페 정보
 * @returns {boolean} 영업 중 여부
 */
export const isCafeOpen = cafe => {
  // 실제 구현에서는 카페의 영업시간 정보를 사용
  // 현재는 샘플 데이터의 isOpen 속성을 사용
  if (cafe.operatingHours) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;

    const openTime = parseInt(cafe.operatingHours.open.replace(':', ''));
    const closeTime = parseInt(cafe.operatingHours.close.replace(':', ''));

    if (closeTime > openTime) {
      return currentTime >= openTime && currentTime <= closeTime;
    } else {
      // 24시간 영업 또는 자정을 넘어 영업하는 경우
      return currentTime >= openTime || currentTime <= closeTime;
    }
  }

  return cafe.isOpen !== undefined ? cafe.isOpen : true;
};

/**
 * 위치 권한 상태 확인
 * @returns {Promise<string>} 권한 상태 ('granted', 'denied', 'prompt')
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown';
  }

  try {
    const permission = await navigator.permissions.query({
      name: 'geolocation',
    });
    return permission.state;
  } catch (error) {
    console.error('위치 권한 확인 오류:', error);
    return 'unknown';
  }
};

/**
 * 브라우저의 위치 서비스 지원 여부 확인
 * @returns {boolean} 지원 여부
 */
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

/**
 * 카페 데이터에 추가 메타데이터 생성
 * @param {Array} cafes - 카페 목록
 * @param {Object} userLocation - 사용자 위치
 * @returns {Array} 메타데이터가 추가된 카페 목록
 */
export const enrichCafeData = (cafes, userLocation) => {
  return cafes.map(cafe => ({
    ...cafe,
    isOpen: isCafeOpen(cafe),
    distance: userLocation
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          cafe.coordinates.lat,
          cafe.coordinates.lng
        )
      : null,
    distanceText: userLocation
      ? formatDistance(
          calculateDistance(
            userLocation.lat,
            userLocation.lng,
            cafe.coordinates.lat,
            cafe.coordinates.lng
          )
        )
      : '위치 정보 없음',
  }));
};
