import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { ROUTES } from '../constants/app';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DebugInfo from '../components/DebugInfo';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithKakao, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  // 리다이렉트할 경로 (로그인 후 이동할 페이지)
  const from = location.state?.from?.pathname || ROUTES.HOME;

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // 카카오 로그인 핸들러
  const handleKakaoLogin = async () => {
    try {
      setIsKakaoLoading(true);
      clearError();

      const result = await signInWithKakao();

      if (!result.success) {
        console.error('카카오 로그인 실패:', result.error);
        // 에러는 useAuthStore에서 관리됨
      }
      // 성공 시 OAuth 리다이렉트가 발생하므로 여기서 추가 처리 불필요
    } catch (error) {
      console.error('카카오 로그인 중 오류:', error);
    } finally {
      setIsKakaoLoading(false);
    }
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <LoadingSpinner size="lg" message="로그인 확인 중..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="w-full max-w-md">
        {/* 로고 및 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl">🏃‍♀️</span>
            <span className="text-4xl ml-2">☕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Running Cafe
          </h1>
          <p className="text-gray-600">러닝과 카페를 연결하는 플랫폼</p>
        </div>

        {/* 로그인 카드 */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 text-sm">⚠️</span>
                  <span className="text-red-700 text-sm ml-2">{error}</span>
                </div>
              </div>
            )}

            {/* 카카오 로그인 버튼 */}
            <Button
              onClick={handleKakaoLogin}
              disabled={isKakaoLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isKakaoLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400 text-xs font-bold">K</span>
                  </div>
                  <span>카카오로 시작하기</span>
                </>
              )}
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 게스트 모드 */}
            <Button
              onClick={() => navigate(ROUTES.HOME)}
              variant="outline"
              className="w-full py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="mr-2">👀</span>
              둘러보기
            </Button>
          </div>
        </Card>

        {/* 하단 정보 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>로그인하면 개인화된 서비스를 이용할 수 있습니다</p>
        </div>
      </div>

      {/* 디버그 정보 (개발 환경에서만 표시) */}
      <DebugInfo />
    </div>
  );
};

export default LoginPage;
