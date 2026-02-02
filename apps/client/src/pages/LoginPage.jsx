/**
 * Apple-Style Login Page
 * Glassmorphism, spring animations, clean design
 */
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
    <div
      className="
        min-h-screen 
        relative 
        flex 
        flex-col 
        items-center 
        justify-center 
        p-6 
        overflow-hidden
        bg-[var(--bg-app)]
      "
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="
            absolute 
            top-[-10%] 
            right-[10%] 
            w-[500px] 
            h-[500px] 
            rounded-full 
            blur-[120px]
            bg-[var(--color-green-primary)]
            opacity-[0.08]
            animate-float
          "
        />
        <div
          className="
            absolute 
            bottom-[-10%] 
            left-[10%] 
            w-[400px] 
            h-[400px] 
            rounded-full 
            blur-[100px]
            bg-[var(--color-green-light)]
            opacity-[0.06]
            animate-float
          "
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-spring-in">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="
              text-6xl 
              font-bold 
              tracking-tight 
              mb-3
              text-gradient
            "
          >
            Didit
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            개발자를 위한 실시간 음성 협업
          </p>
        </div>

        {/* Login Card */}
        <div
          className="
            p-8 
            rounded-[var(--radius-2xl)]
            bg-[var(--bg-glass-strong)]
            backdrop-blur-2xl
            border 
            border-[var(--border-default)]
            shadow-[var(--shadow-xl)]
          "
        >
          <h2 className="text-xl font-semibold text-center mb-8 text-[var(--text-bright)]">
            Sign in to your account
          </h2>

          {/* GitHub Login Button */}
          <button
            onClick={handleGithubLogin}
            className="
              w-full 
              relative 
              group 
              flex 
              items-center 
              justify-center 
              gap-3 
              px-6 
              py-4 
              rounded-full
              font-semibold
              bg-[var(--text-bright)]
              text-[var(--bg-app)]
              transition-all 
              duration-300
              hover:-translate-y-0.5 
              hover:shadow-[var(--shadow-xl)]
              active:scale-[0.98]
            "
          >
            <svg className="w-5 h-5 fill-current transition-transform duration-200 group-hover:scale-110" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>GitHub 계정으로 계속하기</span>
            <ArrowRight
              size={16}
              className="
                opacity-0 
                -translate-x-2 
                group-hover:opacity-100 
                group-hover:translate-x-0 
                transition-all 
                duration-200
              "
            />
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs uppercase tracking-wider font-medium text-[var(--text-tertiary)] bg-transparent">
                Or
              </span>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm text-[var(--text-tertiary)]">
            계정이 없으신가요?<br />
            <span className="font-medium text-[var(--text-primary)]">
              GitHub 로그인 시 자동 가입됩니다.
            </span>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
            <path d="M7 1L2 3.5V6.5C2 9.475 4.1 12.25 7 13C9.9 12.25 12 9.475 12 6.5V3.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M5 7L6.5 8.5L9 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>안전한 OAuth 인증</span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="
          mt-10 
          text-xs 
          text-[var(--text-tertiary)]
          animate-fade-up
        "
        style={{ animationDelay: '0.3s' }}
      >
        © 2026 Didit. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;