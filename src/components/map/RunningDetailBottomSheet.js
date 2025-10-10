import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Clock,
  TrendingUp,
  Users,
  Star,
  Phone,
  Share2,
  Heart,
} from 'lucide-react';
import { openNaverMapDirectionsFromCurrentLocation } from '../../utils/naverMapUtils';

/**
 * 러닝코스/러닝플레이스 상세 정보 바텀시트 컴포넌트
 * 드래그 가능한 바텀시트로 상세 정보를 표시
 */
const RunningDetailBottomSheet = ({
  isOpen = false,
  onClose,
  selectedItem = null,
  itemType = 'course', // 'course' | 'place'
}) => {
  const [sheetHeight, setSheetHeight] = useState('60%');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const sheetRef = useRef(null);
  const handleRef = useRef(null);

  // 바텀시트가 열릴 때 초기 높이 설정
  useEffect(() => {
    if (isOpen) {
      setSheetHeight('60%');
    }
  }, [isOpen]);

  // 저장된 상태 로드
  useEffect(() => {
    if (selectedItem) {
      const savedItems = JSON.parse(
        localStorage.getItem(
          `saved${itemType === 'course' ? 'Courses' : 'Places'}`
        ) || '[]'
      );
      setIsSaved(savedItems.some(item => item.id === selectedItem.id));
    }
  }, [selectedItem, itemType]);

  const getSheetStyles = () => {
    if (!isOpen) {
      return {
        height: '0',
        transform: 'translateY(100%)',
        borderRadius: '24px 24px 0 0',
      };
    }

    switch (sheetHeight) {
      case '30%':
        return {
          height: '30vh',
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
      default:
        return {
          height: '60vh',
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

    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // 아래로 드래그 - 축소 또는 닫기
        if (sheetHeight === '85%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('30%');
        } else if (sheetHeight === '30%') {
          onClose();
        }
        setDragStartY(currentY);
      } else if (deltaY < 0) {
        // 위로 드래그 - 확대
        if (sheetHeight === '30%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('85%');
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

  const handleSaveToggle = () => {
    if (!selectedItem) return;

    const storageKey = `saved${itemType === 'course' ? 'Courses' : 'Places'}`;
    const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (isSaved) {
      // 제거
      const updatedItems = savedItems.filter(
        item => item.id !== selectedItem.id
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      setIsSaved(false);
    } else {
      // 추가
      if (!savedItems.find(item => item.id === selectedItem.id)) {
        savedItems.push({ ...selectedItem, savedAt: Date.now() });
        localStorage.setItem(storageKey, JSON.stringify(savedItems));
        setIsSaved(true);
      }
    }
  };

  const handleShare = () => {
    if (!selectedItem) return;

    const shareData = {
      title: selectedItem.name,
      text: `${selectedItem.name} - Running Cafe에서 발견한 ${itemType === 'course' ? '러닝 코스' : '러닝 플레이스'}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`
      );
    }
  };

  const getDifficultyInfo = difficulty => {
    switch (difficulty) {
      case 'easy':
        return { text: '초급', color: 'bg-green-500', icon: '🟢' };
      case 'medium':
        return { text: '중급', color: 'bg-yellow-500', icon: '🟡' };
      case 'hard':
        return { text: '고급', color: 'bg-red-500', icon: '🔴' };
      default:
        return { text: '보통', color: 'bg-blue-500', icon: '🔵' };
    }
  };

  if (!isOpen || !selectedItem) {
    return null;
  }

  const difficultyInfo = getDifficultyInfo(selectedItem.difficulty);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] bg-white/98 backdrop-blur-lg shadow-[0_-4px_32px_rgba(0,0,0,0.12)] z-50 ${
          isDragging
            ? 'transition-none'
            : 'transition-all duration-300 ease-out'
        }`}
        style={{
          ...getSheetStyles(),
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* 드래그 핸들 */}
        <div
          ref={handleRef}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors duration-200"></div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex flex-col h-full px-4 pb-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedItem.name}
                </h2>
                {itemType === 'course' && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${difficultyInfo.color}`}
                  >
                    {difficultyInfo.text}
                  </span>
                )}
              </div>

              {selectedItem.address && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin size={14} />
                  <span>{selectedItem.address}</span>
                </div>
              )}

              {itemType === 'course' && selectedItem.distance && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span>{selectedItem.distance}</span>
                  </div>
                  {selectedItem.estimatedTime && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{selectedItem.estimatedTime}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleSaveToggle}
                className={`p-2 rounded-full transition-colors ${
                  isSaved
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 size={18} />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="flex-1 overflow-y-auto">
            {/* 기본 정보 카드 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                {itemType === 'course' ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedItem.distance || '5.2km'}
                      </div>
                      <div className="text-xs text-gray-600">총 거리</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedItem.estimatedTime || '30분'}
                      </div>
                      <div className="text-xs text-gray-600">예상 시간</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">{difficultyInfo.icon}</div>
                      <div className="text-xs text-gray-600">난이도</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedItem.elevation || '50m'}
                      </div>
                      <div className="text-xs text-gray-600">고도차</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedItem.rating || '4.5'}
                      </div>
                      <div className="text-xs text-gray-600">평점</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedItem.reviewCount || '24'}
                      </div>
                      <div className="text-xs text-gray-600">리뷰 수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">
                        {selectedItem.isOpen ? '🟢' : '🔴'}
                      </div>
                      <div className="text-xs text-gray-600">운영 상태</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedItem.distance || '0.3km'}
                      </div>
                      <div className="text-xs text-gray-600">거리</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 특징 및 편의시설 */}
            {selectedItem.features && selectedItem.features.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {itemType === 'course' ? '코스 특징' : '편의시설'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 설명 */}
            {selectedItem.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">상세 설명</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* 연락처 정보 (러닝플레이스인 경우) */}
            {itemType === 'place' && selectedItem.phone && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">연락처</h3>
                <a
                  href={`tel:${selectedItem.phone}`}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Phone size={18} />
                  <span>{selectedItem.phone}</span>
                </a>
              </div>
            )}

            {/* 운영 시간 (러닝플레이스인 경우) */}
            {itemType === 'place' && selectedItem.operatingHours && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">운영 시간</h3>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">오픈</span>
                    <span className="font-medium text-blue-900">
                      {selectedItem.operatingHours.open}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-blue-700">마감</span>
                    <span className="font-medium text-blue-900">
                      {selectedItem.operatingHours.close}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 하단 여백 */}
            <div className="h-20"></div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (selectedItem) {
                  // 네이버 지도 길찾기 열기
                  const destination = {
                    lat: selectedItem.latitude || selectedItem.lat,
                    lng: selectedItem.longitude || selectedItem.lng,
                    name:
                      selectedItem.name || selectedItem.title || '러닝 장소',
                  };
                  openNaverMapDirectionsFromCurrentLocation(destination);
                }
              }}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              길찾기
            </button>

            {itemType === 'course' && (
              <button
                onClick={() => {
                  // TODO: 러닝 시작 기능 구현
                  console.log('러닝 시작:', selectedItem);
                }}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                러닝 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RunningDetailBottomSheet;
