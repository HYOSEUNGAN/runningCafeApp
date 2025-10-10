import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import useFeedPosts from '../hooks/useFeedPosts';
import CommentModal from '../components/feed/CommentModal';
import CreatePostModal from '../components/feed/CreatePostModal';
import FeedHeader from '../components/feed/FeedHeader';
import FeedList from '../components/feed/FeedList';
import EmptyFeedState from '../components/feed/EmptyFeedState';
import FloatingActionButtons from '../components/feed/FloatingActionButtons';
import FeedLoadingState from '../components/feed/FeedLoadingState';
import FeedErrorState from '../components/feed/FeedErrorState';
import ErrorBoundary from '../components/common/ErrorBoundary';

/**
 * 피드 페이지 메인 컴포넌트
 * 무한스크롤이 적용된 피드 목록과 포스트 작성 기능을 제공
 */
const FeedPage = () => {
  // 상태 관리
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    selectedPost: null,
  });
  const [createPostModal, setCreatePostModal] = useState({
    isOpen: false,
    mode: 'normal', // 'normal' | 'camera'
  });

  // 훅들
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // 피드 데이터 관리 훅
  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    likeStates,
    loadMorePosts,
    refreshPosts,
    handleLike,
    updateCommentCount,
    handleImageLoadStart,
    handleImageLoadEnd,
    isImageLoading,
    totalPosts,
  } = useFeedPosts({
    limit: 10, // 한 번에 10개씩 로드
  });

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  /**
   * 포스트 작성 모달 열기
   */
  const handleCreatePost = useCallback(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setCreatePostModal({
      isOpen: true,
      mode: 'normal',
    });
  }, [isAuthenticated, navigate]);

  /**
   * 카메라 모드로 포스트 작성 모달 열기
   */
  const handleCreateCameraPost = useCallback(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setCreatePostModal({
      isOpen: true,
      mode: 'camera',
    });
  }, [isAuthenticated, navigate]);

  /**
   * 포스트 작성 모달 닫기
   */
  const handleCloseCreatePostModal = useCallback(
    (shouldRefresh = false) => {
      setCreatePostModal({
        isOpen: false,
        mode: 'normal',
      });

      // 포스트가 성공적으로 작성된 경우 피드 새로고침
      if (shouldRefresh) {
        refreshPosts();
      }
    },
    [refreshPosts]
  );

  /**
   * 댓글 모달 열기
   */
  const handleCommentClick = useCallback(
    post => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      setCommentModal({
        isOpen: true,
        selectedPost: {
          ...post,
          onCommentAdded: (postId, commentsCount) => {
            updateCommentCount(postId, commentsCount);
          },
          onCommentDeleted: (postId, commentsCount) => {
            updateCommentCount(postId, commentsCount);
          },
        },
      });
    },
    [isAuthenticated, navigate, updateCommentCount]
  );

  /**
   * 댓글 모달 닫기
   */
  const handleCloseCommentModal = useCallback(() => {
    setCommentModal({
      isOpen: false,
      selectedPost: null,
    });
  }, []);

  /**
   * 러닝 시작하기 버튼 클릭
   */
  const handleStartRunning = useCallback(() => {
    navigate('/nav');
  }, [navigate]);

  /**
   * 좋아요 클릭 핸들러
   */
  const handleLikeClick = useCallback(
    async postId => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      await handleLike(postId);
    },
    [isAuthenticated, navigate, handleLike]
  );

  // 로그인하지 않은 경우
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto">
          <FeedHeader
            onRefresh={handleRefresh}
            onCreatePost={handleCreatePost}
            refreshing={refreshing}
          />
          <EmptyFeedState
            onStartRunning={handleStartRunning}
            isAuthenticated={false}
          />
        </div>
      </div>
    );
  }

  // 초기 로딩 중인 경우
  if (loading) {
    return <FeedLoadingState />;
  }

  // 에러가 발생한 경우
  if (error) {
    // 에러 타입 감지
    let errorType = 'unknown';
    if (
      error.includes('네트워크') ||
      error.includes('network') ||
      error.includes('fetch')
    ) {
      errorType = 'network';
    } else if (
      error.includes('서버') ||
      error.includes('500') ||
      error.includes('502') ||
      error.includes('503')
    ) {
      errorType = 'server';
    } else if (
      error.includes('인증') ||
      error.includes('401') ||
      error.includes('403')
    ) {
      errorType = 'auth';
    }

    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto">
          <FeedHeader
            onRefresh={handleRefresh}
            onCreatePost={handleCreatePost}
            refreshing={refreshing}
          />
          <FeedErrorState
            error={error}
            onRetry={handleRefresh}
            type={errorType}
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <FeedHeader
            onRefresh={handleRefresh}
            onCreatePost={handleCreatePost}
            refreshing={refreshing}
          />

          {/* 피드 콘텐츠 */}
          {posts.length === 0 ? (
            <EmptyFeedState
              onStartRunning={handleStartRunning}
              isAuthenticated={true}
            />
          ) : (
            <ErrorBoundary
              fallback={(error, retry) => (
                <FeedErrorState
                  error={
                    error?.message ||
                    '피드 목록을 표시하는 중 오류가 발생했습니다'
                  }
                  onRetry={retry}
                  type="unknown"
                />
              )}
            >
              <FeedList
                posts={posts}
                likeStates={likeStates}
                onLike={handleLikeClick}
                onComment={handleCommentClick}
                onImageLoadStart={handleImageLoadStart}
                onImageLoadEnd={handleImageLoadEnd}
                isImageLoading={isImageLoading}
                onLoadMore={loadMorePosts}
                hasMore={hasMore}
                loadingMore={loadingMore}
              />
            </ErrorBoundary>
          )}

          {/* 플로팅 액션 버튼 */}
          {/* <FloatingActionButtons
            onCreatePost={handleCreatePost}
            onCreateCameraPost={handleCreateCameraPost}
            isAuthenticated={isAuthenticated()}
          /> */}

          {/* 댓글 모달 */}
          <ErrorBoundary
            fallback={(error, retry) => (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-2">댓글 오류</h3>
                  <p className="text-gray-600 mb-4">
                    댓글을 불러오는 중 오류가 발생했습니다.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={retry}
                      className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      다시 시도
                    </button>
                    <button
                      onClick={handleCloseCommentModal}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          >
            <CommentModal
              isOpen={commentModal.isOpen}
              onClose={handleCloseCommentModal}
              post={commentModal.selectedPost}
            />
          </ErrorBoundary>

          {/* 포스트 작성 모달 */}
          <ErrorBoundary
            fallback={(error, retry) => (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-2">
                    포스트 작성 오류
                  </h3>
                  <p className="text-gray-600 mb-4">
                    포스트 작성 중 오류가 발생했습니다.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={retry}
                      className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      다시 시도
                    </button>
                    <button
                      onClick={() => handleCloseCreatePostModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          >
            <CreatePostModal
              isOpen={createPostModal.isOpen}
              onClose={handleCloseCreatePostModal}
              mode={createPostModal.mode}
            />
          </ErrorBoundary>

          {/* 개발 정보 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
              <div>총 포스트: {totalPosts}</div>
              <div>더 로드 가능: {hasMore ? 'Yes' : 'No'}</div>
              <div>로딩 중: {loadingMore ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FeedPage;
