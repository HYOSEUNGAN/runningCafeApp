import React from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 버튼 스타일 ('primary', 'secondary', 'ghost')
 * @param {string} props.size - 버튼 크기 ('sm', 'md', 'lg')
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-medium rounded-card transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-gradient text-white hover:shadow-card-hover focus:ring-primary-400',
    secondary: 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50 focus:ring-primary-400',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 focus:ring-primary-400',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          로딩 중...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
