import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    {
      name: '대시보드',
      href: '/admin/dashboard',
      icon: '📊',
      current: location.pathname === '/admin/dashboard',
    },
    {
      name: '사용자 관리',
      href: '/admin/users',
      icon: '👥',
      current: location.pathname === '/admin/users',
    },
    {
      name: '러닝 코스',
      href: '/admin/courses',
      icon: '🛤️',
      current: location.pathname === '/admin/courses',
    },
    {
      name: '카페 관리',
      href: '/admin/cafes',
      icon: '☕',
      current: location.pathname === '/admin/cafes',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* 로고 */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="text-xl font-bold text-white">Running Cafe Admin</h1>
        </div>

        {/* 네비게이션 */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* 사용자 정보 및 로그아웃 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">관리자</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="로그아웃"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="pl-64">
        {/* 상단 바 */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← 사용자 사이트로 돌아가기
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
