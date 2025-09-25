import React, { useState } from 'react';

/**
 * 지도 페이지 헤더 컴포넌트
 * 네이버 지도 스타일의 필터 버튼들과 거리 선택 기능
 */
const MapHeader = ({
  onSearchFocus,
  onLocationClick,
  onFilterChange,
  onRadiusChange,
  onReSearchArea,
  selectedFilters = [],
  selectedRadius = 5,
  onZoomIn,
  onZoomOut,
  onMapTypeChange,
  currentZoom = 15,
  mapType = 'normal',
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 카페 타입 필터 옵션들
  const filterOptions = [
    { id: 'open', label: '영업중', icon: '🟢' },
    { id: 'runner-friendly', label: '러너친화 카페', icon: '🏃‍♀️' },
    { id: 'partnership', label: '제휴카페', icon: '🤝' },
    // { id: 'brunch', label: '브런치 카페', icon: '🥐' },
  ];

  // 거리 옵션들
  const radiusOptions = [
    { value: 3, label: '3k' },
    { value: 5, label: '5k' },
    { value: 10, label: '10k' },
  ];

  const handleFilterToggle = filterId => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId];

    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleRadiusChange = radius => {
    if (onRadiusChange) {
      onRadiusChange(radius);
    }
  };

  const handleReSearchClick = () => {
    if (onReSearchArea) {
      onReSearchArea();
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      {/* 상단 필터 버튼들 */}
      <div className="pt-4 px-4 pointer-events-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          {filterOptions.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleFilterToggle(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-md ${
                selectedFilters.includes(filter.id)
                  ? 'bg-blue-500 text-white shadow-blue-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-gray-200'
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 중앙 재검색 버튼 */}
      {/* <div className="px-4 pointer-events-auto">
        <div className="flex justify-center">
          <button
            onClick={handleReSearchClick}
            className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center space-x-2"
          >
            <span className="text-blue-500">🔄</span>
            <span>이 지역에서 재검색</span>
          </button>
        </div>
      </div> */}

      {/* 우측 거리 선택 버튼들 */}
      <div className="absolute top-20 right-4 pointer-events-auto">
        <div className="flex flex-col space-y-2">
          {radiusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleRadiusChange(option.value)}
              className={`w-12 h-12 rounded-full text-sm font-bold transition-all duration-200 shadow-lg ${
                selectedRadius === option.value
                  ? 'bg-blue-500 text-white shadow-blue-200 ring-2 ring-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 커스텀 지도 컨트롤 패널 */}
      <div className="absolute bottom-32 right-4 pointer-events-auto">
        <div className="flex flex-col space-y-3">
          {/* 줌 컨트롤 */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <button
              onClick={onZoomIn}
              disabled={currentZoom >= 19}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
              aria-label="확대"
            >
              <span className="text-lg font-bold text-gray-700">+</span>
            </button>
            <button
              onClick={onZoomOut}
              disabled={currentZoom <= 10}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="축소"
            >
              <span className="text-lg font-bold text-gray-700">−</span>
            </button>
          </div>

          {/* 지도 타입 변경 버튼 */}
          <button
            onClick={onMapTypeChange}
            className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 active:scale-95 group relative"
            aria-label={`지도 타입: ${mapType === 'normal' ? '일반' : mapType === 'satellite' ? '위성' : '하이브리드'}`}
          >
            <div className="relative">
              {mapType === 'normal' && <span className="text-lg">🗺️</span>}
              {mapType === 'satellite' && <span className="text-lg">🛰️</span>}
              {mapType === 'hybrid' && <span className="text-lg">🌍</span>}
            </div>
            {/* 타입 표시 툴팁 */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {mapType === 'normal'
                ? '일반'
                : mapType === 'satellite'
                  ? '위성'
                  : '하이브리드'}
            </div>
          </button>

          {/* GPS 현재위치 버튼 */}
          <button
            onClick={onLocationClick}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95 group"
            aria-label="현재 위치"
          >
            <div className="relative">
              <span className="text-lg text-white group-active:scale-110 transition-transform">
                📍
              </span>
              <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapHeader;
