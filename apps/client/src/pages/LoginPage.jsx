  import React, { useEffect } from 'react';
  import { useNavigate, useLocation } from 'react-router-dom';
  import useAuthStore from '../store/useAuthStore';
  import { ArrowRight } from 'lucide-react';

  const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithGithub, isAuthenticated } = useAuthStore();

    useEffect(() => {
      if (isAuthenticated) {
        navigate(location.state?.from || '/mypage');
      }
    }, [isAuthenticated, navigate, location]);

    const handleGithubLogin = () => {
      loginWithGithub();
    };

    return (
      <>
        <style>{`
          @keyframes blob-float {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(22px, -35px) scale(1.06); }
            66% { transform: translate(-14px, 18px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob-float 12s infinite;
            filter: saturate(0.9);
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
        `}</style>

        <div 
          className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans"
          style={{ 
            backgroundColor: 'var(--bg-app)', 
            color: 'var(--text-primary)' 
          }}
        >
          {/* 1. 배경 효과 */}
          <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div 
              className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-blob"
              style={{ 
                backgroundColor: 'var(--color-green-primary)',
                opacity: 0.05
              }}
            ></div>
            <div 
              className="absolute bottom-[-10%] left-[10%] w-[450px] h-[450px] rounded-full blur-[90px] animate-blob"
              style={{ 
                backgroundColor: 'var(--color-green-primary)',
                animationDelay: '2s',
                opacity: 0.04
              }}
            ></div>
          </div>

          {/* 2. 메인 컨테이너 */}
          <div 
              className="w-full max-w-md animate-slide-up relative z-10"
              style={{ animationDelay: '0.1s' }}
          >
            {/* 헤더 섹션 */}
            <div className="text-center mb-10">
              <h1 
                className="text-6xl font-extrabold mb-3 tracking-tight text-transparent bg-clip-text"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green-light) 100%)`,
                  color: 'var(--color-green-primary)'
                }}
              >
                Didit
              </h1>
              <p 
                  className="text-lg"
                  style={{ color: 'var(--text-secondary)' }}
              >
                개발자를 위한 실시간 음성 협업
              </p>
            </div>

            {/* 로그인 카드 */}
            <div 
              className="p-8 rounded-[24px] border backdrop-blur-md transition-all"
              style={{ 
                // Glassmorphism System: 투명도를 변수와 결합
                backgroundColor: 'color-mix(in srgb, var(--bg-elevated), transparent 40%)', 
                borderColor: 'var(--border-default)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <h2 
                  className="text-xl font-bold text-center mb-8"
                  style={{ color: 'var(--text-primary)' }}
              >
                Sign in to your account
              </h2>

              {/* GitHub 로그인 버튼 */}
              <button
                onClick={handleGithubLogin}
                className="w-full relative group flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  // Brand Color 대신 Theme Variable 사용 (Light: Black / Dark: White)
                  backgroundColor: 'var(--text-bright)', 
                  color: 'var(--bg-app)', // 배경색과 대비되는 텍스트 색상
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <svg className="w-5 h-5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>GitHub 계정으로 계속하기</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>

              {/* 구분선 */}
              <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'var(--border-default)' }}></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span 
                        className="px-2 font-medium" 
                        style={{ 
                          // 배경을 투명하게 처리하여 부모의 color-mix 배경과 일치시킴
                          backgroundColor: 'transparent', 
                          color: 'var(--text-tertiary)' 
                        }}
                      >
                        Or
                      </span>
                  </div>
              </div>

              {/* 하단 안내 문구 */}
              <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                계정이 없으신가요? <br/>
                <span 
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }} 
                >
                  GitHub 로그인 시 자동 가입됩니다.
                </span>
              </p>
            </div>
          </div>
          
          {/* 저작권 표시 */}
          <div 
              className="mt-8 text-xs animate-slide-up" 
              style={{ 
                color: 'var(--text-tertiary)', 
                animationDelay: '0.3s' 
              }}
          >
              © 2026 Didit. All rights reserved.
          </div>
        </div>
      </>
    );
  };

  export default LoginPage;