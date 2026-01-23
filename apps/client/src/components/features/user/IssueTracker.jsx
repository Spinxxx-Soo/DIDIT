import React, { useState } from 'react';
import useLoungeStore from '@/store/useLoungeStore'; // ★ 무전기 가져오기

// 임시 데이터 (나중에 API 연결)
const MOCK_ISSUES = [
  { id: 143, priority: 'High', title: '로그인 버그 수정', assignee: '김도연', status: '진행중', author: '김이', date: '2025-01-20' },
  { id: 142, priority: 'Medium', title: 'UI 컴포넌트 리팩토링', assignee: '이다연', status: '대기중', author: '손율준', date: '2025-01-19' },
  { id: 141, priority: 'Low', title: '문서 업데이트', assignee: '하지연', status: '완료', author: '홍수민', date: '2025-01-18' },
  { id: 140, priority: 'High', title: '결제 모듈 연동 실패', assignee: '박지성', status: '진행중', author: '김이', date: '2025-01-17' },
  { id: 139, priority: 'Medium', title: '메인 페이지 배너 교체', assignee: '손흥민', status: '대기중', author: '이강인', date: '2025-01-16' },
  { id: 138, priority: 'Low', title: '폰트 사이즈 조정', assignee: '김민재', status: '완료', author: '황희찬', date: '2025-01-15' },
];

const ITEMS_PER_PAGE = 5;

const IssueTracker = () => {
  const { openIssueDetail } = useLoungeStore(); // ★ 스토어에서 함수 꺼내기
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지네이션 로직
  const totalPages = Math.ceil(MOCK_ISSUES.length / ITEMS_PER_PAGE);
  const currentIssues = MOCK_ISSUES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 뱃지 스타일 도우미 함수
  const getPriorityBadge = (p) => {
    const styles = {
      High: 'bg-red-100 text-red-700 border-red-200',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Low: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[p] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="w-full flex flex-col h-full">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        ⚙️ 진행중인 이슈 (이슈 트래커)
      </h2>

      {/* 테이블 영역 */}
      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">제목</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentIssues.map((issue) => (
              <tr 
                key={issue.id} 
                onClick={() => openIssueDetail(issue.id)} // ★ 클릭 시 사이드바 열기!
                className="hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${getPriorityBadge(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center">#{issue.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center">{issue.assignee}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center">{issue.author}</td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center">{issue.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors
              ${currentPage === i + 1 ? 'bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-700'}
            `}
          >
            {i + 1}
          </button>
        ))}
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default IssueTracker;