import React, { forwardRef } from 'react';

/**
 * 재사용 가능한 입력 필드 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.label - 라벨 텍스트
 * @param {string} props.error - 에러 메시지
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {string} props.type - 입력 타입
 * @param {boolean} props.required - 필수 입력 여부
 * @param {string} props.className - 추가 CSS 클래스
 */
const Input = forwardRef(({
  label,
  error,
  placeholder,
  type = 'text',
  required = false,
  className = '',
  ...props
}, ref) => {
  const inputClasses = `
    w-full px-4 py-3 border rounded-card
    focus:border-primary-500 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:outline-none
    transition-all duration-200
    ${error ? 'border-system-error' : 'border-neutral-300'}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-system-error ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-system-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
