import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 모달 컴포넌트
 */
const Modal = () => {
  const { modal, hideModal } = useAppStore();

  if (!modal) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      hideModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-card p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          {modal.title && (
            <h2 className="text-h4 font-bold text-neutral-900">{modal.title}</h2>
          )}
          <button
            onClick={hideModal}
            className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
          >
            ×
          </button>
        </div>
        {modal.content}
      </div>
    </div>
  );
};

export default Modal;
