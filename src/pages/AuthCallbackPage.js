import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { ROUTES } from '../constants/app';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { initialize, isAuthenticated, user } = useAuthStore();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('processing');

        // Supabase가 URL 해시에서 토큰을 자동으로 처리
        // 인증 상태를 다시 초기화하여 사용자 정보 업데이트
        await initialize();

        // 잠시 대기 후 인증 상태 확인
        setTimeout(() => {
          if (isAuthenticated()) {
            setStatus('success');
            // 성공 메시지 표시 후 홈으로 이동
            setTimeout(() => {
              navigate(ROUTES.HOME, { replace: true });
            }, 1500);
          } else {
            setStatus('error');
            // 에러 시 로그인 페이지로 이동
            setTimeout(() => {
              navigate(ROUTES.LOGIN, { replace: true });
            }, 2000);
          }
        }, 1000);
      } catch (error) {
        console.error('OAuth 콜백 처리 중 오류:', error);
        setStatus('error');
        setTimeout(() => {
          navigate(ROUTES.LOGIN, { replace: true });
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [initialize, isAuthenticated, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900 mt-4">
              로그인 처리 중...
            </h2>
            <p className="text-gray-600 mt-2">잠시만 기다려주세요</p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-900">
              로그인 성공!
            </h2>
            <p className="text-gray-600 mt-2">
              {user?.user_metadata?.name || user?.email}님, 환영합니다!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              곧 메인 페이지로 이동합니다...
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900">로그인 실패</h2>
            <p className="text-gray-600 mt-2">
              로그인 처리 중 문제가 발생했습니다
            </p>
            <p className="text-sm text-gray-500 mt-1">
              로그인 페이지로 돌아갑니다...
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="text-center">{renderContent()}</div>
    </div>
  );
};

export default AuthCallbackPage;
