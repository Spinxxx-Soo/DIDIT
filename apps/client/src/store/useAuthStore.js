import { create } from 'zustand';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // env로 mock 버전 설정

const useAuthStore = create((set, get) => ({
  user: null,          
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ------------------------------------------------------------------
  // [1] 로그인 요청
  // ------------------------------------------------------------------
  loginWithGithub: () => {
    // 테스트
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
      // 실제 백엔드 연동
      window.location.href = `${BACKEND_URL}/api/v1/auth/login`;
    }
  },

  // ------------------------------------------------------------------
  // [2] 로그인 콜백 처리 (OAuth redirect 후)
  // ------------------------------------------------------------------
  completeLogin: async (token) => {
    set({ isLoading: true, error: null });
    
    try {
      localStorage.setItem('accessToken', token);
      await get().fetchCurrentUser(); // 내 정보 조회
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
    if (IS_MOCK) {
      // 테스트 데이터 반환
      set({ 
        user: { 
          userId: 1, 
          githubLogin: "jiyeon_dev",
          name: "하지연", 
          avatarUrl: "https://via.placeholder.com/150"
        },
        isAuthenticated: true 
      });
      return;
    }

    // 실제 API 호출
    set({ isLoading: true });
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('토큰 없음');

      const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const userData = await response.json();
      set({ user: userData, isAuthenticated: true, error: null });
    } catch (error) {
      console.error('fetchCurrentUser 에러:', error);
      set({ user: null, isAuthenticated: false, error: error.message });
      localStorage.removeItem('accessToken');
    } finally {
      set({ isLoading: false });
    }
  },

  // ------------------------------------------------------------------
  // [4] 로그아웃
  // ------------------------------------------------------------------
  logout: async () => {
    if (!IS_MOCK) {
      // 실제 백엔드에 로그아웃 요청
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`${BACKEND_URL}/api/v1/auth/logout`, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) { 
        console.error('로그아웃 요청 실패:', e); 
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
  checkLoginStatus: async () => { // async 추가
    let token;
    try {
      token = localStorage.getItem('accessToken');
    } catch (e) { return; }

    if (!token) return;

    // Mock 모드 또는 실제 모드 자동 처리
    await get().fetchCurrentUser();
  }
}));

export default useAuthStore;