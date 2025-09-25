import { supabase } from './supabase';

/**
 * 사용자 프로필 관련 API 서비스
 * user_profiles 테이블과 관련된 CRUD 작업을 담당
 */

/**
 * 사용자 프로필 생성 또는 업데이트
 * @param {Object} userData - 사용자 데이터
 * @param {string} userData.id - 사용자 ID (Supabase auth.users.id)
 * @param {string} userData.email - 이메일
 * @param {string} userData.name - 이름
 * @param {string} userData.avatar_url - 프로필 이미지 URL
 * @param {string} userData.provider - 로그인 제공자 (kakao, email 등)
 * @returns {Promise<Object>} 생성/업데이트된 프로필 데이터
 */
export const createOrUpdateUserProfile = async userData => {
  try {
    const { id, email, name, avatar_url, provider } = userData;

    if (!id) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 기존 프로필 확인
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (프로필이 없는 경우)
      console.error('프로필 조회 중 오류:', fetchError);
      throw fetchError;
    }

    const profileData = {
      user_id: id,
      email: email || '',
      name: name || '',
      avatar_url: avatar_url || '',
      provider: provider || 'email',
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingProfile) {
      // 기존 프로필 업데이트
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', id)
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
        .from('user_profiles')
        .insert({
          ...profileData,
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
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
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
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
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
      name:
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.nickname ||
        '카카오 사용자',
      avatar_url:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      provider: 'kakao',
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
      name:
        additionalData.name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '사용자',
      avatar_url:
        additionalData.avatar_url || user.user_metadata?.avatar_url || '',
      provider: 'email',
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

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

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
