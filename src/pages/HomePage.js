import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/**
 * 메인 홈페이지 컴포넌트
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  const handleNavigate = path => {
    if (path === ROUTES.PROFILE && !isAuthenticated()) {
      showToast({
        type: 'warning',
        message: '로그인이 필요한 서비스입니다.',
      });
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* 헤더 섹션 - 모바일 최적화 */}
      <header className="bg-primary-gradient text-white px-6 pt-12 pb-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Running Cafe</h1>
          <p className="text-lg md:text-xl mb-6 opacity-90">
            러닝과 카페를 연결하는 특별한 경험
          </p>
          <p className="text-sm md:text-base mb-8 opacity-80 leading-relaxed">
            새로운 러닝 코스를 발견하고, 완주 후 근처 카페에서 여유로운 시간을
            보내세요
          </p>

          {isAuthenticated() ? (
            <div className="space-y-3">
              <p className="text-base md:text-lg">
                안녕하세요, <span className="font-semibold">{user?.email}</span>
                님! 👋
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="w-full max-w-xs"
                onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
              >
                러닝 시작하기
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 max-w-xs"
                onClick={() => handleNavigate(ROUTES.LOGIN)}
              >
                로그인
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 max-w-xs"
                onClick={() => handleNavigate(ROUTES.SIGNUP)}
              >
                회원가입
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* 메인 기능 섹션 - 모바일 최적화 */}
      <main className="px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
            Running Cafe와 함께하는 특별한 경험
          </h2>
          <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
            건강한 러닝 라이프와 카페 문화를 동시에 즐겨보세요
          </p>
        </div>

        {/* 기능 카드들 - 모바일 세로 배치 */}
        <div className="space-y-4 mb-8">
          <Card
            hoverable
            onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-gradient rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🏃‍♀️</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  러닝 코스 찾기
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  다양한 난이도의 러닝 코스를 발견하고 도전해보세요
                </p>
              </div>
            </div>
          </Card>

          <Card hoverable onClick={() => handleNavigate(ROUTES.CAFES)}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary-orange rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">☕</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  주변 카페 탐색
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  러닝 후 휴식을 취할 수 있는 근처 카페를 찾아보세요
                </p>
              </div>
            </div>
          </Card>

          <Card hoverable onClick={() => handleNavigate(ROUTES.MY_RECORDS)}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary-mint rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  기록 관리
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  러닝 기록을 관리하고 성장하는 모습을 확인하세요
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA 섹션 - 모바일 최적화 */}
        <div className="bg-white rounded-card shadow-card p-6 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-3">
            지금 시작해보세요!
          </h3>
          <p className="text-sm md:text-base text-neutral-600 mb-6 leading-relaxed">
            Running Cafe와 함께 새로운 러닝 경험을 만들어보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => handleNavigate(ROUTES.RUNNING_COURSES)}
            >
              러닝 코스 둘러보기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => handleNavigate(ROUTES.CAFES)}
            >
              카페 찾아보기
            </Button>
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 - 모바일 고정 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 safe-area-bottom">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={() => handleNavigate('/')}
            className="flex flex-col items-center space-y-1 text-primary-500 touch-button"
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
            className="flex flex-col items-center space-y-1 text-neutral-500 touch-button hover:text-neutral-700 transition-colors"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">프로필</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default HomePage;
