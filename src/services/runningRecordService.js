import { supabase } from './supabase';
import { updateUserRunningStats } from './userProfileService';

/**
 * 러닝 기록 관련 API 서비스
 * running_records 테이블과 관련된 CRUD 작업을 담당
 */

/**
 * 러닝 기록 생성
 * @param {Object} recordData - 러닝 기록 데이터
 * @param {string} recordData.user_id - 사용자 ID
 * @param {string} recordData.title - 러닝 제목
 * @param {number} recordData.distance - 거리 (km)
 * @param {number} recordData.duration - 시간 (초)
 * @param {number} recordData.pace - 페이스 (분/km)
 * @param {number} recordData.calories_burned - 소모 칼로리
 * @param {Object} recordData.route_data - GPS 좌표 데이터
 * @param {number} recordData.elevation_gain - 고도 상승 (m)
 * @param {number} recordData.average_heart_rate - 평균 심박수
 * @param {number} recordData.max_heart_rate - 최대 심박수
 * @param {string} recordData.weather_condition - 날씨 상태
 * @param {number} recordData.temperature - 온도
 * @param {string} recordData.notes - 메모
 * @param {boolean} recordData.is_public - 공개 여부
 * @returns {Promise<Object>} 생성된 러닝 기록 데이터
 */
export const createRunningRecord = async recordData => {
  try {
    const {
      user_id,
      title,
      distance,
      duration,
      pace,
      calories_burned,
      route_data,
      elevation_gain,
      average_heart_rate,
      max_heart_rate,
      weather_condition,
      temperature,
      notes,
      is_public = true,
    } = recordData;

    if (!user_id || distance == null || !duration) {
      throw new Error(
        '필수 필드가 누락되었습니다: user_id, distance, duration'
      );
    }

    // 러닝 기록 생성
    const { data, error } = await supabase
      .from('running_records')
      .insert({
        user_id,
        title: title || `${distance}km 러닝`,
        distance,
        duration,
        pace: pace || Math.round((duration / 60 / distance) * 100) / 100,
        calories_burned: calories_burned || Math.round(distance * 60), // 대략적인 계산
        route_data: route_data || null,
        elevation_gain: elevation_gain || 0,
        average_heart_rate: average_heart_rate || null,
        max_heart_rate: max_heart_rate || null,
        weather_condition: weather_condition || null,
        temperature: temperature || null,
        notes: notes || '',
        is_public,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('러닝 기록 생성 실패:', error);
      throw error;
    }

    // 사용자 통계 업데이트
    await updateUserRunningStats(user_id, distance, 1);

    console.log('러닝 기록 생성 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('러닝 기록 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 러닝 기록 목록 조회
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 20)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @param {string} options.orderBy - 정렬 기준 (기본값: 'created_at')
 * @param {boolean} options.ascending - 오름차순 여부 (기본값: false)
 * @returns {Promise<Object>} 러닝 기록 목록
 */
export const getUserRunningRecords = async (userId, options = {}) => {
  try {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      ascending = false,
    } = options;

    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    let query = supabase
      .from('running_records')
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('러닝 기록 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('러닝 기록 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 특정 러닝 기록 조회
 * @param {string} recordId - 러닝 기록 ID
 * @returns {Promise<Object>} 러닝 기록 데이터
 */
export const getRunningRecord = async recordId => {
  try {
    if (!recordId) {
      throw new Error('러닝 기록 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('running_records')
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
      .eq('id', recordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: '러닝 기록을 찾을 수 없습니다.' };
      }
      console.error('러닝 기록 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('러닝 기록 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 러닝 기록 업데이트
 * @param {string} recordId - 러닝 기록 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @param {Object} updates - 업데이트할 필드들
 * @returns {Promise<Object>} 업데이트된 러닝 기록 데이터
 */
export const updateRunningRecord = async (recordId, userId, updates) => {
  try {
    if (!recordId || !userId) {
      throw new Error('러닝 기록 ID와 사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('running_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('user_id', userId) // 본인 기록만 수정 가능
      .select()
      .single();

    if (error) {
      console.error('러닝 기록 업데이트 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('러닝 기록 업데이트 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 러닝 기록 삭제
 * @param {string} recordId - 러닝 기록 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteRunningRecord = async (recordId, userId) => {
  try {
    if (!recordId || !userId) {
      throw new Error('러닝 기록 ID와 사용자 ID가 필요합니다.');
    }

    // 기존 기록 조회 (통계 업데이트용)
    const { data: existingRecord } = await supabase
      .from('running_records')
      .select('distance')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('running_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId); // 본인 기록만 삭제 가능

    if (error) {
      console.error('러닝 기록 삭제 실패:', error);
      throw error;
    }

    // 사용자 통계 업데이트 (차감)
    if (existingRecord) {
      await updateUserRunningStats(userId, -existingRecord.distance, -1);
    }

    console.log('러닝 기록 삭제 성공:', recordId);
    return { success: true };
  } catch (error) {
    console.error('러닝 기록 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 공개 러닝 기록 목록 조회 (피드용)
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 20)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @returns {Promise<Object>} 공개 러닝 기록 목록
 */
export const getPublicRunningRecords = async (options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('running_records')
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
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('공개 러닝 기록 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('공개 러닝 기록 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 월별 러닝 통계 조회
 * @param {string} userId - 사용자 ID
 * @param {number} year - 년도
 * @param {number} month - 월 (1-12)
 * @returns {Promise<Object>} 월별 통계 데이터
 */
export const getMonthlyRunningStats = async (userId, year, month) => {
  try {
    if (!userId || !year || !month) {
      throw new Error('사용자 ID, 년도, 월이 필요합니다.');
    }

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('running_records')
      .select('distance, duration, calories_burned')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('월별 통계 조회 실패:', error);
      throw error;
    }

    // 통계 계산
    const stats = data.reduce(
      (acc, record) => {
        acc.totalDistance += record.distance || 0;
        acc.totalDuration += record.duration || 0;
        acc.totalCalories += record.calories_burned || 0;
        acc.totalRuns += 1;
        return acc;
      },
      {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalRuns: 0,
      }
    );

    // 평균 페이스 계산
    stats.averagePace =
      stats.totalDistance > 0
        ? Math.round((stats.totalDuration / 60 / stats.totalDistance) * 100) /
          100
        : 0;

    return { success: true, data: stats };
  } catch (error) {
    console.error('월별 통계 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};
