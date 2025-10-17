import React, { memo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import ImageSkeleton from '../common/ImageSkeleton';

/**
 * 개별 피드 포스트 컴포넌트
 * 포스트의 모든 정보를 표시하고 상호작용을 처리
 *
 * @param {Object} props
 * @param {Object} props.post - 포스트 데이터
 * @param {boolean} props.isLiked - 좋아요 여부
 * @param {Function} props.onLike - 좋아요 클릭 핸들러
 * @param {Function} props.onComment - 댓글 클릭 핸들러
 * @param {Function} props.onImageLoadStart - 이미지 로딩 시작 핸들러
 * @param {Function} props.onImageLoadEnd - 이미지 로딩 완료 핸들러
 * @param {Function} props.isImageLoading - 이미지 로딩 상태 확인 함수
 */
const FeedPost = ({
  post,
  isLiked = false,
  onLike,
  onComment,
  onImageLoadStart,
  onImageLoadEnd,
  isImageLoading,
}) => {
  // 시간 포맷팅 (초를 HH:MM:SS로 변환)
  const formatDuration = useCallback(seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 페이스 포맷팅 (분/km)
  const formatPace = useCallback(pace => {
    if (!pace || pace === 0) return '--\'--"';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  }, []);

  // 상대 시간 포맷팅
  const formatRelativeTime = useCallback(dateString => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}일 전`;

    return postDate.toLocaleDateString();
  }, []);

  // 좋아요 클릭 핸들러
  const handleLikeClick = useCallback(() => {
    onLike(post.id);
  }, [onLike, post.id]);

  // 댓글 클릭 핸들러
  const handleCommentClick = useCallback(() => {
    onComment(post);
  }, [onComment, post]);

  // 이미지 로딩 핸들러들
  const handleImageLoadStart = useCallback(
    imageIndex => {
      onImageLoadStart(post.id, imageIndex);
    },
    [onImageLoadStart, post.id]
  );

  const handleImageLoadEnd = useCallback(
    imageIndex => {
      onImageLoadEnd(post.id, imageIndex);
    },
    [onImageLoadEnd, post.id]
  );

  const handleImageError = useCallback(
    (e, imageIndex) => {
      console.error('이미지 로드 실패:', post.image_urls[imageIndex]);
      handleImageLoadEnd(imageIndex);
      e.target.style.display = 'none';
    },
    [post.image_urls, handleImageLoadEnd]
  );

  // 이미지 클릭 핸들러
  const handleImageClick = useCallback(imageUrl => {
    window.open(imageUrl, '_blank');
  }, []);

  return (
    <div className="bg-white border-b border-gray-200">
      {/* 사용자 정보 헤더 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {(
                  post.profiles?.display_name ||
                  post.profiles?.username ||
                  'U'
                ).charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.profiles?.display_name ||
                post.profiles?.username ||
                '익명의 러너'}
            </h3>
            {post.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin size={12} className="mr-1" />
                {post.location}
              </div>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-400">
          {formatRelativeTime(post.created_at)}
        </span>
      </div>

      {/* 러닝 통계 카드 (러닝 기록이 있는 경우만 표시) - 개선된 디자인 */}
      {post.running_records && post.running_record_id && (
        <div className="mx-4 mb-3 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-sm">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🏃‍♀️</span>
              </div>
              <h4 className="text-sm font-bold text-gray-800">러닝 기록</h4>
            </div>
            {post.is_achievement && (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full border border-yellow-300">
                <span className="text-xs">🏆</span>
                <span className="text-xs font-semibold text-yellow-700">
                  달성
                </span>
              </div>
            )}
          </div>

          {/* 메인 통계 */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 text-center border border-blue-100">
              <div className="text-xs text-gray-500 mb-0.5">📏</div>
              <div className="text-base font-bold text-blue-600">
                {post.running_records?.distance?.toFixed(1) || '0.0'}
              </div>
              <div className="text-xs text-gray-600">km</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 text-center border border-green-100">
              <div className="text-xs text-gray-500 mb-0.5">⏱️</div>
              <div className="text-xs font-bold text-green-600">
                {formatDuration(post.running_records?.duration || 0)}
              </div>
              <div className="text-xs text-gray-600">시간</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 text-center border border-purple-100">
              <div className="text-xs text-gray-500 mb-0.5">⚡</div>
              <div className="text-xs font-bold text-purple-600">
                {formatPace(post.running_records?.pace || 0)}
              </div>
              <div className="text-xs text-gray-600">/km</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 text-center border border-orange-100">
              <div className="text-xs text-gray-500 mb-0.5">🔥</div>
              <div className="text-base font-bold text-orange-600">
                {post.running_records?.calories_burned || 0}
              </div>
              <div className="text-xs text-gray-600">kcal</div>
            </div>
          </div>

          {/* 경로 정보 (route_data가 있는 경우) */}
          {post.running_records?.route_data && (
            <div className="mt-2 p-2 bg-white/50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center space-x-1">
                  <span>📍</span>
                  <span>경로 데이터 포함</span>
                </span>
                <span className="font-medium text-blue-600">
                  {post.running_records.route_data?.path?.length || 0}개 포인트
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 게시글 내용 */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 leading-relaxed">{post.caption}</p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((hashtag, index) => (
              <span key={index} className="text-blue-500 text-sm">
                #{hashtag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 이미지 (있을 경우) */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="px-4 pb-3">
          {post.image_urls.length === 1 ? (
            // 단일 이미지
            <div className="relative">
              {isImageLoading(post.id, 0) && (
                <ImageSkeleton
                  height="320px"
                  className="absolute inset-0 z-10"
                />
              )}
              <img
                src={post.image_urls[0]}
                alt="포스트 이미지"
                className={`w-full max-h-80 rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                  isImageLoading(post.id, 0) ? 'opacity-0' : 'opacity-100'
                }`}
                loading="lazy"
                onLoadStart={() => handleImageLoadStart(0)}
                onLoad={() => handleImageLoadEnd(0)}
                onError={e => handleImageError(e, 0)}
                onClick={() => handleImageClick(post.image_urls[0])}
              />
            </div>
          ) : (
            // 여러 이미지 - 그리드 레이아웃
            <div
              className={`grid gap-2 rounded-lg overflow-hidden ${
                post.image_urls.length === 2
                  ? 'grid-cols-2'
                  : post.image_urls.length === 3
                    ? 'grid-cols-2 grid-rows-2'
                    : 'grid-cols-2 grid-rows-2'
              }`}
            >
              {post.image_urls.slice(0, 4).map((imageUrl, index) => (
                <div
                  key={index}
                  className={`relative ${
                    post.image_urls.length === 3 && index === 0
                      ? 'row-span-2'
                      : ''
                  }`}
                >
                  {isImageLoading(post.id, index) && (
                    <ImageSkeleton
                      height="100%"
                      className="absolute inset-0 z-10"
                      rounded="rounded-none"
                    />
                  )}
                  <img
                    src={imageUrl}
                    alt={`포스트 이미지 ${index + 1}`}
                    className={`w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                      isImageLoading(post.id, index)
                        ? 'opacity-0'
                        : 'opacity-100'
                    }`}
                    loading="lazy"
                    onLoadStart={() => handleImageLoadStart(index)}
                    onLoad={() => handleImageLoadEnd(index)}
                    onError={e => handleImageError(e, index)}
                    onClick={() => handleImageClick(imageUrl)}
                  />
                  {/* 4개 이상인 경우 마지막 이미지에 +N 표시 */}
                  {index === 3 && post.image_urls.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                      <span className="text-white text-lg font-bold">
                        +{post.image_urls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLikeClick}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">{post.likes_count}</span>
          </button>

          <button
            onClick={handleCommentClick}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">{post.comments_count}</span>
          </button>
        </div>

        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default memo(FeedPost);
