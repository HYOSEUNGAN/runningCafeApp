import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../../constants/app';

// 아이콘 컴포넌트 import
import HomeIcon from '../../assets/icons/HomeIcon';
import RecordIcon from '../../assets/icons/RecordIcon';
import MapIcon from '../../assets/icons/MapIcon';
import FeedIcon from '../../assets/icons/FeedIcon';
import ProfileIcon from '../../assets/icons/ProfileIcon';

/**
 * 하단 GNB 네비게이션 컴포넌트
 * 홈/기록/지도/피드/마이 5개 탭
 */
const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    {
      id: 'home',
      label: '홈',
      path: ROUTES.HOME,
      Icon: HomeIcon,
    },
    {
      id: 'record',
      label: '기록',
      path: ROUTES.RECORD,
      Icon: RecordIcon,
      requireAuth: true,
    },
    {
      id: 'map',
      label: '지도',
      path: ROUTES.MAP,
      Icon: MapIcon,
    },
    {
      id: 'feed',
      label: '피드',
      path: ROUTES.FEED,
      Icon: FeedIcon,
    },
    {
      id: 'profile',
      label: '마이',
      path: ROUTES.PROFILE,
      Icon: ProfileIcon,
      requireAuth: true,
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
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const active = isActive(item.path);
          const { Icon } = item;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`mobile-nav-item min-w-[60px] ${
                active ? 'active' : ''
              }`}
              aria-label={item.label}
            >
              {/* 아이콘 */}
              <div className="flex items-center justify-center">
                <Icon
                  size={22}
                  color={active ? '#a259ff' : '#9ca3af'}
                  filled={active}
                />
              </div>

              {/* 라벨 */}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
