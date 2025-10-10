import React, { useState, useEffect } from 'react';
import { getPlaceRelatedFeeds } from '../../services/feedService';

/**
 * 장소별 피드 목록 컴포넌트
 * 특정 장소와 관련된 해시태그 피드를 인스타그램 스타일로 표시
 */
const PlaceFeedList = ({
  placeType,
  placeId,
  placeName,
  maxHeight = '400px',
}) => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState(null);

  // 피드 목록 로드
  useEffect(() => {
    if (placeType && placeId && placeName) {
      loadFeeds();
    }
  }, [placeType, placeId, placeName]);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const result = await getPlaceRelatedFeeds(placeType, placeId, placeName, {
        limit: 20,
        offset: 0,
      });

      if (result.success) {
        setFeeds(result.data);
      } else {
        console.error('피드 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('피드 로드 실패:', error);
    } finally {
      setLoading(false);
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

  // 러닝 데이터 포맷팅
  const formatRunningData = runningRecord => {
    if (!runningRecord) return null;

    const { distance, duration, pace } = runningRecord;
    const formatTime = seconds => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      }
      return `${minutes}분`;
    };

    return {
      distance: distance ? `${distance.toFixed(1)}km` : null,
      duration: duration ? formatTime(duration) : null,
      pace: pace
        ? `${Math.floor(pace / 60)}'${(pace % 60).toString().padStart(2, '0')}"`
        : null,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">피드를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          관련 피드 ({feeds.length})
        </h3>
        <div className="text-sm text-gray-500">#{placeName}</div>
      </div>

      {/* 피드 그리드 */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {feeds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📱</div>
            <p className="text-lg font-medium mb-2">관련 피드가 없습니다</p>
            <p className="text-sm">
              이 장소에서 러닝하고 첫 번째 피드를 공유해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeds.map(feed => {
              const runningData = formatRunningData(feed.running_records);

              return (
                <div
                  key={feed.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedFeed(feed)}
                >
                  {/* 피드 헤더 */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {feed.profiles?.display_name?.charAt(0) ||
                          feed.profiles?.username?.charAt(0) ||
                          '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {feed.profiles?.display_name ||
                            feed.profiles?.username ||
                            '익명'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(feed.created_at)}
                        </div>
                      </div>
                      {feed.is_achievement && (
                        <div className="text-yellow-500">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 이미지 */}
                  {feed.image_urls && feed.image_urls.length > 0 && (
                    <div className="relative">
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={feed.image_urls[0]}
                          alt="피드 이미지"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {feed.image_urls.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          +{feed.image_urls.length - 1}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 러닝 데이터 */}
                  {runningData && (
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {runningData.distance && (
                          <div className="flex items-center space-x-1">
                            <span>🏃‍♂️</span>
                            <span>{runningData.distance}</span>
                          </div>
                        )}
                        {runningData.duration && (
                          <div className="flex items-center space-x-1">
                            <span>⏱️</span>
                            <span>{runningData.duration}</span>
                          </div>
                        )}
                        {runningData.pace && (
                          <div className="flex items-center space-x-1">
                            <span>⚡</span>
                            <span>{runningData.pace}/km</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 캡션 */}
                  <div className="p-3">
                    {feed.caption && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {feed.caption}
                      </p>
                    )}

                    {/* 해시태그 */}
                    {feed.hashtags && feed.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {feed.hashtags.slice(0, 3).map((hashtag, index) => (
                          <span
                            key={index}
                            className="text-xs text-purple-600 font-medium"
                          >
                            #{hashtag}
                          </span>
                        ))}
                        {feed.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{feed.hashtags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 좋아요 및 댓글 */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
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
                        <span>{feed.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>{feed.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 피드 상세 모달 */}
      {selectedFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setSelectedFeed(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedFeed.profiles?.display_name?.charAt(0) ||
                    selectedFeed.profiles?.username?.charAt(0) ||
                    '?'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedFeed.profiles?.display_name ||
                      selectedFeed.profiles?.username ||
                      '익명'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(selectedFeed.created_at)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeed(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="max-h-[70vh] overflow-y-auto">
              {/* 이미지 */}
              {selectedFeed.image_urls &&
                selectedFeed.image_urls.length > 0 && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={selectedFeed.image_urls[0]}
                      alt="피드 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

              {/* 내용 */}
              <div className="p-4 space-y-4">
                {/* 러닝 데이터 */}
                {formatRunningData(selectedFeed.running_records) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-6 text-sm">
                      {formatRunningData(selectedFeed.running_records)
                        .distance && (
                        <div className="flex items-center space-x-2">
                          <span>🏃‍♂️</span>
                          <span className="font-medium">거리</span>
                          <span>
                            {
                              formatRunningData(selectedFeed.running_records)
                                .distance
                            }
                          </span>
                        </div>
                      )}
                      {formatRunningData(selectedFeed.running_records)
                        .duration && (
                        <div className="flex items-center space-x-2">
                          <span>⏱️</span>
                          <span className="font-medium">시간</span>
                          <span>
                            {
                              formatRunningData(selectedFeed.running_records)
                                .duration
                            }
                          </span>
                        </div>
                      )}
                      {formatRunningData(selectedFeed.running_records).pace && (
                        <div className="flex items-center space-x-2">
                          <span>⚡</span>
                          <span className="font-medium">페이스</span>
                          <span>
                            {
                              formatRunningData(selectedFeed.running_records)
                                .pace
                            }
                            /km
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 캡션 */}
                {selectedFeed.caption && (
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedFeed.caption}
                    </p>
                  </div>
                )}

                {/* 해시태그 */}
                {selectedFeed.hashtags && selectedFeed.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFeed.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 위치 */}
                {selectedFeed.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{selectedFeed.location}</span>
                  </div>
                )}

                {/* 좋아요 및 댓글 */}
                <div className="flex items-center space-x-6 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
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
                    <span>{selectedFeed.likes_count || 0}개의 좋아요</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{selectedFeed.comments_count || 0}개의 댓글</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceFeedList;
