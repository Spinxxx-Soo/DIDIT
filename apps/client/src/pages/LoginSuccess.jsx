import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser(); // 세션 확인
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mypage'); // 성공 시 리다이렉트
    }
  }, [isAuthenticated, navigate]);

  return <div>로그인 처리 중...</div>;
};

export default LoginSuccess;