import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const LoginPage = () => {
  const navigate = useNavigate();

  // Zustand 스토어에서 로그인 함수와 인증 상태 가져오기
  const { loginWithGithub, isAuthenticated } = useAuthStore();

  // 로그인 시 마이페이지로 연결
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mypage');
    }
  }, [isAuthenticated, navigate]);

  const handleGithubLogin = () => {
    loginWithGithub(); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* 1. 로고 및 헤더 영역 */}
      <div className="text-center mb-8">
        <div className="text-4xl font-bold mb-2">DevMeet</div>
        <p className="text-gray-600">
          개발자를 위한 실시간 음성 협업 플랫폼
        </p>
      </div>
    
      {/* 2. 로그인 카드 영역 */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-xl font-bold text-center mb-8 text-gray-800">
          Sign in to your account
        </h2>

        {/* GitHub 로그인 버튼 */}
        <button
          onClick={handleGithubLogin}
          className="w-full bg-[#24292F] text-white h-12 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-[#1f242a] transition-colors mb-6"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
            
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub 계정으로 계속하기
        </button>
      </div>

      {/* 하단 링크 */}
      <p className="mt-8 text-sm text-gray-500">
        계정이 없으신가요?{" "}
        <Link to="/signup" className="font-semibold text-green-600 hover:text-green-500">
          GitHub 계정으로 자동 생성됩니다.
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;