import { supabase } from './supabase';
import { uploadMultipleImages, deleteImage } from './imageUploadService';

/**
 * 피드 관련 API 서비스
 * feed_posts, post_likes, post_comments 테이블과 관련된 CRUD 작업을 담당
 */

/**
 * 피드 포스트 생성 (이미지 업로드 포함)
 * @param {Object} postData - 포스트 데이터
 * @param {string} postData.user_id - 사용자 ID
 * @param {string} postData.running_record_id - 러닝 기록 ID (선택사항)
 * @param {string} postData.caption - 캡션
 * @param {File[]} postData.images - 업로드할 이미지 파일 배열
 * @param {string[]} postData.image_urls - 이미지 URL 배열 (기존 이미지)
 * @param {string[]} postData.hashtags - 해시태그 배열
 * @param {string} postData.location - 위치
 * @param {boolean} postData.is_achievement - 달성 기록 여부
 * @returns {Promise<Object>} 생성된 포스트 데이터
 */
export const createFeedPost = async postData => {
  try {
    const {
      user_id,
      running_record_id = null,
      caption,
      images = [],
      image_urls = [],
      hashtags = [],
      location,
      is_achievement = false,
    } = postData;

    if (!user_id) {
      throw new Error('필수 필드가 누락되었습니다: user_id');
    }

    let finalImageUrls = [...image_urls];

    // 새로운 이미지 파일이 있는 경우 업로드
    if (images && images.length > 0) {
      console.log(`${images.length}개의 이미지 업로드 시작`);

      const uploadResult = await uploadMultipleImages(images, user_id, 'posts');

      if (uploadResult.success && uploadResult.data.uploaded.length > 0) {
        const uploadedUrls = uploadResult.data.uploaded.map(
          img => img.imageUrl
        );
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];

        console.log('이미지 업로드 성공:', uploadedUrls);
      } else {
        console.warn('이미지 업로드 실패:', uploadResult.error);
        // 이미지 업로드 실패해도 포스트는 생성 진행
      }
    }

    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        user_id,
        running_record_id,
        caption: caption || '',
        image_urls: finalImageUrls,
        hashtags,
        location: location || '',
        is_achievement,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        running_records:running_record_id (
          distance,
          duration,
          pace,
          calories_burned
        )
      `
      )
      .single();

    if (error) {
      console.error('피드 포스트 생성 실패:', error);
      throw error;
    }

    console.log('피드 포스트 생성 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('피드 포스트 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 피드 포스트 목록 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 20)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @param {string} options.userId - 특정 사용자의 포스트만 조회 (선택사항)
 * @returns {Promise<Object>} 피드 포스트 목록
 */
export const getFeedPosts = async (options = {}) => {
  try {
    const { limit = 20, offset = 0, userId } = options;

    let query = supabase
      .from('feed_posts')
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        running_records:running_record_id (
          distance,
          duration,
          pace,
          calories_burned,
          title
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 사용자의 포스트만 조회하는 경우
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('피드 포스트 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('피드 포스트 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 특정 피드 포스트 조회
 * @param {string} postId - 포스트 ID
 * @returns {Promise<Object>} 피드 포스트 데이터
 */
export const getFeedPost = async postId => {
  try {
    if (!postId) {
      throw new Error('포스트 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('feed_posts')
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        running_records:running_record_id (
          distance,
          duration,
          pace,
          calories_burned,
          title,
          route_data
        )
      `
      )
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: '포스트를 찾을 수 없습니다.' };
      }
      console.error('피드 포스트 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('피드 포스트 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 피드 포스트 좋아요/취소
 * @param {string} postId - 포스트 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 좋아요 처리 결과
 */
export const togglePostLike = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      throw new Error('포스트 ID와 사용자 ID가 필요합니다.');
    }

    // 기존 좋아요 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let isLiked = false;

    if (existingLike) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;

      // 포스트 좋아요 수 감소
      const { error: updateError } = await supabase.rpc(
        'decrement_post_likes',
        {
          post_id: postId,
        }
      );

      if (updateError) throw updateError;
      isLiked = false;
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // 포스트 좋아요 수 증가
      const { error: updateError } = await supabase.rpc(
        'increment_post_likes',
        {
          post_id: postId,
        }
      );

      if (updateError) throw updateError;
      isLiked = true;
    }

    return { success: true, data: { isLiked } };
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 포스트 좋아요 상태 확인
 * @param {string} postId - 포스트 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 좋아요 상태
 */
