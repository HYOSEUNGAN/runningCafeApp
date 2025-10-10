import React, { memo } from 'react';

/**
 * 피드가 비어있을 때 표시하는 컴포넌트
 *
 * @param {Object} props
 * @param {Function} props.onStartRunning - 러닝 시작 버튼 클릭 핸들러
 * @param {boolean} props.isAuthenticated - 로그인 여부
 */
const EmptyFeedState = ({ onStartRunning, isAuthenticated = false }) => {
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">📱</span>
          </div>
          <p className="text-gray-500 mb-4">
            로그인하면 다른 러너들의 기록을 볼 수 있어요
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-gray-400">🏃‍♂️</span>
        </div>
        <p className="text-gray-500 mb-4">
          아직 피드에 게시된 러닝 기록이 없어요
        </p>
        <button
          onClick={onStartRunning}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          첫 러닝 시작하기
        </button>
      </div>
    </div>
  );
};

export default memo(EmptyFeedState);
