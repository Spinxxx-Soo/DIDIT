/**
 * Apple-Style Landing Page
 * Uses LandingPage.css for styling
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Scroll animation refs
    const [heroEffect, setHeroEffect] = useState({ scale: 1, opacity: 1, filter: 'blur(0px)' });
    const heroRef = useRef(null);
    const revealRefs = useRef([]);

    // Add element to reveal refs
    const addToReveal = (el) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    // Scroll effects
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;

            // Hero parallax effect - Apple style fade out & scale down
            const progress = Math.min(scrollY / 800, 1);
            setHeroEffect({
                scale: Math.max(0.9, 1 - progress * 0.1),
                opacity: Math.max(0, 1 - progress * 1.2),
                filter: `blur(${progress * 20}px)`
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Intersection Observer for reveal elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealRefs.current.forEach((el) => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/mypage');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <span className="logo-text">
                            DID<span className="logo-accent">IT</span>
                        </span>
                    </div>

                    <div className="nav-links">
                        <a href="#features">기능</a>
                        <a href="#workflow">워크플로우</a>
                        <a href="#team">팀</a>
                    </div>

                    <button className="nav-cta" onClick={handleGetStarted}>
                        {isAuthenticated ? '대시보드' : '시작하기'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                className="hero-section"
                ref={heroRef}
                style={{
                    transform: `scale(${heroEffect.scale})`,
                    opacity: heroEffect.opacity,
                    filter: heroEffect.filter
                }}
            >
                <div className="hero-content appear-on-load">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        AI 기반 회의 관리 플랫폼
                    </div>

                    <h1 className="hero-title">
                        협업은 <span className="title-accent">간단</span>하게.<br />
                        결과는 <span className="title-accent">완벽</span>하게.

                    </h1>

                    <p className="hero-description">
                        실시간 화상회의부터 AI 회의록 자동 생성까지,<br />
                        팀 협업에 필요한 모든 것이 한곳에.
                    </p>

                    <div className="hero-cta-group">
                        <button className="cta-primary" onClick={handleGetStarted}>
                            무료로 시작하기
                            <span>→</span>
                        </button>
                        <button className="cta-secondary">
                            데모 보기
                        </button>
                    </div>
                </div>

                <div className="hero-visual appear-on-load">
                    <div className="hero-glow"></div>
                    <div className="hero-card-stack">
                        <div className="floating-card card-1">
                            <span className="card-icon">🎯</span>
                            <span>실시간 회의</span>
                        </div>
                        <div className="floating-card card-2">
                            <span className="card-icon">🤖</span>
                            <span>AI 회의록</span>
                        </div>
                        <div className="floating-card card-3">
                            <span className="card-icon">📊</span>
                            <span>일정 관리</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scroll Indicator */}
            <div className="scroll-indicator" style={{ opacity: heroEffect.opacity }}>
                <div className="scroll-mouse">
                    <div className="scroll-wheel"></div>
                </div>
                <span>스크롤하여 더 보기</span>
            </div>

            {/* Features Bento Grid */}
            <section id="features" className="features-section">
                <div className="section-header reveal-on-scroll" ref={addToReveal}>
                    <span className="section-label">Features</span>
                    <h2 className="section-title">
                        팀 협업의 새로운 기준
                    </h2>
                </div>

                <div className="bento-grid">
                    {/* Large Card - Video Call */}
                    <div className="bento-item bento-large reveal-on-scroll" ref={addToReveal}>
                        <div className="bento-content">
                            <div className="bento-icon-wrapper accent">
                                <span className="bento-icon">🎬</span>
                            </div>
                            <h3>실시간 화상 회의</h3>
                            <p>
                                최대 50명 동시 참여 가능한 고품질 화상 회의.<br />
                                화면 공유와 실시간 채팅을 지원합니다.
                            </p>
                        </div>
                        <div className="bento-visual">
                            <div className="mock-video-grid">
                                <div className="mock-video-item speaking">
                                    <div className="avatar-large">👨‍💼</div>
                                    <span className="user-name">김스마트</span>
                                    <div className="speaking-wave"></div>
                                </div>
                                <div className="mock-video-item">
                                    <div className="avatar-large">👩‍💻</div>
                                    <span className="user-name">이개발</span>
                                </div>
                                <div className="mock-video-item">
                                    <div className="avatar-large">👨‍🎨</div>
                                    <span className="user-name">박디자인</span>
                                </div>
                                <div className="mock-video-item">
                                    <div className="avatar-large">👩‍🔬</div>
                                    <span className="user-name">최기획</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Large Card - AI Summary */}
                    <div className="bento-item bento-large reveal-on-scroll" ref={addToReveal}>
                        <div className="bento-content">
                            <div className="bento-icon-wrapper">
                                <span className="bento-icon">✨</span>
                            </div>
                            <h3>AI 회의록 자동 생성</h3>
                            <p>
                                회의가 끝나면 AI가 자동으로 핸심 내용을 정리하고,<br />
                                액션 아이템과 담당자를 배정해드립니다.
                            </p>
                        </div>
                        <div className="ai-summary-preview-large">
                            <div className="summary-header">
                                <span className="summary-badge">회의 요약</span>
                                <span className="summary-date">2025.01.29</span>
                            </div>
                            <div className="summary-content">
                                <div className="summary-section">
                                    <span className="section-icon">📌</span>
                                    <div className="section-text">
                                        <strong>주요 논의</strong>
                                        <p>Q1 로드맵 및 주요 마일스톤 결정</p>
                                    </div>
                                </div>
                                <div className="summary-section">
                                    <span className="section-icon">✅</span>
                                    <div className="section-text">
                                        <strong>액션 아이템</strong>
                                        <p>디자인 시안 검토 (박디자인)</p>
                                    </div>
                                </div>
                                <div className="summary-section">
                                    <span className="section-icon">📅</span>
                                    <div className="section-text">
                                        <strong>다음 회의</strong>
                                        <p>2025.02.05 14:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - Schedule & Issue */}
                    <div className="bento-item bento-medium reveal-on-scroll" ref={addToReveal}>
                        <div className="bento-icon-wrapper accent">
                            <span className="bento-icon">📅</span>
                        </div>
                        <h3>스마트 일정 관리</h3>
                        <p>
                            팀원들의 일정을 한눈에 확인하고 효율적으로 관리하세요.
                        </p>
                        <div className="calendar-preview">
                            <div className="calendar-grid">
                                {[22, 23, 24, 25, 26, 27, 28].map((day) => (
                                    <div
                                        key={day}
                                        className={`calendar-day ${day === 24 ? 'active' : ''} ${day === 25 || day === 26 ? 'has-event' : ''}`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - Issue Tracking */}
                    <div className="bento-item bento-medium reveal-on-scroll" ref={addToReveal}>
                        <div className="bento-icon-wrapper">
                            <span className="bento-icon">📋</span>
                        </div>
                        <h3>이슈 트래킹</h3>
                        <p>
                            프로젝트 진행 상황을 실시간으로 확인하세요.
                        </p>
                        <div className="issue-preview">
                            <div className="issue-item">
                                <span className="issue-status done">✅</span>
                                <span className="issue-text">로그인 UI 개선</span>
                            </div>
                            <div className="issue-item">
                                <span className="issue-status progress">🟡</span>
                                <span className="issue-text">API 연동 작업</span>
                            </div>
                            <div className="issue-item">
                                <span className="issue-status todo">⬜</span>
                                <span className="issue-text">테스트 코드 작성</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="workflow-section">
                <div className="section-header reveal-on-scroll" ref={addToReveal}>
                    <span className="section-label">Workflow</span>
                    <h2 className="section-title">
                        3단계로 시작하세요
                    </h2>
                </div>

                <div className="workflow-steps">
                    <div className="workflow-step fade-up" ref={addToReveal}>
                        <span className="step-number">01</span>
                        <div className="step-content">
                            <h3>프로젝트 생성</h3>
                            <p>팀을 위한 워크스페이스를 몇 초 만에 만드세요.</p>
                        </div>
                        <div className="step-visual">
                            <div className="step-icon-wrapper">📁</div>
                        </div>
                    </div>

                    <div className="workflow-connector">
                        <svg width="2" height="40" viewBox="0 0 2 40">
                            <line x1="1" y1="0" x2="1" y2="40" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>

                    <div className="workflow-step fade-up" ref={addToReveal}>
                        <span className="step-number">02</span>
                        <div className="step-content">
                            <h3>팀원 초대</h3>
                            <p>링크 하나로 팀원들을 초대하세요.</p>
                        </div>
                        <div className="step-visual">
                            <div className="step-icon-wrapper accent">👥</div>
                        </div>
                    </div>

                    <div className="workflow-connector">
                        <svg width="2" height="40" viewBox="0 0 2 40">
                            <line x1="1" y1="0" x2="1" y2="40" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>

                    <div className="workflow-step fade-up" ref={addToReveal}>
                        <span className="step-number">03</span>
                        <div className="step-content">
                            <h3>회의 시작</h3>
                            <p>즉시 회의를 시작하고 AI가 기록합니다.</p>
                        </div>
                        <div className="step-visual">
                            <div className="step-icon-wrapper">🚀</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section id="team" className="team-section">
                <div className="team-container">
                    <div className="section-header reveal-on-scroll" ref={addToReveal}>
                        <span className="section-label">For Teams</span>
                        <h2 className="section-title">
                            모든 팀을 위한 솔루션
                        </h2>
                    </div>

                    <div className="team-grid">
                        <div className="team-card fade-up" ref={addToReveal}>
                            <div className="team-icon">💻</div>
                            <h4>개발팀</h4>
                            <p>
                                스프린트 회의부터 코드 리뷰까지,
                                개발 워크플로우에 최적화되어 있습니다.
                            </p>
                        </div>

                        <div className="team-card featured fade-up" ref={addToReveal}>
                            <div className="team-icon">🎨</div>
                            <h4>디자인팀</h4>
                            <p>
                                디자인 리뷰와 피드백을 체계적으로 관리하고
                                빠르게 반영하세요.
                            </p>
                        </div>

                        <div className="team-card fade-up" ref={addToReveal}>
                            <div className="team-icon">📈</div>
                            <h4>마케팅팀</h4>
                            <p>
                                캠페인 기획부터 결과 분석까지,
                                팀 협업을 한곳에서 관리하세요.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section fade-up" ref={addToReveal}>
                <div className="cta-container">
                    <div className="cta-glow"></div>
                    <h2>
                        지금 바로 시작하세요 ㅡ
                    </h2>
                    <p>
                        DIDIT은 여러분의 새로운 시작을 기다리고 있습니다.
                    </p>
                    <button className="cta-primary large" onClick={handleGetStarted}>
                        무료로 시작하기
                        <span>→</span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-bottom">
                    <p>© 2026 DIDIT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
