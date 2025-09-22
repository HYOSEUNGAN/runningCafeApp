import React from 'react';

/**
 * 로딩 스피너 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.size - 스피너 크기 ('sm', 'md', 'lg')
 * @param {string} props.color - 스피너 색상
 * @param {string} props.message - 로딩 메시지
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary-500', 
  message = '로딩 중...' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses[size]} border-4 border-${color} border-t-transparent rounded-full animate-spin`}
      ></div>
      {message && (
        <p className="mt-4 text-neutral-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
