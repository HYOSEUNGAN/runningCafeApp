import React, { memo } from 'react';
import FeedPost from './FeedPost';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

/**
 * 피드 포스트 목록 컴포넌트
 * 무한스크롤과 함께 포스트 목록을 렌더링
 *
 * @param {Object} props
 * @param {Array} props.posts - 포스트 배열
 * @param {Object} props.likeStates - 좋아요 상태 객체
 * @param {Function} props.onLike - 좋아요 클릭 핸들러
 * @param {Function} props.onComment - 댓글 클릭 핸들러
 * @param {Function} props.onImageLoadStart - 이미지 로딩 시작 핸들러
 * @param {Function} props.onImageLoadEnd - 이미지 로딩 완료 핸들러
 * @param {Function} props.isImageLoading - 이미지 로딩 상태 확인 함수
 * @param {Function} props.onLoadMore - 더 많은 데이터 로드 함수
 * @param {boolean} props.hasMore - 더 가져올 데이터가 있는지 여부
 * @param {boolean} props.loadingMore - 추가 로딩 중 여부
 */
const FeedList = ({
  posts,
  likeStates,
  onLike,
  onComment,
  onImageLoadStart,
  onImageLoadEnd,
  isImageLoading,
  onLoadMore,
  hasMore,
  loadingMore,
}) => {
  // 무한스크롤 훅 사용
  const { targetRef } = useInfiniteScroll(onLoadMore, {
    hasMore,
    isLoading: loadingMore,
    threshold: 0.1,
    rootMargin: '100px',
  });

  return (
    <div className="space-y-0">
      {/* 포스트 목록 */}
      {posts.map(post => (
        <FeedPost
          key={post.id}
          post={post}
          isLiked={likeStates[post.id] || false}
          onLike={onLike}
          onComment={onComment}
          onImageLoadStart={onImageLoadStart}
          onImageLoadEnd={onImageLoadEnd}
          isImageLoading={isImageLoading}
        />
      ))}

      {/* 무한스크롤 로더 */}
      <InfiniteScrollLoader
        ref={targetRef}
        isLoading={loadingMore}
        hasMore={hasMore}
        loadingText="더 많은 포스트를 불러오는 중..."
        endText="모든 포스트를 확인했습니다 🏁"
      />
    </div>
  );
};

export default memo(FeedList);
