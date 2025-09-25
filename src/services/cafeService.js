import { supabase } from './supabase';

/**
 * 카페 관련 API 서비스
 * Supabase에서 카페 데이터를 가져오고 관리하는 함수들
 */

/**
 * 모든 카페 데이터를 가져오는 함수
 * @returns {Promise<Array>} 카페 데이터 배열
 */
export const getAllCafes = async () => {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('카페 데이터 가져오기 실패:', error);
      throw error;
    }

    // 데이터를 프론트엔드에서 사용하기 쉽게 변환
    return data.map(cafe => ({
      id: cafe.id,
      name: cafe.name,
      address: cafe.address,
      coordinates: {
        lat: cafe.lat,
        lng: cafe.lng,
      },
      phone: cafe.phone,
      description: cafe.description,
      imageUrl: cafe.image_url,
      createdAt: cafe.created_at,
      // 기본값들 (실제로는 추가 테이블에서 가져올 수 있음)
      rating: 4.5, // 기본 평점
      isOpen: true, // 기본 영업상태
      operatingHours: { open: '08:00', close: '22:00' }, // 기본 영업시간
      features: ['WiFi', '콘센트'], // 기본 편의시설
    }));
  } catch (error) {
    console.error('카페 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 특정 위치 주변의 카페를 가져오는 함수
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {number} radius - 반경 (km, 기본값: 5)
 * @returns {Promise<Array>} 주변 카페 데이터 배열
 */
export const getNearbyCafes = async (lat, lng, radius = 5) => {
  try {
    // Supabase에서 지리적 거리 계산을 위한 쿼리
    // PostGIS 확장이 있다면 더 정확한 거리 계산 가능
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .gte('lat', lat - radius * 0.01) // 대략적인 위도 범위
      .lte('lat', lat + radius * 0.01)
      .gte('lng', lng - radius * 0.01) // 대략적인 경도 범위
      .lte('lng', lng + radius * 0.01);

    if (error) {
      console.error('주변 카페 데이터 가져오기 실패:', error);
      throw error;
    }

    // 정확한 거리 계산 및 정렬
    return data
      .map(cafe => {
        const distance = calculateDistance(lat, lng, cafe.lat, cafe.lng);
        return {
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          coordinates: {
            lat: cafe.lat,
            lng: cafe.lng,
          },
          phone: cafe.phone,
          description: cafe.description,
          imageUrl: cafe.image_url,
          createdAt: cafe.created_at,
          distance: distance,
          distanceText: `${distance.toFixed(1)}km`,
          // 기본값들
          rating: 4.5,
          isOpen: true,
          operatingHours: { open: '08:00', close: '22:00' },
          features: ['WiFi', '콘센트'],
        };
      })
      .filter(cafe => cafe.distance <= radius) // 정확한 반경 내 필터링
      .sort((a, b) => a.distance - b.distance); // 거리순 정렬
  } catch (error) {
    console.error('주변 카페 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 특정 카페 상세 정보를 가져오는 함수
 * @param {number} cafeId - 카페 ID
 * @returns {Promise<Object|null>} 카페 상세 데이터
 */
export const getCafeById = async cafeId => {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', cafeId)
      .single();

    if (error) {
      console.error('카페 상세 정보 가져오기 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      address: data.address,
      coordinates: {
        lat: data.lat,
        lng: data.lng,
      },
      phone: data.phone,
      description: data.description,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      // 기본값들
      rating: 4.5,
      isOpen: true,
      operatingHours: { open: '08:00', close: '22:00' },
      features: ['WiFi', '콘센트'],
    };
  } catch (error) {
    console.error('카페 상세 정보 가져오기 중 오류:', error);
    return null;
  }
};

/**
 * 새 카페를 추가하는 함수
 * @param {Object} cafeData - 카페 데이터
 * @returns {Promise<Object|null>} 생성된 카페 데이터
 */
export const createCafe = async cafeData => {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .insert([
        {
          name: cafeData.name,
          address: cafeData.address,
          lat: cafeData.coordinates.lat,
          lng: cafeData.coordinates.lng,
          phone: cafeData.phone,
          description: cafeData.description,
          image_url: cafeData.imageUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('카페 생성 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      address: data.address,
      coordinates: {
        lat: data.lat,
        lng: data.lng,
      },
      phone: data.phone,
      description: data.description,
      imageUrl: data.image_url,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('카페 생성 중 오류:', error);
    return null;
  }
};

/**
 * 두 지점 간의 거리를 계산하는 함수 (하버사인 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lng1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lng2 - 두 번째 지점의 경도
 * @returns {number} 거리 (km)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
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
 * 네이버 검색 API를 활용한 주변 카페 검색
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {number} radius - 반경 (미터, 기본값: 1000)
 * @param {string} query - 검색 키워드 (기본값: '카페')
 * @returns {Promise<Array>} 검색된 카페 데이터 배열
 */
export const searchNearbyCafesWithNaver = async (
  lat,
  lng,
  radius = 1000,
  query = '카페'
) => {
  try {
    // 네이버 API 서비스를 통해 검색
    const { searchLocal, transformNaverSearchResults } = await import(
      './naverApiService'
    );

    const searchParams = {
      query: `${query} 주변`,
      display: 20,
      start: 1,
      sort: 'comment',
    };

    const data = await searchLocal(searchParams);

    if (!data.items || data.items.length === 0) {
      console.log('네이버 검색 결과가 없습니다. Supabase 데이터를 사용합니다.');
      return await getNearbyCafes(lat, lng, radius / 1000);
    }

    // 네이버 검색 결과를 표준 형식으로 변환
    const transformedCafes = transformNaverSearchResults(data.items, lat, lng);

    // 반경 내 필터링
    return transformedCafes.filter(cafe => {
      if (!cafe.distance) return true;
      return cafe.distance * 1000 <= radius;
    });
  } catch (error) {
    console.error('네이버 카페 검색 중 오류:', error);
    // 네이버 API 실패 시 기본 Supabase 데이터 반환
    return await getNearbyCafes(lat, lng, radius / 1000);
  }
};

/**
 * 카페 데이터의 기본 구조를 검증하는 함수
 * @param {Object} cafeData - 검증할 카페 데이터
 * @returns {boolean} 유효성 여부
 */
export const validateCafeData = cafeData => {
  return (
    cafeData &&
    cafeData.name &&
    cafeData.coordinates &&
    typeof cafeData.coordinates.lat === 'number' &&
    typeof cafeData.coordinates.lng === 'number'
  );
};
