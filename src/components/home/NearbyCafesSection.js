import React from 'react';

/**
 * 주변 카페 섹션 컴포넌트
 * "지금 위치에서 1km 이내" 가로 스크롤
 */
const NearbyCafesSection = () => {
  // GPS 기반 주변 카페 데이터
  const nearbyCafes = [
    {
      id: 1,
      title: '러닝 후 힐링 카페',
      subtitle: '누적 방문 12만명',
      rating: 4.9,
      distance: '0.3km',
      image: '/images/nearby-healing-cafe.svg',
    },
    {
      id: 2,
      title: '아침 러너 카페',
      subtitle: '누적 방문 8만명',
      rating: 4.9,
      distance: '0.5km',
      image: '/images/nearby-morning-cafe.svg',
    },
    {
      id: 3,
      title: '한강뷰 카페',
      subtitle: '누적 방문 15만명',
      rating: 4.9,
      distance: '0.8km',
      image: '/images/nearby-hangang-view.svg',
    },
    {
      id: 4,
      title: '올림픽공원 카페',
      subtitle: '누적 방문 6만명',
      rating: 4.9,
      distance: '1.0km',
      image: '/images/nearby-olympic-cafe.svg',
      hasBookmark: true,
    },
  ];

  const handleCafeClick = cafeId => {
    console.log('주변 카페 클릭:', cafeId);
    // 카페 상세 페이지로 이동 로직 추가
  };

  const handleBookmarkClick = (e, cafeId) => {
    e.stopPropagation();
    console.log('북마크 클릭:', cafeId);
    // 북마크 토글 로직 추가
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          지금 위치에서 1km 이내
        </h2>
      </div>

      {/* 가로 스크롤 컨테이너 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-3 pb-2">
          {nearbyCafes.map(cafe => (
            <div
              key={cafe.id}
              onClick={() => handleCafeClick(cafe.id)}
              className="flex-shrink-0 w-[105px] cursor-pointer group"
            >
              {/* 카페 카드 */}
              <div className="relative">
                {/* 카페 이미지 */}
                <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[105/150] relative">
                  {/* 카페 이미지 */}
                  <img 
                    src={cafe.image} 
                    alt={cafe.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* 북마크 버튼 (있는 경우만) */}
                  {cafe.hasBookmark && (
                    <button
                      onClick={e => handleBookmarkClick(e, cafe.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="북마크"
                    >
                      <span className="text-xs">🔖</span>
                    </button>
                  )}

                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                </div>

                {/* 카페 정보 */}
                <div className="mt-2">
                  <h3 className="text-xs font-bold text-black leading-tight mb-1">
                    {cafe.title}
                  </h3>

                  <p className="text-xs text-gray-500 mb-2">{cafe.subtitle}</p>

                  {/* 평점 */}
                  <div className="flex items-center space-x-1">
                    <div className="bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-xs text-gray-400">⭐</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {cafe.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 스크롤 힌트 (선택적) */}
      <div className="flex justify-center mt-2">
        <div className="text-xs text-gray-400">
          ← 좌우로 스크롤하여 더 많은 카페를 확인하세요 →
        </div>
      </div>
    </section>
  );
};

export default NearbyCafesSection;
