import React from 'react';

/**
 * 이미지 로딩 스켈레톤 컴포넌트
 */
const ImageSkeleton = ({
  width = '100%',
  height = '320px',
  rounded = 'rounded-lg',
  className = '',
}) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ImageSkeleton;
