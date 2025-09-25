/**
 * 네이버 API 서비스
 * 클라이언트에서 서버를 통해 네이버 검색 API를 호출하는 서비스
 */

/**
 * 네이버 지역 검색 API 호출
 * @param {Object} params - 검색 파라미터
 * @param {string} params.query - 검색어
 * @param {number} params.display - 검색 결과 출력 건수 (기본값: 20, 최대: 20)
 * @param {number} params.start - 검색 시작 위치 (기본값: 1, 최대: 1000)
 * @param {string} params.sort - 정렬 옵션 (random, comment)
 * @returns {Promise<Object>} 검색 결과
 */
export const searchLocal = async params => {
  try {
    const response = await fetch('/api/naver/search/local', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('네이버 지역 검색 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 네이버 길찾기 API 호출 (Directions 5 API)
 * @param {Object} params - 길찾기 파라미터
 * @param {string} params.start - 출발지 (경도,위도 형식)
 * @param {string} params.goal - 목적지 (경도,위도 형식)
 * @param {string} params.option - 경로 옵션 (trafast, tracomfort, traoptimal 등)
 * @returns {Promise<Object>} 길찾기 결과
 */
export const getDirections = async params => {
  try {
    const response = await fetch('/api/naver/directions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('네이버 길찾기 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {Promise<Object>} 주소 정보
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch('/api/naver/geocode/reverse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coords: `${lng},${lat}`,
        orders: 'roadaddr,addr',
        output: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('네이버 역지오코딩 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 주소를 좌표로 변환 (Geocoding)
 * @param {string} address - 주소
 * @returns {Promise<Object>} 좌표 정보
 */
export const geocode = async address => {
  try {
    const response = await fetch('/api/naver/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: address,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('네이버 지오코딩 API 호출 실패:', error);
    throw error;
  }
};

/**
 * API 응답 데이터를 표준화하는 헬퍼 함수들
 */

/**
 * 네이버 지역 검색 결과를 표준 카페 데이터 형식으로 변환
 * @param {Array} items - 네이버 검색 결과 items
 * @param {number} userLat - 사용자 위도 (거리 계산용)
 * @param {number} userLng - 사용자 경도 (거리 계산용)
 * @returns {Array} 표준화된 카페 데이터 배열
 */
export const transformNaverSearchResults = (items, userLat, userLng) => {
  return items
    .map((item, index) => {
      // HTML 태그 제거
      const cleanTitle = item.title.replace(/<[^>]*>/g, '');
      const cleanDescription = item.description?.replace(/<[^>]*>/g, '') || '';

      // 네이버 좌표계를 WGS84로 변환
      const lat = item.mapy ? item.mapy / 10000000 : null;
      const lng = item.mapx ? item.mapx / 10000000 : null;

      let distance = null;
      let distanceText = '';

      if (lat && lng && userLat && userLng) {
        distance = calculateDistance(userLat, userLng, lat, lng);
        distanceText =
          distance < 1
            ? `${Math.round(distance * 1000)}m`
            : `${distance.toFixed(1)}km`;
      }

      return {
        id: `naver_${index}_${Date.now()}`,
        name: cleanTitle,
        address: item.address,
        roadAddress: item.roadAddress,
        coordinates: lat && lng ? { lat, lng } : null,
        phone: item.telephone || '',
        description: cleanDescription,
        category: item.category,
        link: item.link,
        distance,
        distanceText,
        source: 'naver',
        // 기본값들
        rating: 4.0,
        isOpen: true,
        operatingHours: { open: '08:00', close: '22:00' },
        features: ['WiFi'],
      };
    })
    .filter(cafe => cafe.coordinates) // 좌표가 있는 항목만
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity)); // 거리순 정렬
};

/**
 * 두 지점 간의 거리를 계산하는 함수 (하버사인 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lng1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lng2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 도를 라디안으로 변환하는 헬퍼 함수
 * @param {number} deg - 도
 * @returns {number} 라디안
 */
const toRad = deg => {
  return deg * (Math.PI / 180);
};
