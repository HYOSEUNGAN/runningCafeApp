import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // 상태
  isLoading: false,
  error: null,
  toast: null,
  modal: null,

  // 러닝 목표 설정 상태
  runningGoal: null,

  // 로딩 상태 관리
  setLoading: isLoading => set({ isLoading }),

  // 에러 상태 관리
  setError: error => set({ error }),
  clearError: () => set({ error: null }),

  // 토스트 메시지 관리
  showToast: toast => {
    set({ toast });
    // 3초 후 자동으로 토스트 제거
    setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  hideToast: () => set({ toast: null }),

  // 모달 관리
  showModal: modal => set({ modal }),
  hideModal: () => set({ modal: null }),

  // 러닝 목표 관리
  setRunningGoal: goal => {
    set({ runningGoal: goal });
    // localStorage에도 저장하여 페이지 새로고침 시에도 유지
    if (goal) {
      localStorage.setItem('runningGoal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('runningGoal');
    }
  },

  clearRunningGoal: () => {
    set({ runningGoal: null });
    localStorage.removeItem('runningGoal');
  },

  // 앱 초기화 시 localStorage에서 러닝 목표 복원
  initializeRunningGoal: () => {
    try {
      const savedGoal = localStorage.getItem('runningGoal');
      if (savedGoal) {
        const goal = JSON.parse(savedGoal);
        set({ runningGoal: goal });
      }
    } catch (error) {
      console.error('러닝 목표 복원 실패:', error);
      localStorage.removeItem('runningGoal');
    }
  },
}));
