import { supabase } from './supabase';

/**
 * 사용자 프로필 관련 API 서비스
 * profiles 테이블과 관련된 CRUD 작업을 담당
 */

/**
 * 사용자 프로필 생성 또는 업데이트 (새로운 스키마 적용)
 * @param {Object} userData - 사용자 데이터
 * @param {string} userData.id - 사용자 ID (Supabase auth.users.id)
 * @param {string} userData.email - 이메일
 * @param {string} userData.username - 사용자명 (고유)
 * @param {string} userData.display_name - 표시명
 * @param {string} userData.avatar_url - 프로필 이미지 URL
 * @param {string} userData.bio - 자기소개
 * @returns {Promise<Object>} 생성/업데이트된 프로필 데이터
 */
export const createOrUpdateUserProfile = async userData => {
  try {
    const { id, email, username, display_name, avatar_url, bio } = userData;

    if (!id) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 기존 프로필 확인
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (프로필이 없는 경우)
      console.error('프로필 조회 중 오류:', fetchError);
      throw fetchError;
    }

    // 사용자명 생성 (이메일 기반 또는 랜덤)
    const generateUsername = async baseEmail => {
      const baseUsername = baseEmail ? baseEmail.split('@')[0] : 'user';
      let finalUsername = baseUsername;
      let counter = 1;

      // 중복 확인
      while (true) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', finalUsername)
          .neq('id', id)
          .single();

        if (!existingUser) break;
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      return finalUsername;
    };

    const profileData = {
      id: id,
      username: username || (await generateUsername(email)),
      display_name: display_name || username || email?.split('@')[0] || '러너',
      avatar_url: avatar_url || '',
      bio: bio || '',
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingProfile) {
      // 기존 프로필 업데이트
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('프로필 업데이트 실패:', error);
        throw error;
      }

      result = data;
      console.log('프로필 업데이트 성공:', result);
    } else {
      // 새 프로필 생성
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          total_distance: 0,
          total_runs: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('프로필 생성 실패:', error);
        throw error;
      }

      result = data;
      console.log('프로필 생성 성공:', result);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('프로필 생성/업데이트 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 프로필 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 프로필 데이터
 */
export const getUserProfile = async userId => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 프로필이 없는 경우
        return { success: false, error: '프로필을 찾을 수 없습니다.' };
      }
      console.error('프로필 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('프로필 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 프로필 업데이트 (사용자가 직접 수정)
 * @param {string} userId - 사용자 ID
 * @param {Object} updates - 업데이트할 필드들
 * @returns {Promise<Object>} 업데이트된 프로필 데이터
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('프로필 업데이트 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 러닝 통계 업데이트
 * @param {string} userId - 사용자 ID
 * @param {number} distance - 추가할 거리 (km)
 * @param {number} runCount - 추가할 러닝 횟수 (기본값: 1)
 * @returns {Promise<Object>} 업데이트된 프로필 데이터
 */
export const updateUserRunningStats = async (
  userId,
  distance,
  runCount = 1
) => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 현재 통계 조회
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_distance, total_runs')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('현재 통계 조회 실패:', fetchError);
      throw fetchError;
    }

    // 통계 업데이트
    const { data, error } = await supabase
      .from('profiles')
      .update({
        total_distance: (currentProfile.total_distance || 0) + distance,
        total_runs: (currentProfile.total_runs || 0) + runCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('러닝 통계 업데이트 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('러닝 통계 업데이트 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 카카오 로그인 시 사용자 프로필 생성
 * @param {Object} user - Supabase auth user 객체
 * @returns {Promise<Object>} 생성된 프로필 데이터
 */
export const createKakaoUserProfile = async user => {
  try {
    if (!user) {
      throw new Error('사용자 정보가 없습니다.');
    }

    // 카카오에서 제공하는 사용자 정보 추출
    const userData = {
      id: user.id,
      email: user.email || '',
      display_name:
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.nickname ||
        '카카오 사용자',
      avatar_url:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      bio: '카카오 로그인으로 가입한 러너입니다! 🏃‍♀️',
    };

    return await createOrUpdateUserProfile(userData);
  } catch (error) {
    console.error('카카오 사용자 프로필 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이메일 회원가입 시 사용자 프로필 생성
 * @param {Object} user - Supabase auth user 객체
 * @param {Object} additionalData - 추가 사용자 데이터
 * @returns {Promise<Object>} 생성된 프로필 데이터
 */
export const createEmailUserProfile = async (user, additionalData = {}) => {
  try {
    if (!user) {
      throw new Error('사용자 정보가 없습니다.');
    }

    // 이메일 회원가입 시 사용자 정보 추출
    const userData = {
      id: user.id,
      email: user.email || '',
      display_name:
        additionalData.display_name ||
        additionalData.name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '러너',
      avatar_url:
        additionalData.avatar_url || user.user_metadata?.avatar_url || '',
      bio: additionalData.bio || '새로운 러너입니다! 🏃‍♂️',
    };

    return await createOrUpdateUserProfile(userData);
  } catch (error) {
    console.error('이메일 사용자 프로필 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 프로필 삭제
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteUserProfile = async userId => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      console.error('프로필 삭제 실패:', error);
      throw error;
    }

    console.log('프로필 삭제 성공:', userId);
    return { success: true };
  } catch (error) {
    console.error('프로필 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이번 주 TOP3 러너 조회 (총 거리 기준)
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 3)
 * @returns {Promise<Object>} TOP3 러너 데이터
 */
export const getWeeklyTopRunners = async (options = {}) => {
  try {
    const { limit = 3 } = options;

    // 이번 주 시작일과 종료일 계산
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 일요일
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일
    endOfWeek.setHours(23, 59, 59, 999);

    // 이번 주 러닝 기록 조회 및 사용자별 집계
    const { data: weeklyRecords, error } = await supabase
      .from('running_records')
      .select(
        `
        user_id,
        distance,
        duration,
        created_at,
        profiles:user_id (
          username,
          display_name,
          avatar_url,
          total_distance,
          total_runs
        )
      `
      )
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString())
      .eq('is_public', true);

    if (error) {
      console.error('주간 러닝 기록 조회 실패:', error);
      throw error;
    }

    // 사용자별 이번 주 통계 집계
    const userStats = {};
    weeklyRecords.forEach(record => {
      const userId = record.user_id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          profile: record.profiles,
          weeklyDistance: 0,
          weeklyRuns: 0,
          weeklyDuration: 0,
          lastActivity: record.created_at,
        };
      }
      userStats[userId].weeklyDistance += record.distance || 0;
      userStats[userId].weeklyRuns += 1;
      userStats[userId].weeklyDuration += record.duration || 0;

      // 가장 최근 활동 시간 업데이트
      if (
        new Date(record.created_at) > new Date(userStats[userId].lastActivity)
      ) {
        userStats[userId].lastActivity = record.created_at;
      }
    });

    // 이번 주 거리 기준으로 정렬
    const topRunners = Object.values(userStats)
      .filter(user => user.profile && user.weeklyDistance > 0)
      .sort((a, b) => b.weeklyDistance - a.weeklyDistance)
      .slice(0, limit)
      .map((user, index) => {
        const timeDiff = Date.now() - new Date(user.lastActivity).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

        // 러너 레벨 결정
        let level, badge;
        if (user.weeklyDistance >= 30) {
          level = '프로 러너';
          badge = '🏃‍♂️';
        } else if (user.weeklyDistance >= 20) {
          level = '열정 러너';
          badge = '🔥';
        } else if (user.weeklyRuns >= 4) {
          level = '꾸준 러너';
          badge = '⭐';
        } else {
          level = '새싹 러너';
          badge = '🌱';
        }

        return {
          id: user.user_id,
          rank: index + 1,
          name: user.profile.display_name || user.profile.username || '러너',
          avatar: user.profile.avatar_url || '/images/avatars/runner-01.svg',
          totalDistance: `${user.weeklyDistance.toFixed(1)}km`,
          weeklyRuns: user.weeklyRuns,
          level,
          badge,
          recentActivity: hoursAgo < 1 ? '방금 전' : `${hoursAgo}시간 전`,
          // 추가 통계 정보
          totalLifetimeDistance: user.profile.total_distance || 0,
          totalLifetimeRuns: user.profile.total_runs || 0,
          averagePace:
            user.weeklyDuration > 0
              ? (user.weeklyDuration / 60 / user.weeklyDistance).toFixed(1)
              : 0,
        };
      });

    return { success: true, data: topRunners };
  } catch (error) {
    console.error('주간 TOP 러너 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 전체 러너 랭킹 조회 (누적 거리 기준)
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 10)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @returns {Promise<Object>} 러너 랭킹 데이터
 */
export const getAllTimeTopRunners = async (options = {}) => {
  try {
    const { limit = 10, offset = 0 } = options;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('total_distance', 'is', null)
      .gt('total_distance', 0)
      .order('total_distance', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('전체 러너 랭킹 조회 실패:', error);
      throw error;
    }

    const topRunners = data.map((profile, index) => {
      // 러너 레벨 결정
      let level, badge;
      if (profile.total_distance >= 500) {
        level = '마스터 러너';
        badge = '👑';
      } else if (profile.total_distance >= 200) {
        level = '프로 러너';
        badge = '🏃‍♂️';
      } else if (profile.total_distance >= 100) {
        level = '열정 러너';
        badge = '🔥';
      } else if (profile.total_distance >= 50) {
        level = '꾸준 러너';
        badge = '⭐';
      } else {
        level = '새싹 러너';
        badge = '🌱';
      }

      return {
        id: profile.id,
        rank: offset + index + 1,
        name: profile.display_name || profile.username || '러너',
        avatar: profile.avatar_url || '/images/avatars/runner-01.svg',
        totalDistance: `${profile.total_distance?.toFixed(1) || 0}km`,
        totalRuns: profile.total_runs || 0,
        level,
        badge,
        averageDistance:
          profile.total_runs > 0
            ? (profile.total_distance / profile.total_runs).toFixed(1)
            : 0,
        joinDate: new Date(profile.created_at).toLocaleDateString(),
      };
    });

    return { success: true, data: topRunners };
  } catch (error) {
    console.error('전체 러너 랭킹 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};
