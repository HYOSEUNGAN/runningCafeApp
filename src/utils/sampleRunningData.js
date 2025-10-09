/**
 * 샘플 러닝 데이터를 Supabase에 추가하는 유틸리티
 * 개발 및 테스트 목적으로 사용
 */

import { createRunningRecord } from '../services/runningRecordService';
import { createOrUpdateUserProfile } from '../services/userProfileService';

// 샘플 사용자 프로필 데이터
export const sampleUsers = [
  {
    id: 'sample-user-1',
    username: 'runner_kim',
    display_name: '김러너',
    avatar_url: '/images/avatars/runner-01.svg',
    bio: '매일 아침 러닝을 즐기는 프로 러너입니다! 🏃‍♂️',
  },
  {
    id: 'sample-user-2',
    username: 'park_running',
    display_name: '박달리기',
    avatar_url: '/images/avatars/runner-02.svg',
    bio: '건강한 삶을 위해 꾸준히 달리고 있어요! 🔥',
  },
  {
    id: 'sample-user-3',
    username: 'lee_jogging',
    display_name: '이조깅',
    avatar_url: '/images/avatars/runner-03.svg',
    bio: '러닝으로 스트레스를 날려버려요! ⭐',
  },
  {
    id: 'sample-user-4',
    username: 'choi_marathon',
    display_name: '최마라톤',
    avatar_url: '/images/avatars/Group 48.png',
    bio: '마라톤 완주가 목표인 열정적인 러너! 🎯',
  },
  {
    id: 'sample-user-5',
    username: 'jung_sprint',
    display_name: '정스프린트',
    avatar_url: '/images/avatars/Group 49.png',
    bio: '단거리 스피드 러닝 전문가입니다! ⚡',
  },
];

// 이번 주 샘플 러닝 기록 데이터
export const generateWeeklyRunningRecords = () => {
  const records = [];
  const now = new Date();

  // 이번 주 시작일 계산 (일요일)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // 각 사용자별로 이번 주 러닝 기록 생성
  sampleUsers.forEach((user, userIndex) => {
    const runsThisWeek = Math.floor(Math.random() * 5) + 2; // 2-6회 러닝

    for (let i = 0; i < runsThisWeek; i++) {
      const runDate = new Date(startOfWeek);
      runDate.setDate(startOfWeek.getDate() + Math.floor(Math.random() * 7));
      runDate.setHours(
        Math.floor(Math.random() * 12) + 6, // 6-18시 사이
        Math.floor(Math.random() * 60),
        0,
        0
      );

      // 거리와 시간 생성 (사용자별로 다른 패턴)
      let distance, duration;
      switch (userIndex) {
        case 0: // 김러너 - 프로 러너
          distance = Math.random() * 8 + 7; // 7-15km
          duration = distance * (4.5 + Math.random() * 1.5) * 60; // 4.5-6분/km
          break;
        case 1: // 박달리기 - 열정 러너
          distance = Math.random() * 6 + 5; // 5-11km
          duration = distance * (5 + Math.random() * 1.5) * 60; // 5-6.5분/km
          break;
        case 2: // 이조깅 - 꾸준 러너
          distance = Math.random() * 5 + 3; // 3-8km
          duration = distance * (5.5 + Math.random() * 1.5) * 60; // 5.5-7분/km
          break;
        case 3: // 최마라톤 - 장거리 러너
          distance = Math.random() * 12 + 8; // 8-20km
          duration = distance * (5.5 + Math.random() * 1) * 60; // 5.5-6.5분/km
          break;
        case 4: // 정스프린트 - 단거리 러너
          distance = Math.random() * 3 + 2; // 2-5km
          duration = distance * (4 + Math.random() * 1) * 60; // 4-5분/km
          break;
        default:
          distance = Math.random() * 5 + 3;
          duration = distance * (5 + Math.random() * 2) * 60;
      }

      // 러닝 코스별 제목 생성
      const courses = [
        '한강공원 러닝',
        '올림픽공원 조깅',
        '남산 등반 러닝',
        '청계천 러닝',
        '뚝섬한강공원 러닝',
        '반포한강공원 러닝',
        '서울숲 러닝',
        '월드컵공원 러닝',
      ];

      const record = {
        user_id: user.id,
        title: courses[Math.floor(Math.random() * courses.length)],
        distance: Math.round(distance * 100) / 100,
        duration: Math.round(duration),
        pace: Math.round((duration / 60 / distance) * 100) / 100,
        calories_burned: Math.round(distance * (50 + Math.random() * 20)), // 50-70 cal/km
        elevation_gain: Math.floor(Math.random() * 100), // 0-100m
        weather_condition: ['맑음', '흐림', '약간 흐림'][
          Math.floor(Math.random() * 3)
        ],
        temperature: Math.floor(Math.random() * 15) + 10, // 10-25도
        notes: [
          '오늘도 좋은 러닝이었어요!',
          '날씨가 좋아서 기분 좋게 뛰었습니다.',
          '목표 거리를 달성했어요!',
          '페이스가 점점 좋아지고 있어요.',
          '러닝 후 스트레칭도 잊지 않았어요.',
          '',
        ][Math.floor(Math.random() * 6)],
        is_public: true,
        created_at: runDate.toISOString(),
      };

      records.push(record);
    }
  });

  return records.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
};

/**
 * 샘플 사용자 프로필을 Supabase에 일괄 추가하는 함수
 * @returns {Promise<Array>} 생성된 프로필 데이터 배열
 */
