import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 지도 페이지 헤더 컴포넌트
 * 네이버 지도 스타일의 검색창과 GPS 버튼
 */
const MapHeader = ({ onSearchFocus, onLocationClick }) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchClick = () => {
    if (onSearchFocus) {
      onSearchFocus();
    }
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pt-12 pb-4 px-4 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-sm w-full max-w-[390px] mx-auto">
      <div className="flex items-center space-x-3">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={handleBackClick}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 active:scale-95"
          aria-label="뒤로가기"
        >
          <span className="text-lg">←</span>
        </button>

        {/* 검색창 */}
        <div
          onClick={handleSearchClick}
          className="flex-1 bg-white rounded-full shadow-lg px-4 py-3 cursor-pointer hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center space-x-3">
            <span className="text-gray-400">🔍</span>
            <span className="text-gray-600 text-sm font-medium">
              {searchValue || '매장, 지역명으로 검색해 보세요!'}
            </span>
          </div>
        </div>

        {/* GPS 현재위치 버튼 */}
        <button
          onClick={handleLocationClick}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 active:scale-95 group"
          aria-label="현재 위치"
        >
          <div className="relative">
            <span className="text-lg group-active:scale-110 transition-transform">
              📍
            </span>
            {/* GPS 펄스 효과 */}
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
          </div>
        </button>
      </div>

      {/* 검색 힌트 툴팁 */}
      <div className="mt-2 ml-13">
        <div className="bg-gray-800/90 text-white text-xs px-3 py-1.5 rounded-full inline-block backdrop-blur-sm">
          <span>💡 러닝 후 휴식할 카페를 찾아보세요!</span>
        </div>
      </div>
    </header>
  );
};

export default MapHeader;
