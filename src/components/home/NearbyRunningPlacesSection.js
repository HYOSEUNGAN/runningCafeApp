import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNearbyRunningPlaces } from '../../services/runningPlaceService';

/**
 * 주변 러닝코스 섹션 컴포넌트
 * "지금 위치에서 1km 이내" 가로 스크롤
 */
const NearbyRunningPlacesSection = () => {
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
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

  // 주변 러닝코스 데이터 가져오기
  useEffect(() => {
    const fetchNearbyRunningPlaces = async () => {
      if (!userLocation) return;

      try {
        setLoading(true);
        const places = await getNearbyRunningPlaces(
          userLocation.lat,
          userLocation.lng,
          1
        ); // 1km 반경

        // 거리순으로 정렬하여 최대 10개까지 표시
        const formattedPlaces = places.slice(0, 10).map((place, index) => ({
          id: place.id,
          title: place.name,
          subtitle: `${place.distanceKm || '2.5'}km 코스`,
          difficulty: place.difficulty || 'medium',
          distance:
            place.distanceText || `${(Math.random() * 0.8 + 0.2).toFixed(1)}km`,
          image: place.imageUrls?.[0] || getDefaultCourseImage(index),
          difficultyLevel: place.difficultyLevel || 3,
          placeType: place.placeType || 'park',
          address: place.address,
          rating: place.rating || 4.5,
          reviewCount: place.reviewCount || Math.floor(Math.random() * 50) + 10,
        }));

        setNearbyPlaces(formattedPlaces);
      } catch (error) {
        console.error('주변 러닝코스 데이터 가져오기 실패:', error);
        // 에러 시 기본 데이터 사용
        setNearbyPlaces([
          {
            id: 1,
            title: '한강공원 러닝코스',
            subtitle: '3.2km 코스',
            difficulty: 'easy',
            distance: '0.3km',
            image: getDefaultCourseImage(0),
            difficultyLevel: 2,
            placeType: 'riverside',
            rating: 4.8,
            reviewCount: 42,
          },
          {
            id: 2,
            title: '올림픽공원 트랙',
            subtitle: '2.1km 코스',
            difficulty: 'medium',
            distance: '0.5km',
            image: getDefaultCourseImage(1),
            difficultyLevel: 3,
            placeType: 'park',
            rating: 4.6,
            reviewCount: 28,
          },
          {
            id: 3,
            title: '남산 둘레길',
            subtitle: '4.5km 코스',
            difficulty: 'hard',
            distance: '0.8km',
            image: getDefaultCourseImage(2),
            difficultyLevel: 4,
            placeType: 'mountain',
            rating: 4.9,
            reviewCount: 65,
          },
          {
            id: 4,
            title: '청계천 산책로',
            subtitle: '1.8km 코스',
            difficulty: 'easy',
            distance: '1.0km',
            image: getDefaultCourseImage(3),
            difficultyLevel: 1,
            placeType: 'riverside',
            rating: 4.4,
            reviewCount: 33,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyRunningPlaces();
  }, [userLocation]);

  const handlePlaceClick = placeId => {
    console.log('러닝코스 클릭:', placeId);
    // 러닝코스 상세 페이지로 이동
    navigate(`/running-place/${placeId}`);
  };

  // 난이도별 색상 반환
  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'hard':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // 난이도별 텍스트 반환
  const getDifficultyText = difficulty => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return '보통';
    }
  };

  // 플레이스 타입별 아이콘 반환
  const getPlaceTypeIcon = placeType => {
    switch (placeType) {
      case 'park':
        return '🌳';
      case 'riverside':
        return '🌊';
      case 'mountain':
        return '⛰️';
      case 'track':
        return '🏃';
      case 'trail':
        return '🥾';
      default:
        return '🏃';
    }
  };

  // 기본 코스 이미지 반환
  const getDefaultCourseImage = index => {
    const courseImages = [
      '/images/courses/course-banpo-hangang.svg',
      '/images/courses/course-hangang-5km.svg',
      '/images/courses/course-olympic-park.svg',
      '/images/courses/course-seoul-forest.svg',
      '/images/courses/course-hangang-5km-new.svg',
    ];
    return courseImages[index % courseImages.length];
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          지금 위치에서 1km 이내 러닝코스
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
      ) : nearbyPlaces.length === 0 ? (
        /* 러닝코스가 없을 때 안내 카드 */
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
              주변에 러닝코스가 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              1km 반경 내에 등록된 러닝코스가 없습니다.
              <br />
              다른 지역을 탐색해보세요!
            </p>
            <button
              onClick={() => {
                // 전체 러닝코스 목록 페이지로 이동하거나 새로고침
                navigate('/map');
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              지도에서 찾기
            </button>
          </div>
        </div>
      ) : (
        /* 가로 스크롤 컨테이너 */
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-3 pb-2">
            {nearbyPlaces.map(place => (
              <div
                key={place.id}
                onClick={() => handlePlaceClick(place.id)}
                className="flex-shrink-0 w-[105px] cursor-pointer group"
              >
                {/* 러닝코스 카드 */}
                <div className="relative">
                  {/* 러닝코스 이미지 */}
                  <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[105/150] relative">
                    {/* 러닝코스 이미지 */}
                    <img
                      src={place.image}
                      alt={place.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => {
                        e.target.src = getDefaultCourseImage(0); // 기본 이미지로 fallback
                      }}
                    />

                    {/* 난이도 뱃지 */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(place.difficulty)}`}
                      >
                        {getDifficultyText(place.difficulty)}
                      </span>
                    </div>

                    {/* 플레이스 타입 아이콘 */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                      <span className="text-xs">
                        {getPlaceTypeIcon(place.placeType)}
                      </span>
                    </div>

                    {/* 호버 효과 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                  </div>

                  {/* 러닝코스 정보 */}
                  <div className="mt-2">
                    <h3 className="text-xs font-bold text-black leading-tight mb-1">
                      {place.title}
                    </h3>

                    <p className="text-xs text-gray-500 mb-2">
                      {place.subtitle}
                    </p>

                    {/* 평점과 리뷰 수 */}
                    <div className="flex items-center space-x-1">
                      <div className="bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs text-gray-400">⭐</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        {place.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({place.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 스크롤 힌트 (러닝코스가 있을 때만) */}
      {!loading && nearbyPlaces.length > 0 && (
        <div className="flex justify-center mt-2">
          <div className="text-xs text-gray-400">
            ← 좌우로 스크롤하여 더 많은 러닝코스를 확인하세요 →
          </div>
        </div>
      )}
    </section>
  );
};

export default NearbyRunningPlacesSection;
