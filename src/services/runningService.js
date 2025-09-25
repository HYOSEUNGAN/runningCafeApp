import { supabase } from './supabase';
import {
  createRunningRecord,
  updateChallengeProgress,
} from './runningRecordService';
import { updateChallengeProgress as updateChallenge } from './challengeService';

/**
 * 러닝 기록 관련 API 서비스 (NavigationPage용 레거시 함수들)
 * 새로운 스키마에 맞게 업데이트된 함수들
 */

/**
 * 러닝 기록을 저장하는 함수 (NavigationPage 호환)
 * @param {Object} runningData - 러닝 기록 데이터
 * @returns {Promise<Object|null>} 저장된 러닝 기록 데이터
 */
export const saveRunningRecord = async runningData => {
  try {
    // 새로운 스키마에 맞게 데이터 변환
    const recordData = {
      user_id: runningData.userId,
      title: `${(runningData.distance / 1000).toFixed(1)}km 러닝`,
      distance: runningData.distance / 1000, // 미터를 킬로미터로 변환
      duration: Math.round(runningData.duration / 1000), // 밀리초를 초로 변환
      pace:
        runningData.distance > 0
          ? Math.round(runningData.duration / 1000 / 60) /
            (runningData.distance / 1000)
          : 0, // 분/km
      calories_burned:
        runningData.calories || Math.round((runningData.distance / 1000) * 60), // 대략적인 칼로리 계산
      route_data: {
        path: runningData.path || [],
        nearbyCafes: runningData.nearbyCafes || [],
        startTime: runningData.startTime,
        endTime: runningData.endTime,
        averageSpeed: runningData.averageSpeed,
        maxSpeed: runningData.maxSpeed,
      },
      notes: `최고 속도: ${(runningData.maxSpeed * 3.6).toFixed(1)}km/h, 평균 속도: ${(runningData.averageSpeed * 3.6).toFixed(1)}km/h`,
      is_public: true,
    };

    // 새로운 서비스 함수 사용
    const result = await createRunningRecord(recordData);

    if (!result.success) {
      throw new Error(result.error);
    }

    // 챌린지 진행률 업데이트
    try {
      await updateChallenge(runningData.userId, result.data.id, {
        distance: recordData.distance,
        duration: recordData.duration,
      });
    } catch (challengeError) {
      console.error('챌린지 업데이트 실패:', challengeError);
      // 챌린지 업데이트 실패해도 러닝 기록 저장은 성공으로 처리
    }

    // 레거시 형식으로 반환 (NavigationPage 호환성)
    return {
      id: result.data.id,
      userId: result.data.user_id,
      startTime: runningData.startTime,
      endTime: runningData.endTime,
      duration: runningData.duration,
      distance: runningData.distance,
      calories: result.data.calories_burned,
      averageSpeed: runningData.averageSpeed,
      maxSpeed: runningData.maxSpeed,
      path: runningData.path,
      nearbyCafes: runningData.nearbyCafes,
      createdAt: result.data.created_at,
    };
  } catch (error) {
    console.error('러닝 기록 저장 중 오류:', error);
    return null;
  }
};

/**
 * 사용자의 러닝 기록 목록을 가져오는 함수
 * @param {string} userId - 사용자 ID
 * @param {number} limit - 가져올 기록 수 (기본값: 10)
 * @returns {Promise<Array>} 러닝 기록 배열
 */
export const getUserRunningRecords = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('running_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('러닝 기록 조회 실패:', error);
      throw error;
    }

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      startTime: record.start_time,
      endTime: record.end_time,
      duration: record.duration,
      distance: record.distance,
      calories: record.calories,
      averageSpeed: record.average_speed,
      maxSpeed: record.max_speed,
      path: JSON.parse(record.path_data || '[]'),
      nearbyCafes: JSON.parse(record.nearby_cafes || '[]'),
      createdAt: record.created_at,
    }));
  } catch (error) {
    console.error('러닝 기록 조회 중 오류:', error);
    return [];
  }
};

/**
 * 특정 러닝 기록의 상세 정보를 가져오는 함수
 * @param {number} recordId - 러닝 기록 ID
 * @returns {Promise<Object|null>} 러닝 기록 상세 데이터
 */
