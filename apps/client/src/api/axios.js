import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // .env에 설정된 주소
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 공유가 필요하다면 true
});

// 요청 인터셉터: (Session 기반이므로 토큰 첨부 로직 삭제됨)
// 필요하다면 로깅이나 다른 공통 처리를 위해 유지/추가 가능
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러(토큰 만료) 등 공통 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 예: 401 발생 시 로그아웃 처리 로직 등을 여기에 추가 가능
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;