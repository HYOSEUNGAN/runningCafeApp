import React from 'react';

/**
 * 재사용 가능한 카드 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.hoverable - 호버 효과 여부
 * @param {function} props.onClick - 클릭 핸들러
 */
const Card = ({ 
  children, 
  className = '', 
  hoverable = false, 
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-card shadow-card p-6 transition-shadow duration-200';
  const hoverClasses = hoverable ? 'hover:shadow-card-hover cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
