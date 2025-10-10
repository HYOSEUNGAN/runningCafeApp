import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getFeedPosts,
  togglePostLike,
  checkPostLikeStatus,
} from '../services/feedService';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * 피드 포스트 데이터 관리를 위한 커스텀 훅
 * 무한스크롤, 좋아요 처리, 댓글 수 업데이트 등을 담당
 *
 * @param {Object} options - 옵션 설정
 * @param {number} options.limit - 한 번에 가져올 포스트 수 (기본값: 10)
 * @param {string} options.userId - 특정 사용자의 포스트만 조회 (선택사항)
 * @returns {Object} 피드 관련 상태와 함수들
 */
export const useFeedPosts = (options = {}) => {
  const { limit = 10, userId } = options;

  // 상태 관리
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [likeStates, setLikeStates] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  // 인증 스토어
  const { isAuthenticated, getUserId } = useAuthStore();

  // 현재 오프셋 계산
  const currentOffset = useMemo(() => posts.length, [posts.length]);

  /**
   * 피드 포스트 초기 로드
   */
  const loadInitialPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getFeedPosts({
        limit,
        offset: 0,
        userId,
      });

      if (result.success) {
        setPosts(result.data);
        setHasMore(result.data.length === limit);

        // 이미지 로딩 상태 초기화
        const initialImageStates = {};
        result.data.forEach(post => {
          if (post.image_urls && post.image_urls.length > 0) {
            post.image_urls.forEach((_, index) => {
              const key = `${post.id}-${index}`;
              initialImageStates[key] = true;
            });
          }
        });
        setImageLoadingStates(initialImageStates);

        // 로그인한 사용자의 좋아요 상태 확인
        if (isAuthenticated()) {
          await loadLikeStates(result.data);
        }
      } else {
        setError(result.error);
        setPosts([]);
      }
    } catch (err) {
      console.error('피드 초기 로드 실패:', err);
      setError(err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, userId, isAuthenticated]);

  /**
   * 추가 포스트 로드 (무한스크롤용)
   */
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const result = await getFeedPosts({
        limit,
        offset: currentOffset,
        userId,
      });

      if (result.success) {
        const newPosts = result.data;

        if (newPosts.length === 0) {
          setHasMore(false);
          return;
        }

        // 중복 제거하여 포스트 추가
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(
            post => !existingIds.has(post.id)
          );
          return [...prevPosts, ...uniqueNewPosts];
        });

        // 더 가져올 데이터가 있는지 확인
        setHasMore(newPosts.length === limit);

        // 새로운 포스트의 이미지 로딩 상태 초기화
        const newImageStates = {};
        newPosts.forEach(post => {
          if (post.image_urls && post.image_urls.length > 0) {
            post.image_urls.forEach((_, index) => {
              const key = `${post.id}-${index}`;
              newImageStates[key] = true;
            });
          }
        });
        setImageLoadingStates(prev => ({ ...prev, ...newImageStates }));

        // 새로운 포스트의 좋아요 상태 확인
        if (isAuthenticated()) {
          await loadLikeStates(newPosts);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('추가 포스트 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, limit, currentOffset, userId, isAuthenticated]);

  /**
   * 피드 새로고침
   */
  const refreshPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const result = await getFeedPosts({
        limit,
        offset: 0,
        userId,
      });

      if (result.success) {
        setPosts(result.data);
        setHasMore(result.data.length === limit);

        // 이미지 로딩 상태 초기화
        const initialImageStates = {};
        result.data.forEach(post => {
          if (post.image_urls && post.image_urls.length > 0) {
            post.image_urls.forEach((_, index) => {
              const key = `${post.id}-${index}`;
              initialImageStates[key] = true;
            });
          }
        });
        setImageLoadingStates(initialImageStates);

        // 좋아요 상태 다시 로드
        if (isAuthenticated()) {
          await loadLikeStates(result.data);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('피드 새로고침 실패:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [limit, userId, isAuthenticated]);

  /**
   * 좋아요 상태 로드
   */
  const loadLikeStates = useCallback(
    async postsToCheck => {
      if (!isAuthenticated()) return;

      try {
        const currentUserId = getUserId();
        const likePromises = postsToCheck.map(async post => {
          const likeResult = await checkPostLikeStatus(post.id, currentUserId);
          return {
            postId: post.id,
            isLiked: likeResult.success ? likeResult.data.isLiked : false,
          };
        });

        const likes = await Promise.all(likePromises);
        const likeMap = {};
        likes.forEach(({ postId, isLiked }) => {
          likeMap[postId] = isLiked;
        });

        setLikeStates(prev => ({ ...prev, ...likeMap }));
      } catch (err) {
        console.error('좋아요 상태 로드 실패:', err);
      }
    },
    [isAuthenticated, getUserId]
  );

  /**
   * 좋아요 토글 처리
   */
  const handleLike = useCallback(
    async postId => {
      if (!isAuthenticated()) return false;

      try {
        const currentUserId = getUserId();
        const result = await togglePostLike(postId, currentUserId);

        if (result.success) {
          // 좋아요 상태 업데이트
          setLikeStates(prev => ({
            ...prev,
            [postId]: result.data.isLiked,
          }));

          // 포스트의 좋아요 수 업데이트
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    likes_count: result.data.likesCount,
                  }
                : post
            )
          );

          return true;
        }
        return false;
      } catch (err) {
        console.error('좋아요 처리 실패:', err);
        return false;
      }
    },
    [isAuthenticated, getUserId]
  );

  /**
   * 댓글 수 업데이트
   */
  const updateCommentCount = useCallback((postId, newCount) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments_count: newCount,
            }
          : post
      )
    );
  }, []);

  /**
   * 이미지 로딩 상태 관리
   */
  const handleImageLoadStart = useCallback((postId, imageIndex) => {
    const key = `${postId}-${imageIndex}`;
    setImageLoadingStates(prev => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const handleImageLoadEnd = useCallback((postId, imageIndex) => {
    const key = `${postId}-${imageIndex}`;
    setImageLoadingStates(prev => ({
      ...prev,
      [key]: false,
    }));
  }, []);

  const isImageLoading = useCallback(
    (postId, imageIndex) => {
      const key = `${postId}-${imageIndex}`;
      return imageLoadingStates[key] || false;
    },
    [imageLoadingStates]
  );

  // 초기 로드
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  return {
    // 상태
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    likeStates,

    // 함수
    loadMorePosts,
    refreshPosts,
    handleLike,
    updateCommentCount,
    handleImageLoadStart,
    handleImageLoadEnd,
    isImageLoading,

    // 통계
    totalPosts: posts.length,
  };
};

export default useFeedPosts;
