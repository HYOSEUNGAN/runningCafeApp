import React from 'react';

/**
 * 인기 러닝 코스 랭킹 섹션 컴포넌트
 * "이번주 인기 코스" 2x2 그리드 레이아웃
 */
const RankingSection = () => {
  // 이번주 인기 러너코스 데이터
  const topCourses = [
    {
      id: 1,
      rank: 1,
      title: '한강공원 5km 코스',
      rating: 4.5,
      distance: '5.2km',
      image: '/images/courses/course-hangang-5km.svg',
    },
    {
      id: 2,
      rank: 2,
      title: '올림픽공원 순환 코스',
      rating: 4.5,
      distance: '3.8km',
      image: '/images/courses/course-olympic-park.svg',
    },
    {
      id: 3,
      rank: 3,
      title: '서울숲 힐링 코스',
      rating: 4.5,
      distance: '4.1km',
      image: '/images/courses/course-seoul-forest.svg',
    },
    {
      id: 4,
      rank: 4,
      title: '반포 한강 코스',
      rating: 4.5,
      distance: '6.3km',
      image: '/images/courses/course-banpo-hangang.svg',
    },
  ];

  const handleCourseClick = courseId => {
    console.log('코스 클릭:', courseId);
    // 코스 상세 페이지로 이동 로직 추가
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">이번주 인기 코스</h2>
      </div>

      {/* 2x2 그리드 */}
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
    </section>
  );
};

export default RankingSection;
