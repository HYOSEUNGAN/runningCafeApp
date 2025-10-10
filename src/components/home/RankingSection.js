import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRunningPlaces } from '../../services/runningPlaceService';

/**
 * 인기 러닝 코스 랭킹 섹션 컴포넌트
 * "이번주 인기 코스" 2x2 그리드 레이아웃
 */
const RankingSection = () => {
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 실제 데이터 가져오기
  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        setLoading(true);
        const places = await getAllRunningPlaces();

        // 평점과 리뷰 수를 기준으로 인기 코스 정렬 (상위 4개)
        const popularCourses = places
          .sort((a, b) => {
            // 평점 * 리뷰 수로 인기도 계산
            const scoreA = (a.rating || 0) * (a.reviewCount || 1);
            const scoreB = (b.rating || 0) * (b.reviewCount || 1);
            return scoreB - scoreA;
          })
          .slice(0, 4)
          .map((place, index) => ({
            id: place.id,
            rank: index + 1,
            title: place.name,
            rating: place.rating || 4.5,
            distance: place.distance || `${place.distanceKm || 5.0}km`,
            image:
              place.imageUrls?.[0] ||
              `/images/banners/banner-0${index % 3}.png`,
            placeType: place.placeType,
            difficulty: place.difficulty,
            address: place.address,
          }));

        setTopCourses(popularCourses);
      } catch (error) {
        console.error('인기 코스 데이터 가져오기 실패:', error);
        // 에러 시 기본 데이터 사용
        setTopCourses([
          {
            id: 1,
            rank: 1,
            title: '한강공원 5km 코스',
            rating: 4.5,
            distance: '5.2km',
            image: '/images/banners/banner-00.png',
          },
          {
            id: 2,
            rank: 2,
            title: '올림픽공원 순환 코스',
            rating: 4.5,
            distance: '3.8km',
            image: '/images/banners/banner-01.png',
          },
          {
            id: 3,
            rank: 3,
            title: '서울숲 힐링 코스',
            rating: 4.5,
            distance: '4.1km',
            image: '/images/banners/banner-02.png',
          },
          {
            id: 4,
            rank: 4,
            title: '반포 한강 코스',
            rating: 4.5,
            distance: '6.3km',
            image: '/images/banners/banner-00.png',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCourses();
  }, []);

  const handleCourseClick = courseId => {
    console.log('코스 클릭:', courseId);
    // 러닝플레이스 상세 페이지로 이동
    navigate(`/running-place/${courseId}`);
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">이번주 인기 코스</h2>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 rounded-lg aspect-[162/206] animate-pulse"
            />
          ))}
        </div>
      ) : (
        /* 2x2 그리드 */
        <div className="grid grid-cols-2 gap-3">
          {topCourses.map(course => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="relative cursor-pointer group"
            >
              {/* 코스 카드 */}
              <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[162/206] relative">
                {/* 코스 이미지 */}
                <img
                  src={course.image}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* 랭킹 번호 */}
                <div className="absolute top-3 left-3">
                  <span className="text-4xl font-bold italic text-black opacity-80">
                    {course.rank}
                  </span>
                </div>

                {/* 코스 정보 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                    {course.title}
                  </h3>

                  {/* 거리 및 평점 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {course.distance}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs text-gray-400">⭐</span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {course.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 호버 효과 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RankingSection;
