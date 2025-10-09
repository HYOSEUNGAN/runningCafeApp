import { supabase } from './supabase';

/**
 * 장소 등록 요청 관련 API 서비스
 * 사용자가 새로운 러닝 코스나 카페 등록을 요청할 때 사용
 */

/**
 * 장소 등록 요청 생성
 * @param {Object} requestData - 요청 데이터
 * @param {string} requestData.user_id - 요청자 사용자 ID
 * @param {string} requestData.place_type - 장소 유형 ('cafe' | 'running_place')
 * @param {string} requestData.place_name - 장소명
 * @param {string} requestData.address - 주소
 * @param {number} requestData.lat - 위도
 * @param {number} requestData.lng - 경도
 * @param {string} requestData.description - 설명
 * @param {string} requestData.reason - 등록 요청 이유
 * @param {Array<string>} requestData.image_urls - 이미지 URL 배열
 * @returns {Promise<Object>} 생성된 요청 데이터
 */
export const createPlaceRequest = async requestData => {
  try {
    const {
      user_id,
      place_type,
      place_name,
      address,
      lat,
      lng,
      description,
      reason,
      image_urls = [],
    } = requestData;

    if (!user_id || !place_type || !place_name) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    const { data, error } = await supabase
      .from('place_requests')
      .insert({
        user_id,
        place_type,
        place_name,
        address,
        lat,
        lng,
        description,
        reason,
        image_urls,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('장소 등록 요청 생성 실패:', error);
      throw error;
    }

    console.log('장소 등록 요청 생성 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('장소 등록 요청 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자의 장소 등록 요청 목록 조회
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회 개수 제한
 * @param {number} options.offset - 조회 시작 위치
 * @param {string} options.status - 상태 필터 ('pending' | 'approved' | 'rejected')
 * @returns {Promise<Object>} 요청 목록
 */
export const getUserPlaceRequests = async (userId, options = {}) => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { limit = 20, offset = 0, status } = options;

    let query = supabase
      .from('place_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('장소 등록 요청 목록 조회 실패:', error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('장소 등록 요청 목록 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 장소 등록 요청 상세 조회
 * @param {string} requestId - 요청 ID
 * @returns {Promise<Object>} 요청 상세 데이터
 */
export const getPlaceRequest = async requestId => {
  try {
    if (!requestId) {
      throw new Error('요청 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('place_requests')
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
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('장소 등록 요청 상세 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('장소 등록 요청 상세 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 장소 등록 요청 수정
 * @param {string} requestId - 요청 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Promise<Object>} 수정된 요청 데이터
 */
export const updatePlaceRequest = async (requestId, userId, updates) => {
  try {
    if (!requestId || !userId) {
      throw new Error('요청 ID와 사용자 ID가 필요합니다.');
    }

    // 권한 확인 - 본인의 요청만 수정 가능
    const { data: existingRequest, error: fetchError } = await supabase
      .from('place_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('기존 요청 조회 실패:', fetchError);
      throw fetchError;
    }

    if (existingRequest.user_id !== userId) {
      throw new Error('본인의 요청만 수정할 수 있습니다.');
    }

    if (existingRequest.status !== 'pending') {
      throw new Error('대기 중인 요청만 수정할 수 있습니다.');
    }

    const { data, error } = await supabase
      .from('place_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('장소 등록 요청 수정 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('장소 등록 요청 수정 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 장소 등록 요청 삭제
 * @param {string} requestId - 요청 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object>} 삭제 결과
 */
export const deletePlaceRequest = async (requestId, userId) => {
  try {
    if (!requestId || !userId) {
      throw new Error('요청 ID와 사용자 ID가 필요합니다.');
    }

    // 권한 확인 - 본인의 요청만 삭제 가능
    const { data: existingRequest, error: fetchError } = await supabase
      .from('place_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('기존 요청 조회 실패:', fetchError);
      throw fetchError;
    }

    if (existingRequest.user_id !== userId) {
      throw new Error('본인의 요청만 삭제할 수 있습니다.');
    }

    if (existingRequest.status !== 'pending') {
      throw new Error('대기 중인 요청만 삭제할 수 있습니다.');
    }

    const { error } = await supabase
      .from('place_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId);

    if (error) {
      console.error('장소 등록 요청 삭제 실패:', error);
      throw error;
    }

    console.log('장소 등록 요청 삭제 성공:', requestId);
    return { success: true };
  } catch (error) {
    console.error('장소 등록 요청 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 장소 등록 요청 통계 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 요청 통계 데이터
 */
export const getPlaceRequestStats = async userId => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('place_requests')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('장소 등록 요청 통계 조회 실패:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      pending: data.filter(req => req.status === 'pending').length,
      approved: data.filter(req => req.status === 'approved').length,
      rejected: data.filter(req => req.status === 'rejected').length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('장소 등록 요청 통계 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};
