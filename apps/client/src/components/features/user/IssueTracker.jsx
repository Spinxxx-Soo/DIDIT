/**
 * Apple-Style Issue Tracker
 * Table layout with pagination
 */
import React, { useState } from 'react';
import useLoungeStore from '@/store/useLoungeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 임시 데이터 (나중에 API 연결)
const MOCK_ISSUES = [
  { id: 143, priority: 'High', title: '로그인 버그 수정', assignee: '김도연', status: '진행중', date: '2025-01-20' },
  { id: 142, priority: 'Medium', title: 'UI 컴포넌트 리팩토링', assignee: '이다연', status: '대기중', date: '2025-01-19' },
  { id: 141, priority: 'Low', title: '문서 업데이트', assignee: '하지연', status: '완료', date: '2025-01-18' },
  { id: 140, priority: 'High', title: '결제 모듈 연동 실패', assignee: '홍수민', status: '진행중', date: '2025-01-17' },
  { id: 139, priority: 'Medium', title: '메인 페이지 배너 교체', assignee: '김이', status: '대기중', date: '2025-01-16' },
  { id: 138, priority: 'Low', title: 'API 응답 최적화', assignee: '손을준', status: '완료', date: '2025-01-15' },
  { id: 137, priority: 'High', title: '보안 취약점 패치', assignee: '이강인', status: '진행중', date: '2025-01-14' },
];

const ITEMS_PER_PAGE = 5;

const IssueTracker = () => {
  const { openIssueDetail } = useLoungeStore();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(MOCK_ISSUES.length / ITEMS_PER_PAGE);
  const currentIssues = MOCK_ISSUES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 우선순위 스타일
  const getPriorityStyle = (priority) => {
    const styles = {
      High: 'bg-red-50 text-red-600',
      Medium: 'bg-amber-50 text-amber-600',
      Low: 'bg-emerald-50 text-emerald-600',
    };
    return styles[priority] || 'bg-gray-50 text-gray-600';
  };

  // 상태 스타일
  const getStatusStyle = (status) => {
    const styles = {
      '진행중': 'bg-blue-50 text-blue-600',
      '대기중': 'bg-gray-100 text-gray-600',
      '완료': 'bg-emerald-50 text-emerald-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="w-full">
      {/* 테이블 */}
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
        {/* 테이블 바디 */}
        <div className="divide-y divide-[var(--border-subtle)] bg-white">
          {currentIssues.map((issue, index) => (
            <div
              key={issue.id}
              onClick={() => openIssueDetail(issue.id)}
              className="
                grid grid-cols-[80px_1fr_100px_100px_80px_60px] gap-4 px-4 py-3.5
                cursor-pointer
                transition-all duration-200
                hover:bg-[var(--bg-input)]
                animate-fade-up
              "
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* 우선순위 */}
              <span className={`
                inline-flex items-center justify-center
                px-2 py-0.5
                text-[11px] font-semibold
                rounded-full
                w-fit
                ${getPriorityStyle(issue.priority)}
              `}>
                {issue.priority}
              </span>

              {/* 제목 */}
              <span className="text-sm font-medium text-[var(--text-bright)] truncate">
                {issue.title}
              </span>

              {/* 담당자 */}
              <span className="text-sm text-[var(--text-secondary)]">
                {issue.assignee}
              </span>

              {/* 날짜 */}
              <span className="text-sm text-[var(--text-tertiary)]">
                {issue.date}
              </span>

              {/* 상태 */}
              <span className={`
                inline-flex items-center justify-center
                px-2 py-0.5
                text-[11px] font-medium
                rounded-full
                w-fit
                ${getStatusStyle(issue.status)}
              `}>
                {issue.status}
              </span>

              {/* ID */}
              <span className="text-sm text-[var(--text-tertiary)] text-right">
                #{issue.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="
                w-8 h-8
                flex items-center justify-center
                rounded-lg
                text-[var(--text-secondary)]
                transition-all duration-200
                hover:bg-[var(--bg-input)]
                disabled:opacity-30 disabled:cursor-not-allowed
              "
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`
                  w-8 h-8
                  flex items-center justify-center
                  rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                  ${currentPage === i + 1
                  ? 'bg-[var(--color-green-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                }
                `}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-lg
              text-[var(--text-secondary)]
              transition-all duration-200
              hover:bg-[var(--bg-input)]
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueTracker;