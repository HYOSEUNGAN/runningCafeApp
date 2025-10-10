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

  // 카페 타입 필터 옵션들 (러닝앱 스타일)
  const filterOptions = [
    // { id: 'open', label: '영업중', icon: '🟢', color: 'bg-green-500' },
    // {
    //   id: 'runner-friendly',
    //   label: '러너친화',
    //   icon: '🏃‍♀️',
    //   color: 'bg-purple-500',
    // },
    // {
    //   id: 'partnership',
    //   label: '제휴카페',
    //   icon: '🤝',
    //   color: 'bg-orange-500',
    // },
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
      {/* 상단 필터 버튼들 - 러닝앱 스타일 */}
      <div className="pt-safe-top pt-4 px-4 pointer-events-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          {filterOptions.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleFilterToggle(filter.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 shadow-md backdrop-blur-sm border ${
                selectedFilters.includes(filter.id)
                  ? `bg-purple-500 text-white shadow-lg border-transparent transform scale-105`
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-lg border-gray-200/50 hover:scale-105'
              } active:scale-95`}
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

      {/* 우측 거리 선택 버튼들 - 러닝앱 스타일 */}
      <div className="absolute top-20 right-4 pointer-events-auto">
        <div className="flex flex-col space-y-2">
          {radiusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleRadiusChange(option.value)}
              className={`w-11 h-11 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg backdrop-blur-sm border ${
                selectedRadius === option.value
                  ? 'bg-purple-500 text-white shadow-purple-200 ring-2 ring-purple-300 transform scale-110'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-xl border-gray-200/50 hover:scale-105'
              } active:scale-95`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 커스텀 지도 컨트롤 패널 - 러닝앱 스타일 */}
      <div className="absolute bottom-32 right-4 pointer-events-auto">
        <div className="flex flex-col space-y-3">
          {/* 줌 컨트롤 */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
            <button
              onClick={onZoomIn}
              disabled={currentZoom >= 19}
              className="w-11 h-11 flex items-center justify-center hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 group"
              aria-label="확대"
            >
              <span className="text-lg font-bold text-gray-700 group-hover:text-purple-600 group-active:scale-110 transition-all">
                +
              </span>
            </button>
            <button
              onClick={onZoomOut}
              disabled={currentZoom <= 10}
              className="w-11 h-11 flex items-center justify-center hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="축소"
            >
              <span className="text-lg font-bold text-gray-700 group-hover:text-purple-600 group-active:scale-110 transition-all">
                −
              </span>
            </button>
          </div>

          {/* 지도 타입 변경 버튼 */}
          <button
            onClick={onMapTypeChange}
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 flex items-center justify-center hover:bg-purple-50 transition-all duration-300 active:scale-95 group relative"
            aria-label={`지도 타입: ${mapType === 'normal' ? '일반' : mapType === 'satellite' ? '위성' : '하이브리드'}`}
          >
            <div className="relative group-active:scale-110 transition-transform">
              {mapType === 'normal' && <span className="text-lg">🗺️</span>}
              {mapType === 'satellite' && <span className="text-lg">🛰️</span>}
              {mapType === 'hybrid' && <span className="text-lg">🌍</span>}
            </div>
            {/* 타입 표시 툴팁 */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              {mapType === 'normal'
                ? '일반'
                : mapType === 'satellite'
                  ? '위성'
                  : '하이브리드'}
            </div>
          </button>

          {/* GPS 현재위치 버튼 - 러닝앱 스타일 */}
          <button
            onClick={onLocationClick}
            className="w-11 h-11 bg-purple-500 rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 active:scale-95 group relative overflow-hidden"
            aria-label="현재 위치"
          >
            <div className="relative z-10">
              <span className="text-lg text-white group-active:scale-110 transition-transform">
                📍
              </span>
            </div>
            {/* 애니메이션 효과 */}
            <div className="absolute inset-0 rounded-xl bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-xl bg-white opacity-20 animate-pulse"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapHeader;
