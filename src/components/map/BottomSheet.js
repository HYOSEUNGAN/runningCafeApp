import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import FilterTabs from './FilterTabs';
import CafeCard from './CafeCard';
import { searchNearbyCafesWithNaver } from '../../services/cafeService';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 하단 스크롤 바텀시트 컴포넌트
 * 드래그 가능한 바텀시트와 카페 목록
 */
const BottomSheet = ({
  cafes = [],
  userLocation,
  isOpen = true,
  onClose,
  onCafeSelect,
  onRouteClick,
  onCallClick,
  onSaveClick,
  onShareClick,
  selectedFilters = [],
  searchRadius = 5,
}) => {
  const [sheetHeight, setSheetHeight] = useState('10%'); // 'closed', '10%', '50%', '80%', 'full'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [activeTab, setActiveTab] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyCarfes, setNearbyCafes] = useState([]);
  const [savedCafes, setSavedCafes] = useState([]);

  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const { showToast } = useAppStore();

  // 사용자 위치 기반 카페 검색
  useEffect(() => {
    if (userLocation && activeTab === 'nearby') {
      fetchNearbyCafes();
    }
  }, [userLocation, searchRadius, selectedFilters, activeTab]);

  // 저장된 카페 목록 로드
  useEffect(() => {
    if (activeTab === 'favorites') {
      loadSavedCafes();
    }
  }, [activeTab]);

  const fetchNearbyCafes = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      const cafes = await searchNearbyCafesWithNaver(
        userLocation.lat,
        userLocation.lng,
        searchRadius * 1000, // km를 m로 변환
        '카페'
      );

      // 필터 적용
      const filteredCafes = applyFilters(cafes);
      setNearbyCafes(filteredCafes);
    } catch (error) {
      console.error('카페 검색 실패:', error);
      // 실패 시 샘플 데이터 사용
      setNearbyCafes(getSampleCafes());
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedCafes = () => {
    // 로컬 스토리지에서 저장된 카페 목록 로드
    try {
      const saved = localStorage.getItem('savedCafes');
      if (saved) {
        setSavedCafes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('저장된 카페 로드 실패:', error);
    }
  };

  const applyFilters = cafes => {
    return cafes.filter(cafe => {
      // 검색어 필터
      if (
        searchQuery &&
        !cafe.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 선택된 필터 적용
      if (selectedFilters.includes('open') && !cafe.isOpen) {
        return false;
      }

      if (
        selectedFilters.includes('runner-friendly') &&
        !cafe.tags?.some(
          tag =>
            tag.includes('러너') || tag.includes('러닝') || tag.includes('운동')
        )
      ) {
        return false;
      }

      return true;
    });
  };

  const getSampleCafes = () => [
    {
      id: 'sample_1',
      name: '러닝 후 힐링 카페',
      rating: 4.8,
      reviewCount: 24,
      distance: '0.3km',
      district: '한남동',
      isOpen: true,
      closeTime: '22:00',
      phone: '02-1234-5678',
      tags: ['러닝 후 추천', '테라스 있음', 'WiFi 무료'],
      isSaved: false,
      coordinates: { lat: 37.5665, lng: 126.978 },
    },
    {
      id: 'sample_2',
      name: '한강뷰 카페',
      rating: 4.6,
      reviewCount: 18,
      distance: '0.5km',
      district: '용산구',
      isOpen: true,
      closeTime: '21:00',
      phone: '02-2345-6789',
      tags: ['한강뷰', '러너 할인', '샤워실 근처'],
      isSaved: true,
      coordinates: { lat: 37.5665, lng: 126.979 },
    },
    {
      id: 'sample_3',
      name: '올림픽공원 카페',
      rating: 4.9,
      reviewCount: 32,
      distance: '0.8km',
      district: '송파구',
      isOpen: false,
      openTime: '07:00',
      phone: '02-3456-7890',
      tags: ['아침 일찍 오픈', '건강 메뉴', '러닝 용품 판매'],
      isSaved: false,
      coordinates: { lat: 37.5665, lng: 126.977 },
    },
  ];

  const getSheetStyles = () => {
    switch (sheetHeight) {
      case 'closed':
        return {
          height: '80px',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '10%':
        return {
          height: '10vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '50%':
        return {
          height: '50vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case '80%':
        return {
          height: '80vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      case 'full':
        return {
          height: '90vh',
          transform: 'translateY(0)',
          borderRadius: '24px 24px 0 0',
        };
      default:
        return {
          height: '10vh',
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
          setSheetHeight('80%');
        } else if (sheetHeight === '80%') {
          setSheetHeight('50%');
        } else if (sheetHeight === '50%') {
          setSheetHeight('10%');
        } else if (sheetHeight === '10%') {
          setSheetHeight('closed');
        }
        setDragStartY(currentY);
      } else if (deltaY < 0 && sheetHeight !== 'full') {
        // 위로 드래그 - 확대
        if (sheetHeight === 'closed') {
          setSheetHeight('10%');
        } else if (sheetHeight === '10%') {
          setSheetHeight('50%');
        } else if (sheetHeight === '50%') {
          setSheetHeight('80%');
        } else if (sheetHeight === '80%') {
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

  // 현재 표시할 카페 목록 결정
  const getCurrentCafes = () => {
    if (activeTab === 'favorites') {
      return savedCafes;
    }

    // 실제 데이터가 있으면 사용, 없으면 샘플 데이터
    const cafesToUse =
      nearbyCarfes.length > 0 ? nearbyCarfes : getSampleCafes();

    // 검색어 및 필터 적용
    return applyFilters(cafesToUse);
  };

  const filteredCafes = getCurrentCafes();

  // 카페 저장/해제 핸들러
  const handleSaveToggle = (cafeId, isSaved) => {
    try {
      const savedList = JSON.parse(localStorage.getItem('savedCafes') || '[]');

      if (isSaved) {
        // 저장
        const cafeToSave = filteredCafes.find(cafe => cafe.id === cafeId);
        if (cafeToSave && !savedList.find(c => c.id === cafeId)) {
          savedList.push({ ...cafeToSave, isSaved: true });
          localStorage.setItem('savedCafes', JSON.stringify(savedList));
          setSavedCafes(savedList);
        }
      } else {
        // 제거
        const updatedList = savedList.filter(cafe => cafe.id !== cafeId);
        localStorage.setItem('savedCafes', JSON.stringify(updatedList));
        setSavedCafes(updatedList);
      }

      if (onSaveClick) {
        onSaveClick(cafeId, isSaved);
      }
    } catch (error) {
      console.error('카페 저장 실패:', error);
    }
  };

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
          nearbyCount={nearbyCarfes.length || getSampleCafes().length}
          favoritesCount={savedCafes.length}
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
                placeholder="카페 이름으로 검색..."
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

        {/* 카페 목록 - 네이버 지도 스타일 스크롤 */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-500 text-sm">주변 카페를 찾는 중...</p>
            </div>
          ) : filteredCafes.length > 0 ? (
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
                {filteredCafes.map((cafe, index) => (
                  <div key={cafe.id} className="relative">
                    <CafeCard
                      cafe={cafe}
                      onCardClick={onCafeSelect}
                      onRouteClick={onRouteClick}
                      onCallClick={onCallClick}
                      onSaveClick={handleSaveToggle}
                      onShareClick={onShareClick}
                      isSaved={savedCafes.some(saved => saved.id === cafe.id)}
                    />
                    {/* 구분선 (마지막 항목 제외) */}
                    {index < filteredCafes.length - 1 && (
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
                {searchQuery ? '🔍' : activeTab === 'favorites' ? '⭐' : '☕'}
              </div>
              <p className="text-lg font-medium mb-2">
                {searchQuery
                  ? `'${searchQuery}' 검색 결과가 없습니다`
                  : activeTab === 'favorites'
                    ? '즐겨찾기한 카페가 없습니다'
                    : '주변에 카페가 없습니다'}
              </p>
              <p className="text-sm text-center px-8 text-gray-400">
                {searchQuery
                  ? '다른 검색어를 시도해보세요'
                  : activeTab === 'favorites'
                    ? '마음에 드는 카페를 저장해보세요'
                    : '다른 지역을 검색해보세요'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
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
          onClick={() => setSheetHeight('80%')}
        ></div>
      )}
    </div>
  );
};

export default BottomSheet;
