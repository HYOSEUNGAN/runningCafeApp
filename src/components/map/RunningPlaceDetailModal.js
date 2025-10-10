import React, { useState, useEffect } from 'react';
import { getRunningPlaceById } from '../../services/runningPlaceService';
import ReviewList from '../common/ReviewList';
import PlaceFeedList from '../common/PlaceFeedList';

/**
 * 러닝 플레이스 상세 정보 모달 컴포넌트
 * 인스타그램 스타일의 해시태그 피드와 리뷰 시스템을 포함
 */
const RunningPlaceDetailModal = ({
  isOpen = false,
  onClose,
  placeId,
  place: initialPlace = null,
}) => {
  const [place, setPlace] = useState(initialPlace);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'reviews', 'feeds'
  const [reviews, setReviews] = useState([]);
  const [feeds, setFeeds] = useState([]);

  // 플레이스 상세 정보 로드
  useEffect(() => {
    if (isOpen && placeId && !initialPlace) {
      loadPlaceDetail();
    }
  }, [isOpen, placeId, initialPlace]);

  const loadPlaceDetail = async () => {
    setLoading(true);
    try {
      const placeData = await getRunningPlaceById(placeId);
      setPlace(placeData);
    } catch (error) {
      console.error('러닝 플레이스 상세 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 난이도 정보 반환
  const getDifficultyInfo = difficulty => {
    switch (difficulty) {
      case 'easy':
        return { text: '초급', color: 'bg-green-500', icon: '🟢' };
      case 'medium':
        return { text: '중급', color: 'bg-yellow-500', icon: '🟡' };
      case 'hard':
        return { text: '고급', color: 'bg-red-500', icon: '🔴' };
      default:
        return { text: '보통', color: 'bg-blue-500', icon: '🔵' };
    }
  };

  // 플레이스 타입 한글 변환
  const getPlaceTypeKorean = placeType => {
    const typeMap = {
      park: '공원',
      trail: '트레일',
      track: '트랙',
      riverside: '강변',
      mountain: '산',
    };
    return typeMap[placeType] || '기타';
  };

  // 표면 타입 한글 변환
  const getSurfaceTypeKorean = surfaceType => {
    const typeMap = {
      asphalt: '아스팔트',
      dirt: '흙길',
      track: '트랙',
      mixed: '혼합',
    };
    return typeMap[surfaceType] || '기타';
  };

  if (!isOpen) return null;

  const difficultyInfo = place ? getDifficultyInfo(place.difficulty) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M13.5 5.5C13.5 6.32843 12.8284 7 12 7C11.1716 7 10.5 6.32843 10.5 5.5C10.5 4.67157 11.1716 4 12 4C12.8284 4 13.5 4.67157 13.5 5.5Z" />
                <path d="M8.5 12C8.5 11.1716 9.17157 10.5 10 10.5H14C14.8284 10.5 15.5 11.1716 15.5 12V19C15.5 19.8284 14.8284 20.5 14 20.5H10C9.17157 20.5 8.5 19.8284 8.5 19V12Z" />
                <path d="M10 8.5C9.17157 8.5 8.5 9.17157 8.5 10C8.5 10.8284 9.17157 11.5 10 11.5H14C14.8284 11.5 15.5 10.8284 15.5 10C15.5 9.17157 14.8284 8.5 14 8.5H10Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {place?.name || '러닝 플레이스'}
              </h2>
              <p className="text-sm text-gray-500">
                {place?.address || '주소 정보 없음'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
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

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            정보
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            리뷰 ({place?.reviewCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'feeds'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            피드
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* 정보 탭 */}
              {activeTab === 'info' && place && (
                <div className="p-6 space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {difficultyInfo && (
                          <span
                            className={`px-3 py-1 rounded-full text-white text-sm font-medium ${difficultyInfo.color}`}
                          >
                            {difficultyInfo.icon} {difficultyInfo.text}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {getPlaceTypeKorean(place.placeType)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">거리:</span>
                          <span>{place.distance}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">표면:</span>
                          <span>{getSurfaceTypeKorean(place.surfaceType)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">평점:</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">⭐</span>
                            <span>{place.rating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-400">
                              ({place.reviewCount || 0})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 편의시설 */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">편의시설</h3>
                      {place.facilities && place.facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {place.facilities.map((facility, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          편의시설 정보가 없습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 설명 */}
                  {place.description && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">설명</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {place.description}
                      </p>
                    </div>
                  )}

                  {/* 이미지 갤러리 */}
                  {place.imageUrls && place.imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">사진</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {place.imageUrls.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                          >
                            <img
                              src={imageUrl}
                              alt={`${place.name} 사진 ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 리뷰 탭 */}
              {activeTab === 'reviews' && (
                <div className="p-6">
                  <ReviewList
                    placeType="running_place"
                    placeId={place?.id}
                    placeName={place?.name}
                    showWriteButton={true}
                    maxHeight="50vh"
                  />
                </div>
              )}

              {/* 피드 탭 */}
              {activeTab === 'feeds' && (
                <div className="p-6">
                  <PlaceFeedList
                    placeType="running_place"
                    placeId={place?.id}
                    placeName={place?.name}
                    maxHeight="50vh"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              // TODO: 즐겨찾기 기능 구현
              console.log('즐겨찾기:', place);
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
            </svg>
            즐겨찾기
          </button>

          <button
            onClick={() => {
              // TODO: 공유 기능 구현
              console.log('공유:', place);
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            공유
          </button>

          <button
            onClick={() => {
              // TODO: 길찾기 기능 구현
              console.log('길찾기:', place);
            }}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            길찾기
          </button>

          <button
            onClick={() => {
              // TODO: 러닝 시작 기능 구현
              console.log('러닝 시작:', place);
            }}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            러닝 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunningPlaceDetailModal;
