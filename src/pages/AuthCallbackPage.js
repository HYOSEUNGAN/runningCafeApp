import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { ROUTES } from '../constants/app';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { createOrUpdateUserProfile } from '../services/userProfileService';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { initialize, isAuthenticated, user, userProfile, setUserProfile } =
    useAuthStore();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [profileStatus, setProfileStatus] = useState('checking'); // checking, created, failed

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('processing');

        // URL에서 토큰 정보 확인
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          // 토큰이 있으면 Supabase가 자동으로 처리할 때까지 대기
          // 인증 상태를 다시 초기화하여 사용자 정보 업데이트
          await initialize();

          // 인증 및 프로필 생성 완료 대기
          const checkAuthAndProfile = async () => {
            if (isAuthenticated() && user) {
              setStatus('success');

              try {
                // 카카오 로그인인 경우 프로필 생성/업데이트
                if (user.app_metadata?.provider === 'kakao') {
                  console.log('카카오 로그인 감지, 프로필 생성 중...');

                  const userData = {
                    id: user.id,
                    email: user.email || '',
                    name:
                      user.user_metadata?.name ||
                      user.user_metadata?.full_name ||
                      user.user_metadata?.nickname ||
                      '카카오 사용자',
                    avatar_url:
                      user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture ||
                      '',
                    provider: 'kakao',
                  };

                  const profileResult =
                    await createOrUpdateUserProfile(userData);

                  if (profileResult.success) {
                    setUserProfile(profileResult.data);
                    setProfileStatus('created');
                    console.log(
                      '카카오 사용자 프로필 생성/업데이트 완료:',
                      profileResult.data
                    );
                  } else {
                    setProfileStatus('failed');
                    console.error('프로필 생성 실패:', profileResult.error);
                  }
                } else {
                  // 기존 프로필이 있는지 확인
                  if (userProfile) {
                    setProfileStatus('created');
                  } else {
                    setProfileStatus('failed');
                  }
                }
              } catch (error) {
                console.error('프로필 처리 중 오류:', error);
                setProfileStatus('failed');
              }

              // URL 해시 제거 (보안을 위해)
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );

              // 성공 메시지 표시 후 홈으로 이동
              setTimeout(() => {
                navigate(ROUTES.HOME, { replace: true });
              }, 3000);
            } else {
              setStatus('error');
              setTimeout(() => {
                navigate(ROUTES.LOGIN, { replace: true });
              }, 2000);
            }
          };

          // 1.5초 후 첫 번째 확인, 인증이 안되어 있으면 추가 대기
          setTimeout(() => {
            if (isAuthenticated()) {
              checkAuthAndProfile();
            } else {
              // 추가 1초 대기 후 재확인
              setTimeout(checkAuthAndProfile, 1000);
            }
          }, 1500);
        } else {
          setStatus('error');
          setTimeout(() => {
            navigate(ROUTES.LOGIN, { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 중 오류:', error);
        setStatus('error');
        setTimeout(() => {
          navigate(ROUTES.LOGIN, { replace: true });
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [initialize, isAuthenticated, navigate, userProfile]);

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
              {userProfile?.name || user?.user_metadata?.name || user?.email}님,
              환영합니다!
            </p>

            {/* 프로필 생성 상태 표시 */}
            {profileStatus === 'created' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ 프로필이 성공적으로 생성되었습니다
                </p>
              </div>
            )}

            {profileStatus === 'failed' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ 프로필 생성에 실패했지만 로그인은 성공했습니다
                </p>
              </div>
            )}

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
