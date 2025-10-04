import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/app';

/**
 * 앱 시작 시 표시되는 인트로 페이지
 * favicon.svg 디자인을 활용한 스플래시 스크린
 */
const IntroPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 3초 후 홈으로 이동
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 500); // fade out 애니메이션 시간
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate(ROUTES.HOME);
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* 배경 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      {/* 메인 로고 영역 */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* 로고 컨테이너 - favicon.svg 스타일 반영 */}
        <div className="relative mb-8">
          {/* 메인 로고 배경 */}
          <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            {/* 내부 그라데이션 */}
            <div className="w-28 h-28 bg-gradient-to-br from-purple-300 to-purple-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
              {/* 러닝 아이콘 */}
              <div className="text-white text-4xl font-bold relative z-10">
                🏃‍♀️
              </div>

              {/* 위치 핀 아이콘 */}
              <div className="absolute top-2 right-2 text-white text-xl">
                📍
              </div>

              {/* 반짝임 효과 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-60" />

              {/* 하이라이트 효과 */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-white/30 rounded-full blur-sm" />
            </div>

            {/* 외부 그림자 효과 */}
            <div className="absolute -inset-4 bg-purple-500/20 rounded-3xl blur-xl" />
          </div>

          {/* 펄스 애니메이션 링 */}
          <div className="absolute inset-0 rounded-3xl border-4 border-white/30 animate-ping" />
          <div className="absolute inset-2 rounded-3xl border-2 border-white/20 animate-pulse" />
        </div>

        {/* 앱 이름 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Running Cafe
          </h1>
          <p className="text-purple-100 text-lg font-medium">
            러닝과 카페의 만남
          </p>
        </div>

        {/* 서브 텍스트 */}
        <div className="text-center mb-8 px-8">
          <p className="text-purple-200 text-sm leading-relaxed">
            당신의 러닝 여정을 기록하고
            <br />
            완주 후 근처 카페에서 휴식을 취해보세요
          </p>
        </div>

        {/* 로딩 인디케이터 */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-2">
            <div
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-white to-purple-200 rounded-full animate-pulse"
            style={{
              animation: 'progress 3s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      {/* 스킵 버튼 */}
      <button
        onClick={handleSkip}
        className="absolute top-12 right-6 text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
      >
        건너뛰기
      </button>

      {/* 하단 정보 */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-purple-200/60 text-xs">
          © 2024 Running Cafe. 건강한 러닝 라이프를 시작하세요.
        </p>
      </div>

      {/* 커스텀 CSS 애니메이션 */}
      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default IntroPage;
