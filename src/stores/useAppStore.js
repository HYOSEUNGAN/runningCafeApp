import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // 상태
  isLoading: false,
  error: null,
  toast: null,
  modal: null,

  // 로딩 상태 관리
  setLoading: (isLoading) => set({ isLoading }),

  // 에러 상태 관리
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // 토스트 메시지 관리
  showToast: (toast) => {
    set({ toast });
    // 3초 후 자동으로 토스트 제거
    setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  hideToast: () => set({ toast: null }),

  // 모달 관리
  showModal: (modal) => set({ modal }),
  hideModal: () => set({ modal: null }),
}));
