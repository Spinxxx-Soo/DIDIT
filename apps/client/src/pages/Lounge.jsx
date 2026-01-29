/**
 * Apple-Style Lounge Page
 * Bento Grid dashboard layout, clean sections
 */
import React from 'react';
import WeeklySchedule from '@/components/features/user/WeeklySchedule';
import RecentMinutes from '@/components/features/user/RecentMinutes';
import IssueTracker from '@/components/features/user/IssueTracker';
import { Calendar, FileText, AlertCircle } from 'lucide-react';

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="
        w-10 h-10 
        rounded-[var(--radius-lg)] 
        bg-[var(--bg-input)] 
        flex items-center justify-center
        text-[var(--color-green-primary)]
      "
    >
      {icon}
    </div>
    <div>
      <h2 className="text-title text-[var(--text-bright)]">{title}</h2>
      {subtitle && (
        <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
      )}
    </div>
  </div>
);

const DashboardCard = ({ children, className = '' }) => (
  <div
    className={`
      bg-[var(--bg-panel)]
      rounded-[var(--radius-2xl)]
      border border-[var(--border-default)]
      shadow-[var(--shadow-sm)]
      p-6
      transition-all duration-300
      hover:shadow-[var(--shadow-md)]
      ${className}
    `}
  >
    {children}
  </div>
);

const Lounge = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-headline text-[var(--text-bright)] mb-2">
          대시보드
        </h1>
        <p className="text-[var(--text-secondary)]">
          이번 주 일정과 최근 활동을 한눈에 확인하세요
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 주간 일정 - 큰 카드 */}
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <DashboardCard>
            <SectionHeader
              icon={<Calendar size={20} />}
              title="이번 주 일정"
              subtitle="예정된 회의와 일정"
            />
            <WeeklySchedule />
          </DashboardCard>
        </div>

        {/* 이슈 트래커 */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <DashboardCard className="h-full">
            <SectionHeader
              icon={<AlertCircle size={20} />}
              title="이슈 현황"
            />
            <IssueTracker />
          </DashboardCard>
        </div>

        {/* 최근 회의록 - 전체 너비 */}
        <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <DashboardCard>
            <SectionHeader
              icon={<FileText size={20} />}
              title="최근 회의록"
              subtitle="AI가 요약한 회의 내용"
            />
            <RecentMinutes />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default Lounge;