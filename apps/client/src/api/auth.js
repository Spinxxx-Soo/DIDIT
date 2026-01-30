import api from './axios';

export const authApi = {
  // 1. 로그인
  LOGIN_URL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/login`,

  // 2. 로그아웃
  logout: () => api.post('/api/v1/auth/logout'),

  // 3. 내 프로필 조회
  getMe: () => api.get('/api/v1/auth/me'),

  // [Disabled] 문서에 없는 API 주석 처리
  // 4. 프로필 사진 수정
  // updateProfile: (data) => api.patch('/api/v1/users/me', data),

  // 5. 활동 기록 조회
  // getActivity: (limit = 10) =>
  //   api.get('/api/v1/users/me/activity', { params: { limit } }),

  // 6. 조직 목록 조회 (팀장 기능)
  // getOrgs: () => api.get('/api/v1/user/orgs'),
};