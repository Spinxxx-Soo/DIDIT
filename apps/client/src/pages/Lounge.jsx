/**
 * Apple-Style Lounge Page
 * Jira-inspired dashboard with floating navigation
 */
import React, { useRef } from 'react';
import WeeklySchedule from '@/components/features/user/WeeklySchedule';
import RecentMinutes from '@/components/features/user/RecentMinutes';
// import StatCards from '@/components/features/user/StatCards';
import IssueStatusChart from '@/components/features/user/IssueStatusChart';
import PriorityDistribution from '@/components/features/user/PriorityDistribution';
import useProjectStore from '@/store/useProjectStore';
import useLoungeStore from '@/store/useLoungeStore';
import { Calendar, FileText, BarChart3, LayoutGrid, ChevronRight, Github } from 'lucide-react';

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-4 mb-6">
    <div
      className="
        w-12 h-12 
        rounded-[var(--radius-xl)] 
        bg-gradient-to-br from-[var(--color-green-50)] to-[var(--success-bg)]
        flex items-center justify-center
        text-[var(--color-green-primary)]
        shadow-[var(--shadow-sm)]
      "
    >
      {icon}
    </div>
    <div>
      <h2 className="text-2xl font-bold text-[var(--text-bright)]">{title}</h2>
      {subtitle && (
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
      )}
    </div>
  </div>
);

const DashboardCard = ({ children, className = '', hover = true }) => (
  <div
    className={`
      bg-[var(--bg-panel)]
      rounded-[var(--radius-2xl)]
      border border-[var(--border-subtle)]
      shadow-[var(--shadow-card)]
      p-6
      transition-all duration-300
      ${hover ? 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// 플로팅 네비게이션 아이템
const NAV_ITEMS = [
  // { id: 'stats', label: '통계', icon: LayoutGrid },
  { id: 'issues', label: '이슈', icon: BarChart3 },
  { id: 'minutes', label: '회의', icon: FileText },
  { id: 'schedule', label: '일정', icon: Calendar },
];

const Lounge = () => {
  const { currentProject } = useProjectStore();
  const isGithubConnected = !!currentProject?.repoFullName;

  const sectionRefs = {
    // stats: useRef(null),
    issues: useRef(null),
    minutes: useRef(null),
    schedule: useRef(null),
  };

  const scrollToSection = (sectionId) => {
    sectionRefs[sectionId]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="relative">
      {/* 플로팅 네비게이션 리모컨 */}
      <div
        className={`
          fixed right-6 top-1/2 -translate-y-1/2 z-40
          flex flex-col gap-2
          p-2
          bg-white/70
          backdrop-blur-xl
          rounded-2xl
          border border-white/50
          shadow-lg
          transition-transform duration-500 ease-in-out
          ${(useLoungeStore(state => state.activePanel) === 'issue' || useLoungeStore(state => state.activePanel) === 'issue_detail') ? 'translate-x-[200%]' : 'translate-x-0'}
        `}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="
                group
                flex items-center gap-2
                px-3 py-2.5
                rounded-xl
                text-gray-600
                hover:bg-[var(--color-green-primary)]
                hover:text-white
                transition-all duration-200
                min-w-[44px]
              "
              title={item.label}
            >
              <Icon size={18} className="shrink-0" />
              <span
                className="
                  text-sm font-medium
                  max-w-0 overflow-hidden opacity-0
                  group-hover:max-w-[80px] group-hover:opacity-100
                  transition-all duration-300
                  whitespace-nowrap
                "
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="space-y-6">
        {/* 1. 통계 카드 (삭제됨) */}
        {/* <div ref={sectionRefs.stats} className="animate-fade-up" style={{ animationDelay: '0ms' }}>
          <StatCards />
        </div> */}

        {/* 2. 이슈 섹션 */}
        <div ref={sectionRefs.issues} className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <DashboardCard hover={false}>
            <SectionHeader
              icon={<BarChart3 size={22} />}
              title="이슈 현황"
              subtitle="상태 및 우선순위 분포"
            />
            {/* GitHub 미연동 안내 배너 */}
            {!isGithubConnected && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-[var(--bg-input)] rounded-[var(--radius-xl)] border border-[var(--border-default)]">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-panel)] flex items-center justify-center">
                  <Github size={20} className="text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    GitHub 저장소 연동이 필요합니다
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    상단에서 저장소를 연결하면 이슈를 관리할 수 있습니다
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <IssueStatusChart />
              <PriorityDistribution />
            </div>
          </DashboardCard>
        </div>

        {/* 3. 최근 회의록 */}
        <div ref={sectionRefs.minutes} className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <DashboardCard hover={false}>
            <SectionHeader
              icon={<FileText size={22} />}
              title="최근 회의록"
              subtitle="AI가 요약한 회의 내용"
            />
            <RecentMinutes />
          </DashboardCard>
        </div>

        {/* 4. 이번 주 일정 */}
        <div ref={sectionRefs.schedule} className="animate-fade-up" style={{ animationDelay: '300ms' }}>
          <DashboardCard hover={false}>
            <SectionHeader
              icon={<Calendar size={22} />}
              title="주간 캘린더"
              subtitle="예정된 회의와 일정"
            />
            <WeeklySchedule />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default Lounge;