import React, { useState, useRef, useEffect } from 'react';
import FilterTabs from './FilterTabs';
import CafeCard from './CafeCard';

/**
 * 하단 스크롤 바텀시트 컴포넌트
 * 드래그 가능한 바텀시트와 카페 목록
 */
const BottomSheet = ({
  cafes = [],
  isOpen = true,
  onClose,
  onCafeSelect,
  onRouteClick,
  onCallClick,
  onSaveClick,
  onShareClick,
}) => {
  const [sheetHeight, setSheetHeight] = useState('50%'); // 'closed', '50%', '80%', 'full'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  const [activeTab, setActiveTab] = useState('nearby');
  const sheetRef = useRef(null);
  const handleRef = useRef(null);

  // 샘플 카페 데이터
  const sampleCafes = [
    {
      id: 1,
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
    },
    {
      id: 2,
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
    },
    {
      id: 3,
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
    },
  ];

  const getSheetStyles = () => {
    switch (sheetHeight) {
      case 'closed':
        return { height: '80px', transform: 'translateY(0)' };
      case '50%':
        return { height: '50%', transform: 'translateY(0)' };
      case '80%':
        return { height: '80%', transform: 'translateY(0)' };
      case 'full':
        return { height: '90%', transform: 'translateY(0)' };
      default:
        return { height: '50%', transform: 'translateY(0)' };
    }
  };

  const handleDragStart = e => {
    setIsDragging(true);
    setDragStartY(e.type === 'touchstart' ? e.touches[0].clientY : e.clientY);
  };

  const handleDragMove = e => {
    if (!isDragging) return;

    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY;

    // 드래그 방향에 따른 높이 조절 로직
    if (deltaY > 50 && sheetHeight !== 'closed') {
      if (sheetHeight === 'full') setSheetHeight('80%');
      else if (sheetHeight === '80%') setSheetHeight('50%');
      else if (sheetHeight === '50%') setSheetHeight('closed');
    } else if (deltaY < -50) {
      if (sheetHeight === 'closed') setSheetHeight('50%');
      else if (sheetHeight === '50%') setSheetHeight('80%');
      else if (sheetHeight === '80%') setSheetHeight('full');
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

  const filteredCafes =
    activeTab === 'favorites'
      ? sampleCafes.filter(cafe => cafe.isSaved)
      : sampleCafes;

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-40 ${
        isDragging ? 'transition-none' : ''
      }`}
      style={getSheetStyles()}
    >
      {/* 드래그 핸들 */}
      <div
        ref={handleRef}
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></div>
      </div>

      {/* 바텀시트 컨텐츠 */}
      <div className="flex flex-col h-full">
        {/* 필터 탭 */}
        <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 카페 목록 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredCafes.length > 0 ? (
            <div className="space-y-0">
              {filteredCafes.map(cafe => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  onCardClick={onCafeSelect}
                  onRouteClick={onRouteClick}
                  onCallClick={onCallClick}
                  onSaveClick={onSaveClick}
                  onShareClick={onShareClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">☕</div>
              <p className="text-lg font-medium mb-2">
                {activeTab === 'favorites'
                  ? '즐겨찾기한 카페가 없습니다'
                  : '주변에 카페가 없습니다'}
              </p>
              <p className="text-sm text-center px-8">
                {activeTab === 'favorites'
                  ? '마음에 드는 카페를 저장해보세요'
                  : '다른 지역을 검색해보세요'}
              </p>
            </div>
          )}
        </div>

        {/* 하단 여백 (safe area) */}
        <div className="h-6 bg-white"></div>
      </div>

      {/* 배경 오버레이 (전체 화면일 때) */}
      {sheetHeight === 'full' && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
          onClick={() => setSheetHeight('80%')}
        ></div>
      )}
    </div>
  );
};

export default BottomSheet;
