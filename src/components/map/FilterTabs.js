import React, { useState } from 'react';

/**
 * 지도 필터 탭 컴포넌트 (모바일 최적화 + 보라색 테마)
 * "주변 5km", "즐겨찾기" 탭 전환 및 카테고리 필터
 */
const FilterTabs = ({
  onTabChange,
  activeTab = 'nearby',
  nearbyCount = 0,
  favoritesCount = 0,
  searchRadius = 5,
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedRadius, setSelectedRadius] = useState(searchRadius);

  // activeTab이 변경되면 selectedTab도 업데이트
  React.useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const tabs = [
    {
      id: 'nearby',
      label: `주변 ${selectedRadius}km`,
      icon: '📍',
      count: nearbyCount,
    },
    {
      id: 'favorites',
      label: '즐겨찾기',
      icon: '⭐',
      count: favoritesCount,
    },
  ];

  // 카테고리 필터 (모바일 최적화)
  const categoryFilters = [
    { id: 'open', label: '영업중', icon: '🟢' },
    { id: 'runner-friendly', label: '러너친화', icon: '🏃‍♀️' },
    { id: 'partnership', label: '제휴카페', icon: '🤝' },
  ];

  // 거리 필터 (모바일 최적화)
  const radiusOptions = [
    { value: 3, label: '3km' },
    { value: 5, label: '5km' },
    { value: 10, label: '10km' },
  ];

  const handleTabClick = tabId => {
    setSelectedTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleFilterToggle = filterId => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId];
    setSelectedFilters(newFilters);
  };

  const handleRadiusChange = radius => {
    setSelectedRadius(radius);
  };

  return (
    <div className="px-3 py-2 space-y-3">
      {/* 메인 탭 */}
      <div className="flex space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 relative px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 ${
              selectedTab === tab.id
                ? 'bg-purple-100 text-purple-800 shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-sm">{tab.icon}</span>
              <span className="text-xs font-semibold">{tab.label}</span>
              <div
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedTab === tab.id
                    ? 'bg-white text-purple-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </div>
            </div>
            {selectedTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-purple-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* 주변 탭일 때만 필터 표시 */}
      {selectedTab === 'nearby' && (
        <div className="space-y-2">
          {/* 거리 필터 */}
          <div className="flex space-x-1.5">
            {radiusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleRadiusChange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedRadius === option.value
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex space-x-1.5">
            {categoryFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleFilterToggle(filter.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                  selectedFilters.includes(filter.id)
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xs">{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTabs;
