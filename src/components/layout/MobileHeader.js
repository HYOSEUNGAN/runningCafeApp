import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../../constants/app';

/**
 * 모바일 앱 스타일의 새로운 헤더 컴포넌트
 * 러닝 테마에 맞춘 트렌디한 디자인
 */
const MobileHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleProfileClick = () => {
    if (isAuthenticated()) {
      navigate(ROUTES.PROFILE);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleLogoClick = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {/* 상태바 배경 */}
      <div className="h-12 bg-gradient-to-r from-purple-600 to-indigo-600" />

      {/* 메인 헤더 */}
      <header className="bg-white shadow-sm relative">
        {/* 그라데이션 상단 라인 */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 좌측 로고 영역 */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              {/* 미니 로고 */}
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg">🏃‍♀️</span>
              </div>

              {/* 앱 이름 */}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  Running Cafe
                </h1>
                <p className="text-xs text-purple-600 font-medium -mt-1">
                  러닝과 카페의 만남
                </p>
              </div>
            </button>

            {/* 우측 프로필 영역 */}
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-2 transition-colors"
            >
              {isAuthenticated() && user ? (
                <>
                  {/* 사용자 아바타 */}
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.user_metadata?.full_name?.charAt(0) ||
                      user.email?.charAt(0) ||
                      '👤'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.user_metadata?.full_name || '사용자'}
                  </span>
                </>
              ) : (
                <>
                  {/* 로그인 버튼 */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">👤</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    로그인
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 검색 바 (선택적) */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="매장, 지역명으로 검색해 보세요!"
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
            </div>
          </div>

          {/* 퀵 액션 버튼들 */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(ROUTES.NAVIGATION)}
                className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              >
                <span>🏃‍♀️</span>
                <span>러닝 시작</span>
              </button>

              <button
                onClick={() => navigate(ROUTES.MAP)}
                className="flex items-center space-x-1 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              >
                <span>☕</span>
                <span>카페 찾기</span>
              </button>
            </div>

            {/* 알림 버튼 */}
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="text-gray-600 text-lg">🔔</span>
              {/* 알림 배지 */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </button>
          </div>
        </div>

        {/* 하단 그라데이션 라인 */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
      </header>
    </>
  );
};

export default MobileHeader;
