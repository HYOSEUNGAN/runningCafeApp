import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BottomNavigation from '../components/layout/BottomNavigation';
import ProfileHeader from '../components/layout/ProfileHeader';

/**
 * 프로필 페이지 컴포넌트 - 사용자 정보 및 러닝 통계
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

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

  // 로그인 상태 확인
  const isLoggedIn = isAuthenticated();

  // 사용자 데이터 (로그인 상태에 따라 다름)
  const userStats = isLoggedIn
    ? {
        totalDistance: 127.5,
        totalRuns: 24,
        totalTime: 1020, // minutes
        averagePace: '6:30',
        favoriteRoutes: 5,
        visitedCafes: 12,
      }
    : {
        totalDistance: 0,
        totalRuns: 0,
        totalTime: 0,
        averagePace: '0:00',
        favoriteRoutes: 0,
        visitedCafes: 0,
      };

  const recentActivities = isLoggedIn
    ? [
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
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <ProfileHeader
        title="프로필"
        showEditButton={isLoggedIn}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <div className="px-6 py-6 space-y-6">
        {/* 프로필 카드 */}
        <Card>
          <div className="relative overflow-hidden">
            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-primary-gradient opacity-10 rounded-t-card"></div>

            <div className="relative flex items-center space-x-4 mb-6 pt-4">
              <div className="w-20 h-20 bg-primary-gradient rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">🏃‍♀️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {isLoggedIn
                    ? user?.email?.split('@')[0] || 'Runner'
                    : '게스트'}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  {isLoggedIn
                    ? user?.email || 'runner@example.com'
                    : '로그인하여 더 많은 기능을 이용해보세요'}
                </p>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {isLoggedIn ? (
                    <>
                      <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                        러닝 레벨 3
                      </span>
                      <span className="text-xs bg-secondary-mint bg-opacity-20 text-secondary-mint px-3 py-1 rounded-full font-medium">
                        활동적인 러너
                      </span>
                    </>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      게스트 사용자
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isLoggedIn && isEditing && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
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

          {!isLoggedIn && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  로그인
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(ROUTES.SIGNUP)}
                >
                  회원가입
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 통계 카드 */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">러닝 통계</h3>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div className="text-2xl font-bold text-primary-500 mb-1">
                {userStats.totalDistance}km
              </div>
              <div className="text-xs text-gray-600 font-medium">총 거리</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-2xl font-bold text-secondary-orange mb-1">
                {userStats.totalRuns}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                총 러닝 횟수
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-2xl font-bold text-secondary-mint mb-1">
                {Math.floor(userStats.totalTime / 60)}h{' '}
                {userStats.totalTime % 60}m
              </div>
              <div className="text-xs text-gray-600 font-medium">총 시간</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {userStats.averagePace}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                평균 페이스
              </div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {userStats.favoriteRoutes}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                즐겨찾는 코스
              </div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {userStats.visitedCafes}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                방문한 카페
              </div>
            </div>
          </div>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">최근 활동</h3>
            <button className="text-sm text-primary-500 hover:text-primary-600 transition-colors">
              전체보기
            </button>
          </div>

          <div className="space-y-3">
            {isLoggedIn ? (
              recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'running'
                        ? 'bg-primary-gradient'
                        : 'bg-gradient-to-r from-orange-400 to-orange-500'
                    }`}
                  >
                    <span className="text-white text-lg">
                      {activity.type === 'running' ? '🏃‍♀️' : '☕'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate mb-1">
                      {activity.title}
                    </h4>
                    {activity.type === 'running' ? (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{activity.distance}</span>{' '}
                        •<span className="font-medium">{activity.time}</span> •
                        <span className="text-primary-600">
                          {activity.pace}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">
                        {activity.description} •
                        <span className="text-orange-500 font-medium">
                          ⭐ {activity.rating}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 font-medium">
                    {activity.date}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">📊</span>
                </div>
                <p className="text-gray-500 mb-4">
                  로그인하면 최근 러닝 활동과 카페 방문 기록을 볼 수 있어요
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  로그인하고 기록 보기
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 설정 및 기타 */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">설정</h3>
          <div className="space-y-2">
            <button className="flex items-center justify-between w-full py-4 text-left hover:bg-gray-50 rounded-lg px-4 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">목표 설정</span>
                  <p className="text-xs text-gray-500">
                    월간 러닝 목표와 거리 설정
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                ›
              </span>
            </button>

            <button className="flex items-center justify-between w-full py-4 text-left hover:bg-gray-50 rounded-lg px-4 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔔</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">알림 설정</span>
                  <p className="text-xs text-gray-500">
                    러닝 알림 및 카페 추천 설정
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                ›
              </span>
            </button>

            <button className="flex items-center justify-between w-full py-4 text-left hover:bg-gray-50 rounded-lg px-4 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">
                    개인정보 설정
                  </span>
                  <p className="text-xs text-gray-500">
                    프로필 공개 범위 및 개인정보
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                ›
              </span>
            </button>

            <button className="flex items-center justify-between w-full py-4 text-left hover:bg-gray-50 rounded-lg px-4 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">❓</span>
                </div>
                <div>
                  <span className="text-gray-900 font-medium">도움말</span>
                  <p className="text-xs text-gray-500">
                    자주 묻는 질문 및 고객 지원
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                ›
              </span>
            </button>
          </div>
        </Card>

        {/* 로그아웃 버튼 */}
        {isLoggedIn && (
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
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
