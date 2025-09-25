import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../../constants/app';
import RunningIcon from '../../assets/icons/RunningIcon';

/**
 * 홈페이지 전용 헤더 컴포넌트
 * Figma 디자인에 맞춰 검색 제외, 프로필/편성표 버튼만 포함
 */
const HomeHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleProfileClick = () => {
    if (isAuthenticated()) {
      navigate(ROUTES.PROFILE);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleScheduleClick = () => {
    // 편성표 페이지로 이동 (추후 구현)
    console.log('편성표 클릭');
  };

  return (
    <header className="bg-white px-4 pt-12 pb-4">
      {/* 상태바 공간 */}
      <div className="flex items-center justify-between h-11">
        {/* 좌측 영역 - 빈 공간 */}
        <div className="flex-1" />

        {/* 중앙 검색 영역 */}
        <div className="flex-1 px-4">
          <div className="text-center">
            <span className="text-sm font-bold text-gray-800">
              매장, 지역명으로 검색해 보세요!
            </span>
          </div>
        </div>

        {/* 우측 버튼들 */}
        <div className="flex-1 flex justify-end items-center space-x-2">
          {/* 프로필 버튼 */}
          <button
            onClick={handleProfileClick}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="프로필"
          >
            <RunningIcon size={20} gradient={false} color="#6B7280" />
          </button>

          {/* 편성표 버튼 */}
          <button
            onClick={handleScheduleClick}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="편성표"
          >
            <span className="text-xs text-gray-600">📋</span>
          </button>
        </div>
      </div>

      {/* 툴팁 (선택적 표시) */}
      <div className="mt-2 px-4">
        <div className="bg-gray-800 text-white text-xs px-4 py-2 rounded-full inline-block">
          <span>💡 팁: 러닝 후 근처 카페를 찾아보세요!</span>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
