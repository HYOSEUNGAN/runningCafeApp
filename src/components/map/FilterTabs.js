import React, { useState } from 'react';

/**
 * 지도 필터 탭 컴포넌트
 * "주변 10km", "즐겨찾기" 탭 전환
 */
const FilterTabs = ({ onTabChange, activeTab = 'nearby' }) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  const tabs = [
    {
      id: 'nearby',
      label: '주변 10Km',
      icon: '📍',
      count: 24,
    },
    {
      id: 'favorites',
      label: '즐겨찾기',
      icon: '⭐',
      count: 8,
    },
  ];

  const handleTabClick = tabId => {
    setSelectedTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="flex space-x-2 px-4 py-3">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 ${
            selectedTab === tab.id
              ? 'bg-gray-200 text-gray-800 shadow-sm'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {/* 탭 컨텐츠 */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>

            {/* 카운트 배지 */}
            <div
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedTab === tab.id
                  ? 'bg-white text-gray-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {tab.count}
            </div>

            {/* 드롭다운 아이콘 (주변 탭만) */}
            {tab.id === 'nearby' && (
              <span
                className={`text-xs transition-transform duration-200 ${
                  selectedTab === tab.id ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            )}
          </div>

          {/* 활성 탭 인디케이터 */}
          {selectedTab === tab.id && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>
          )}

          {/* 호버 효과 */}
          <div
            className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
              selectedTab === tab.id
                ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5'
                : 'hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-purple-500/5 opacity-0 hover:opacity-100'
            }`}
          ></div>
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
