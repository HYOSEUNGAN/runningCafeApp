import React, { useState, useEffect } from 'react';
import { getPlaceReviews, getPlaceRatingStats } from '../../services/reviewService';
import ReviewModal from '../common/ReviewModal';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 러닝플레이스 바텀시트 컴포넌트
 * 지도에서 러닝플레이스 클릭 시 표시되는 바텀시트
 */
const RunningPlaceBottomSheet = ({ place, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { showToast } = useAppStore();

  // 리뷰 데이터 로드
  useEffect(() => {
    if (place && isOpen && activeTab === 'reviews') {
      loadReviews();
    }
  }, [place, isOpen, activeTab]);

  const loadReviews = async () => {
    if (!place?.id) return;
    
    setIsLoadingReviews(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        getPlaceReviews('running_place', place.id),
        getPlaceRatingStats('running_place', place.id)
      ]);
      
      setReviews(reviewsData);
      setRatingStats(statsData);
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      showToast('리뷰를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setRatingStats(prev => ({
      averageRating: ((prev.averageRating * prev.totalReviews) + newReview.rating) / (prev.totalReviews + 1),
      totalReviews: prev.totalReviews + 1
    }));
    showToast('리뷰가 작성되었습니다!', 'success');
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return date.toLocaleDateString();
  };

  if (!place || !isOpen) return null;

  // 난이도별 정보
  const getDifficultyInfo = level => {
    const difficultyMap = {
      1: { label: '초급', color: 'bg-green-100 text-green-700', emoji: '🚶‍♀️' },
      2: { label: '초중급', color: 'bg-blue-100 text-blue-700', emoji: '🏃‍♀️' },
      3: { label: '중급', color: 'bg-yellow-100 text-yellow-700', emoji: '🏃‍♂️' },
      4: {
        label: '중고급',
        color: 'bg-orange-100 text-orange-700',
        emoji: '🏃‍♀️💨',
      },
      5: { label: '고급', color: 'bg-red-100 text-red-700', emoji: '🏃‍♂️💨' },
    };
    return difficultyMap[level] || difficultyMap[1];
  };

  // 장소 타입별 아이콘
  const getPlaceTypeIcon = type => {
    const typeMap = {
      park: '🌳',
      trail: '🛤️',
      track: '🏟️',
      riverside: '🌊',
      mountain: '⛰️',
    };
    return typeMap[type] || '🏃‍♀️';
  };

  // 거리 포맷팅
  const formatDistance = distance => {
    if (!distance) return '거리 정보 없음';
    return distance >= 1
      ? `${distance.toFixed(1)}km`
      : `${(distance * 1000).toFixed(0)}m`;
  };

  const difficultyInfo = getDifficultyInfo(
    place.difficulty_level || place.difficultyLevel
  );
  const placeIcon = getPlaceTypeIcon(place.place_type || place.placeType);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="px-4 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{placeIcon}</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {place.name}
                </h2>
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}
                >
                  {difficultyInfo.emoji} {difficultyInfo.label}
                </span>
                {(place.distance_km || place.distanceKm) && (
                  <span className="text-sm text-cyan-600 font-medium">
                    📏 {formatDistance(place.distance_km || place.distanceKm)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-bold text-gray-800">
                    {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : (place.rating || '4.5')}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({ratingStats.totalReviews > 0 ? ratingStats.totalReviews : (place.review_count || place.reviewCount || 0)})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            정보
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            리뷰
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'feeds'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            피드
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="p-4 space-y-4">
              {/* 주소 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  📍 위치
                </h3>
                <p className="text-sm text-gray-600">
                  {place.address || '주소 정보 없음'}
                </p>
              </div>

              {/* 설명 */}
              {place.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    📝 설명
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {place.description}
                  </p>
                </div>
              )}

              {/* 시설 정보 */}
              {place.facilities && place.facilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    🏢 시설
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {place.facilities.map((facility, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-cyan-50 text-cyan-700 text-xs rounded-full font-medium"
                      >
                        {facility === 'parking' && '🅿️ 주차장'}
                        {facility === 'restroom' && '🚻 화장실'}
                        {facility === 'water_fountain' && '💧 음수대'}
                        {facility === 'shower' && '🚿 샤워실'}
                        {facility === 'locker' && '🔒 사물함'}
                        {![
                          'parking',
                          'restroom',
                          'water_fountain',
                          'shower',
                          'locker',
                        ].includes(facility) && facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 표면 타입 */}
              {(place.surface_type || place.surfaceType) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    🛤️ 표면
                  </h3>
                  <span className="text-sm text-gray-600">
                    {(place.surface_type || place.surfaceType) === 'asphalt' &&
                      '아스팔트'}
                    {(place.surface_type || place.surfaceType) === 'dirt' &&
                      '흙길'}
                    {(place.surface_type || place.surfaceType) === 'track' &&
                      '트랙'}
                    {(place.surface_type || place.surfaceType) === 'mixed' &&
                      '혼합'}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-4">
              {/* 리뷰 작성 버튼 */}
              <div className="mb-4">
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✍️</span>
                  <span>리뷰 작성하기</span>
                </button>
              </div>

              {/* 리뷰 통계 */}
              {ratingStats.totalReviews > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-500 text-lg">⭐</span>
                      <span className="text-lg font-bold text-gray-900">
                        {ratingStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({ratingStats.totalReviews}개 리뷰)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 리뷰 목록 */}
              {isLoadingReviews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">리뷰를 불러오는 중...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                      {/* 리뷰 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {review.user?.username?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {review.user?.username || '익명'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 리뷰 내용 */}
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {review.content}
                      </p>

                      {/* 태그 */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {review.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 리뷰 액션 */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                          <span>❤️</span>
                          <span className="text-xs">{review.likesCount || 0}</span>
                        </button>
                        <div className="flex items-center space-x-2">
                          {review.isFeatured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                              ⭐ 추천 리뷰
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-gray-500 text-sm">아직 리뷰가 없습니다</p>
                  <p className="text-gray-400 text-xs mt-1">
                    첫 번째 리뷰를 작성해보세요!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feeds' && (
            <div className="p-4">
              <div className="space-y-4">
                {/* 샘플 피드 데이터 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      김
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        김러너
                      </p>
                      <p className="text-xs text-gray-500">2시간 전</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      오늘 {place.name}에서 러닝했는데 정말 좋았어요! 🏃‍♀️ 날씨도
                      좋고 경치도 예뻐서 기분 좋게 뛸 수 있었습니다.
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>📏 거리: 3.2km</span>
                      <span>⏱️ 시간: 18분 30초</span>
                      <span>⚡ 페이스: 5'47"/km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                        <span>❤️</span>
                        <span className="text-xs">12</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                        <span>💬</span>
                        <span className="text-xs">3</span>
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">
                      #러닝 #운동 #{place.name?.replace(/\s+/g, '')}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      박
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        박달리기
                      </p>
                      <p className="text-xs text-gray-500">1일 전</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      새벽 러닝으로 하루를 시작! 💪 조용하고 공기도 맑아서
                      최고였어요.
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>📏 거리: 5.0km</span>
                      <span>⏱️ 시간: 25분 12초</span>
                      <span>⚡ 페이스: 5'02"/km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                        <span>❤️</span>
                        <span className="text-xs">8</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                        <span>💬</span>
                        <span className="text-xs">1</span>
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">
                      #새벽러닝 #건강 #운동
                    </span>
                  </div>
                </div>

                {/* 더 많은 피드가 있을 때 */}
                <div className="text-center py-4">
                  <button className="text-cyan-600 text-sm font-medium hover:text-cyan-700 transition-colors">
                    더 많은 피드 보기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>길찾기</span>
            </button>

            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span>공유</span>
            </button>
          </div>
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        place={place}
        placeType="running_place"
        onReviewSubmitted={handleReviewSubmitted}
      />
    </>
  );
};

export default RunningPlaceBottomSheet;
