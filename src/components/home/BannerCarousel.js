import React, { useState, useEffect } from 'react';

/**
 * 홈페이지 배너 캐러셀 컴포넌트
 * "이번주 오픈 카페" 섹션
 */
const BannerCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 홍보 배너 데이터
  const banners = [
    {
      id: 1,
      title: '러너픽 추천 코스',
      subtitle: 'AI가 선별한 최고의 러닝 코스',
      image: '/images/banner-runner-pick.svg',
      backgroundColor: '#4F46E5',
    },
    {
      id: 2,
      title: '30일 습관 챌린지',
      subtitle: '매일 러닝으로 건강한 습관 만들기',
      image: '/images/banner-challenge.svg',
      backgroundColor: '#059669',
    },
    {
      id: 3,
      title: '러닝 기록 공유',
      subtitle: '친구들과 러닝 성과를 자랑하세요',
      image: '/images/banner-sns-share.svg',
      backgroundColor: '#DC2626',
    },
  ];

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const handleSlideChange = index => {
    setCurrentSlide(index);
  };

  return (
    <section className="px-4 py-4">
      {/* 섹션 타이틀 */}
      {/* <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">이번주 오픈 카페</h2>
      </div> */}

      {/* 캐러셀 컨테이너 */}
      <div className="relative">
        <div className="overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map(banner => (
              <div key={banner.id} className="w-full flex-shrink-0 relative">
                {/* 배너 카드 */}
                <div
                  className="h-36 rounded-lg flex items-center justify-center text-white relative overflow-hidden"
                  style={{ backgroundColor: banner.backgroundColor }}
                >
                  {/* 배경 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                  {/* 배경 이미지 */}
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* 컨텐츠 */}
                  <div className="relative z-10 text-center px-6">
                    <h3 className="text-lg font-bold mb-2">{banner.title}</h3>
                    <p className="text-sm opacity-90">{banner.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center mt-3 space-x-2">
          {banners.map((_, index) => (
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

export default BannerCarousel;
