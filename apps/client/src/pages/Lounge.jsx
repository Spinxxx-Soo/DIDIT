/**
 * Apple-Style Lounge Page
 * Bento Grid dashboard layout, clean sections
 */
import React from 'react';
import WeeklySchedule from '@/components/features/user/WeeklySchedule';
import RecentMinutes from '@/components/features/user/RecentMinutes';
import IssueTracker from '@/components/features/user/IssueTracker';
import { Calendar, FileText, AlertCircle, Sparkles } from 'lucide-react';

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
      <h2 className="text-xl font-semibold text-[var(--text-bright)]">{title}</h2>
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
      p-8
      transition-all duration-300
      ${hover ? 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const Lounge = () => {
  const cardHeight = "h-[450px]";

  return (
    <div className="space-y-10">
      {/* Page Header */}

      {/* Top Row - 최근 회의록 + 이슈 현황 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 최근 회의록 (넓게) */}
        <div className="flex-[2]">
          <DashboardCard hover={false} className={`${cardHeight} flex flex-col`}>
            <SectionHeader
              icon={<FileText size={22} />}
              title="최근 회의록"
              subtitle="AI가 요약한 회의 내용"
            />
            <RecentMinutes />
          </DashboardCard>
        </div>

        {/* 이슈 트래커 */}
        <div className="w-full lg:w-[340px] flex-shrink-0">
          <DashboardCard hover={false} className={`${cardHeight} flex flex-col`}>
            <SectionHeader
              icon={<AlertCircle size={22} />}
              title="이슈 현황"
            />
            <IssueTracker />
          </DashboardCard>
        </div>
      </div>

      {/* Bottom Row - 이번 주 일정 */}
      <DashboardCard hover={false}>
        <SectionHeader
          icon={<Calendar size={22} />}
          title="이번 주 일정"
          subtitle="예정된 회의와 일정"
        />
        <WeeklySchedule />
      </DashboardCard>
    </div>
  );
};

export default Lounge;