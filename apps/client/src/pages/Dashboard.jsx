import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // 👈 [필수] 부모와 연결
import { Calendar as CalendarIcon, ClipboardList, Settings, Plus, Clock } from 'lucide-react';

// ✅ 공통 컴포넌트 활용
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { IconButton, Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal/Modal';
import { DraggableWindow } from '@/components/common/DraggableWindow';

const Dashboard = () => {
  // 1. [연결] WorkspaceLayout에서 내려준 데이터와 함수 가져오기
  // (방어 코드 추가: 데이터가 없어도 에러 안 나게 처리)
  const { issues = [], handleOpenIssueDetail = () => {} } = useOutletContext() || {};

  // --- [State] ---
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState(null); // 회의록용
  
  const mockIssues = [
    { id: 1, priority: 'High', title: '로그인 버그 수정', assignee: '김철수', status: 'In Progress' },
    { id: 2, priority: 'Medium', title: 'UI 개선 작업', assignee: '이영희', status: 'In Progress' },
    { id: 3, priority: 'Low', title: '문서 업데이트', assignee: '박민수', status: 'To Do' },
  ];

  // --- [Mock Data: 일정 & 회의록은 유지] ---
  const scheduleDates = [
    { day: 'Sun', date: '1/12', label: '주간 달력 (1/12)' },
    { day: 'Tue', date: '1/13', label: 'Tue (1/13)' },
    { day: 'Wed', date: '1/14', label: 'Wed (1/14)' },
    { day: 'Thu', date: '1/15', label: 'Thu (1/15)' },
    { day: 'Fri', date: '1/16', label: 'Fri (1/16)' },
    { day: 'Sat', date: '1/17', label: 'Sat (1/17)' },
    { day: 'Sun', date: '1/18', label: 'Sun (1/18)' },
  ];

  const recentMinutes = [
    { id: 1, date: '2025-01-10', title: '개발회의.md', desc: '로그인 버그', content: '## 1. 로그인 버그 논의\n- 간헐적으로 401 에러 발생\n- 토큰 갱신 로직 확인 필요\n\n## 2. 다음 스프린트 계획\n- 마이페이지 구현...' },
    { id: 2, date: '2025-01-08', title: '기획회의.md', desc: 'UI 개선', content: '## UI 피드백 반영\n- 버튼 크기 조절 요청\n- 메인 컬러 채도 낮추기' },
    { id: 3, date: '2025-01-09', title: '긴급버그.md', desc: '결제 오류', content: '## PG사 연동 오류\n- 결제 모듈 버전 업데이트 필요' },
  ];

  // ⚠️ [대체] activeIssues 가짜 데이터 대신 props로 받은 issues 사용
  // 화면에 보여줄 이슈 (최대 5개 정도만)
  const displayIssues = (issues.length > 0 ? issues : mockIssues).slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen relative">
      
      {/* 1. 이번 주 일정 (변경 없음) */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            이번 주 일정
          </CardTitle>
          <IconButton 
            icon={<Plus size={16} />} 
            size="sm" 
            variant="ghost" 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setIsScheduleModalOpen(true)}
          />
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-7 border border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 rounded-t-md">
            {scheduleDates.map((item, idx) => (
              <div key={idx} className="py-2 border-r border-gray-200 last:border-r-0">{item.label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border border-t-0 border-gray-200 h-16 rounded-b-md relative bg-white">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="border-r border-gray-200 h-full last:border-r-0"></div>
            ))}
            <div className="absolute top-2 left-2 w-[calc(28.5%-16px)] h-8 bg-blue-50 border border-blue-100 rounded text-blue-600 text-xs flex items-center justify-center font-medium shadow-sm">
              기획 구상 및 마무리
            </div>
            <div className="absolute top-2 right-2 w-[calc(28.5%-16px)] h-8 bg-green-50 border border-green-100 rounded text-green-600 text-xs flex items-center justify-center font-medium shadow-sm">
              데이터 수집 및 전처리
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 최근 회의록 (변경 없음) */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            최근 회의록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mt-2">
            {recentMinutes.map((minute) => (
              <li 
                key={minute.id} 
                className="flex items-center text-sm text-gray-600 pl-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group"
                onClick={() => setSelectedMinute(minute)}
              >
                <span className="text-gray-400 mr-2 group-hover:text-[var(--color-green-primary)]">-</span>
                <span className="text-gray-500">[{minute.date}]</span>
                <span className="font-medium text-gray-700 mx-2 group-hover:underline">{minute.title}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-500 ml-2">{minute.desc}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 3. 진행중인 이슈 (❗️여기만 수정됨) */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
            <Settings className="w-5 h-5 text-purple-500" />
            진행중인 이슈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-400">
                  <th className="py-3 pl-4 w-24">우선순위</th>
                  <th className="py-3">제목</th>
                  <th className="py-3 w-20">번호</th>
                  <th className="py-3 w-24">담당자</th>
                  <th className="py-3 w-24">상태</th>
                </tr>
              </thead>
              <tbody>
                {/* displayIssues로 교체 */}
                {displayIssues.map((issue) => (
                  <tr 
                    key={issue.id} 
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm text-gray-700 cursor-pointer"
                    // ⭐️ [핵심] 클릭 시 사이드바 오픈 함수 실행
                    onClick={() => handleOpenIssueDetail(issue)}
                  >
                    <td className="py-4 pl-4">
                      {/* priority 값에 따라 색상 처리 (데이터 호환성 고려) */}
                      <Badge variant={
                          issue.priority === 'error' || issue.priority === 'High' ? 'error' : 
                          issue.priority === 'warning' || issue.priority === 'Medium' ? 'warning' : 'success'
                        } size="sm">
                        {issue.priority === 'error' ? 'High' : issue.priority === 'warning' ? 'Medium' : issue.priority}
                      </Badge>
                    </td>
                    <td className="py-4 font-medium hover:text-[var(--color-green-primary)]">{issue.title}</td>
                    <td className="py-4 text-gray-500">#{issue.id}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={issue.assignee} size="xs" />
                        <span>{issue.assignee}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500">{issue.status}</td>
                  </tr>
                ))}
                {displayIssues.length === 0 && (
                   <tr><td colSpan="5" className="py-4 text-center text-gray-400">이슈가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* [모달 1] 일정 추가 모달 (유지) */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="새 일정 추가"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>취소</Button>
            <Button onClick={() => { alert('일정이 추가되었습니다!'); setIsScheduleModalOpen(false); }}>추가하기</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="일정 제목" placeholder="예: 기획 회의" />
          <div className="grid grid-cols-2 gap-4">
             <Input type="date" label="시작일" />
             <Input type="date" label="종료일" />
          </div>
          <Input label="설명 (선택)" placeholder="간단한 메모를 입력하세요" />
        </div>
      </Modal>

      {/* [Draggable Window] 회의록 상세 보기 (유지) */}
      {selectedMinute && (
        <DraggableWindow
          isOpen={true}
          onClose={() => setSelectedMinute(null)}
          title={selectedMinute.title}
          defaultX={200}
          defaultY={150}
          defaultWidth={600}
          defaultHeight={500}
        >
          <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 pb-4 border-b border-gray-100">
                <Clock size={16} /> <span>{selectedMinute.date}</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="font-medium text-gray-700">{selectedMinute.desc}</span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-line leading-relaxed font-mono border border-gray-200">
                {selectedMinute.content}
            </div>
          </div>
        </DraggableWindow>
      )}

      {/* ⚠️ 이슈 상세 Modal은 삭제했습니다. (RightSidebar가 대신하므로) */}

    </div>
  );
};

export default Dashboard;