/**
 * 샘플 카페 데이터를 Supabase에 추가하는 유틸리티
 * 개발 및 테스트 목적으로 사용
 */

import { createCafe } from '../services/cafeService';

// 서울 지역 샘플 카페 데이터
export const sampleCafes = [
  {
    name: '러닝 후 힐링 카페',
    address: '서울시 마포구 한강대로 123',
    coordinates: { lat: 37.5225, lng: 126.99 },
    phone: '02-123-4567',
    description:
      '한강뷰와 함께 즐기는 러닝 후 완벽한 휴식 공간. 프로틴 음료와 건강한 간식을 제공합니다.',
    imageUrl: null,
    features: ['러닝 후 추천', 'WiFi', '콘센트', '프로틴 음료'],
  },
  {
    name: '한강뷰 카페',
    address: '서울시 용산구 한강대로 456',
    coordinates: { lat: 37.521, lng: 126.989 },
    phone: '02-234-5678',
    description:
      '한강이 내려다보이는 테라스가 있는 카페. 러닝 후 샤워 시설도 이용 가능합니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '테라스', '샤워실', 'WiFi'],
  },
  {
    name: '올림픽공원 카페',
    address: '서울시 송파구 올림픽로 789',
    coordinates: { lat: 37.5208, lng: 127.1235 },
    phone: '02-345-6789',
    description:
      '올림픽공원 바로 옆에 위치한 러너들의 성지. 주차장과 러닝 코스 연결 통로가 있습니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '주차장', '러닝 코스 연결', '제휴카페'],
  },
  {
    name: '강변 러너스 카페',
    address: '서울시 영등포구 여의도동 123',
    coordinates: { lat: 37.518, lng: 126.995 },
    phone: '02-456-7890',
    description:
      '24시간 운영하는 러너 전용 카페. 러닝 클럽 모임 장소로도 인기가 높습니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '24시간', '러닝 클럽', '프로틴 음료'],
  },
  {
    name: '서울숲 브런치 카페',
    address: '서울시 성동구 성수동1가 456',
    coordinates: { lat: 37.5443, lng: 127.0378 },
    phone: '02-567-8901',
    description:
      '서울숲 근처의 건강한 브런치 전문점. 러닝 후 회복에 좋은 메뉴들을 제공합니다.',
    imageUrl: null,
    features: ['브런치', '건강식', '러닝 후 회복 메뉴', 'WiFi'],
  },
  {
    name: '반포한강공원 카페',
    address: '서울시 서초구 반포동 19',
    coordinates: { lat: 37.5133, lng: 126.9965 },
    phone: '02-678-9012',
    description:
      '반포한강공원 무지개다리 근처 위치. 일출 러닝 후 모닝커피를 즐기기 좋습니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '모닝커피', '한강뷰', '제휴카페'],
  },
  {
    name: '청계천 러닝 카페',
    address: '서울시 중구 청계천로 100',
    coordinates: { lat: 37.5692, lng: 126.9784 },
    phone: '02-789-0123',
    description:
      '청계천 러닝 코스 중간지점에 위치. 도심 러닝족들에게 인기 만점입니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '도심 위치', '러닝 코스 연결', 'WiFi'],
  },
  {
    name: '월드컵공원 카페',
    address: '서울시 마포구 월드컵로 240',
    coordinates: { lat: 37.5663, lng: 126.8997 },
    phone: '02-890-1234',
    description:
      '월드컵공원 내 위치한 넓은 공간의 카페. 러닝 동호회 모임 장소로 최적입니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '넓은 공간', '러닝 클럽', '주차장'],
  },
  {
    name: '남산 힐링 카페',
    address: '서울시 중구 남산공원길 105',
    coordinates: { lat: 37.5512, lng: 126.9882 },
    phone: '02-901-2345',
    description:
      '남산 등반 후 휴식하기 좋은 카페. 서울 전경을 감상하며 커피를 즐길 수 있습니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '서울 전경', '등반 후 휴식', 'WiFi'],
  },
  {
    name: '뚝섬한강공원 카페',
    address: '서울시 광진구 자양동 704-1',
    coordinates: { lat: 37.5311, lng: 127.0648 },
    phone: '02-012-3456',
    description:
      '뚝섬한강공원 내 위치. 자전거 보관소와 러닝 용품 대여 서비스도 제공합니다.',
    imageUrl: null,
    features: ['러닝 후 추천', '자전거 보관소', '러닝 용품 대여', '제휴카페'],
  },
];

/**
 * 샘플 카페 데이터를 Supabase에 일괄 추가하는 함수
 * @returns {Promise<Array>} 생성된 카페 데이터 배열
 */
export const insertSampleCafes = async () => {
  const results = [];
  const errors = [];

  console.log('샘플 카페 데이터 추가 시작...');

  for (const cafeData of sampleCafes) {
    try {
      const result = await createCafe(cafeData);
      if (result) {
        results.push(result);
        console.log(`✅ ${cafeData.name} 추가 완료`);
      } else {
        errors.push(`${cafeData.name} 추가 실패`);
        console.error(`❌ ${cafeData.name} 추가 실패`);
      }
    } catch (error) {
      errors.push(`${cafeData.name}: ${error.message}`);
      console.error(`❌ ${cafeData.name} 추가 중 오류:`, error);
    }

    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 결과 요약:`);
  console.log(`✅ 성공: ${results.length}개`);
  console.log(`❌ 실패: ${errors.length}개`);

  if (errors.length > 0) {
    console.log('\n❌ 실패한 항목들:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return { results, errors };
};

/**
 * 개발용 - 브라우저 콘솔에서 샘플 데이터 추가하는 함수
 * 사용법: window.addSampleCafes() 콘솔에서 실행
 */
export const setupSampleDataHelper = () => {
  if (typeof window !== 'undefined') {
    window.addSampleCafes = insertSampleCafes;
    console.log('💡 개발 도구: window.addSampleCafes() 함수가 등록되었습니다.');
    console.log(
      '   브라우저 콘솔에서 window.addSampleCafes()를 실행하면 샘플 데이터가 추가됩니다.'
    );
  }
};

/**
 * 특정 지역의 카페만 필터링하는 함수
 * @param {string} district - 지역명 (예: '마포구', '용산구')
 * @returns {Array} 해당 지역의 카페 데이터
 */
export const getCafesByDistrict = district => {
  return sampleCafes.filter(cafe => cafe.address.includes(district));
};

/**
 * 좌표 범위 내의 카페를 필터링하는 함수
 * @param {number} centerLat - 중심 위도
 * @param {number} centerLng - 중심 경도
 * @param {number} radius - 반경 (km)
 * @returns {Array} 범위 내의 카페 데이터
 */
export const getCafesInRadius = (centerLat, centerLng, radius = 5) => {
  return sampleCafes.filter(cafe => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      cafe.coordinates.lat,
      cafe.coordinates.lng
    );
    return distance <= radius;
  });
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
