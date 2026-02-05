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
  loginWithGithub: (returnUrl) => {
    if (IS_MOCK) {
      const mockUser = {
        userId: 1,
        githubLogin: "jiyeon_dev",
        name: "하지연",
        avatarUrl: null,
      };
      set({ user: mockUser, isAuthenticated: true });
      alert("GitHub 로그인 성공! (Mock Mode)");
    } else {
      localStorage.removeItem('loggedOut');
      if (returnUrl) {
        sessionStorage.setItem('auth_return_url', returnUrl);
      }
      // 백엔드로 이동 -> 백엔드에서 GitHub 로그인 -> 쿠키(JSESSIONID) 설정 -> 프론트로 리다이렉트
      window.location.href = authApi.LOGIN_URL;
    }
  },

  // ------------------------------------------------------------------
  // [2] 로그인 콜백 처리 (더 이상 토큰을 받지 않음)
  // ------------------------------------------------------------------
  completeLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      // 쿠키가 세팅되었을 것이므로 바로 내 정보 조회 시도
      await get().fetchCurrentUser();
    } catch (error) {
      set({ error: error.message, isAuthenticated: false });
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
          avatarUrl: null
        },
        isAuthenticated: true,
        isLoading: false
      });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await authApi.getMe();
      // API 변경으로 id -> userId 매핑 (구조 분해 할당 및 리네이밍)
      const { id, ...rest } = response.data;
      const userData = { ...rest, id, userId: id };
      set({ user: userData, isAuthenticated: true });
    } catch (error) {
      // 여기서 401 에러 등이 발생하면 세션이 없는 것
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // ------------------------------------------------------------------
  // [4] 로그아웃
  // ------------------------------------------------------------------
  logout: async () => {
    console.log("1. 로그아웃 프로세스 시작");
    set({ isLoading: true });

    try {
      if (!IS_MOCK) {
        console.log("2. 서버에 로그아웃 요청 중...");
        // 이 부분에서 에러가 나면 아래 set({})이 실행 안 될 수 있음
        await authApi.logout();
      }
    } catch (e) {
      console.error('로그아웃 API 에러:', e);
    } finally {
      console.log("3. 클라이언트 상태 초기화 (여기서 GNB가 바뀌어야 함)");
      localStorage.setItem('loggedOut', 'true');
      // 🔴 중요: 에러가 나든 말든 일단 로컬 상태는 로그아웃으로 바꿈
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false
      });

      // window.location.href = '/';
    }
  },

  // ------------------------------------------------------------------
  // [5] 새로고침 시 상태 복구
  // ------------------------------------------------------------------
  checkLoginStatus: async () => {
    if (localStorage.getItem('loggedOut') === 'true') {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    // 바로 백엔드에 찔러서 세션 유효한지 확인
    await get().fetchCurrentUser();
  },

  // ------------------------------------------------------------------
  // [6] 프로필 이미지 수정
  // ------------------------------------------------------------------
  updateProfileImage: async ({ imageFile, removeImage }) => {
    set({ isLoading: true, error: null });

    // Mock 모드
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const currentUser = get().user;
      let newAvatarUrl = currentUser?.avatarUrl;

      if (removeImage) {
        newAvatarUrl = null;
      } else if (imageFile) {
        newAvatarUrl = URL.createObjectURL(imageFile);
      }

      set({
        user: { ...currentUser, avatarUrl: newAvatarUrl },
        isLoading: false,
      });

      return { success: true };
    }

    try {
      const formData = new FormData();

      if (removeImage) {
        formData.append('removeAvatar', 'true');
      } else if (imageFile) {
        formData.append('avatar', imageFile);
      }

      const response = await authApi.updateProfile(formData);

      set(state => ({
        user: { ...state.user, avatarUrl: response.data?.avatarUrl },
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('프로필 이미지 수정 실패:', error);
      set({ error: '프로필 이미지 수정에 실패했습니다', isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useAuthStore;