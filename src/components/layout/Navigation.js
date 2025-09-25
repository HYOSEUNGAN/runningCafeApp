import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { ROUTES } from '../../constants/app';
import Button from '../ui/Button';

/**
 * 네비게이션 컴포넌트
 */
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { showToast } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      showToast({
        type: 'success',
        message: '로그아웃되었습니다.',
      });
      navigate(ROUTES.HOME);
    } else {
      showToast({
        type: 'error',
        message: '로그아웃 중 오류가 발생했습니다.',
      });
    }
  };

  const navItems = [
    { path: ROUTES.HOME, label: '홈' },
    { path: ROUTES.RUNNING_COURSES, label: '러닝 코스' },
    { path: ROUTES.NAV, label: '러닝 네비' },
    { path: ROUTES.CAFES, label: '카페' },
    ...(isAuthenticated()
      ? [{ path: ROUTES.MY_RECORDS, label: '내 기록' }]
      : []),
  ];

  return (
    <nav className="bg-white shadow-card sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <span className="text-2xl">🏃‍♀️☕</span>
            <span className="text-h4 font-bold text-gradient">
              Running Cafe
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-body font-medium transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'text-primary-500'
                    : 'text-neutral-600 hover:text-primary-500'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* 사용자 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated() ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={ROUTES.PROFILE}
                  className="text-body text-neutral-600 hover:text-primary-500"
                >
                  {user?.email}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link to={ROUTES.SIGNUP}>
                  <Button variant="primary" size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-neutral-600"></div>
              <div className="w-full h-0.5 bg-neutral-600"></div>
              <div className="w-full h-0.5 bg-neutral-600"></div>
            </div>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="space-y-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block text-body font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'text-primary-500'
                      : 'text-neutral-600 hover:text-primary-500'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated() ? (
                <div className="space-y-2 pt-4 border-t border-neutral-200">
                  <Link
                    to={ROUTES.PROFILE}
                    className="block text-body text-neutral-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {user?.email}
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-neutral-200">
                  <Link to={ROUTES.LOGIN} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      로그인
                    </Button>
                  </Link>
                  <Link to={ROUTES.SIGNUP} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
