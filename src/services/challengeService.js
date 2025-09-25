import { supabase } from './supabase';

/**
 * 챌린지 관련 API 서비스
 * monthly_challenges, challenge_participations, challenge_records 테이블과 관련된 CRUD 작업을 담당
 */

/**
 * 월별 챌린지 생성 (관리자용)
 * @param {Object} challengeData - 챌린지 데이터
 * @param {string} challengeData.title - 챌린지 제목
 * @param {string} challengeData.description - 챌린지 설명
 * @param {string} challengeData.target_type - 목표 타입 (distance, runs_count, duration)
 * @param {number} challengeData.target_value - 목표 값
 * @param {string} challengeData.target_unit - 목표 단위
 * @param {number} challengeData.year - 년도
 * @param {number} challengeData.month - 월
 * @param {string} challengeData.badge_image_url - 배지 이미지 URL
 * @param {number} challengeData.reward_points - 보상 포인트
 * @returns {Promise<Object>} 생성된 챌린지 데이터
 */
export const createMonthlyChallenge = async challengeData => {
  try {
    const {
      title,
      description,
      target_type,
      target_value,
      target_unit,
      year,
      month,
      badge_image_url,
      reward_points = 0,
    } = challengeData;

    if (!title || !target_type || !target_value || !year || !month) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    // 해당 월의 시작일과 종료일 계산
    const start_date = new Date(year, month - 1, 1);
    const end_date = new Date(year, month, 0); // 다음 달 0일 = 이번 달 마지막 날

    const { data, error } = await supabase
      .from('monthly_challenges')
      .insert({
        title,
        description: description || '',
        target_type,
        target_value,
        target_unit: target_unit || 'km',
        year,
        month,
        start_date: start_date.toISOString().split('T')[0],
        end_date: end_date.toISOString().split('T')[0],
        badge_image_url: badge_image_url || '',
        reward_points,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('월별 챌린지 생성 실패:', error);
      throw error;
    }

    console.log('월별 챌린지 생성 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('월별 챌린지 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 활성 월별 챌린지 목록 조회
 * @param {number} year - 년도 (선택사항)
 * @param {number} month - 월 (선택사항)
 * @returns {Promise<Object>} 챌린지 목록
 */
export const getActiveMonthlyChallenges = async (year = null, month = null) => {
  try {
    let query = supabase
      .from('monthly_challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (year && month) {
      query = query.eq('year', year).eq('month', month);
    } else if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) {
      console.error('활성 챌린지 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('활성 챌린지 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 현재 월의 활성 챌린지 조회
 * @returns {Promise<Object>} 현재 월 챌린지 목록
 */
export const getCurrentMonthlyChallenges = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return await getActiveMonthlyChallenges(year, month);
  } catch (error) {
    console.error('현재 월 챌린지 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 챌린지 참여
 * @param {string} userId - 사용자 ID
 * @param {string} challengeId - 챌린지 ID
 * @returns {Promise<Object>} 참여 결과
 */
export const joinChallenge = async (userId, challengeId) => {
  try {
    if (!userId || !challengeId) {
      throw new Error('사용자 ID와 챌린지 ID가 필요합니다.');
    }

    // 이미 참여했는지 확인
    const { data: existingParticipation, error: checkError } = await supabase
      .from('challenge_participations')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingParticipation) {
      return { success: false, error: '이미 참여한 챌린지입니다.' };
    }

    const { data, error } = await supabase
      .from('challenge_participations')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        current_progress: 0,
        is_completed: false,
        joined_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        monthly_challenges:challenge_id (
          title,
          description,
          target_type,
          target_value,
          target_unit,
          badge_image_url,
          reward_points
        )
      `
      )
      .single();

    if (error) {
      console.error('챌린지 참여 실패:', error);
      throw error;
    }

    console.log('챌린지 참여 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('챌린지 참여 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 참여 중인 챌린지 목록 조회
 * @param {string} userId - 사용자 ID
 * @param {boolean} onlyActive - 활성 챌린지만 조회할지 여부 (기본값: true)
 * @returns {Promise<Object>} 참여 챌린지 목록
 */
export const getUserChallengeParticipations = async (
  userId,
  onlyActive = true
) => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    let query = supabase
      .from('challenge_participations')
      .select(
        `
        *,
        monthly_challenges:challenge_id (
          title,
          description,
          target_type,
          target_value,
          target_unit,
          year,
          month,
          start_date,
          end_date,
          badge_image_url,
          reward_points,
          is_active
        )
      `
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('monthly_challenges.is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('사용자 챌린지 참여 목록 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('사용자 챌린지 참여 목록 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 러닝 기록을 챌린지에 반영
 * @param {string} userId - 사용자 ID
 * @param {string} runningRecordId - 러닝 기록 ID
 * @param {Object} recordData - 러닝 기록 데이터
 * @param {number} recordData.distance - 거리 (km)
 * @param {number} recordData.duration - 시간 (초)
 * @returns {Promise<Object>} 챌린지 업데이트 결과
 */
export const updateChallengeProgress = async (
  userId,
  runningRecordId,
  recordData
) => {
  try {
    if (!userId || !runningRecordId || !recordData) {
      throw new Error('필수 데이터가 누락되었습니다.');
    }

    // 현재 참여 중인 활성 챌린지 조회
    const { data: participations, error: fetchError } = await supabase
      .from('challenge_participations')
      .select(
        `
        *,
        monthly_challenges:challenge_id (
          target_type,
          target_value,
          start_date,
          end_date,
          is_active
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_completed', false)
      .eq('monthly_challenges.is_active', true);

    if (fetchError) {
      console.error('참여 챌린지 조회 실패:', fetchError);
      throw fetchError;
    }

    if (!participations || participations.length === 0) {
      return { success: true, data: { updated: 0 } };
    }

    const recordDate = new Date().toISOString().split('T')[0];
    const updatedParticipations = [];

    for (const participation of participations) {
      const challenge = participation.monthly_challenges;

      // 챌린지 기간 확인
      if (
        recordDate < challenge.start_date ||
        recordDate > challenge.end_date
      ) {
        continue;
      }

      let contributedValue = 0;

      // 챌린지 타입에 따른 기여값 계산
      switch (challenge.target_type) {
        case 'distance':
          contributedValue = recordData.distance || 0;
          break;
        case 'runs_count':
          contributedValue = 1;
          break;
        case 'duration':
          contributedValue = Math.round((recordData.duration || 0) / 60); // 분 단위
          break;
        default:
          continue;
      }

      if (contributedValue <= 0) continue;

      // 챌린지 기록 생성
      const { error: recordError } = await supabase
        .from('challenge_records')
        .insert({
          participation_id: participation.id,
          running_record_id: runningRecordId,
          contributed_value: contributedValue,
          created_at: new Date().toISOString(),
        });

      if (recordError) {
        console.error('챌린지 기록 생성 실패:', recordError);
        continue;
      }

      // 진행률 업데이트
      const newProgress = participation.current_progress + contributedValue;
      const isCompleted = newProgress >= challenge.target_value;

      const { data: updatedParticipation, error: updateError } = await supabase
        .from('challenge_participations')
        .update({
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', participation.id)
        .select()
        .single();

      if (updateError) {
        console.error('챌린지 진행률 업데이트 실패:', updateError);
        continue;
      }

      updatedParticipations.push(updatedParticipation);
    }

    console.log('챌린지 진행률 업데이트 완료:', updatedParticipations.length);
    return {
      success: true,
      data: {
        updated: updatedParticipations.length,
        participations: updatedParticipations,
      },
    };
  } catch (error) {
    console.error('챌린지 진행률 업데이트 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 챌린지 완료자 순위 조회
 * @param {string} challengeId - 챌린지 ID
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 10)
 * @returns {Promise<Object>} 순위 목록
 */
export const getChallengeLeaderboard = async (challengeId, options = {}) => {
  try {
    const { limit = 10 } = options;

    if (!challengeId) {
      throw new Error('챌린지 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('challenge_participations')
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('challenge_id', challengeId)
      .order('current_progress', { ascending: false })
      .order('completed_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('챌린지 순위 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('챌린지 순위 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 완료된 챌린지 목록 조회 (배지 컬렉션용)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 완료된 챌린지 목록
 */
export const getUserCompletedChallenges = async userId => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('challenge_participations')
      .select(
        `
        *,
        monthly_challenges:challenge_id (
          title,
          description,
          target_type,
          target_value,
          target_unit,
          year,
          month,
          badge_image_url,
          reward_points
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('완료된 챌린지 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('완료된 챌린지 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 챌린지 참여 취소
 * @param {string} userId - 사용자 ID
 * @param {string} challengeId - 챌린지 ID
 * @returns {Promise<Object>} 취소 결과
 */
export const leaveChallengeParticipation = async (userId, challengeId) => {
  try {
    if (!userId || !challengeId) {
      throw new Error('사용자 ID와 챌린지 ID가 필요합니다.');
    }

    const { error } = await supabase
      .from('challenge_participations')
      .delete()
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('is_completed', false); // 완료된 챌린지는 취소할 수 없음

    if (error) {
      console.error('챌린지 참여 취소 실패:', error);
      throw error;
    }

    console.log('챌린지 참여 취소 성공');
    return { success: true };
  } catch (error) {
    console.error('챌린지 참여 취소 중 오류:', error);
    return { success: false, error: error.message };
  }
};