export const insertSampleUsers = async () => {
  const results = [];
  const errors = [];

  console.log('샘플 사용자 프로필 추가 시작...');

  for (const userData of sampleUsers) {
    try {
      const result = await createOrUpdateUserProfile(userData);
      if (result.success) {
        results.push(result.data);
        console.log(`✅ ${userData.display_name} 프로필 추가 완료`);
      } else {
        errors.push(`${userData.display_name}: ${result.error}`);
        console.error(
          `❌ ${userData.display_name} 프로필 추가 실패:`,
          result.error
        );
      }
    } catch (error) {
      errors.push(`${userData.display_name}: ${error.message}`);
      console.error(`❌ ${userData.display_name} 프로필 추가 중 오류:`, error);
    }

    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n📊 사용자 프로필 결과 요약:`);
  console.log(`✅ 성공: ${results.length}개`);
  console.log(`❌ 실패: ${errors.length}개`);

  return { results, errors };
};

/**
 * 샘플 러닝 기록을 Supabase에 일괄 추가하는 함수
 * @returns {Promise<Array>} 생성된 러닝 기록 데이터 배열
 */
export const insertSampleRunningRecords = async () => {
  const records = generateWeeklyRunningRecords();
  const results = [];
  const errors = [];

  console.log('샘플 러닝 기록 추가 시작...');
  console.log(`총 ${records.length}개의 기록을 추가합니다.`);

  for (const recordData of records) {
    try {
      const result = await createRunningRecord(recordData);
      if (result.success) {
        results.push(result.data);
        console.log(
          `✅ ${recordData.title} (${recordData.distance}km) 추가 완료`
        );
      } else {
        errors.push(`${recordData.title}: ${result.error}`);
        console.error(`❌ ${recordData.title} 추가 실패:`, result.error);
      }
    } catch (error) {
      errors.push(`${recordData.title}: ${error.message}`);
      console.error(`❌ ${recordData.title} 추가 중 오류:`, error);
    }

    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 러닝 기록 결과 요약:`);
  console.log(`✅ 성공: ${results.length}개`);
  console.log(`❌ 실패: ${errors.length}개`);

  if (errors.length > 0) {
    console.log('\n❌ 실패한 항목들:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return { results, errors };
};

/**
 * 모든 샘플 데이터를 한 번에 추가하는 함수
 * @returns {Promise<Object>} 전체 결과 요약
 */
export const insertAllSampleData = async () => {
  console.log('🚀 모든 샘플 데이터 추가 시작...\n');

  try {
    // 1. 사용자 프로필 추가
    console.log('1️⃣ 사용자 프로필 추가 중...');
    const userResults = await insertSampleUsers();

    // 2. 러닝 기록 추가 (프로필 생성 후)
    console.log('\n2️⃣ 러닝 기록 추가 중...');
    const recordResults = await insertSampleRunningRecords();

    console.log('\n🎉 모든 샘플 데이터 추가 완료!');
    console.log(
      `👥 사용자: ${userResults.results.length}개 성공, ${userResults.errors.length}개 실패`
    );
    console.log(
      `🏃‍♂️ 러닝 기록: ${recordResults.results.length}개 성공, ${recordResults.errors.length}개 실패`
    );

    return {
      users: userResults,
      records: recordResults,
      totalSuccess: userResults.results.length + recordResults.results.length,
      totalErrors: userResults.errors.length + recordResults.errors.length,
    };
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 중 전체 오류:', error);
    return {
      users: { results: [], errors: [] },
      records: { results: [], errors: [] },
      totalSuccess: 0,
      totalErrors: 1,
      error: error.message,
    };
  }
};

/**
 * 개발용 - 브라우저 콘솔에서 샘플 데이터 추가하는 함수들
 * 사용법:
 * - window.addSampleUsers() - 사용자 프로필만 추가
 * - window.addSampleRunningRecords() - 러닝 기록만 추가
 * - window.addAllSampleData() - 모든 데이터 추가
 */
export const setupSampleDataHelper = () => {
  if (typeof window !== 'undefined') {
    window.addSampleUsers = insertSampleUsers;
    window.addSampleRunningRecords = insertSampleRunningRecords;
    window.addAllSampleData = insertAllSampleData;

    console.log('💡 개발 도구: 샘플 데이터 함수들이 등록되었습니다.');
    console.log('   🔧 사용 가능한 함수들:');
    console.log('   - window.addSampleUsers() : 샘플 사용자 프로필 추가');
    console.log('   - window.addSampleRunningRecords() : 샘플 러닝 기록 추가');
    console.log('   - window.addAllSampleData() : 모든 샘플 데이터 추가');
  }
};

/**
 * 특정 사용자의 이번 주 러닝 기록만 생성하는 함수
 * @param {string} userId - 사용자 ID
 * @param {number} runCount - 생성할 러닝 횟수 (기본값: 3)
 * @returns {Promise<Object>} 생성 결과
 */
export const createUserWeeklyRecords = async (userId, runCount = 3) => {
  const records = [];
  const now = new Date();

  // 이번 주 시작일 계산
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  for (let i = 0; i < runCount; i++) {
    const runDate = new Date(startOfWeek);
    runDate.setDate(startOfWeek.getDate() + Math.floor(Math.random() * 7));
    runDate.setHours(
      Math.floor(Math.random() * 12) + 6,
      Math.floor(Math.random() * 60),
      0,
      0
    );

    const distance = Math.random() * 8 + 3; // 3-11km
    const duration = distance * (4.5 + Math.random() * 2) * 60; // 4.5-6.5분/km

    const record = {
      user_id: userId,
      title: `러닝 기록 ${i + 1}`,
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(duration),
      pace: Math.round((duration / 60 / distance) * 100) / 100,
      calories_burned: Math.round(distance * 60),
      is_public: true,
      created_at: runDate.toISOString(),
    };

    records.push(record);
  }

  // 기록 추가
  const results = [];
  const errors = [];

  for (const recordData of records) {
    try {
      const result = await createRunningRecord(recordData);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push(result.error);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { results, errors };
};
