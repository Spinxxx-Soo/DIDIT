import { X, ArrowLeft, Save, Trash2 } from 'lucide-react'; // 아이콘 추가
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/Button/IconButton';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';

const RightSidebar = ({ activePanel, onClose }) => {
  const isChat = activePanel === 'chat';
  const isIssue = activePanel === 'issue';

  // --- 상태 관리 ---
  const [chatMessage, setChatMessage] = useState('');
  
  // 이슈 뷰 모드: 'list' | 'form'
  const [issueViewMode, setIssueViewMode] = useState('list');
  
  // 현재 작성/수정 중인 폼 데이터
  const initialFormState = { id: null, title: '', priority: 'warning', assignee: '', description: '', status: 'Open' };
  const [formData, setFormData] = useState(initialFormState);

  // 로컬 데이터 (실제로는 API에서 가져오겠지만, CRUD 시뮬레이션을 위해 state로 변환)
  const [issues, setIssues] = useState([
    { id: 23, title: '로그인 페이지 CSS 깨짐 현상', priority: 'error', assignee: '하지연', description: '모바일 뷰에서 로그인 버튼이 겹칩니다.', status: 'Open', date: '2024-05-20' },
    { id: 22, title: 'API 응답 속도 개선 필요', priority: 'warning', assignee: '김도연', description: 'GET /users 호출 시 2초 이상 소요됨.', status: 'In Progress', date: '2024-05-19' },
  ]);

  // 헤더 타이틀 동적 계산
  const getTitle = () => {
    if (isChat) return '채팅';
    if (isIssue) {
      if (issueViewMode === 'list') return '이슈 트래커';
      return formData.id ? '이슈 수정 (# ' + formData.id + ')' : '새 이슈 생성';
    }
    return '';
  };

  // --- 핸들러 ---

  // 1. 새 이슈 생성 모드로 진입
  const handleCreateClick = () => {
    setFormData(initialFormState); // 폼 초기화
    setIssueViewMode('form');
  };

  // 2. 기존 이슈 수정 모드로 진입
  const handleIssueClick = (issue) => {
    setFormData(issue); // 선택된 이슈 데이터로 폼 채우기
    setIssueViewMode('form');
  };

  // 3. 목록으로 돌아가기
  const handleBackToList = () => {
    setIssueViewMode('list');
    setFormData(initialFormState);
  };

  // 4. 이슈 저장 (생성/수정 분기 처리)
  const handleSaveIssue = () => {
    if (!formData.title.trim()) return alert('제목을 입력해주세요.');

    if (formData.id) {
      // 수정 로직
      setIssues(issues.map(issue => issue.id === formData.id ? formData : issue));
    } else {
      // 생성 로직
      const newIssue = {
        ...formData,
        id: Math.max(...issues.map(i => i.id), 0) + 1, // 임시 ID 생성
        date: new Date().toLocaleDateString(),
        status: 'Open',
        assignee: formData.assignee || '미지정' // 임시 처리
      };
      setIssues([newIssue, ...issues]);
    }
    handleBackToList();
  };

  // 5. 입력 값 변경 핸들러
  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- 채팅 데이터 (기존 유지) ---
  const messages = [
    { id: 1, sender: '김도연', content: '레이아웃 작업 완료했습니다! 확인 부탁드려요.', time: '오후 2:30', isMine: false },
    { id: 2, sender: '나', content: '네, 지금 확인 중입니다. 이슈 탭 애니메이션도 추가할게요.', time: '오후 2:32', isMine: true },
  ];

  return (
    <aside className="w-[360px] flex flex-col h-full bg-[var(--bg-panel)] transition-all duration-300">
      {/* 1. 헤더 영역 */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)] flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* 이슈 폼 모드일 때만 뒤로가기 버튼 표시 */}
          {isIssue && issueViewMode === 'form' && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={18} />}
              onClick={handleBackToList}
              title="목록으로"
            />
          )}
          <h2 className="font-bold text-lg text-[var(--text-bright)] flex items-center gap-2">
            {getTitle()}
          </h2>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<X size={18} />}
          onClick={onClose}
          title="닫기"
        />
      </div>

      {/* 2. 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-app)] relative">
        {isChat ? (
          // --- 채팅 뷰 ---
          <div className="space-y-4">
             {/* ... 기존 채팅 코드 ... */}
             <div className="text-center text-[12px] text-[var(--text-tertiary)] my-4">오늘</div>
             {messages.map((msg) => (
               <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                 <Avatar name={msg.sender} size="sm" />
                 <div className={msg.isMine ? 'text-right' : ''}>
                   <div className={`p-3 rounded-[var(--radius-lg)] text-[14px] ${
                     msg.isMine
                       ? 'bg-[var(--color-green-primary)] text-white rounded-tr-none text-left'
                       : 'bg-[var(--bg-panel)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none shadow-[var(--shadow-sm)]'
                   }`}>
                     {msg.content}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        ) : isIssue ? (
          // --- 이슈 영역 (List <-> Form 스위칭) ---
          <>
            {/* A. 이슈 목록 뷰 */}
            {issueViewMode === 'list' && (
              <div className="space-y-3 animate-fade-in">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleIssueClick(issue)} // 클릭 시 수정 폼으로 이동
                    className="bg-[var(--bg-panel)] p-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] hover:border-[var(--color-green-primary)] transition-colors duration-200 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={issue.priority} size="sm">
                        {issue.priority === 'error' ? 'High' : 'Medium'}
                      </Badge>
                      <span className="text-[12px] text-[var(--text-tertiary)] group-hover:text-[var(--color-green-primary)] transition-colors">
                        #{issue.id}
                      </span>
                    </div>
                    <h3 className="font-medium text-[var(--text-bright)] text-[14px] mb-2">{issue.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={issue.assignee} size="xs" />
                        <span className="text-[13px] text-[var(--text-secondary)]">{issue.assignee}</span>
                      </div>
                      <span className="text-[11px] text-[var(--text-tertiary)]">{issue.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* B. 이슈 입력/수정 폼 뷰 */}
            {issueViewMode === 'form' && (
              <div className="space-y-5 animate-slide-in-right">
                {/* 제목 입력 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">제목</label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="이슈 제목을 입력하세요"
                    className="w-full"
                  />
                </div>

                {/* 우선순위 선택 (간단한 라디오 버튼 역할) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">우선순위</label>
                  <div className="flex gap-2">
                    {['warning', 'error'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleFormChange('priority', p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          formData.priority === p
                            ? p === 'error' 
                              ? 'bg-red-100 text-red-700 border-red-200' 
                              : 'bg-orange-100 text-orange-700 border-orange-200'
                            : 'bg-transparent border-[var(--border-default)] text-[var(--text-tertiary)]'
                        }`}
                      >
                        {p === 'error' ? 'High' : 'Medium'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 담당자 입력 */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">담당자</label>
                    <Input 
                      value={formData.assignee}
                      onChange={(e) => handleFormChange('assignee', e.target.value)} 
                      placeholder="담당자 이름"
                    />
                </div>

                {/* 내용 입력 (Textarea 대용) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">상세 내용</label>
                  <textarea
                    className="w-full h-40 p-3 text-sm bg-[var(--bg-panel)] border border-[var(--border-default)] rounded-[var(--radius-lg)] focus:outline-none focus:border-[var(--color-green-primary)] resize-none text-[var(--text-primary)]"
                    placeholder="이슈에 대한 상세 설명을 작성해주세요..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* 3. 하단 입력/버튼 영역 */}
      <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-panel)] flex-shrink-0">
        {isChat ? (
          <div className="flex gap-2">
            <Input placeholder="메시지 입력..." size="md" className="flex-1" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
            <Button variant="primary" size="md">➤</Button>
          </div>
        ) : isIssue ? (
          issueViewMode === 'list' ? (
            // 목록 모드일 때: 생성 버튼
            <Button variant="primary" size="md" className="w-full" onClick={handleCreateClick}>
              + 새 이슈 생성하기
            </Button>
          ) : (
            // 폼 모드일 때: 저장/취소 버튼
            <div className="flex gap-2">
               {formData.id && ( // 수정 모드일 때만 삭제 버튼 노출 (선택사항)
                 <Button variant="danger" size="md" onClick={() => {/* 삭제 로직 */}} className="bg-red-50 text-red-600 hover:bg-red-100 border-none w-12 flex justify-center px-0">
                    <Trash2 size={18} />
                 </Button>
               )}
              <Button variant="secondary" size="md" className="flex-1" onClick={handleBackToList}>
                취소
              </Button>
              <Button variant="primary" size="md" className="flex-1 flex items-center justify-center gap-2" onClick={handleSaveIssue}>
                <Save size={16} />
                {formData.id ? '수정 완료' : '이슈 등록'}
              </Button>
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
};

export default RightSidebar;