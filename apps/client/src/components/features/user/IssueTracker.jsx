/**
 * Apple-Style Issue Tracker
 * Table layout with pagination
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useLoungeStore from '@/store/useLoungeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

// 날짜 포맷 함수
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
};

const IssueTracker = () => {
  const { projectId } = useParams();
  const { issues, fetchIssues, isLoading, openIssueDetail } = useLoungeStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 이슈 목록 불러오기
  useEffect(() => {
    if (projectId) {
      fetchIssues(projectId);
    }
  }, [projectId, fetchIssues]);

  // [수정됨] 이슈 목록에는 OPEN 상태만 표시 (도넛 차트는 모든 이슈 사용)
  const openIssues = issues.filter(issue => issue.status === 'open');

  const totalPages = Math.ceil(openIssues.length / ITEMS_PER_PAGE);
  const currentIssues = openIssues.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 우선순위 스타일 (소문자로 정규화됨)
  const getPriorityStyle = (priority) => {
    const styles = {
      high: 'bg-red-50 text-red-600',
      medium: 'bg-amber-50 text-amber-600',
      low: 'bg-emerald-50 text-emerald-600',
    };
    return styles[priority] || 'bg-gray-50 text-gray-600';
  };

  // 우선순위 라벨
  const getPriorityLabel = (priority) => {
    const labels = { high: 'High', medium: 'Medium', low: 'Low' };
    return labels[priority] || priority;
  };

  // 상태 스타일 (소문자로 정규화됨: open/closed)
  const getStatusStyle = (status) => {
    const styles = {
      open: 'bg-blue-50 text-blue-600',
      closed: 'bg-emerald-50 text-emerald-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  // 상태 라벨
  const getStatusLabel = (status) => {
    const labels = { open: 'Open', closed: 'Closed' };
    return labels[status] || status;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <span className="text-sm text-[var(--text-tertiary)]">로딩 중...</span>
      </div>
    );
  }

  // 이슈가 없는 경우
  if (openIssues.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <span className="text-sm text-[var(--text-tertiary)]">등록된 이슈가 없습니다.</span>
      </div>
    );
  }

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
                {getPriorityLabel(issue.priority)}
              </span>

              {/* 제목 */}
              <span className="text-sm font-medium text-[var(--text-bright)] truncate">
                {issue.title}
              </span>

              {/* 담당자 */}
              <span className="text-sm text-[var(--text-secondary)]">
                {issue.assignees?.[0] || '-'}
              </span>

              {/* 날짜 */}
              <span className="text-sm text-[var(--text-tertiary)]">
                {formatDate(issue.createdAt)}
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
                {getStatusLabel(issue.status)}
              </span>

              {/* ID */}
              <span className="text-sm text-[var(--text-tertiary)] text-right">
                #{issue.issueNo || issue.id}
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