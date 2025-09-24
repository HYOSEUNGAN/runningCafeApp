import React from 'react';

/**
 * 러너스픽 랭킹 섹션 컴포넌트
 * "이번주 러너스픽" 2x2 그리드 레이아웃
 */
const RankingSection = () => {
  // 샘플 랭킹 데이터
  const topCafes = [
    {
      id: 1,
      rank: 1,
      title: '한강뷰 러닝 카페',
      rating: 4.5,
      image: '/images/cafe1.jpg',
    },
    {
      id: 2,
      rank: 2,
      title: '올림픽공원 카페',
      rating: 4.5,
      image: '/images/cafe2.jpg',
    },
    {
      id: 3,
      rank: 3,
      title: '서울숲 힐링 카페',
      rating: 4.5,
      image: '/images/cafe3.jpg',
    },
    {
      id: 4,
      rank: 4,
      title: '반포 러너스 카페',
      rating: 4.5,
      image: '/images/cafe4.jpg',
    },
  ];

  const handleCafeClick = cafeId => {
    console.log('카페 클릭:', cafeId);
    // 카페 상세 페이지로 이동 로직 추가
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">이번주 러너스픽</h2>
      </div>

      {/* 2x2 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {topCafes.map(cafe => (
          <div
            key={cafe.id}
            onClick={() => handleCafeClick(cafe.id)}
            className="relative cursor-pointer group"
          >
            {/* 카페 카드 */}
            <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[162/206] relative">
              {/* 플레이스홀더 이미지 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-500">IMG</span>
              </div>

              {/* 랭킹 번호 */}
              <div className="absolute top-3 left-3">
                <span className="text-4xl font-bold italic text-black opacity-80">
                  {cafe.rank}
                </span>
              </div>

              {/* 카페 정보 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                  {cafe.title}
                </h3>

                {/* 평점 */}
                <div className="flex items-center space-x-1">
                  <div className="bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-xs text-gray-400">⭐</span>
                  </div>
                  <span className="text-xs font-bold text-white">
                    {cafe.rating}
                  </span>
                </div>
              </div>

              {/* 호버 효과 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RankingSection;
