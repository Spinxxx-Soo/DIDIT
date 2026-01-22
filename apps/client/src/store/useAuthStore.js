import { create } from 'zustand';
import { authApi } from '@/api/auth.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; 

const useAuthStore = create((set, get) => ({
  user: null,          
  isAuthenticated: false,
  // 앱 시작 시엔 "확인 중"이어야 하므로 true로 설정해놓음 일단
  isLoading: true, 
  error: null,

  // ------------------------------------------------------------------
  // [1] 로그인 요청
  // ------------------------------------------------------------------
  loginWithGithub: () => {
    if (IS_MOCK) {
      const mockUser = {
        userId: 1,
        githubLogin: "jiyeon_dev",
        name: "하지연",
        avatarUrl: "https://via.placeholder.com/150",
      };
      
      try {
        localStorage.setItem('accessToken', 'mock_token_12345');
      } catch (e) {
        console.warn('localStorage 사용 불가');
      }

      set({ user: mockUser, isAuthenticated: true });
      alert("GitHub 로그인 성공! (Mock Mode)");
    } else {
      window.location.href = authApi.LOGIN_URL;
    }
  },

  // ------------------------------------------------------------------
  // [2] 로그인 콜백 처리
  // ------------------------------------------------------------------
  completeLogin: async (token) => {
    set({ isLoading: true, error: null });
    
    try {
      localStorage.setItem('accessToken', token);
      await get().fetchCurrentUser(); 
    } catch (error) {
      set({ error: error.message, isAuthenticated: false });
      localStorage.removeItem('accessToken');
    } finally {
      set({ isLoading: false });
    }
  },

  // ------------------------------------------------------------------
  // [3] 내 정보 조회
  // ------------------------------------------------------------------
  fetchCurrentUser: async () => {
      // Mock 모드
      if (IS_MOCK) {
        set({ 
          user: { 
            userId: 1, 
            githubLogin: "jiyeon_dev",
            name: "하지연", 
            avatarUrl: "https://via.placeholder.com/150"
          },
          isAuthenticated: true,
          isLoading: false
        });
        return;
      }

      set({ isLoading: true });
      
      try {
        // authApi
        const response = await authApi.getMe();
        set({ user: response.data, isAuthenticated: true, error: null });
      } catch (error) {
        console.error('내 정보 조회 실패:', error);
        set({ user: null, isAuthenticated: false, error: '로그인 세션 만료' });
        localStorage.removeItem('accessToken');
      } finally {
        // 성공하든 실패하든 로딩 종료
        set({ isLoading: false });
      }
    },

  // ------------------------------------------------------------------
  // [4] 로그아웃
  // ------------------------------------------------------------------
  logout: async () => {

    set({ isLoading: true });

    if (!IS_MOCK) {
      try {
        await authApi.logout();
      } catch (e) {
        console.warn('로그아웃 실패:', e);
      }
    }

    try {
      localStorage.removeItem('accessToken');
    } catch (e) {}

    set({ user: null, isAuthenticated: false, error: null });
    window.location.href = '/';
  },

  // ------------------------------------------------------------------
  // [5] 새로고침 시 상태 복구
  // ------------------------------------------------------------------
  checkLoginStatus: async () => {
    const token = localStorage.getItem('accessToken');

    // 토근 없을 시 실패
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // 토큰 있으면 검증 시작
    await get().fetchCurrentUser();
  }
}));

export default useAuthStore;