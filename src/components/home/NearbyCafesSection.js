import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNearbyCafes } from '../../services/cafeService';

/**
 * 주변 카페 섹션 컴포넌트
 * "지금 위치에서 1km 이내" 가로 스크롤
 */
const NearbyCafesSection = () => {
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  // 위치 정보 가져오기
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          error => {
            console.error('위치 정보 가져오기 실패:', error);
            // 기본 위치 (서울 시청 좌표)
            setUserLocation({
              lat: 37.5666805,
              lng: 126.9784147,
            });
          }
        );
      } else {
        // Geolocation을 지원하지 않는 경우 기본 위치 사용
        setUserLocation({
          lat: 37.5666805,
          lng: 126.9784147,
        });
      }
    };

    getCurrentLocation();
  }, []);

  // 주변 카페 데이터 가져오기
  useEffect(() => {
    const fetchNearbyCafes = async () => {
      if (!userLocation) return;

      try {
        setLoading(true);
        const cafes = await getNearbyCafes(
          userLocation.lat,
          userLocation.lng,
          1
        ); // 1km 반경

        // 거리순으로 정렬하여 최대 10개까지 표시
        const formattedCafes = cafes.slice(0, 10).map((cafe, index) => ({
          id: cafe.id,
          title: cafe.name,
          subtitle: `누적 방문 ${Math.floor(Math.random() * 20) + 1}만명`, // 임시 데이터
          rating: cafe.rating || 4.9,
          distance:
            cafe.distanceText || `${(Math.random() * 0.8 + 0.2).toFixed(1)}km`,
          image: cafe.imageUrl || `/images/banners/banner-0${index % 3}.png`,
          hasBookmark: index === 3, // 4번째 카페에만 북마크 표시
          address: cafe.address,
        }));

        setNearbyCafes(formattedCafes);
      } catch (error) {
        console.error('주변 카페 데이터 가져오기 실패:', error);
        // 에러 시 기본 데이터 사용
        setNearbyCafes([
          {
            id: 1,
            title: '러닝 후 힐링 카페',
            subtitle: '누적 방문 12만명',
            rating: 4.9,
            distance: '0.3km',
            image: '/images/banners/banner-00.png',
          },
          {
            id: 2,
            title: '아침 러너 카페',
            subtitle: '누적 방문 8만명',
            rating: 4.9,
            distance: '0.5km',
            image: '/images/banners/banner-01.png',
          },
          {
            id: 3,
            title: '한강뷰 카페',
            subtitle: '누적 방문 15만명',
            rating: 4.9,
            distance: '0.8km',
            image: '/images/banners/banner-02.png',
          },
          {
            id: 4,
            title: '올림픽공원 카페',
            subtitle: '누적 방문 6만명',
            rating: 4.9,
            distance: '1.0km',
            image: '/images/banners/banner-00.png',
            hasBookmark: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyCafes();
  }, [userLocation]);

  const handleCafeClick = cafeId => {
    console.log('주변 카페 클릭:', cafeId);
    // 카페 상세 페이지로 이동
    navigate(`/cafe/${cafeId}`);
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

      {/* 로딩 상태 */}
      {loading ? (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-3 pb-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[105px]">
                <div className="bg-gray-200 rounded-lg aspect-[105/150] animate-pulse" />
                <div className="mt-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : nearbyCafes.length === 0 ? (
        /* 카페가 없을 때 안내 카드 */
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gray-50 rounded-2xl p-8 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-500"
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
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              주변에 카페가 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              1km 반경 내에 등록된 카페가 없습니다.
              <br />
              다른 지역을 탐색해보세요!
            </p>
            <button
              onClick={() => {
                // 전체 카페 목록 페이지로 이동하거나 새로고침
                window.location.reload();
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              다시 찾기
            </button>
          </div>
        </div>
      ) : (
        /* 가로 스크롤 컨테이너 */
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

                    <p className="text-xs text-gray-500 mb-2">
                      {cafe.subtitle}
                    </p>

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
      )}

      {/* 스크롤 힌트 (카페가 있을 때만) */}
      {!loading && nearbyCafes.length > 0 && (
        <div className="flex justify-center mt-2">
          <div className="text-xs text-gray-400">
            ← 좌우로 스크롤하여 더 많은 카페를 확인하세요 →
          </div>
        </div>
      )}
    </section>
  );
};

export default NearbyCafesSection;
