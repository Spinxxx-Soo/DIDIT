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
    const [heroScale, setHeroScale] = useState(1);
    const [heroOpacity, setHeroOpacity] = useState(1);
    const heroRef = useRef(null);
    const fadeRefs = useRef([]);

    // Add element to fade refs
    const addToRefs = (el) => {
        if (el && !fadeRefs.current.includes(el)) {
            fadeRefs.current.push(el);
        }
    };

    // Scroll effects
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Hero parallax effect
            const scale = Math.max(0.8, 1 - scrollY / 2000);
            const opacity = Math.max(0, 1 - scrollY / 500);
            setHeroScale(scale);
            setHeroOpacity(opacity);

            // Fade-up animations
            fadeRefs.current.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < windowHeight * 0.85) {
                    el.classList.add('visible');
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
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
                            did<span className="logo-accent">!</span>t
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
                    transform: `scale(${heroScale})`,
                    opacity: heroOpacity,
                }}
            >
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        AI 기반 회의 관리 플랫폼
                    </div>

                    <h1 className="hero-title">
                        회의를 <span className="title-accent">스마트</span>하게,
                        <br />
                        협업을 <span className="title-accent">심플</span>하게.
                    </h1>

                    <p className="hero-description">
                        did!t와 함께라면 복잡한 회의 관리는 잊으세요.
                        AI가 회의록을 자동으로 정리하고, 팀의 생산성을 높여드립니다.
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

                <div className="hero-visual">
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
            <div className="scroll-indicator" style={{ opacity: heroOpacity }}>
                <div className="scroll-mouse">
                    <div className="scroll-wheel"></div>
                </div>
                <span>스크롤하여 더 보기</span>
            </div>

            {/* Features Bento Grid */}
            <section id="features" className="features-section">
                <div className="section-header fade-up" ref={addToRefs}>
                    <span className="section-label">Features</span>
                    <h2 className="section-title">
                        팀 협업의 새로운 기준
                    </h2>
                </div>

                <div className="bento-grid">
                    {/* Large Card - Video Call */}
                    <div className="bento-item bento-large fade-up" ref={addToRefs}>
                        <div className="bento-content">
                            <div className="bento-icon-wrapper accent">
                                <span className="bento-icon">🎥</span>
                            </div>
                            <h3>실시간 화상 회의</h3>
                            <p>
                                최대 50명이 동시 참여 가능한 고품질 화상 회의.
                                화면 공유와 실시간 채팅을 지원합니다.
                            </p>
                        </div>
                        <div className="bento-visual">
                            <div className="mock-video-grid">
                                <div className="mock-video-item"></div>
                                <div className="mock-video-item"></div>
                                <div className="mock-video-item"></div>
                                <div className="mock-video-item"></div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - AI Summary */}
                    <div className="bento-item bento-medium fade-up" ref={addToRefs}>
                        <div className="bento-icon-wrapper">
                            <span className="bento-icon">✨</span>
                        </div>
                        <h3>AI 회의록 자동 생성</h3>
                        <p>
                            회의 내용을 AI가 분석하여 핵심 내용만 정리해드립니다.
                        </p>
                        <div className="ai-summary-preview">
                            <div className="summary-line"></div>
                            <div className="summary-line short"></div>
                            <div className="summary-bullet"></div>
                            <div className="summary-bullet"></div>
                        </div>
                    </div>

                    {/* Small Cards */}
                    <div className="bento-item bento-small fade-up" ref={addToRefs}>
                        <div className="bento-icon-wrapper small">
                            <span className="bento-icon">📅</span>
                        </div>
                        <h4>일정 관리</h4>
                    </div>

                    <div className="bento-item bento-small fade-up" ref={addToRefs}>
                        <div className="bento-icon-wrapper small accent">
                            <span className="bento-icon">📋</span>
                        </div>
                        <h4>이슈 트래킹</h4>
                    </div>

                    {/* Medium Card - Calendar */}
                    <div className="bento-item bento-medium fade-up" ref={addToRefs}>
                        <div className="bento-icon-wrapper">
                            <span className="bento-icon">🗓️</span>
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
                                        className={`calendar-day ${day === 24 ? 'active' : ''}`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="workflow-section">
                <div className="section-header fade-up" ref={addToRefs}>
                    <span className="section-label">Workflow</span>
                    <h2 className="section-title">
                        3단계로 시작하세요
                    </h2>
                </div>

                <div className="workflow-steps">
                    <div className="workflow-step fade-up" ref={addToRefs}>
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

                    <div className="workflow-step fade-up" ref={addToRefs}>
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

                    <div className="workflow-step fade-up" ref={addToRefs}>
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
                    <div className="section-header fade-up" ref={addToRefs}>
                        <span className="section-label">For Teams</span>
                        <h2 className="section-title">
                            모든 팀을 위한 솔루션
                        </h2>
                    </div>

                    <div className="team-grid">
                        <div className="team-card fade-up" ref={addToRefs}>
                            <div className="team-icon">💻</div>
                            <h4>개발팀</h4>
                            <p>
                                스프린트 회의부터 코드 리뷰까지,
                                개발 워크플로우에 최적화되어 있습니다.
                            </p>
                        </div>

                        <div className="team-card featured fade-up" ref={addToRefs}>
                            <div className="team-icon">🎨</div>
                            <h4>디자인팀</h4>
                            <p>
                                디자인 리뷰와 피드백을 체계적으로 관리하고
                                빠르게 반영하세요.
                            </p>
                        </div>

                        <div className="team-card fade-up" ref={addToRefs}>
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
            <section className="cta-section fade-up" ref={addToRefs}>
                <div className="cta-container">
                    <div className="cta-glow"></div>
                    <h2>
                        지금 바로 시작하세요
                    </h2>
                    <p>
                        did!t와 함께 더 스마트한 팀 협업을 경험해보세요.
                    </p>
                    <button className="cta-primary large" onClick={handleGetStarted}>
                        무료로 시작하기
                        <span>→</span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <span className="logo-text">
                            did<span className="logo-accent">!</span>t
                        </span>
                        <p>AI 기반 스마트 회의 관리 플랫폼</p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h5>Product</h5>
                            <a href="#features">기능</a>
                            <a href="#workflow">워크플로우</a>
                            <a href="#">가격</a>
                        </div>
                        <div className="footer-column">
                            <h5>Company</h5>
                            <a href="#">소개</a>
                            <a href="#">블로그</a>
                            <a href="#">채용</a>
                        </div>
                        <div className="footer-column">
                            <h5>Support</h5>
                            <a href="#">도움말</a>
                            <a href="#">문의하기</a>
                            <a href="#">개인정보처리방침</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2025 did!t. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
