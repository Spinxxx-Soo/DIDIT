/**
 * Apple-Style Landing Page
 * Ultra-modern, Minimalist, Fluid Interactive Design
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Video, Brain, Calendar, MessageCircle, FolderOpen, Bell, Shield } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const sectionsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const heroScale = Math.max(1 - scrollY * 0.0003, 0.9);
  const heroOpacity = Math.max(1 - scrollY * 0.002, 0);

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden"
        style={{
          transform: `scale(${heroScale})`,
          opacity: heroOpacity
        }}
      >
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-green-primary)] opacity-[0.08] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--success-bg)] border border-[var(--color-green-200)] rounded-full text-sm font-medium text-[var(--color-green-dark)] mb-8 animate-fade-up">
            <span className="w-2 h-2 bg-[var(--color-green-primary)] rounded-full animate-pulse" />
            새로운 협업의 시작
          </div>

          {/* Title */}
          <h1 className="text-display text-[var(--text-bright)] mb-6 animate-fade-up stagger-1">
            팀워크를<br />
            <span className="text-gradient">더 스마트하게.</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            실시간 화상회의, AI 기반 회의록, 스마트 일정 관리.<br />
            모든 협업 도구가 하나로.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-3">
            <button
              onClick={() => navigate('/login')}
              className="
                inline-flex items-center justify-center gap-2
                px-8 py-4
                bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-hover)]
                text-white font-semibold
                rounded-full
                shadow-[0_4px_20px_rgba(46,204,113,0.35)]
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_8px_30px_rgba(46,204,113,0.45)]
                active:scale-[0.98]
              "
            >
              무료로 시작하기
              <ArrowRight size={18} />
            </button>
            <button
              className="
                inline-flex items-center justify-center gap-2
                px-8 py-4
                bg-[var(--bg-glass-strong)]
                backdrop-blur-xl
                text-[var(--text-primary)] font-semibold
                border border-[var(--border-default)]
                rounded-full
                transition-all duration-300
                hover:-translate-y-1
                hover:border-[var(--border-strong)]
                hover:shadow-[var(--shadow-lg)]
                active:scale-[0.98]
              "
            >
              더 알아보기
            </button>
          </div>

          {/* Floating Cards */}
          <div className="mt-16 relative h-[200px] hidden md:block">
            <div className="absolute left-[10%] top-0 animate-float" style={{ animationDelay: '0s' }}>
              <FeatureChip icon={<Video size={18} />} label="화상회의" />
            </div>
            <div className="absolute left-[50%] top-[20%] -translate-x-1/2 animate-float" style={{ animationDelay: '1s' }}>
              <FeatureChip icon={<Brain size={18} />} label="AI 요약" isAccent />
            </div>
            <div className="absolute right-[10%] top-0 animate-float" style={{ animationDelay: '2s' }}>
              <FeatureChip icon={<Calendar size={18} />} label="일정 관리" />
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none transition-opacity duration-300"
        style={{ opacity: heroOpacity }}
      >
        <div className="w-6 h-10 border-2 border-[var(--border-strong)] rounded-full relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-[var(--color-green-primary)] rounded-full animate-[scrollWheel_2s_infinite]" />
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">스크롤</span>
      </div>

      {/* Features Section */}
      <section className="py-32 px-6 bg-[var(--bg-panel)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-up" ref={addToRefs}>
            <span className="text-label text-[var(--color-green-primary)] mb-4 block">Features</span>
            <h2 className="text-headline text-[var(--text-bright)]">
              협업에 필요한<br />
              <span className="text-gradient">모든 것.</span>
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Large Card - Video */}
            <div className="md:col-span-2 md:row-span-2 fade-up" ref={addToRefs}>
              <BentoCard>
                <div className="h-full flex flex-col">
                  <IconWrapper icon={<Video size={24} />} />
                  <h3 className="text-title text-[var(--text-bright)] mt-5 mb-2">실시간 화상회의</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                    고화질 영상과 선명한 음성으로 어디서든 팀과 소통하세요. 화면 공유와 실시간 채팅이 기본으로 제공됩니다.
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-video bg-[var(--bg-hover)] rounded-[var(--radius-lg)]" />
                    ))}
                  </div>
                </div>
              </BentoCard>
            </div>

            {/* Medium Card - AI */}
            <div className="md:col-span-2 fade-up" ref={addToRefs}>
              <BentoCard isAccent>
                <IconWrapper icon={<Brain size={24} />} isAccent />
                <h3 className="text-title text-[var(--text-bright)] mt-5 mb-2">AI 회의록</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  회의 내용을 자동으로 요약하고 핵심 액션 아이템을 추출합니다.
                </p>
                <div className="mt-5 space-y-2">
                  <div className="h-2 bg-[var(--bg-hover)] rounded-full w-full" />
                  <div className="h-2 bg-[var(--bg-hover)] rounded-full w-3/4" />
                  <div className="h-2 bg-[var(--color-green-200)] rounded-full w-1/2" />
                </div>
              </BentoCard>
            </div>

            {/* Medium Card - Calendar */}
            <div className="md:col-span-2 fade-up" ref={addToRefs}>
              <BentoCard>
                <IconWrapper icon={<Calendar size={24} />} />
                <h3 className="text-title text-[var(--text-bright)] mt-5 mb-2">스마트 캘린더</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  팀 일정을 한눈에 파악하고 최적의 회의 시간을 자동으로 찾아드립니다.
                </p>
                <div className="mt-5 flex gap-1">
                  {[15, 16, 17, 18, 19, 20, 21].map((day, i) => (
                    <div
                      key={day}
                      className={`
                        w-9 h-9 flex items-center justify-center text-xs font-medium rounded-[var(--radius-md)]
                        ${i === 3 ? 'bg-[var(--color-green-primary)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'}
                      `}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>

            {/* Small Cards */}
            <SmallBentoCard icon={<MessageCircle size={20} />} label="실시간 채팅" addToRefs={addToRefs} />
            <SmallBentoCard icon={<FolderOpen size={20} />} label="파일 공유" isAccent addToRefs={addToRefs} />
            <SmallBentoCard icon={<Bell size={20} />} label="알림 센터" addToRefs={addToRefs} />
            <SmallBentoCard icon={<Shield size={20} />} label="보안" isAccent addToRefs={addToRefs} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden fade-up" ref={addToRefs}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-green-primary)] opacity-[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-headline text-[var(--text-bright)] mb-6">
            지금 바로<br />
            <span className="text-gradient">시작하세요.</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10">
            무료로 시작하고, 필요에 따라 업그레이드하세요.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="
              inline-flex items-center justify-center gap-2
              px-10 py-5
              bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-hover)]
              text-white text-lg font-semibold
              rounded-full
              shadow-[0_4px_20px_rgba(46,204,113,0.35)]
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_8px_30px_rgba(46,204,113,0.45)]
              active:scale-[0.98]
            "
          >
            무료로 시작하기
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--text-bright)] text-[var(--bg-app)] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                DID<span className="text-[var(--color-green-primary)]">IT</span>
              </h3>
              <p className="text-sm opacity-60">더 스마트한 팀 협업</p>
            </div>
            <div className="flex gap-16">
              <FooterColumn title="제품" links={['기능', '워크플로우', '가격']} />
              <FooterColumn title="회사" links={['회사 소개', '채용', '보도자료']} />
              <FooterColumn title="지원" links={['도움말', '문의하기', '상태']} />
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm opacity-50">
            © 2026 DIDIT. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes scrollWheel {
          0%, 100% { opacity: 1; top: 8px; }
          50% { opacity: 0.3; top: 18px; }
        }
      `}</style>
    </div>
  );
};

// Helper Components
const FeatureChip = ({ icon, label, isAccent }) => (
  <div
    className={`
      inline-flex items-center gap-2 px-5 py-3 rounded-full
      backdrop-blur-xl shadow-[var(--shadow-lg)]
      ${isAccent
        ? 'bg-[var(--success-bg)] border border-[var(--color-green-200)]'
        : 'bg-[var(--bg-glass-strong)] border border-[var(--border-default)]'
      }
    `}
  >
    <span className={isAccent ? 'text-[var(--color-green-primary)]' : 'text-[var(--text-secondary)]'}>
      {icon}
    </span>
    <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
  </div>
);

const IconWrapper = ({ icon, isAccent }) => (
  <div
    className={`
      w-12 h-12 flex items-center justify-center rounded-[var(--radius-lg)]
      ${isAccent
        ? 'bg-gradient-to-br from-[var(--color-green-50)] to-[var(--color-mint-light)] border border-[var(--color-green-200)] text-[var(--color-green-primary)]'
        : 'bg-[var(--bg-panel)] shadow-[var(--shadow-sm)] text-[var(--text-secondary)]'
      }
    `}
  >
    {icon}
  </div>
);

const BentoCard = ({ children, isAccent }) => (
  <div
    className={`
      p-7 rounded-[var(--radius-2xl)] h-full
      transition-all duration-300
      hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]
      ${isAccent
        ? 'bg-gradient-to-br from-[var(--bg-input)] to-[var(--color-green-50)]/30 border border-[var(--color-green-100)]'
        : 'bg-[var(--bg-input)] border border-[var(--border-subtle)]'
      }
    `}
  >
    {children}
  </div>
);

const SmallBentoCard = ({ icon, label, isAccent, addToRefs }) => (
  <div className="fade-up" ref={addToRefs}>
    <div
      className={`
        p-6 rounded-[var(--radius-2xl)] text-center
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]
        ${isAccent
          ? 'bg-gradient-to-br from-[var(--bg-input)] to-[var(--color-green-50)]/30 border border-[var(--color-green-100)]'
          : 'bg-[var(--bg-input)] border border-[var(--border-subtle)]'
        }
      `}
    >
      <div
        className={`
          w-11 h-11 mx-auto mb-3 flex items-center justify-center rounded-[var(--radius-lg)]
          ${isAccent
            ? 'bg-[var(--success-bg)] text-[var(--color-green-primary)]'
            : 'bg-[var(--bg-panel)] shadow-[var(--shadow-sm)] text-[var(--text-secondary)]'
          }
        `}
      >
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-[var(--text-bright)]">{label}</h4>
    </div>
  </div>
);

const FooterColumn = ({ title, links }) => (
  <div>
    <h5 className="text-xs font-semibold uppercase tracking-wider mb-4 opacity-60">{title}</h5>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link}>
          <a href="#" className="text-sm opacity-80 hover:opacity-100 transition-opacity">{link}</a>
        </li>
      ))}
    </ul>
  </div>
);

export default LandingPage;