import React, { useState } from 'react';

/**
 * 볼까말까 투표 섹션 컴포넌트
 * "볼까?말까? 의견을 모아모아" 캐러셀
 */
const VoteSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 이번주 핫한 플레이스 투표 데이터
  const voteItems = [
    {
      id: 1,
      title: '새로운 러닝 코스 카페',
      subtitle: '한강공원 5km 코스 끝',
      leftImage: '/images/vote-new-course-cafe.svg',
      rightImage: '/images/vote-hangang-finish-cafe.svg',
      voteCount: 234,
      totalVotes: 456,
    },
    {
      id: 2,
      title: '주말 러닝 모임 카페',
      subtitle: '올림픽공원 3km 코스',
      leftImage: '/images/vote-weekend-group-cafe.svg',
      rightImage: '/images/vote-night-running-cafe.svg',
      voteCount: 189,
      totalVotes: 312,
    },
    {
      id: 3,
      title: '야간 러닝 후 카페',
      subtitle: '반포 한강공원 근처',
      leftImage: '/images/vote-night-running-cafe.svg',
      rightImage: '/images/vote-new-course-cafe.svg',
      voteCount: 156,
      totalVotes: 289,
    },
  ];

  const handleVote = (itemId, voteType) => {
    console.log('투표:', itemId, voteType);
    // 투표 로직 추가
  };

  const handleSeeMore = () => {
    console.log('자세히 보기 클릭');
    // 전체 투표 목록 페이지로 이동
  };

  const handleSlideChange = index => {
    setCurrentSlide(index);
  };

  return (
    <section className="px-4 py-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-black">
          볼까?말까? 의견을 모아모아
        </h2>
        <button
          onClick={handleSeeMore}
          className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          자세히 보기
        </button>
      </div>

      {/* 투표 카드 캐러셀 */}
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {voteItems.map(item => (
              <div
                key={item.id}
                className="w-full flex-shrink-0 px-2 first:pl-0 last:pr-0"
              >
                <div className="flex space-x-3">
                  {/* 좌측 카드 */}
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[128/182] relative">
                      {/* 투표 이미지 */}
                      <img 
                        src={item.leftImage} 
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <h3 className="text-xs font-bold text-black mb-1">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => handleVote(item.id, 'left')}
                        className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-gray-700 transition-colors"
                      >
                        보고싶어요
                      </button>
                    </div>
                  </div>

                  {/* 우측 카드 */}
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[128/182] relative">
                      {/* 투표 이미지 */}
                      <img 
                        src={item.rightImage} 
                        alt={item.subtitle}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <h3 className="text-xs font-bold text-black mb-1">
                        {item.subtitle}
                      </h3>
                      <button
                        onClick={() => handleVote(item.id, 'right')}
                        className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-gray-700 transition-colors"
                      >
                        보고싶어요
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center mt-4 space-x-2">
          {voteItems.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentSlide ? 'bg-gray-600' : 'bg-gray-300'
              }`}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VoteSection;
