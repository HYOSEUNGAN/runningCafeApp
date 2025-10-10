import React, { memo } from 'react';
import { Camera, Plus } from 'lucide-react';

/**
 * 피드 페이지 플로팅 액션 버튼 컴포넌트
 * 카메라 촬영과 일반 글쓰기 버튼을 제공
 *
 * @param {Object} props
 * @param {Function} props.onCreatePost - 일반 글쓰기 버튼 클릭 핸들러
 * @param {Function} props.onCreateCameraPost - 카메라 글쓰기 버튼 클릭 핸들러
 * @param {boolean} props.isAuthenticated - 로그인 여부
 */
const FloatingActionButtons = ({
  onCreatePost,
  onCreateCameraPost,
  isAuthenticated = false,
}) => {
  // 로그인하지 않은 경우 버튼을 표시하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <div className="flex flex-col space-y-3">
        {/* 카메라 버튼 */}
        <button
          onClick={onCreateCameraPost}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95"
          aria-label="카메라로 포스트 작성"
        >
          <Camera size={24} />
        </button>

        {/* 일반 글쓰기 버튼 */}
        <button
          onClick={onCreatePost}
          className="w-16 h-16 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95"
          aria-label="새 포스트 작성"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};

export default memo(FloatingActionButtons);
