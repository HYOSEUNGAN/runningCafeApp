import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRunningPlaceById } from '../services/runningPlaceService';
import {
  getPlaceTypeKorean,
  getSurfaceTypeKorean,
} from '../services/runningPlaceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewList from '../components/common/ReviewList';
import ReviewWriteModal from '../components/common/ReviewWriteModal';

/**
 * 러닝플레이스 상세페이지 컴포넌트
 * 러닝플레이스의 상세 정보, 리뷰, 이미지 등을 표시
 */
const RunningPlaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 러닝플레이스 상세 정보 가져오기
  useEffect(() => {
    const fetchPlaceDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const placeData = await getRunningPlaceById(parseInt(id));

        if (!placeData) {
          setError('러닝플레이스 정보를 찾을 수 없습니다.');
          return;
        }

        setPlace(placeData);
      } catch (err) {
        console.error('러닝플레이스 상세 정보 가져오기 실패:', err);
        setError('러닝플레이스 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetail();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBookmark = () => {
    console.log('북마크 토글:', place.id);
    // 북마크 기능 구현
  };

  const handleDirections = () => {
    if (place?.coordinates) {
      // 네이버 지도 또는 구글 맵으로 길찾기
      const url = `https://map.naver.com/v5/directions/-/-/${place.coordinates.lat},${place.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleStartRunning = () => {
    // 러닝 시작 페이지로 이동 (해당 플레이스 정보 포함)
    navigate('/running-start', {
      state: {
        selectedPlace: place,
        startLocation: place.coordinates,
      },
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: `${place.name} - ${place.address}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('공유 취소됨');
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  const getDifficultyBadge = level => {
    const configs = {
      1: { color: 'bg-green-100 text-green-800', text: '매우 쉬움' },
      2: { color: 'bg-green-100 text-green-800', text: '쉬움' },
      3: { color: 'bg-yellow-100 text-yellow-800', text: '보통' },
      4: { color: 'bg-red-100 text-red-800', text: '어려움' },
      5: { color: 'bg-red-100 text-red-800', text: '매우 어려움' },
    };

    const config = configs[level] || configs[3];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          message="러닝플레이스 정보를 불러오는 중..."
        />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">
            {error || '러닝플레이스 정보를 찾을 수 없습니다.'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h1 className="text-lg font-bold text-gray-800 truncate mx-4">
            {place.name}
          </h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBookmark}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-200">
          <img
            src={
              place.imageUrls?.[activeImageIndex] ||
              '/images/banners/banner-00.png'
            }
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 평점 배지 */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center space-x-1">
          <span className="text-yellow-400">⭐</span>
          <span className="text-sm font-bold">{place.rating}</span>
        </div>

        {/* 이미지 인디케이터 */}
        {place.imageUrls && place.imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {place.imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 러닝플레이스 정보 */}
      <div className="px-4 py-6">
        {/* 기본 정보 */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">{place.name}</h2>
            {place.difficultyLevel && getDifficultyBadge(place.difficultyLevel)}
          </div>

          <p className="text-gray-600 mb-4">{place.description}</p>

          {/* 기본 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {place.distanceKm && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {place.distanceKm}km
                </div>
                <div className="text-sm text-gray-500">거리</div>
              </div>
            )}

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {place.reviewCount || 0}
              </div>
              <div className="text-sm text-gray-500">리뷰</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getPlaceTypeKorean(place.placeType)}
              </div>
              <div className="text-sm text-gray-500">타입</div>
            </div>
          </div>

          {/* 주소 */}
          <div className="flex items-start space-x-3 mb-3">
            <svg
              className="w-5 h-5 text-gray-400 mt-0.5"
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
            <span className="text-gray-700">{place.address}</span>
          </div>

          {/* 표면 타입 */}
          {place.surfaceType && (
            <div className="flex items-center space-x-3 mb-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-gray-700">
                바닥재: {getSurfaceTypeKorean(place.surfaceType)}
              </span>
            </div>
          )}

          {/* 편의시설 */}
          {place.facilities && place.facilities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-800 mb-2">편의시설</h4>
              <div className="flex flex-wrap gap-2">
                {place.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleStartRunning}
            className="flex flex-col items-center justify-center py-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4v4m0-4V6a2 2 0 114 0v4M7 16l1 1h8l1-1"
              />
            </svg>
            <span className="text-sm font-medium">러닝 시작</span>
          </button>

          <button
            onClick={handleDirections}
            className="flex flex-col items-center justify-center py-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className="text-sm font-medium">길찾기</span>
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            className="flex flex-col items-center justify-center py-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="text-sm font-medium">리뷰 작성</span>
          </button>
        </div>

        {/* 리뷰 섹션 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">리뷰</h3>
          <ReviewList placeType="running_place" placeId={place.id} />
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <ReviewWriteModal
          placeType="running_place"
          placeId={place.id}
          placeName={place.name}
          onClose={() => setShowReviewModal(false)}
          onSubmit={reviewData => {
            console.log('리뷰 작성:', reviewData);
            setShowReviewModal(false);
            // 리뷰 목록 새로고침
          }}
        />
      )}
    </div>
  );
};

export default RunningPlaceDetailPage;
