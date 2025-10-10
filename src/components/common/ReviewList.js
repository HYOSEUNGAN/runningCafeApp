import React, { useState, useEffect } from 'react';
import {
  getPlaceReviews,
  toggleReviewLike,
} from '../../services/placeReviewService';
import ReviewWriteModal from './ReviewWriteModal';

/**
 * 리뷰 목록 컴포넌트
 * 장소의 리뷰 목록을 표시하고 관리하는 컴포넌트
 */
const ReviewList = ({
  placeType,
  placeId,
  placeName,
  showWriteButton = true,
  maxHeight = '400px',
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 리뷰 목록 로드
  useEffect(() => {
    if (placeType && placeId) {
      loadReviews();
    }
  }, [placeType, placeId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviewData = await getPlaceReviews(placeType, placeId);
      setReviews(reviewData);
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 리뷰 작성 완료 시
  const handleReviewCreated = newReview => {
    setReviews(prev => [newReview, ...prev]);
  };

  // 리뷰 좋아요 토글
  const handleLikeToggle = async reviewId => {
    try {
      const isLiked = await toggleReviewLike(reviewId);
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                likesCount: isLiked
                  ? review.likesCount + 1
                  : review.likesCount - 1,
                isLiked: isLiked,
              }
            : review
        )
      );
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
    }
  };

  // 날짜 포맷팅
  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // 별점 렌더링
  const renderStars = rating => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              rating >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}.0</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">리뷰를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          리뷰 ({reviews.length})
        </h3>
        {showWriteButton && (
          <button
            onClick={() => setShowWriteModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            리뷰 작성
          </button>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div className="space-y-4 overflow-y-auto" style={{ maxHeight }}>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">아직 리뷰가 없습니다</p>
            <p className="text-sm">첫 번째 리뷰를 작성해보세요!</p>
            {showWriteButton && (
              <button
                onClick={() => setShowWriteModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                리뷰 작성하기
              </button>
            )}
          </div>
        ) : (
          reviews.map(review => (
            <div
              key={review.id}
              className="bg-gray-50 rounded-lg p-4 space-y-3"
            >
              {/* 리뷰 헤더 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {review.user?.displayName?.charAt(0) ||
                      review.user?.username?.charAt(0) ||
                      '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.user?.displayName ||
                        review.user?.username ||
                        '익명'}
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 좋아요 버튼 */}
                <button
                  onClick={() => handleLikeToggle(review.id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 ${review.isLiked ? 'text-red-500 fill-current' : ''}`}
                    fill={review.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-sm">{review.likesCount}</span>
                </button>
              </div>

              {/* 리뷰 내용 */}
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  {review.content}
                </p>

                {/* 태그 */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 이미지 */}
                {review.images && review.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {review.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded overflow-hidden"
                      >
                        <img
                          src={imageUrl}
                          alt={`리뷰 이미지 ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 추천 리뷰 배지 */}
              {review.isFeatured && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium">추천 리뷰</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 리뷰 작성 모달 */}
      <ReviewWriteModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        placeType={placeType}
        placeId={placeId}
        placeName={placeName}
        onReviewCreated={handleReviewCreated}
      />
    </div>
  );
};

export default ReviewList;