export const checkPostLikeStatus = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      throw new Error('포스트 ID와 사용자 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: { isLiked: !!data } };
  } catch (error) {
    console.error('좋아요 상태 확인 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 포스트 댓글 생성
 * @param {Object} commentData - 댓글 데이터
 * @param {string} commentData.user_id - 사용자 ID
 * @param {string} commentData.post_id - 포스트 ID
 * @param {string} commentData.content - 댓글 내용
 * @param {string} commentData.parent_comment_id - 부모 댓글 ID (대댓글인 경우)
 * @returns {Promise<Object>} 생성된 댓글 데이터
 */
export const createPostComment = async commentData => {
  try {
    const { user_id, post_id, content, parent_comment_id = null } = commentData;

    if (!user_id || !post_id || !content?.trim()) {
      throw new Error('필수 필드가 누락되었습니다: user_id, post_id, content');
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        user_id,
        post_id,
        parent_comment_id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
      console.error('댓글 생성 실패:', error);
      throw error;
    }

    // 포스트 댓글 수 증가
    const { error: updateError } = await supabase.rpc(
      'increment_post_comments',
      {
        post_id: post_id,
      }
    );

    if (updateError) {
      console.error('댓글 수 업데이트 실패:', updateError);
    }

    console.log('댓글 생성 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('댓글 생성 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 포스트 댓글 목록 조회
 * @param {string} postId - 포스트 ID
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 50)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @returns {Promise<Object>} 댓글 목록
 */
export const getPostComments = async (postId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;

    if (!postId) {
      throw new Error('포스트 ID가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('post_comments')
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
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('댓글 조회 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 댓글 삭제
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object>} 삭제 결과
 */
export const deletePostComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      throw new Error('댓글 ID와 사용자 ID가 필요합니다.');
    }

    // 댓글 정보 조회 (포스트 ID 획득용)
    const { data: comment, error: fetchError } = await supabase
      .from('post_comments')
      .select('post_id')
      .eq('id', commentId)
      .eq('user_id', userId) // 본인 댓글만 삭제 가능
      .single();

    if (fetchError) {
      console.error('댓글 조회 실패:', fetchError);
      throw fetchError;
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // 본인 댓글만 삭제 가능

    if (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }

    // 포스트 댓글 수 감소
    const { error: updateError } = await supabase.rpc(
      'decrement_post_comments',
      {
        post_id: comment.post_id,
      }
    );

    if (updateError) {
      console.error('댓글 수 업데이트 실패:', updateError);
    }

    console.log('댓글 삭제 성공:', commentId);
    return { success: true };
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 포스트 삭제
 * @param {string} postId - 포스트 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteFeedPost = async (postId, userId) => {
  try {
    if (!postId || !userId) {
      throw new Error('포스트 ID와 사용자 ID가 필요합니다.');
    }

    const { error } = await supabase
      .from('feed_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId); // 본인 포스트만 삭제 가능

    if (error) {
      console.error('포스트 삭제 실패:', error);
      throw error;
    }

    console.log('포스트 삭제 성공:', postId);
    return { success: true };
  } catch (error) {
    console.error('포스트 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 해시태그로 포스트 검색
 * @param {string} hashtag - 검색할 해시태그
 * @param {Object} options - 조회 옵션
 * @param {number} options.limit - 조회할 개수 (기본값: 20)
 * @param {number} options.offset - 시작 위치 (기본값: 0)
 * @returns {Promise<Object>} 검색된 포스트 목록
 */
export const searchPostsByHashtag = async (hashtag, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    if (!hashtag) {
      throw new Error('해시태그가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('feed_posts')
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        running_records:running_record_id (
          distance,
          duration,
          pace,
          calories_burned,
          title
        )
      `
      )
      .contains('hashtags', [hashtag])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('해시태그 검색 실패:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('해시태그 검색 중 오류:', error);
    return { success: false, error: error.message };
  }
};
