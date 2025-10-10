/**
 * 네이버 지도 관련 유틸리티 함수들
 */

/**
 * 네이버 지도 길찾기 URL 생성
 * @param {Object} destination - 목적지 정보
 * @param {number} destination.lat - 목적지 위도
 * @param {number} destination.lng - 목적지 경도
 * @param {string} destination.name - 목적지 이름
 * @param {Object} origin - 출발지 정보 (선택사항)
 * @param {number} origin.lat - 출발지 위도
 * @param {number} origin.lng - 출발지 경도
 * @param {string} origin.name - 출발지 이름
 * @returns {string} 네이버 지도 길찾기 URL
 */
export const generateNaverMapDirectionsUrl = (destination, origin = null) => {
  const baseUrl = 'https://map.naver.com/v5/directions';

  // 목적지 정보
  const destLat = destination.lat || destination.latitude;
  const destLng = destination.lng || destination.longitude;
  const destName = destination.name || destination.title || '목적지';

  if (!destLat || !destLng) {
    console.error('목적지 좌표가 없습니다:', destination);
    return null;
  }

  // URL 파라미터 구성
  let url = `${baseUrl}/-/-/${destLng},${destLat},${encodeURIComponent(destName)}`;

  // 출발지가 있는 경우 추가
  if (origin && origin.lat && origin.lng) {
    const originName = origin.name || '현재 위치';
    url = `${baseUrl}/${origin.lng},${origin.lat},${encodeURIComponent(originName)}/-/${destLng},${destLat},${encodeURIComponent(destName)}`;
  }

  // 추가 파라미터 (길찾기 모드 등)
  url += '?c=14,0,0,0,dh'; // 기본 줌 레벨과 옵션

  return url;
};

/**
 * 네이버 지도 길찾기 열기
 * @param {Object} destination - 목적지 정보
 * @param {Object} origin - 출발지 정보 (선택사항)
 * @param {boolean} openInNewTab - 새 탭에서 열기 여부 (기본값: true)
 */
export const openNaverMapDirections = (
  destination,
  origin = null,
  openInNewTab = true
) => {
  const url = generateNaverMapDirectionsUrl(destination, origin);

  if (!url) {
    console.error('네이버 지도 URL 생성에 실패했습니다.');
    return false;
  }

  try {
    if (openInNewTab) {
      // 새 탭에서 열기
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // 현재 탭에서 열기
      window.location.href = url;
    }
    return true;
  } catch (error) {
    console.error('네이버 지도 열기 실패:', error);
    return false;
  }
};

/**
 * 현재 위치 기반 네이버 지도 길찾기
 * @param {Object} destination - 목적지 정보
 * @param {boolean} openInNewTab - 새 탭에서 열기 여부
 */
export const openNaverMapDirectionsFromCurrentLocation = (
  destination,
  openInNewTab = true
) => {
  // 현재 위치 가져오기
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: '현재 위치',
        };

        openNaverMapDirections(destination, origin, openInNewTab);
      },
      error => {
        console.warn('현재 위치를 가져올 수 없습니다:', error);
        // 현재 위치 없이 길찾기 열기
        openNaverMapDirections(destination, null, openInNewTab);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분
      }
    );
  } else {
    console.warn('Geolocation이 지원되지 않습니다.');
    // 현재 위치 없이 길찾기 열기
    openNaverMapDirections(destination, null, openInNewTab);
  }
};

/**
 * 네이버 지도에서 장소 검색 URL 생성
 * @param {string} query - 검색어
 * @param {Object} location - 검색 중심 좌표 (선택사항)
 * @returns {string} 네이버 지도 검색 URL
 */
export const generateNaverMapSearchUrl = (query, location = null) => {
  const baseUrl = 'https://map.naver.com/v5/search';
  let url = `${baseUrl}/${encodeURIComponent(query)}`;

  if (location && location.lat && location.lng) {
    url += `?c=${location.lng},${location.lat},15,0,0,0,dh`;
  }

  return url;
};

/**
 * 네이버 지도에서 장소 검색 열기
 * @param {string} query - 검색어
 * @param {Object} location - 검색 중심 좌표 (선택사항)
 * @param {boolean} openInNewTab - 새 탭에서 열기 여부
 */
export const openNaverMapSearch = (
  query,
  location = null,
  openInNewTab = true
) => {
  const url = generateNaverMapSearchUrl(query, location);

  try {
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
    return true;
  } catch (error) {
    console.error('네이버 지도 검색 열기 실패:', error);
    return false;
  }
};

/**
 * 좌표가 유효한지 확인
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {boolean} 유효성 여부
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * 두 지점 간의 거리 계산 (하버사인 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lng1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lng2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구의 반지름 (km)
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
};
