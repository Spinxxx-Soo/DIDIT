import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Mic, GitBranch, FileText, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* 애니메이션 정의 
        (index.css에 없는 커스텀 애니메이션은 여기서 정의하거나 global css에 추가 필요)
      */}
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
      `}</style>

      <div 
        className="min-h-screen relative overflow-x-hidden font-sans"
        style={{ 
          backgroundColor: 'var(--bg-app)', 
          color: 'var(--text-primary)' 
        }}
      >
        {/* Background blobs */}
        <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div 
            className="absolute top-[-14%] right-[-8%] w-[560px] h-[560px] rounded-full opacity-[0.06] blur-[120px] animate-blob"
            style={{ backgroundColor: 'var(--color-green-primary)' }}
          ></div>
          <div 
            className="absolute bottom-[6%] left-[-12%] w-[520px] h-[520px] rounded-full opacity-[0.045] blur-[110px] animate-blob"
            style={{ 
              backgroundColor: 'var(--color-green-primary)',
              animationDelay: '2.5s' 
            }}
          ></div>
          <div 
            className="absolute top-[18%] left-[42%] w-[320px] h-[320px] rounded-full opacity-[0.06] blur-[90px] animate-blob"
            style={{ 
              backgroundColor: 'var(--color-green-light)',
              animationDelay: '4.5s' 
            }}
          ></div>
        </div>
        {/* Main Content */}
        <main className="px-6 relative z-10 py-14 mt-10">
          <section className="max-w-5xl mx-auto text-center">
            
            {/* Headline */}
            <h1 
              className="text-4xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-slide-up"
              style={{ color: 'var(--text-bright)' }}
            >
              개발자를 위한<br />
              <span 
                className="text-transparent bg-clip-text"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green-light) 100%)`
                }}
              >
                실시간 협업 플랫폼
              </span>
            </h1>

            <p 
              className="text-base md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up"
              style={{ 
                color: 'var(--text-secondary)',
                animationDelay: '0.1s'
              }}
            >
              GitHub 이슈와 음성 회의를 하나로 연결하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, var(--color-green-primary) 0%, var(--color-green-light) 100%)`,
                  boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                }}
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 backdrop-blur-md border"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Play className="w-5 h-5 fill-current" style={{ color: 'var(--color-green-primary)' }} />
                데모 영상 보기
              </button>
            </div>

            {/* Features Grid */}
            <div 
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              <FeatureCard 
                icon={<Mic className="w-5 h-5" style={{ color: 'var(--color-green-dark)' }} />}
                title="음성 회의"
                desc="끊김 없는 소통"
              />
              <FeatureCard 
                icon={<GitBranch className="w-5 h-5" style={{ color: 'var(--color-green-dark)' }} />}
                title="GitHub 연동"
                desc="실시간 이슈 동기화"
              />
              <FeatureCard 
                icon={<FileText className="w-5 h-5" style={{ color: 'var(--color-green-dark)' }} />}
                title="AI 요약"
                desc="자동 회의록 생성"
              />
              <FeatureCard 
                icon={<Zap className="w-5 h-5" style={{ color: 'var(--color-green-dark)' }} />}
                title="이슈 우선순위"
                desc="클릭 한 번으로"
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

// 재사용 가능한 Feature Card 컴포넌트
const FeatureCard = ({ icon, title, desc }) => {
  return (
    <div 
      className="group p-5 rounded-[18px] border text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md backdrop-blur-md"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // --bg-elevated 느낌
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div 
        className="w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-110"
        style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderColor: 'rgba(16, 185, 129, 0.18)'
        }}
      >
        {icon}
      </div>
      <h3 
        className="font-extrabold mb-1"
        style={{ color: 'var(--text-bright)' }}
      >
        {title}
      </h3>
      <p 
        className="text-xs"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {desc}
      </p>
    </div>
  );
};

export default LandingPage;