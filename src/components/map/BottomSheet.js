import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import FilterTabs from './FilterTabs';
import { getAllRunningPlaces } from '../../services/runningPlaceService';
import { useAppStore } from '../../stores/useAppStore';

// 러닝플레이스 카드 컴포넌트 (불필요한 기능 제거)
const RunningPlaceCard = ({ place, onCardClick }) => {
  // 난이도별 정보
  const getDifficultyInfo = level => {
    const difficultyMap = {
      1: { label: '초급', color: 'bg-green-100 text-green-700', emoji: '🚶‍♀️' },
      2: { label: '초중급', color: 'bg-blue-100 text-blue-700', emoji: '🏃‍♀️' },
      3: { label: '중급', color: 'bg-yellow-100 text-yellow-700', emoji: '🏃‍♂️' },
      4: {
        label: '중고급',
        color: 'bg-orange-100 text-orange-700',
        emoji: '🏃‍♀️💨',
      },
      5: { label: '고급', color: 'bg-red-100 text-red-700', emoji: '🏃‍♂️💨' },
    };
    return difficultyMap[level] || difficultyMap[1];
  };

  // 장소 타입별 아이콘
  const getPlaceTypeIcon = type => {
    const typeMap = {
      park: '🌳',
      trail: '🛤️',
      track: '🏟️',
      riverside: '🌊',
      mountain: '⛰️',
    };
    return typeMap[type] || '🏃‍♀️';
  };

  const difficultyInfo = getDifficultyInfo(
    place.difficultyLevel || place.difficulty_level
  );
  const placeIcon = getPlaceTypeIcon(place.placeType || place.place_type);

  return (
    <div
      className="bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={() => onCardClick && onCardClick(place)}
    >
      <div className="p-4">
        <div className="flex space-x-3">
          {/* 이미지 */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-50 to-purple-50 rounded-lg overflow-hidden">
              {place.imageUrls && place.imageUrls[0] ? (
                <img
                  src={place.imageUrls[0]}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {placeIcon}
                </div>
              )}
            </div>
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 truncate pr-2">
                {place.name}
              </h3>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-xs font-bold text-gray-800">
                  {place.rating || '4.5'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyInfo.color}`}
              >
                {difficultyInfo.emoji} {difficultyInfo.label}
              </span>
              {place.distance && (
                <span className="text-xs text-cyan-600 font-medium">
                  📏 {place.distance.toFixed(1)}km
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 line-clamp-1">
              {place.address || '주소 정보 없음'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 하단 스크롤 바텀시트 컴포넌트
 * 드래그 가능한 바텀시트와 러닝플레이스 목록
 */
const BottomSheet = ({
  userLocation,
  isOpen = true,
  onClose,
  onPlaceSelect,
  selectedFilters = [],
  searchRadius = 5,
}) => {
  const [sheetHeight, setSheetHeight] = useState('15%'); // 'closed', '15%', '60%', '85%', 'full'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [activeTab, setActiveTab] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);

  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const { showToast } = useAppStore();

  // 사용자 위치 기반 러닝플레이스 검색
  useEffect(() => {
    if (userLocation && activeTab === 'nearby') {
      fetchNearbyPlaces();
    }
  }, [userLocation, searchRadius, selectedFilters, activeTab]);

  // 저장된 러닝플레이스 목록 로드
  useEffect(() => {
    if (activeTab === 'favorites') {
      loadSavedPlaces();
    }
  }, [activeTab]);

  // 두 지점 간의 거리 계산 (하버사인 공식)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyPlaces = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      const allPlaces = await getAllRunningPlaces();

      // 거리 계산 및 반경 내 필터링
      const placesWithDistance = allPlaces.map(place => ({
        ...place,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.coordinates.lat,
          place.coordinates.lng
        ),
      }));

      // 반경 내 러닝플레이스만 필터링
      const nearbyFiltered = placesWithDistance.filter(
        place => place.distance <= searchRadius
      );

      // 거리순 정렬 (이미지 필터링 제거)
      const sorted = nearbyFiltered.sort((a, b) => a.distance - b.distance);

      setNearbyPlaces(sorted);
    } catch (error) {
      console.error('주변 러닝플레이스 검색 실패:', error);
      showToast('주변 러닝플레이스를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedPlaces = () => {
    // 로컬 스토리지에서 저장된 러닝플레이스 목록 로드
    try {
      const saved = localStorage.getItem('savedRunningPlaces');
      if (saved) {
        setSavedPlaces(JSON.parse(saved));
      }
    } catch (error) {
      console.error('저장된 러닝플레이스 로드 실패:', error);
    }
  };

  // 현재 표시할 러닝플레이스 목록 결정
  const getCurrentPlaces = () => {
    if (activeTab === 'favorites') {
      return savedPlaces.filter(place => {
        if (
          searchQuery &&
          !place.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
    }

    // 주변 탭에서는 검색어 필터링
    return nearbyPlaces.filter(place => {
      if (
        searchQuery &&
        !place.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const filteredPlaces = getCurrentPlaces();

  const getSheetStyles = () => {
    switch (sheetHeight) {
      case 'closed':
        return {
          height: '80px',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '15%':
        return {
          height: '15vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '60%':
        return {
          height: '60vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '85%':
        return {
          height: '85vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case 'full':
        return {
          height: '95vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      default:
        return {
          height: '15vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
    }
  };

  const handleDragStart = e => {
    setIsDragging(true);
    setDragStartY(e.type === 'touchstart' ? e.touches[0].clientY : e.clientY);
  };

  const handleDragMove = e => {
    if (!isDragging) return;

    // 터치 이벤트와 마우스 이벤트 모두 지원
    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY;
    const threshold = 50; // 네이버 지도 스타일 임계값

    // 부드러운 드래그 감지 (네이버 지도 스타일)
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && sheetHeight !== 'closed') {
        // 아래로 드래그 - 축소
        if (sheetHeight === 'full') {
          setSheetHeight('85%');
        } else if (sheetHeight === '85%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('15%');
        } else if (sheetHeight === '15%') {
          setSheetHeight('closed');
        }
        setDragStartY(currentY);
      } else if (deltaY < 0 && sheetHeight !== 'full') {
        // 위로 드래그 - 확대
        if (sheetHeight === 'closed') {
          setSheetHeight('15%');
        } else if (sheetHeight === '15%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('85%');
        } else if (sheetHeight === '85%') {
          setSheetHeight('full');
        }
        setDragStartY(currentY);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = e => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = e => handleDragMove(e);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartY]);

  // 검색어 변경 핸들러
  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
  };

  // 탭 변경 핸들러
  const handleTabChange = tabId => {
    setActiveTab(tabId);
    setSearchQuery(''); // 탭 변경 시 검색어 초기화
  };

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] bg-white/98 backdrop-blur-lg shadow-[0_-4px_32px_rgba(0,0,0,0.12)] z-40 ${
        isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'
      }`}
      style={{
        ...getSheetStyles(),
        borderTop: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* 드래그 핸들 - 네이버 지도 스타일 */}
      <div
        ref={handleRef}
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors duration-200"></div>
      </div>

      {/* 바텀시트 컨텐츠 */}
      <div className="flex flex-col h-full">
        {/* 필터 탭 */}
        <FilterTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          nearbyCount={nearbyPlaces.length}
          favoritesCount={savedPlaces.length}
          searchRadius={searchRadius}
        />

        {/* 검색 바 (주변 탭에서만 표시) */}
        {activeTab === 'nearby' && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="러닝 플레이스 이름으로 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 러닝플레이스 목록 - 네이버 지도 스타일 스크롤 */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-gray-500 text-sm">
                주변 러닝플레이스를 찾는 중...
              </p>
            </div>
          ) : filteredPlaces.length > 0 ? (
            <div
              className="h-full overflow-y-auto"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB #F3F4F6',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 4px;
                }
                div::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 2px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #c4b5fd;
                  border-radius: 2px;
                  transition: background 0.2s ease;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #a78bfa;
                }
                div::-webkit-scrollbar-thumb:active {
                  background: #8b5cf6;
                }
              `}</style>
              <div className="space-y-0">
                {filteredPlaces.map((place, index) => (
                  <div key={place.id} className="relative">
                    <RunningPlaceCard
                      place={place}
                      onCardClick={onPlaceSelect}
                    />
                    {/* 구분선 (마지막 항목 제외) */}
                    {index < filteredPlaces.length - 1 && (
                      <div className="border-b border-gray-100/70"></div>
                    )}
                  </div>
                ))}

                {/* 하단 패딩 - 네이버 지도 스타일 */}
                <div className="h-20 bg-gradient-to-t from-gray-50/50 to-transparent"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">
                {searchQuery ? '🔍' : activeTab === 'favorites' ? '⭐' : '🏃‍♀️'}
              </div>
              <p className="text-lg font-medium mb-2">
                {searchQuery
                  ? `'${searchQuery}' 검색 결과가 없습니다`
                  : activeTab === 'favorites'
                    ? '즐겨찾기한 러닝플레이스가 없습니다'
                    : '주변에 러닝플레이스가 없습니다'}
              </p>
              <p className="text-sm text-center px-8 text-gray-400">
                {searchQuery
                  ? '다른 검색어를 시도해보세요'
                  : activeTab === 'favorites'
                    ? '마음에 드는 러닝플레이스를 저장해보세요'
                    : '다른 지역을 검색하거나 반경을 늘려보세요'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  검색어 지우기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 하단 여백 (safe area) - 네이버 지도 스타일 */}
        <div className="h-1 bg-white/80"></div>
      </div>

      {/* 배경 오버레이 (전체 화면일 때) - 개선된 스타일 */}
      {sheetHeight === 'full' && (
        <div
          className="fixed inset-0 bg-gradient-to-t from-black/30 via-black/20 to-black/10 backdrop-blur-sm z-[-1] transition-all duration-300"
          onClick={() => setSheetHeight('85%')}
        ></div>
      )}
    </div>
  );
};

export default BottomSheet;
