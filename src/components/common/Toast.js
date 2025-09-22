import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 토스트 메시지 컴포넌트
 */
const Toast = () => {
  const { toast, hideToast } = useAppStore();

  if (!toast) return null;

  const typeClasses = {
    success: 'bg-system-success text-white',
    error: 'bg-system-error text-white',
    warning: 'bg-system-warning text-white',
    info: 'bg-system-info text-white',
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-card shadow-card-hover ${typeClasses[toast.type] || typeClasses.info}`}>
        <div className="flex items-center justify-between">
          <span>{toast.message}</span>
          <button
            onClick={hideToast}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
