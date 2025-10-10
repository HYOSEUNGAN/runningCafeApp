import { supabase } from './supabase';

/**
 * 투표 관련 API 서비스
 * Supabase에서 투표 데이터를 가져오고 관리하는 함수들
 */

/**
 * 활성 투표 목록을 가져오는 함수
 * @returns {Promise<Array>} 활성 투표 데이터 배열
 */
export const getActiveVotes = async () => {
  try {
    // 실제 투표 테이블이 없으므로 임시 데이터를 반환
    // 향후 votes 테이블 생성 시 실제 쿼리로 교체
    const mockVotes = [
      {
        id: 1,
        title: '새로운 러닝 코스 카페',
        subtitle: '한강공원 5km 코스 끝',
        leftImage: '/images/banners/banner-00.png',
        rightImage: '/images/banners/banner-01.png',
        voteCount: 234,
        totalVotes: 456,
        leftOption: '새로운 러닝 코스 카페',
        rightOption: '한강 피니시 카페',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: '주말 러닝 모임 카페',
        subtitle: '올림픽공원 3km 코스',
        leftImage: '/images/banners/banner-02.png',
        rightImage: '/images/banners/banner-00.png',
        voteCount: 189,
        totalVotes: 312,
        leftOption: '주말 그룹 러닝 카페',
        rightOption: '야간 러닝 카페',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: '야간 러닝 후 카페',
        subtitle: '반포 한강공원 근처',
        leftImage: '/images/banners/banner-01.png',
        rightImage: '/images/banners/banner-02.png',
        voteCount: 156,
        totalVotes: 289,
        leftOption: '야간 러닝 카페',
        rightOption: '새로운 코스 카페',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    return mockVotes;
  } catch (error) {
    console.error('투표 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 특정 투표에 참여하는 함수
 * @param {number} voteId - 투표 ID
 * @param {string} option - 투표 옵션 ('left' 또는 'right')
 * @returns {Promise<boolean>} 투표 성공 여부
 */
export const submitVote = async (voteId, option) => {
  try {
    // 실제 구현 시 사용자 인증 및 투표 기록 저장
    console.log(`투표 제출: ID ${voteId}, 옵션: ${option}`);

    // 임시로 성공 반환
    return true;
  } catch (error) {
    console.error('투표 제출 중 오류:', error);
    return false;
  }
};

/**
 * 투표 결과를 가져오는 함수
 * @param {number} voteId - 투표 ID
 * @returns {Promise<Object|null>} 투표 결과 데이터
 */
export const getVoteResults = async voteId => {
  try {
    // 실제 구현 시 투표 결과 집계
    const mockResults = {
      voteId,
      leftVotes: Math.floor(Math.random() * 200) + 50,
      rightVotes: Math.floor(Math.random() * 200) + 50,
      totalVotes: 0,
    };

    mockResults.totalVotes = mockResults.leftVotes + mockResults.rightVotes;

    return mockResults;
  } catch (error) {
    console.error('투표 결과 가져오기 중 오류:', error);
    return null;
  }
};

/**
 * 사용자의 투표 참여 여부를 확인하는 함수
 * @param {number} voteId - 투표 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string|null>} 사용자가 선택한 옵션 ('left', 'right') 또는 null
 */
export const getUserVoteStatus = async (voteId, userId) => {
  try {
    // 실제 구현 시 사용자 투표 기록 조회
    console.log(
      `사용자 투표 상태 확인: 투표 ID ${voteId}, 사용자 ID ${userId}`
    );

    // 임시로 null 반환 (투표하지 않음)
    return null;
  } catch (error) {
    console.error('사용자 투표 상태 확인 중 오류:', error);
    return null;
  }
};

/**
 * 새로운 투표를 생성하는 함수 (관리자용)
 * @param {Object} voteData - 투표 데이터
 * @returns {Promise<Object|null>} 생성된 투표 데이터
 */
export const createVote = async voteData => {
  try {
    // 실제 구현 시 관리자 권한 확인 및 투표 생성
    console.log('새 투표 생성:', voteData);

    const newVote = {
      id: Date.now(), // 임시 ID
      ...voteData,
      voteCount: 0,
      totalVotes: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    return newVote;
  } catch (error) {
    console.error('투표 생성 중 오류:', error);
    return null;
  }
};

/**
 * 투표를 종료하는 함수 (관리자용)
 * @param {number} voteId - 투표 ID
 * @returns {Promise<boolean>} 종료 성공 여부
 */
export const endVote = async voteId => {
  try {
    // 실제 구현 시 관리자 권한 확인 및 투표 종료
    console.log(`투표 종료: ID ${voteId}`);

    return true;
  } catch (error) {
    console.error('투표 종료 중 오류:', error);
    return false;
  }
};

/**
 * 투표 데이터 유효성 검증 함수
 * @param {Object} voteData - 검증할 투표 데이터
 * @returns {boolean} 유효성 여부
 */
export const validateVoteData = voteData => {
  return (
    voteData &&
    voteData.title &&
    voteData.leftOption &&
    voteData.rightOption &&
    voteData.leftImage &&
    voteData.rightImage
  );
};
