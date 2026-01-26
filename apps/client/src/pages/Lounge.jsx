// src/pages/Lounge.jsx 수정
import React from 'react';
// 주간 일정 컴포넌트 경로 주의 (아까 만드신 경로로)
import WeeklySchedule from '@/components/features/user/WeeklySchedule';
import RecentMinutes from "@/components/features/user/RecentMinutes";
import IssueTracker from "@/components/features/user/IssueTracker";

const Lounge = () => {
  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* 1. 이번 주 일정 */}
      <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <WeeklySchedule />
      </section>

      {/* 2. 최근 회의록 */}
      <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 min-h-[200px]">
        <RecentMinutes />
      </section>

      {/* 3. 이슈 트래커 (나중에 풀기) */}
      <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <IssueTracker />
      </section>
    </div>
  );
};

export default Lounge;