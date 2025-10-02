import { supabase } from './supabase';

/**
 * 러닝 플레이스 관련 API 서비스
 * Supabase에서 러닝 플레이스 데이터를 가져오고 관리하는 함수들
 */

/**
 * 모든 러닝 플레이스 데이터를 가져오는 함수
 * @returns {Promise<Array>} 러닝 플레이스 데이터 배열
 */
export const getAllRunningPlaces = async () => {
  try {
    const { data, error } = await supabase
      .from('running_places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('러닝 플레이스 데이터 가져오기 실패:', error);
      throw error;
    }

    // 데이터를 프론트엔드에서 사용하기 쉽게 변환
    return data.map(place => ({
      id: place.id,
      name: place.name,
      address: place.address,
      coordinates: {
        lat: place.lat,
        lng: place.lng,
      },
      placeType: place.place_type,
      description: place.description,
      difficultyLevel: place.difficulty_level,
      distanceKm: place.distance_km,
      surfaceType: place.surface_type,
      facilities: place.facilities || [],
      imageUrls: place.image_urls || [],
      rating: place.rating || 0,
      reviewCount: place.review_count || 0,
      createdAt: place.created_at,
      updatedAt: place.updated_at,
      // 지도 표시용 추가 속성
      difficulty: getDifficultyText(place.difficulty_level),
      color: getDifficultyColor(place.difficulty_level),
      distance: place.distance_km ? `${place.distance_km}km` : '거리 정보 없음',
    }));
  } catch (error) {
    console.error('러닝 플레이스 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 특정 위치 주변의 러닝 플레이스를 가져오는 함수
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {number} radius - 반경 (km, 기본값: 10)
 * @returns {Promise<Array>} 주변 러닝 플레이스 데이터 배열
 */
export const getNearbyRunningPlaces = async (lat, lng, radius = 10) => {
  try {
    // Supabase에서 지리적 거리 계산을 위한 쿼리
    const { data, error } = await supabase
      .from('running_places')
      .select('*')
      .gte('lat', lat - radius * 0.01) // 대략적인 위도 범위
      .lte('lat', lat + radius * 0.01)
      .gte('lng', lng - radius * 0.01) // 대략적인 경도 범위
      .lte('lng', lng + radius * 0.01);

    if (error) {
      console.error('주변 러닝 플레이스 데이터 가져오기 실패:', error);
      throw error;
    }

    // 정확한 거리 계산 및 정렬
    return data
      .map(place => {
        const distance = calculateDistance(lat, lng, place.lat, place.lng);
        return {
          id: place.id,
          name: place.name,
          address: place.address,
          coordinates: {
            lat: place.lat,
            lng: place.lng,
          },
          placeType: place.place_type,
          description: place.description,
          difficultyLevel: place.difficulty_level,
          distanceKm: place.distance_km,
          surfaceType: place.surface_type,
          facilities: place.facilities || [],
          imageUrls: place.image_urls || [],
          rating: place.rating || 0,
          reviewCount: place.review_count || 0,
          createdAt: place.created_at,
          updatedAt: place.updated_at,
          // 거리 정보 추가
          distance: distance,
          distanceText: `${distance.toFixed(1)}km`,
          // 지도 표시용 추가 속성
          difficulty: getDifficultyText(place.difficulty_level),
          color: getDifficultyColor(place.difficulty_level),
        };
      })
      .filter(place => place.distance <= radius) // 정확한 반경 내 필터링
      .sort((a, b) => a.distance - b.distance); // 거리순 정렬
  } catch (error) {
    console.error('주변 러닝 플레이스 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 특정 러닝 플레이스 상세 정보를 가져오는 함수
 * @param {number} placeId - 러닝 플레이스 ID
 * @returns {Promise<Object|null>} 러닝 플레이스 상세 데이터
 */
export const getRunningPlaceById = async placeId => {
  try {
    const { data, error } = await supabase
      .from('running_places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error) {
      console.error('러닝 플레이스 상세 정보 가져오기 실패:', error);
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
      placeType: data.place_type,
      description: data.description,
      difficultyLevel: data.difficulty_level,
      distanceKm: data.distance_km,
      surfaceType: data.surface_type,
      facilities: data.facilities || [],
      imageUrls: data.image_urls || [],
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      // 지도 표시용 추가 속성
      difficulty: getDifficultyText(data.difficulty_level),
      color: getDifficultyColor(data.difficulty_level),
      distance: data.distance_km ? `${data.distance_km}km` : '거리 정보 없음',
    };
  } catch (error) {
    console.error('러닝 플레이스 상세 정보 가져오기 중 오류:', error);
    return null;
  }
};

/**
 * 플레이스 타입별로 러닝 플레이스를 필터링하는 함수
 * @param {string} placeType - 플레이스 타입 ('park', 'trail', 'track', 'riverside', 'mountain')
 * @returns {Promise<Array>} 해당 타입의 러닝 플레이스 데이터
 */
export const getRunningPlacesByType = async placeType => {
  try {
    const { data, error } = await supabase
      .from('running_places')
      .select('*')
      .eq('place_type', placeType)
      .order('rating', { ascending: false });

    if (error) {
      console.error('타입별 러닝 플레이스 데이터 가져오기 실패:', error);
      throw error;
    }

    return data.map(place => ({
      id: place.id,
      name: place.name,
      address: place.address,
      coordinates: {
        lat: place.lat,
        lng: place.lng,
      },
      placeType: place.place_type,
      description: place.description,
      difficultyLevel: place.difficulty_level,
      distanceKm: place.distance_km,
      surfaceType: place.surface_type,
      facilities: place.facilities || [],
      imageUrls: place.image_urls || [],
      rating: place.rating || 0,
      reviewCount: place.review_count || 0,
      createdAt: place.created_at,
      updatedAt: place.updated_at,
      // 지도 표시용 추가 속성
      difficulty: getDifficultyText(place.difficulty_level),
      color: getDifficultyColor(place.difficulty_level),
      distance: place.distance_km ? `${place.distance_km}km` : '거리 정보 없음',
    }));
  } catch (error) {
    console.error('타입별 러닝 플레이스 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 새 러닝 플레이스를 추가하는 함수
 * @param {Object} placeData - 러닝 플레이스 데이터
 * @returns {Promise<Object|null>} 생성된 러닝 플레이스 데이터
 */
export const createRunningPlace = async placeData => {
  try {
    const { data, error } = await supabase
      .from('running_places')
      .insert([
        {
          name: placeData.name,
          address: placeData.address,
          lat: placeData.coordinates.lat,
          lng: placeData.coordinates.lng,
          place_type: placeData.placeType,
          description: placeData.description,
          difficulty_level: placeData.difficultyLevel,
          distance_km: placeData.distanceKm,
          surface_type: placeData.surfaceType,
          facilities: placeData.facilities,
          image_urls: placeData.imageUrls,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('러닝 플레이스 생성 실패:', error);
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
      placeType: data.place_type,
      description: data.description,
      difficultyLevel: data.difficulty_level,
      distanceKm: data.distance_km,
      surfaceType: data.surface_type,
      facilities: data.facilities || [],
      imageUrls: data.image_urls || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('러닝 플레이스 생성 중 오류:', error);
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
 * 난이도 레벨을 텍스트로 변환하는 함수
 * @param {number} level - 난이도 레벨 (1-5)
 * @returns {string} 난이도 텍스트
 */
const getDifficultyText = level => {
  const difficultyMap = {
    1: 'easy',
    2: 'easy',
    3: 'medium',
    4: 'hard',
    5: 'hard',
  };
  return difficultyMap[level] || 'medium';
};

/**
 * 난이도 레벨에 따른 색상을 반환하는 함수
 * @param {number} level - 난이도 레벨 (1-5)
 * @returns {string} 색상 코드
 */
const getDifficultyColor = level => {
  const colorMap = {
    1: '#10B981', // 초록색 (쉬움)
    2: '#10B981', // 초록색 (쉬움)
    3: '#F59E0B', // 노란색 (보통)
    4: '#EF4444', // 빨간색 (어려움)
    5: '#EF4444', // 빨간색 (어려움)
  };
  return colorMap[level] || '#F59E0B';
};

/**
 * 러닝 플레이스 데이터의 기본 구조를 검증하는 함수
 * @param {Object} placeData - 검증할 러닝 플레이스 데이터
 * @returns {boolean} 유효성 여부
 */
export const validateRunningPlaceData = placeData => {
  return (
    placeData &&
    placeData.name &&
    placeData.coordinates &&
    typeof placeData.coordinates.lat === 'number' &&
    typeof placeData.coordinates.lng === 'number' &&
    placeData.placeType &&
    ['park', 'trail', 'track', 'riverside', 'mountain'].includes(
      placeData.placeType
    )
  );
};

/**
 * 플레이스 타입을 한국어로 변환하는 함수
 * @param {string} placeType - 플레이스 타입
 * @returns {string} 한국어 플레이스 타입
 */
export const getPlaceTypeKorean = placeType => {
  const typeMap = {
    park: '공원',
    trail: '트레일',
    track: '트랙',
    riverside: '강변',
    mountain: '산',
  };
  return typeMap[placeType] || '기타';
};

/**
 * 표면 타입을 한국어로 변환하는 함수
 * @param {string} surfaceType - 표면 타입
 * @returns {string} 한국어 표면 타입
 */
export const getSurfaceTypeKorean = surfaceType => {
  const typeMap = {
    asphalt: '아스팔트',
    dirt: '흙길',
    track: '트랙',
    mixed: '혼합',
  };
  return typeMap[surfaceType] || '기타';
};
