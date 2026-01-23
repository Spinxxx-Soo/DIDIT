import { create } from 'zustand';

/**
 * Toast 전역 상태 관리
 */
const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * 토스트 추가
   * @param {Object} toast - { type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number }
   */
  addToast: ({ type = 'success', message, duration = 3000 }) => {
    const id = Date.now();

    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    // 자동 제거
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  /**
   * 토스트 제거
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  /**
   * 모든 토스트 제거
   */
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// 편의 함수 export
export const toast = {
  success: (message, duration) => useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message, duration) => useToastStore.getState().addToast({ type: 'error', message, duration }),
  warning: (message, duration) => useToastStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message, duration) => useToastStore.getState().addToast({ type: 'info', message, duration }),
};

export default useToastStore;
