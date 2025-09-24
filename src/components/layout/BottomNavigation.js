import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../../constants/app';

/**
 * 하단 GNB 네비게이션 컴포넌트
 * Figma 디자인에 맞춰 검색 제거, 홈/지도/마이 3개 탭만
 */
const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    {
      id: 'home',
      label: '홈',
      icon: '🏠',
      path: ROUTES.HOME,
      activeIcon: '🏠',
    },
    {
      id: 'map',
      label: '지도',
      icon: '🗺️',
      path: ROUTES.MAP,
      activeIcon: '🗺️',
    },
    {
      id: 'profile',
      label: '마이',
      icon: '👤',
      path: ROUTES.PROFILE,
      activeIcon: '👤',
    },
  ];

  const handleNavigation = item => {
    if (item.requireAuth && !isAuthenticated()) {
      // 로그인이 필요한 경우 로그인 페이지로 이동
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(item.path);
  };

  const isActive = path => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map(item => {
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-[50px] transition-colors ${
                active ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={item.label}
            >
              {/* 아이콘 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  active ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`text-lg ${
                    active ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {active ? item.activeIcon : item.icon}
                </span>
              </div>

              {/* 라벨 */}
              <span
                className={`text-xs font-bold ${
                  active ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
