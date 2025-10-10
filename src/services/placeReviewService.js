import { supabase } from './supabase';

/**
 * 장소 리뷰 관련 API 서비스
 * Supabase에서 장소 리뷰 데이터를 관리하는 함수들
 */

/**
 * 특정 장소의 리뷰 목록을 가져오는 함수
 * @param {string} placeType - 장소 타입 ('cafe' | 'running_place')
 * @param {number} placeId - 장소 ID
 * @returns {Promise<Array>} 리뷰 데이터 배열
 */
export const getPlaceReviews = async (placeType, placeId) => {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
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
      user: {
        username: review.profiles?.username,
        displayName: review.profiles?.display_name,
        avatarUrl: review.profiles?.avatar_url,
      },
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
export const createPlaceReview = async reviewData => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
        },
      ])
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
      .single();

    if (error) {
      console.error('리뷰 작성 실패:', error);
      throw error;
    }

    // 장소의 평점과 리뷰 수 업데이트
    await updatePlaceRating(reviewData.placeType, reviewData.placeId);

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
      user: {
        username: data.profiles?.username,
        displayName: data.profiles?.display_name,
        avatarUrl: data.profiles?.avatar_url,
      },
    };
  } catch (error) {
    console.error('리뷰 작성 중 오류:', error);
    return null;
  }
};

/**
 * 리뷰를 수정하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise<Object|null>} 수정된 리뷰 데이터
 */
export const updatePlaceReview = async (reviewId, updateData) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('place_reviews')
      .update({
        rating: updateData.rating,
        content: updateData.content,
        images: updateData.images || [],
        tags: updateData.tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', user.id) // 본인의 리뷰만 수정 가능
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
      .single();

    if (error) {
      console.error('리뷰 수정 실패:', error);
      throw error;
    }

    // 장소의 평점 재계산
    await updatePlaceRating(data.place_type, data.place_id);

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
      user: {
        username: data.profiles?.username,
        displayName: data.profiles?.display_name,
        avatarUrl: data.profiles?.avatar_url,
      },
    };
  } catch (error) {
    console.error('리뷰 수정 중 오류:', error);
    return null;
  }
};

/**
 * 리뷰를 삭제하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const deletePlaceReview = async reviewId => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 삭제 전 리뷰 정보 가져오기 (평점 재계산을 위해)
    const { data: reviewToDelete } = await supabase
      .from('place_reviews')
      .select('place_type, place_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('place_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id); // 본인의 리뷰만 삭제 가능

    if (error) {
      console.error('리뷰 삭제 실패:', error);
      throw error;
    }

    // 장소의 평점과 리뷰 수 업데이트
    if (reviewToDelete) {
      await updatePlaceRating(
        reviewToDelete.place_type,
        reviewToDelete.place_id
      );
    }

    return true;
  } catch (error) {
    console.error('리뷰 삭제 중 오류:', error);
    return false;
  }
};

/**
 * 장소의 평점과 리뷰 수를 업데이트하는 함수
 * @param {string} placeType - 장소 타입
 * @param {number} placeId - 장소 ID
 */
const updatePlaceRating = async (placeType, placeId) => {
  try {
    // 해당 장소의 모든 리뷰 가져오기
    const { data: reviews, error: reviewsError } = await supabase
      .from('place_reviews')
      .select('rating')
      .eq('place_type', placeType)
      .eq('place_id', placeId);

    if (reviewsError) {
      console.error('리뷰 데이터 가져오기 실패:', reviewsError);
      return;
    }

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

    // 장소 타입에 따라 다른 테이블 업데이트
    const tableName = placeType === 'cafe' ? 'cafes' : 'running_places';

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        rating: Math.round(averageRating * 10) / 10, // 소수점 첫째 자리까지
        review_count: reviewCount,
      })
      .eq('id', placeId);

    if (updateError) {
      console.error('장소 평점 업데이트 실패:', updateError);
    }
  } catch (error) {
    console.error('평점 업데이트 중 오류:', error);
  }
};

/**
 * 리뷰에 좋아요를 토글하는 함수
 * @param {string} reviewId - 리뷰 ID
 * @returns {Promise<boolean>} 좋아요 상태 (true: 좋아요, false: 좋아요 취소)
 */
export const toggleReviewLike = async reviewId => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // 좋아요 취소
      await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      // 리뷰의 좋아요 수 감소
      await supabase.rpc('decrement_review_likes', { review_id: reviewId });

      return false;
    } else {
      // 좋아요 추가
      await supabase
        .from('review_likes')
        .insert([{ review_id: reviewId, user_id: user.id }]);

      // 리뷰의 좋아요 수 증가
      await supabase.rpc('increment_review_likes', { review_id: reviewId });

      return true;
    }
  } catch (error) {
    console.error('리뷰 좋아요 토글 중 오류:', error);
    return false;
  }
};

/**
 * 사용자가 작성한 리뷰 목록을 가져오는 함수
 * @param {string} userId - 사용자 ID (선택사항, 없으면 현재 로그인한 사용자)
 * @returns {Promise<Array>} 사용자 리뷰 데이터 배열
 */
export const getUserReviews = async (userId = null) => {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('place_reviews')
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
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 리뷰 데이터 가져오기 실패:', error);
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
      user: {
        username: review.profiles?.username,
        displayName: review.profiles?.display_name,
        avatarUrl: review.profiles?.avatar_url,
      },
    }));
  } catch (error) {
    console.error('사용자 리뷰 데이터 가져오기 중 오류:', error);
    return [];
  }
};

/**
 * 리뷰 데이터 유효성 검사 함수
 * @param {Object} reviewData - 검증할 리뷰 데이터
 * @returns {Object} 검증 결과 { isValid: boolean, errors: string[] }
 */
export const validateReviewData = reviewData => {
  const errors = [];

  if (
    !reviewData.placeType ||
    !['cafe', 'running_place'].includes(reviewData.placeType)
  ) {
    errors.push('올바른 장소 타입을 선택해주세요.');
  }

  if (!reviewData.placeId || typeof reviewData.placeId !== 'number') {
    errors.push('올바른 장소 ID가 필요합니다.');
  }

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('평점은 1~5점 사이여야 합니다.');
  }

  if (!reviewData.content || reviewData.content.trim().length < 10) {
    errors.push('리뷰 내용은 최소 10자 이상 작성해주세요.');
  }

  if (reviewData.content && reviewData.content.length > 1000) {
    errors.push('리뷰 내용은 1000자를 초과할 수 없습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
