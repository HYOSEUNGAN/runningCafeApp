import React, { memo } from 'react';

/**
 * 피드 에러 상태 컴포넌트
 * 네트워크 오류, API 오류 등 다양한 에러 상황에 대한 UI 제공
 *
 * @param {Object} props
 * @param {string} props.error - 에러 메시지
 * @param {Function} props.onRetry - 재시도 버튼 클릭 핸들러
 * @param {string} props.type - 에러 타입 ('network' | 'server' | 'unknown')
 */
const FeedErrorState = ({
  error = '알 수 없는 오류가 발생했습니다',
  onRetry,
  type = 'unknown',
}) => {
  // 에러 타입별 아이콘과 메시지
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: '📡',
          title: '네트워크 연결 오류',
          description: '인터넷 연결을 확인하고 다시 시도해주세요.',
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
        };
      case 'server':
        return {
          icon: '🔧',
          title: '서버 오류',
          description:
            '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          color: 'text-red-500',
          bgColor: 'bg-red-100',
        };
      case 'auth':
        return {
          icon: '🔐',
          title: '인증 오류',
          description: '로그인이 필요하거나 세션이 만료되었습니다.',
          color: 'text-purple-500',
          bgColor: 'bg-purple-100',
        };
      default:
        return {
          icon: '⚠️',
          title: '오류 발생',
          description: '예상치 못한 문제가 발생했습니다.',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="flex items-center justify-center min-h-64 p-4">
      <div className="text-center max-w-sm">
        {/* 에러 아이콘 */}
        <div
          className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <span className="text-2xl">{config.icon}</span>
        </div>

        {/* 에러 제목 */}
        <h3 className={`text-lg font-semibold ${config.color} mb-2`}>
          {config.title}
        </h3>

        {/* 에러 설명 */}
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {config.description}
        </p>

        {/* 상세 에러 메시지 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-500 font-mono break-all">{error}</p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              다시 시도
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            페이지 새로고침
          </button>
        </div>

        {/* 추가 도움말 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-2">문제가 계속 발생하나요?</p>
          <div className="flex justify-center space-x-4 text-xs">
            <button
              onClick={() => (window.location.href = '/')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              홈으로 이동
            </button>
            <button
              onClick={() => (window.location.href = '/contact')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FeedErrorState);
