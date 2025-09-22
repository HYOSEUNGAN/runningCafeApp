import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/**
 * 프로필 페이지 컴포넌트 - 사용자 정보 및 러닝 통계
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleNavigate = path => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast({
        type: 'success',
        message: '로그아웃되었습니다.',
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      showToast({
        type: 'error',
        message: '로그아웃 중 오류가 발생했습니다.',
      });
    }
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-20">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-neutral-500">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-neutral-600">
              Running Cafe의 모든 기능을 이용하려면 로그인해주세요
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              로그인
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate(ROUTES.SIGNUP)}
            >
              회원가입
            </Button>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 safe-area-bottom">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button
              onClick={() => handleNavigate(ROUTES.HOME)}
              className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
            >
              <span className="text-xl">🏠</span>
              <span className="text-xs font-medium">홈</span>
            </button>
            <button
              onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
              className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
            >
              <span className="text-xl">🏃‍♀️</span>
              <span className="text-xs font-medium">러닝</span>
            </button>
            <button
              onClick={() => handleNavigate(ROUTES.MAP)}
              className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
            >
              <span className="text-xl">🗺️</span>
              <span className="text-xs font-medium">맵</span>
            </button>
            <button
              onClick={() => handleNavigate(ROUTES.CAFES)}
              className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
            >
              <span className="text-xl">☕</span>
              <span className="text-xs font-medium">카페</span>
            </button>
            <button
              onClick={() => handleNavigate(ROUTES.PROFILE)}
              className="flex flex-col items-center space-y-1 text-primary-500 touch-button"
            >
              <span className="text-xl">👤</span>
              <span className="text-xs font-medium">프로필</span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  // 모의 데이터
  const userStats = {
    totalDistance: 127.5,
    totalRuns: 24,
    totalTime: 1020, // minutes
    averagePace: '6:30',
    favoriteRoutes: 5,
    visitedCafes: 12,
  };

  const recentActivities = [
    {
      id: 1,
      type: 'running',
      title: '한강 러닝 코스',
      distance: '5.2km',
      time: '32분',
      date: '2024-01-20',
      pace: '6:15/km',
    },
    {
      id: 2,
      type: 'cafe',
      title: '러너스 카페',
      description: '러닝 후 휴식',
      date: '2024-01-20',
      rating: 4.5,
    },
    {
      id: 3,
      type: 'running',
      title: '올림픽공원 코스',
      distance: '3.8km',
      time: '28분',
      date: '2024-01-19',
      pace: '7:20/km',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">프로필</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="touch-button text-primary-500 hover:text-primary-600 transition-colors"
          >
            <span className="text-lg">{isEditing ? '✓' : '✏️'}</span>
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* 프로필 카드 */}
        <Card>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-primary-gradient rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">🏃‍♀️</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral-900 mb-1">
                {user?.email?.split('@')[0] || 'Runner'}
              </h2>
              <p className="text-sm text-neutral-600 mb-2">
                {user?.email || 'runner@example.com'}
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  러닝 레벨 3
                </span>
                <span className="text-xs bg-secondary-mint bg-opacity-20 text-secondary-mint px-2 py-1 rounded-full">
                  활동적인 러너
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <input
                type="text"
                placeholder="닉네임"
                className="input-field"
                defaultValue={user?.email?.split('@')[0] || ''}
              />
              <textarea
                placeholder="자기소개"
                className="input-field resize-none"
                rows="3"
                defaultValue="러닝과 카페를 사랑하는 러너입니다 ☕🏃‍♀️"
              />
            </div>
          )}
        </Card>

        {/* 통계 카드 */}
        <Card>
          <h3 className="text-lg font-bold text-neutral-900 mb-4">러닝 통계</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500 mb-1">
                {userStats.totalDistance}km
              </div>
              <div className="text-xs text-neutral-600">총 거리</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-orange mb-1">
                {userStats.totalRuns}
              </div>
              <div className="text-xs text-neutral-600">총 러닝 횟수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-mint mb-1">
                {Math.floor(userStats.totalTime / 60)}h{' '}
                {userStats.totalTime % 60}m
              </div>
              <div className="text-xs text-neutral-600">총 시간</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-neutral-700 mb-1">
                {userStats.averagePace}
              </div>
              <div className="text-xs text-neutral-600">평균 페이스</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-neutral-700 mb-1">
                {userStats.favoriteRoutes}
              </div>
              <div className="text-xs text-neutral-600">즐겨찾는 코스</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-neutral-700 mb-1">
                {userStats.visitedCafes}
              </div>
              <div className="text-xs text-neutral-600">방문한 카페</div>
            </div>
          </div>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">최근 활동</h3>
            <button className="text-sm text-primary-500 hover:text-primary-600 transition-colors">
              전체보기
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map(activity => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">
                    {activity.type === 'running' ? '🏃‍♀️' : '☕'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate">
                    {activity.title}
                  </h4>
                  {activity.type === 'running' ? (
                    <p className="text-xs text-neutral-600">
                      {activity.distance} • {activity.time} • {activity.pace}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-600">
                      {activity.description} • ⭐ {activity.rating}
                    </p>
                  )}
                </div>
                <div className="text-xs text-neutral-500 flex-shrink-0">
                  {activity.date}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 설정 및 기타 */}
        <Card>
          <h3 className="text-lg font-bold text-neutral-900 mb-4">설정</h3>
          <div className="space-y-3">
            <button className="flex items-center justify-between w-full py-3 text-left hover:bg-neutral-50 rounded-lg px-3 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🎯</span>
                <span className="text-neutral-900">목표 설정</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>

            <button className="flex items-center justify-between w-full py-3 text-left hover:bg-neutral-50 rounded-lg px-3 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🔔</span>
                <span className="text-neutral-900">알림 설정</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>

            <button className="flex items-center justify-between w-full py-3 text-left hover:bg-neutral-50 rounded-lg px-3 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🔒</span>
                <span className="text-neutral-900">개인정보 설정</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>

            <button className="flex items-center justify-between w-full py-3 text-left hover:bg-neutral-50 rounded-lg px-3 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">❓</span>
                <span className="text-neutral-900">도움말</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>
          </div>
        </Card>

        {/* 로그아웃 버튼 */}
        <div className="pt-4">
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 safe-area-bottom">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={() => handleNavigate(ROUTES.HOME)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">홈</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">🏃‍♀️</span>
            <span className="text-xs font-medium">러닝</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.MAP)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-xs font-medium">맵</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.CAFES)}
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">☕</span>
            <span className="text-xs font-medium">카페</span>
          </button>
          <button
            onClick={() => handleNavigate(ROUTES.PROFILE)}
            className="flex flex-col items-center space-y-1 text-primary-500 touch-button"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">프로필</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ProfilePage;
