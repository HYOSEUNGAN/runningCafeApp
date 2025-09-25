/**
 * 네이버 Directions API를 사용한 길찾기 서비스
 * 실제 도로를 따라가는 경로를 제공합니다.
 */

// 네이버 Directions API 설정
const NAVER_DIRECTIONS_API_URL =
  'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving';
const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'zbq7gi1m83';
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

/**
 * 네이버 Directions API를 사용한 경로 검색
 * @param {Object} start - 출발지 좌표 {lat, lng}
 * @param {Object} goal - 도착지 좌표 {lat, lng}
 * @param {string} option - 경로 옵션 ('trafast', 'tracomfort', 'traoptimal')
 * @returns {Promise<Object>} 경로 데이터
 */
export const getDirections = async (start, goal, option = 'traoptimal') => {
  try {
    // API 키가 없는 경우 더미 데이터 반환
    if (!NAVER_CLIENT_SECRET) {
      console.warn(
        '네이버 Directions API 키가 설정되지 않았습니다. 더미 데이터를 사용합니다.'
      );
      return generateDummyRoute(start, goal);
    }

    const url = new URL(NAVER_DIRECTIONS_API_URL);
    url.searchParams.set('start', `${start.lng},${start.lat}`);
    url.searchParams.set('goal', `${goal.lng},${goal.lat}`);
    url.searchParams.set('option', option);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`API Error: ${data.message}`);
    }

    return parseDirectionsResponse(data);
  } catch (error) {
    console.error('네이버 Directions API 오류:', error);
    // API 오류 시 더미 경로 반환
    return generateDummyRoute(start, goal);
  }
};

/**
 * 도보 경로 검색 (네이버 지도 웹 URL 사용)
 * @param {Object} start - 출발지 좌표 {lat, lng}
 * @param {Object} goal - 도착지 좌표 {lat, lng}
 * @returns {Object} 도보 경로 데이터
 */
export const getWalkingDirections = async (start, goal) => {
  try {
    // 도보 경로는 직선거리를 기반으로 한 간단한 경로 생성
    const path = generateWalkingPath(start, goal);
    const distance = calculateDistance(
      start.lat,
      start.lng,
      goal.lat,
      goal.lng
    );
    const duration = Math.ceil(distance * 12); // 분당 5km 기준

    return {
      path,
      distance: Math.round(distance * 1000), // 미터 단위
      duration: duration, // 분 단위
      summary: {
        start: { location: [start.lng, start.lat] },
        goal: { location: [goal.lng, goal.lat] },
        distance: Math.round(distance * 1000),
        duration: duration * 60 * 1000, // 밀리초 단위
      },
    };
  } catch (error) {
    console.error('도보 경로 생성 오류:', error);
    return generateDummyRoute(start, goal);
  }
};

/**
 * 네이버 Directions API 응답을 파싱하는 함수
 * @param {Object} data - API 응답 데이터
 * @returns {Object} 파싱된 경로 데이터
 */
const parseDirectionsResponse = data => {
  const route = data.route?.traoptimal?.[0] || data.route?.trafast?.[0];

  if (!route) {
    throw new Error('경로 데이터를 찾을 수 없습니다.');
  }

  const path = [];

  // 경로 좌표 추출
  route.path?.forEach(coord => {
    path.push([coord[1], coord[0]]); // [lat, lng] 형태로 변환
  });

  return {
    path,
    distance: route.summary?.distance || 0,
    duration: route.summary?.duration || 0,
    summary: route.summary,
  };
};

/**
 * 더미 경로 데이터 생성 (API 키가 없거나 오류 시 사용)
 * @param {Object} start - 출발지 좌표
 * @param {Object} goal - 도착지 좌표
 * @returns {Object} 더미 경로 데이터
 */
const generateDummyRoute = (start, goal) => {
  const path = generateWalkingPath(start, goal);
  const distance = calculateDistance(start.lat, start.lng, goal.lat, goal.lng);
  const duration = Math.ceil(distance * 12); // 분당 5km 기준

  return {
    path,
    distance: Math.round(distance * 1000),
    duration: duration,
    summary: {
      start: { location: [start.lng, start.lat] },
      goal: { location: [goal.lng, goal.lat] },
      distance: Math.round(distance * 1000),
      duration: duration * 60 * 1000,
    },
  };
};

/**
 * 도보 경로 생성 (직선 + 약간의 곡선)
 * @param {Object} start - 출발지 좌표
 * @param {Object} goal - 도착지 좌표
 * @returns {Array} 경로 좌표 배열
 */
const generateWalkingPath = (start, goal) => {
  const path = [];
  const steps = 20; // 경로 세분화 정도

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;

    // 기본 직선 보간
    let lat = start.lat + (goal.lat - start.lat) * ratio;
    let lng = start.lng + (goal.lng - start.lng) * ratio;

    // 약간의 곡선 효과 추가 (실제 도로를 시뮬레이션)
    if (i > 0 && i < steps) {
      const curve = Math.sin(ratio * Math.PI) * 0.0005; // 작은 곡선 효과
      lat += curve;
      lng += curve;
    }

    path.push([lat, lng]);
  }

  return path;
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

/**
 * 경로 좌표를 네이버 지도 LatLng 객체 배열로 변환
 * @param {Array} path - 경로 좌표 배열 [[lat, lng], ...]
 * @returns {Array} 네이버 지도 LatLng 객체 배열
 */
export const convertPathToNaverLatLng = path => {
  if (!window.naver?.maps) {
    console.warn('네이버 지도 API가 로드되지 않았습니다.');
    return [];
  }

  return path.map(coord => new window.naver.maps.LatLng(coord[0], coord[1]));
};

/**
 * 거리와 시간을 사용자 친화적 형태로 포맷팅
 * @param {number} distance - 거리 (미터)
 * @param {number} duration - 시간 (분)
 * @returns {Object} 포맷팅된 거리와 시간
 */
export const formatRouteInfo = (distance, duration) => {
  const distanceText =
    distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`;

  const durationText =
    duration >= 60
      ? `${Math.floor(duration / 60)}시간 ${duration % 60}분`
      : `${duration}분`;

  return {
    distance: distanceText,
    duration: durationText,
    walkingTime: `도보 약 ${duration}분`,
  };
};
