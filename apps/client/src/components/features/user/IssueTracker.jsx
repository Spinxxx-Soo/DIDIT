/**
 * Apple-Style Issue Tracker
 * Responsive card layout, clean design
 */
import React, { useState } from 'react';
import useLoungeStore from '@/store/useLoungeStore';
import { AlertCircle, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

// 임시 데이터 (나중에 API 연결)
const MOCK_ISSUES = [
  { id: 143, priority: 'High', title: '로그인 버그 수정', assignee: '김도연', status: '진행중', author: '김이', date: '2025-01-20' },
  { id: 142, priority: 'Medium', title: 'UI 컴포넌트 리팩토링', assignee: '이다연', status: '대기중', author: '손율준', date: '2025-01-19' },
  { id: 141, priority: 'Low', title: '문서 업데이트', assignee: '하지연', status: '완료', author: '홍수민', date: '2025-01-18' },
  { id: 140, priority: 'High', title: '결제 모듈 연동 실패', assignee: '박지성', status: '진행중', author: '김이', date: '2025-01-17' },
  { id: 139, priority: 'Medium', title: '메인 페이지 배너 교체', assignee: '손흥민', status: '대기중', author: '이강인', date: '2025-01-16' },
];

const ITEMS_PER_PAGE = 4;

const IssueTracker = () => {
  const { openIssueDetail } = useLoungeStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지네이션 로직
  const totalPages = Math.ceil(MOCK_ISSUES.length / ITEMS_PER_PAGE);
  const currentIssues = MOCK_ISSUES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 우선순위 스타일
  const getPriorityStyle = (priority) => {
    const styles = {
      High: 'bg-red-50 text-red-600 border-red-100',
      Medium: 'bg-amber-50 text-amber-600 border-amber-100',
      Low: 'bg-[var(--success-bg)] text-[var(--color-green-primary)] border-[var(--color-green-100)]',
    };
    return styles[priority] || 'bg-[var(--bg-input)] text-[var(--text-secondary)]';
  };

  // 상태 스타일
  const getStatusStyle = (status) => {
    const styles = {
      '진행중': 'bg-blue-50 text-blue-600',
      '대기중': 'bg-[var(--bg-input)] text-[var(--text-secondary)]',
      '완료': 'bg-[var(--success-bg)] text-[var(--color-green-primary)]',
    };
    return styles[status] || 'bg-[var(--bg-input)] text-[var(--text-secondary)]';
  };

  return (
    <div className="w-full flex flex-col min-h-0 max-w-full overflow-hidden">
      {/* 이슈 카드 목록 - 스크롤 가능 */}
      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
        {currentIssues.map((issue, index) => (
          <div
            key={issue.id}
            onClick={() => openIssueDetail(issue.id)}
            className="
              p-4
              bg-[var(--bg-input)]
              rounded-[var(--radius-xl)]
              border border-[var(--border-subtle)]
              cursor-pointer
              transition-all duration-300
              hover:-translate-y-0.5
              hover:shadow-[var(--shadow-md)]
              hover:border-[var(--border-strong)]
              animate-fade-up
            "
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 상단: 우선순위 + 이슈 번호 */}
            <div className="flex items-center justify-between mb-2">
              <span className={`
                px-2.5 py-1 
                text-xs font-semibold 
                rounded-full
                border
                ${getPriorityStyle(issue.priority)}
              `}>
                {issue.priority}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                #{issue.id}
              </span>
            </div>

            {/* 제목 */}
            <h4 className="text-sm font-semibold text-[var(--text-bright)] mb-3 line-clamp-1">
              {issue.title}
            </h4>

            {/* 하단: 메타 정보 */}
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {issue.assignee}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {issue.date}
                </span>
              </div>
              <span className={`
                px-2 py-0.5
                text-[11px] font-medium
                rounded-full
                ${getStatusStyle(issue.status)}
              `}>
                {issue.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-full
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
                rounded-full
                text-sm font-medium
                transition-all duration-200
                ${currentPage === i + 1
                  ? 'bg-[var(--color-green-primary)] text-white shadow-[var(--shadow-glow)]'
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
              rounded-full
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