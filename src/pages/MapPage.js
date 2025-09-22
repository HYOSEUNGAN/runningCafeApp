import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/app';
import Button from '../components/ui/Button';

/**
 * 맵 페이지 컴포넌트 - 러닝 코스와 카페 위치를 지도에서 확인
 */
const MapPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showLocationInfo, setShowLocationInfo] = useState(null);

  const handleNavigate = path => {
    navigate(path);
  };

  const filters = [
    { id: 'all', label: '전체', icon: '🗺️' },
    { id: 'running', label: '러닝코스', icon: '🏃‍♀️' },
    { id: 'cafe', label: '카페', icon: '☕' },
    { id: 'favorite', label: '즐겨찾기', icon: '⭐' },
  ];

  const mockLocations = [
    {
      id: 1,
      type: 'running',
      name: '한강 러닝 코스',
      distance: '5.2km',
      difficulty: '초급',
      rating: 4.8,
      position: { top: '45%', left: '35%' },
    },
    {
      id: 2,
      type: 'cafe',
      name: '러너스 카페',
      description: '러닝 후 휴식하기 좋은 카페',
      rating: 4.6,
      position: { top: '40%', left: '45%' },
    },
    {
      id: 3,
      type: 'running',
      name: '올림픽공원 코스',
      distance: '3.8km',
      difficulty: '중급',
      rating: 4.7,
      position: { top: '55%', left: '60%' },
    },
    {
      id: 4,
      type: 'cafe',
      name: '브런치 & 런',
      description: '건강한 브런치 메뉴',
      rating: 4.5,
      position: { top: '35%', left: '55%' },
    },
  ];

  const filteredLocations =
    activeFilter === 'all'
      ? mockLocations
      : mockLocations.filter(location => location.type === activeFilter);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">맵</h1>
          <div className="flex items-center space-x-3">
            <button className="touch-button text-neutral-600 hover:text-neutral-800 transition-colors">
              <span className="text-lg">📍</span>
            </button>
            <button className="touch-button text-neutral-600 hover:text-neutral-800 transition-colors">
              <span className="text-lg">🔍</span>
            </button>
          </div>
        </div>
      </header>

      {/* 필터 탭 */}
      <div className="bg-white px-6 py-3 border-b border-neutral-200">
        <div className="flex space-x-2 overflow-x-auto">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`map-filter-button ${
                activeFilter === filter.id ? 'active' : ''
              }`}
            >
              <span className="text-sm">{filter.icon}</span>
              <span className="text-sm font-medium">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="relative flex-1">
        {/* 모의 지도 배경 */}
        <div
          className="w-full h-[500px] bg-gradient-to-br from-green-100 via-blue-50 to-green-50 relative overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
            `,
          }}
        >
          {/* 도로 라인들 */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-300 opacity-30 transform -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 w-1 h-full bg-neutral-300 opacity-30 transform -translate-x-1/2"></div>
            <div className="absolute top-1/4 left-0 w-full h-0.5 bg-neutral-300 opacity-20 transform rotate-12"></div>
            <div className="absolute top-3/4 left-0 w-full h-0.5 bg-neutral-300 opacity-20 transform -rotate-12"></div>
          </div>

          {/* 위치 마커들 */}
          {filteredLocations.map(location => (
            <button
              key={location.id}
              onClick={() => setShowLocationInfo(location)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 touch-button"
              style={{
                top: location.position.top,
                left: location.position.left,
              }}
            >
              <div className={`map-marker ${location.type}`}>
                <span className="text-white text-lg">
                  {location.type === 'running' ? '🏃‍♀️' : '☕'}
                </span>
                {/* 펄스 애니메이션 */}
                <div className={`map-marker-pulse ${location.type}`}></div>
              </div>
            </button>
          ))}

          {/* 현재 위치 마커 */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ top: '50%', left: '50%' }}
          >
            <div className="relative bg-blue-500 rounded-full w-4 h-4 border-2 border-white shadow-lg">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
        </div>

        {/* 내 위치 버튼 */}
        <button className="absolute bottom-4 right-4 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
          <span className="text-lg">📍</span>
        </button>

        {/* 줌 컨트롤 */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden">
          <button className="w-10 h-10 flex items-center justify-center border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
            <span className="text-lg font-bold text-neutral-600">+</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors">
            <span className="text-lg font-bold text-neutral-600">-</span>
          </button>
        </div>
      </div>

      {/* 위치 정보 팝업 */}
      {showLocationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="location-popup">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4"></div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {showLocationInfo.type === 'running' ? '🏃‍♀️' : '☕'}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {showLocationInfo.name}
                  </h3>
                </div>

                {showLocationInfo.type === 'running' ? (
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="location-tag distance">
                      {showLocationInfo.distance}
                    </span>
                    <span className="location-tag difficulty">
                      {showLocationInfo.difficulty}
                    </span>
                    <span className="text-sm text-secondary-orange">
                      ⭐ {showLocationInfo.rating}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-sm text-neutral-600">
                      {showLocationInfo.description}
                    </span>
                    <span className="text-sm text-secondary-orange">
                      ⭐ {showLocationInfo.rating}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLocationInfo(null)}
                className="touch-button text-neutral-400 hover:text-neutral-600"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  if (showLocationInfo.type === 'running') {
                    handleNavigate(ROUTES.RUNNING_COURSES);
                  } else {
                    handleNavigate(ROUTES.CAFES);
                  }
                }}
              >
                {showLocationInfo.type === 'running'
                  ? '코스 보기'
                  : '카페 보기'}
              </Button>
              <Button variant="secondary" size="md" className="flex-1">
                길찾기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 safe-area-bottom">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={() => handleNavigate(ROUTES.HOME)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">홈</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">🏃‍♀️</span>
            <span className="text-xs font-medium">러닝</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.MAP)}
            className="flex flex-col items-center space-y-1 text-primary-500 touch-button"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-xs font-medium">맵</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.CAFES)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">☕</span>
            <span className="text-xs font-medium">카페</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.PROFILE)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">프로필</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MapPage;
