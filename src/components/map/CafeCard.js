import React, { useState } from 'react';
import ActionButtons from './ActionButtons';

/**
 * 카페 정보 카드 컴포넌트
 * 바텀시트에서 사용되는 개별 카페 카드
 */
const CafeCard = ({
  cafe,
  onCardClick,
  onRouteClick,
  onCallClick,
  onSaveClick,
  onShareClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(cafe.isSaved || false);

  // 샘플 이미지 데이터
  const sampleImages = [
    { id: 1, url: '/images/cafe-interior1.jpg', alt: '카페 내부' },
    { id: 2, url: '/images/cafe-exterior.jpg', alt: '카페 외관' },
    { id: 3, url: '/images/cafe-menu.jpg', alt: '메뉴판' },
  ];

  const handleImageNavigation = direction => {
    if (direction === 'next') {
      setCurrentImageIndex(prev =>
        prev === sampleImages.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex(prev =>
        prev === 0 ? sampleImages.length - 1 : prev - 1
      );
    }
  };

  const handleSaveClick = () => {
    setIsSaved(!isSaved);
    if (onSaveClick) {
      onSaveClick(cafe.id, !isSaved);
    }
  };

  const getStatusInfo = () => {
    if (cafe.isOpen) {
      return {
        text: `영업 중 | ${cafe.closeTime || '22:00'}에 영업 종료`,
        color: 'text-green-600',
        icon: '🟢',
      };
    } else {
      return {
        text: `영업 종료 | ${cafe.openTime || '08:00'}에 영업 시작`,
        color: 'text-red-600',
        icon: '🔴',
      };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="bg-white border-b border-gray-100 overflow-hidden hover:bg-gray-50 transition-colors duration-200">
      {/* 카페 기본 정보 */}
      <div
        onClick={() => onCardClick && onCardClick(cafe)}
        className="p-4 cursor-pointer"
      >
        {/* 상단 정보 */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{cafe.name}</h3>

          {/* 영업 상태 */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm">{status.icon}</span>
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>

          {/* 평점 및 거리 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm font-bold text-gray-800">
                {cafe.rating || '4.5'}
              </span>
              <span className="text-sm text-gray-500">
                ({cafe.reviewCount || 12})
              </span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">
              {cafe.district || '한남동'}({cafe.distance || '0.3km'})
            </span>
          </div>
        </div>

        {/* 이미지 갤러리 */}
        <div className="relative mb-4">
          <div className="flex space-x-2 overflow-hidden">
            {sampleImages.map((image, index) => (
              <div
                key={image.id}
                className={`flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
                  index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* 플레이스홀더 이미지 */}
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                  img
                </div>
              </div>
            ))}
          </div>

          {/* 이미지 네비게이션 */}
          {sampleImages.length > 1 && (
            <div className="absolute top-1/2 transform -translate-y-1/2 left-2 right-2 flex justify-between pointer-events-none">
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleImageNavigation('prev');
                }}
                className="w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs pointer-events-auto hover:bg-black/70 transition-colors"
              >
                ←
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleImageNavigation('next');
                }}
                className="w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs pointer-events-auto hover:bg-black/70 transition-colors"
              >
                →
              </button>
            </div>
          )}

          {/* 이미지 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {sampleImages.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 러닝 관련 태그 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {cafe.tags?.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          )) || (
            <>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                러닝 후 추천
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                테라스 있음
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                WiFi 무료
              </span>
            </>
          )}
        </div>
      </div>

      {/* 액션 버튼들 */}
      <ActionButtons
        onRouteClick={() => onRouteClick && onRouteClick(cafe)}
        onCallClick={() => onCallClick && onCallClick(cafe)}
        onSaveClick={handleSaveClick}
        onShareClick={() => onShareClick && onShareClick(cafe)}
        isSaved={isSaved}
        phoneNumber={cafe.phone}
      />
    </div>
  );
};

export default CafeCard;
