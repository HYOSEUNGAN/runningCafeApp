import { supabase } from './supabase';

/**
 * 리뷰 관련 API 서비스
 * Supabase에서 리뷰 데이터를 가져오고 관리하는 함수들
 */

/**
 * 특정 장소의 리뷰 목록을 가져오는 함수
 * @param {string} placeType - 장소 타입 ('cafe', 'running_place')
 * @param {number} placeId - 장소 ID
 * @returns {Promise<Array>} 리뷰 데이터 배열
 */
export const getPlaceReviews = async (placeType, placeId) => {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('place_type', placeType)
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('리뷰 데이터 가져오기 실패:', error);
      throw error;
    }

    return data.map(review => ({
      id: review.id,
      userId: review.user_id,
      placeType: review.place_type,
      placeId: review.place_id,
      rating: review.rating,
      content: review.content,
      images: review.images || [],
      tags: review.tags || [],
      likesCount: review.likes_count || 0,
      isFeatured: review.is_featured || false,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: review.profiles ? {
        id: review.profiles.id,
        username: review.profiles.username || '익명',
        avatarUrl: review.profiles.avatar_url
      } : null
    }));
  } catch (error) {
    console.error('리뷰 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 새 리뷰를 작성하는 함수
 * @param {Object} reviewData - 리뷰 데이터
 * @returns {Promise<Object|null>} 생성된 리뷰 데이터
 */
export const createReview = async (reviewData) => {
  try {
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('place_reviews')
      .insert([
        {
          user_id: user.id,
          place_type: reviewData.placeType,
          place_id: reviewData.placeId,
          rating: reviewData.rating,
          content: reviewData.content,
          images: reviewData.images || [],
          tags: reviewData.tags || [],
        }
      ])
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('리뷰 작성 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      placeType: data.place_type,
      placeId: data.place_id,
      rating: data.rating,
      content: data.content,
      images: data.images || [],
      tags: data.tags || [],
      likesCount: data.likes_count || 0,
      isFeatured: data.is_featured || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      user: data.profiles ? {
        id: data.profiles.id,
        username: data.profiles.username || '익명',
        avatarUrl: data.profiles.avatar_url
      } : null
    };
  } catch (error) {
    console.error('리뷰 작성 중 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 수정하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise<Object|null>} 수정된 리뷰 데이터
 */
export const updateReview = async (reviewId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .update({
        rating: updateData.rating,
        content: updateData.content,
        images: updateData.images || [],
        tags: updateData.tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('리뷰 수정 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      placeType: data.place_type,
      placeId: data.place_id,
      rating: data.rating,
      content: data.content,
      images: data.images || [],
      tags: data.tags || [],
      likesCount: data.likes_count || 0,
      isFeatured: data.is_featured || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      user: data.profiles ? {
        id: data.profiles.id,
        username: data.profiles.username || '익명',
        avatarUrl: data.profiles.avatar_url
      } : null
    };
  } catch (error) {
    console.error('리뷰 수정 중 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 삭제하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deleteReview = async (reviewId) => {
  try {
    const { error } = await supabase
      .from('place_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('리뷰 삭제 실패:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('리뷰 삭제 중 오류:', error);
    return false;
  }
};

/**
 * 리뷰에 좋아요를 추가/제거하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @param {boolean} isLiked - 좋아요 상태
 * @returns {Promise<number>} 업데이트된 좋아요 수
 */
export const toggleReviewLike = async (reviewId, isLiked) => {
  try {
    // 현재 리뷰의 좋아요 수 가져오기
    const { data: currentReview, error: fetchError } = await supabase
      .from('place_reviews')
      .select('likes_count')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const currentLikes = currentReview.likes_count || 0;
    const newLikesCount = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    const { data, error } = await supabase
      .from('place_reviews')
      .update({ likes_count: newLikesCount })
      .eq('id', reviewId)
      .select('likes_count')
      .single();

    if (error) {
      console.error('리뷰 좋아요 업데이트 실패:', error);
      throw error;
    }

    return data.likes_count;
  } catch (error) {
    console.error('리뷰 좋아요 처리 중 오류:', error);
    return 0;
  }
};

/**
 * 장소의 평균 평점을 계산하는 함수
 * @param {string} placeType - 장소 타입
 * @param {number} placeId - 장소 ID
 * @returns {Promise<Object>} 평점 정보 (평균, 총 개수)
 */
export const getPlaceRatingStats = async (placeType, placeId) => {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .select('rating')
      .eq('place_type', placeType)
      .eq('place_id', placeId);

    if (error) {
      console.error('평점 통계 가져오기 실패:', error);
      throw error;
    }

    if (data.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / data.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // 소수점 첫째자리까지
      totalReviews: data.length
    };
  } catch (error) {
    console.error('평점 통계 계산 중 오류:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
};

/**
 * 사용자가 작성한 리뷰 목록을 가져오는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 사용자 리뷰 데이터 배열
 */
export const getUserReviews = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 리뷰 가져오기 실패:', error);
      throw error;
    }

    return data.map(review => ({
      id: review.id,
      userId: review.user_id,
      placeType: review.place_type,
      placeId: review.place_id,
      rating: review.rating,
      content: review.content,
      images: review.images || [],
      tags: review.tags || [],
      likesCount: review.likes_count || 0,
      isFeatured: review.is_featured || false,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    }));
  } catch (error) {
    console.error('사용자 리뷰 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 리뷰 데이터 유효성 검사 함수
 * @param {Object} reviewData - 검증할 리뷰 데이터
 * @returns {Object} 검증 결과
 */
export const validateReviewData = (reviewData) => {
  const errors = [];

  if (!reviewData.placeType || !['cafe', 'running_place'].includes(reviewData.placeType)) {
    errors.push('올바른 장소 타입을 선택해주세요.');
  }

  if (!reviewData.placeId || typeof reviewData.placeId !== 'number') {
    errors.push('올바른 장소를 선택해주세요.');
  }

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('1-5점 사이의 평점을 선택해주세요.');
  }

  if (!reviewData.content || reviewData.content.trim().length < 10) {
    errors.push('리뷰 내용을 10자 이상 작성해주세요.');
  }

  if (reviewData.content && reviewData.content.length > 500) {
    errors.push('리뷰 내용은 500자 이하로 작성해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