export const getRunningRecordById = async recordId => {
  try {
    const { data, error } = await supabase
      .from('running_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('러닝 기록 상세 조회 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      distance: data.distance,
      calories: data.calories,
      averageSpeed: data.average_speed,
      maxSpeed: data.max_speed,
      path: JSON.parse(data.path_data || '[]'),
      nearbyCafes: JSON.parse(data.nearby_cafes || '[]'),
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('러닝 기록 상세 조회 중 오류:', error);
    return null;
  }
};

/**
 * 러닝 기록을 삭제하는 함수
 * @param {number} recordId - 러닝 기록 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteRunningRecord = async (recordId, userId) => {
  try {
    const { error } = await supabase
      .from('running_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) {
      console.error('러닝 기록 삭제 실패:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('러닝 기록 삭제 중 오류:', error);
    return false;
  }
};

/**
 * 사용자의 러닝 통계를 계산하는 함수
 * @param {string} userId - 사용자 ID
 * @param {number} days - 통계 기간 (일, 기본값: 30)
 * @returns {Promise<Object>} 러닝 통계 데이터
 */
export const getRunningStats = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('running_records')
      .select('distance, duration, calories')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('러닝 통계 조회 실패:', error);
      throw error;
    }

    const stats = data.reduce(
      (acc, record) => ({
        totalDistance: acc.totalDistance + record.distance,
        totalDuration: acc.totalDuration + record.duration,
        totalCalories: acc.totalCalories + record.calories,
        totalRuns: acc.totalRuns + 1,
      }),
      {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalRuns: 0,
      }
    );

    return {
      ...stats,
      averageDistance:
        stats.totalRuns > 0 ? stats.totalDistance / stats.totalRuns : 0,
      averageDuration:
        stats.totalRuns > 0 ? stats.totalDuration / stats.totalRuns : 0,
      averageCalories:
        stats.totalRuns > 0 ? stats.totalCalories / stats.totalRuns : 0,
      period: days,
    };
  } catch (error) {
    console.error('러닝 통계 조회 중 오류:', error);
    return {
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      totalRuns: 0,
      averageDistance: 0,
      averageDuration: 0,
      averageCalories: 0,
      period: days,
    };
  }
};

/**
 * 러닝 경로 데이터를 압축하는 함수 (저장 공간 절약)
 * @param {Array} path - 경로 좌표 배열
 * @param {number} tolerance - 압축 허용 오차 (기본값: 0.0001)
 * @returns {Array} 압축된 경로 배열
 */
export const compressPath = (path, tolerance = 0.0001) => {
  if (path.length <= 2) return path;

  const compressed = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];

    // 더글라스-포이커 알고리즘의 단순화된 버전
    const distance = getPerpendicularDistance(current, prev, next);

    if (distance > tolerance) {
      compressed.push(current);
    }
  }

  compressed.push(path[path.length - 1]);
  return compressed;
};

/**
 * 점과 선분 사이의 수직 거리를 계산하는 함수
 * @param {Object} point - 점 좌표
 * @param {Object} lineStart - 선분 시작점
 * @param {Object} lineEnd - 선분 끝점
 * @returns {number} 수직 거리
 */
const getPerpendicularDistance = (point, lineStart, lineEnd) => {
  const A = point.lat() - lineStart.lat();
  const B = point.lng() - lineStart.lng();
  const C = lineEnd.lat() - lineStart.lat();
  const D = lineEnd.lng() - lineStart.lng();

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  const param = dot / lenSq;
  let xx, yy;

  if (param < 0) {
    xx = lineStart.lat();
    yy = lineStart.lng();
  } else if (param > 1) {
    xx = lineEnd.lat();
    yy = lineEnd.lng();
  } else {
    xx = lineStart.lat() + param * C;
    yy = lineStart.lng() + param * D;
  }

  const dx = point.lat() - xx;
  const dy = point.lng() - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 러닝 기록 데이터를 검증하는 함수
 * @param {Object} runningData - 검증할 러닝 기록 데이터
 * @returns {boolean} 유효성 여부
 */
export const validateRunningData = runningData => {
  return (
    runningData &&
    runningData.userId &&
    runningData.startTime &&
    runningData.endTime &&
    typeof runningData.duration === 'number' &&
    typeof runningData.distance === 'number' &&
    Array.isArray(runningData.path)
  );
};
