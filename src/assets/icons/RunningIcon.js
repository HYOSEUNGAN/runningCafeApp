import React from 'react';

/**
 * 러닝 아이콘 컴포넌트
 * 그라데이션이 적용된 러닝하는 사람 모양의 아이콘
 */
const RunningIcon = ({
  size = 24,
  className = '',
  gradient = true,
  color = '#00BCD4', // 기본 색상 (cyan)
}) => {
  const iconSize = size;

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {gradient ? (
        <defs>
          <linearGradient
            id="runningGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#00BCD4" />
            <stop offset="100%" stopColor="#9C27B0" />
          </linearGradient>
        </defs>
      ) : null}

      {/* 러닝하는 사람 아이콘 */}
      <path
        d="M12 2C12.5 2 13 2.2 13.4 2.6C13.8 3 14 3.5 14 4C14 4.5 13.8 5 13.4 5.4C13 5.8 12.5 6 12 6C11.5 6 11 5.8 10.6 5.4C10.2 5 10 4.5 10 4C10 3.5 10.2 3 10.6 2.6C11 2.2 11.5 2 12 2Z"
        fill={gradient ? 'url(#runningGradient)' : color}
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 몸통 */}
      <path
        d="M12 6L10 10L8 12"
        fill="none"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 왼팔 (앞으로 뻗은 팔) */}
      <path
        d="M10 8L8 6L6 7"
        fill="none"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 오른팔 (뒤로 뻗은 팔) */}
      <path
        d="M10 8L12 6L14 7"
        fill="none"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 왼다리 (앞으로 뻗은 다리) */}
      <path
        d="M8 12L6 16L4 18"
        fill="none"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 오른다리 (뒤로 뻗은 다리) */}
      <path
        d="M8 12L10 16L12 18"
        fill="none"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 지면 표시 */}
      <line
        x1="2"
        y1="20"
        x2="22"
        y2="20"
        stroke={gradient ? 'url(#runningGradient)' : color}
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
};

export default RunningIcon;
