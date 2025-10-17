import React, { useState, useEffect } from 'react';

/**
 * 러닝 시작 전 3-2-1 카운트다운 모달 컴포넌트
 * 러닝 앱처럼 시작 전 카운트다운 효과를 제공합니다.
 */
const CountdownModal = ({
  isOpen,
  onComplete,
  onCancel,
  countFrom = 3,
  title = '러닝 시작 준비',
  subtitle = '곧 러닝이 시작됩니다!',
}) => {
  const [count, setCount] = useState(countFrom);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStart, setShowStart] = useState(false);

  // 카운트다운 로직
  useEffect(() => {
    if (!isOpen) return;

    // 초기 상태 리셋
    setCount(countFrom);
    setIsAnimating(false);
    setShowStart(false);

    const countdownInterval = setInterval(() => {
      setCount(prevCount => {
        if (prevCount > 1) {
          setIsAnimating(true);

          // 애니메이션 완료 후 다음 숫자로
          setTimeout(() => {
            setIsAnimating(false);
          }, 300);

          return prevCount - 1;
        } else {
          // 마지막 카운트 후 "START" 표시
          clearInterval(countdownInterval);
          setShowStart(true);
          setIsAnimating(true);

          // START 표시 후 완료
          setTimeout(() => {
            onComplete();
          }, 1000);

          return 0;
        }
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isOpen, countFrom, onComplete]);

  // 모달이 열리지 않았으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden relative">
        {/* 헤더 */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-center relative overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-8 h-8 border-2 border-white/30 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-2 border-white/30 rounded-full"></div>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="countdown-pattern"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-white/20"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#countdown-pattern)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="text-3xl mb-2">🏃‍♀️</div>
            <h2 className="text-white text-lg font-bold mb-1">{title}</h2>
            <p className="text-white/90 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* 카운트다운 표시 영역 */}
        <div className="p-8 text-center">
          {!showStart ? (
            <div className="relative">
              {/* 카운트다운 숫자 */}
              <div
                className={`text-8xl font-black text-purple-600 transition-all duration-300 ${
                  isAnimating
                    ? 'transform scale-110 opacity-80'
                    : 'transform scale-100 opacity-100'
                }`}
                style={{
                  textShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {count}
              </div>

              {/* 펄스 애니메이션 배경 */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  isAnimating ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="w-32 h-32 border-4 border-purple-300 rounded-full animate-ping"></div>
              </div>

              {/* 진행 바 */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${((countFrom - count) / countFrom) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-gray-500 text-sm mt-2">준비 중...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* START 텍스트 */}
              <div
                className={`text-6xl font-black text-green-600 transition-all duration-500 ${
                  isAnimating
                    ? 'transform scale-125 opacity-100'
                    : 'transform scale-100 opacity-90'
                }`}
                style={{
                  textShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                START!
              </div>

              {/* 성공 애니메이션 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-green-400 rounded-full animate-ping"></div>
              </div>

              <p className="text-green-600 text-lg font-medium mt-4 animate-pulse">
                러닝 시작! 🎉
              </p>
            </div>
          )}
        </div>

        {/* 취소 버튼 (카운트다운 중에만 표시) */}
        {!showStart && (
          <div className="px-6 pb-6">
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
          </div>
        )}

        {/* 커스텀 스타일 */}
        <style jsx>{`
          @keyframes pulse-scale {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .animate-pulse-scale {
            animation: pulse-scale 1s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CountdownModal;
