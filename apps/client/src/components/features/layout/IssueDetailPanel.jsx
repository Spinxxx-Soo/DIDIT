import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, AlertCircle, CheckCircle2, Clock, Trash2, Sparkles, Github } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Divider } from '@/components/common/Divider';
import useLoungeStore from '@/store/useLoungeStore';
import useProjectStore from '@/store/useProjectStore';

// Priority 설정
const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    variant: 'error',
    icon: <AlertCircle size={14} />
  },
  medium: {
    label: 'Medium',
    variant: 'warning',
    icon: <Clock size={14} />
  },
  low: {
    label: 'Low',
    variant: 'info',
    icon: <CheckCircle2 size={14} />
  },
};

// Status 설정
const STATUS_CONFIG = {
  open: { label: 'Open', variant: 'warning' },
  closed: { label: 'Closed', variant: 'success' },
};

const IssueDetailPanel = () => {
  const {
    selectedIssueId,
    closeSidebar,
    setActivePanel,
    getIssueById,
    analyzeIssueContent,
    registerIssue,
    updateIssue,
    deleteIssue,
    isLoading
  } = useLoungeStore();

  const { currentProject, fetchParticipants } = useProjectStore();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (currentProject?.id) {
      fetchParticipants(currentProject.id).then(setParticipants);
    }
  }, [currentProject?.id, fetchParticipants]);

  const isCreateMode = selectedIssueId === null;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    status: 'open',
    priority: 'medium',
    assignees: []
  });
  const [assigneeInput, setAssigneeInput] = useState('');

  // AI 분석 상태 관리
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null); // { issueId, priority, status }
  const eventSourceRef = useRef(null);
  const sseTimeoutRef = useRef(null); // SSE 타임아웃 관리

  // SSE 타임아웃 정리 함수
  const clearSSETimeout = () => {
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
      sseTimeoutRef.current = null;
    }
  };

  // SSE 연결 정리 함수
  const cleanupSSE = () => {
    clearSSETimeout();
    if (eventSourceRef.current) {
      console.log('[SSE] AI 분석 SSE 연결 종료');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // 컴포넌트 언마운트 또는 모드 변경 시 SSE 정리
  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, []);

  // 생성 모드가 아닐 때 SSE 정리
  useEffect(() => {
    if (!isCreateMode) {
      cleanupSSE();
    }
  }, [isCreateMode]);

  useEffect(() => {
    if (isCreateMode) {
      setFormData({
        title: '',
        body: '',
        status: 'open',
        priority: 'medium',
        assignees: []
      });
      setAnalyzedData(null);
      setIsEditing(true);
    } else {
      const found = getIssueById(selectedIssueId);
      if (found) {
        setFormData(found);
      } else {
        setFormData({
          title: '',
          body: '',
          status: 'open',
          priority: 'medium',
          assignees: []
        });
      }
      setAnalyzedData(null);
      setIsEditing(false);
    }
  }, [selectedIssueId, isCreateMode, getIssueById]);

  // SSE 연결 함수
  const connectSSE = (projectId, issueId) => {
    // 기존 연결 정리
    cleanupSSE();

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';
    const es = new EventSource(`${baseUrl}/api/v1/projects/${projectId}/stream`, {
      withCredentials: true
    });

    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE] AI 분석 SSE 연결 성공');
    };

    // AI 분석 결과 이벤트 리스너
    es.addEventListener('ai_analysis_result', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] AI 분석 결과 수신:', data);

        // 현재 분석 중인 이슈의 결과인지 확인
        if (data.issueId === issueId || data.issueId === String(issueId)) {
          clearSSETimeout(); // 타임아웃 취소
          const priority = data.priority?.toLowerCase() || 'medium';

          setAnalyzedData(prev => ({
            ...prev,
            priority: data.priority,
            score: data.score
          }));

          setFormData(prev => ({ ...prev, priority }));
          setIsAnalyzing(false);

          alert(`🤖 AI 분석 완료! 우선순위가 '${data.priority}'(으)로 추천되었습니다.`);

          // 분석 완료 후 SSE 연결 종료
          cleanupSSE();
        }
      } catch (err) {
        console.error('[SSE] AI 분석 결과 파싱 오류:', err);
      }
    });

    es.onerror = (err) => {
      console.error('[SSE] AI 분석 SSE 연결 오류:', err);
      cleanupSSE();
      // SSE 오류 시 타임아웃 대기 없이 바로 기본값으로 완료 처리
      setIsAnalyzing(false);
    };

    // 30초 타임아웃 설정 - AI 응답이 없으면 기본 우선순위(MEDIUM)로 분석 완료 처리
    sseTimeoutRef.current = setTimeout(() => {
      console.log('[SSE] AI 분석 타임아웃 (30초) - 기본값으로 진행');
      cleanupSSE();
      setIsAnalyzing(false);
      alert('⏱️ AI 분석 시간이 초과되었습니다. 기본 우선순위(Medium)로 설정되었습니다. 이슈를 등록하실 수 있습니다.');
    }, 30000);

    return es;
  };

  const handleAnalyze = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      alert('분석을 위해 제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (!currentProject?.id) {
      alert('프로젝트 정보가 없습니다.');
      return;
    }

    try {
      setIsAnalyzing(true);
      // 담당자 ID 변환
      const assigneeIds = formData.assignees
        .map(name => participants.find(p => p.name === name || p.nickname === name)?.id)
        .filter(id => id);

      // API 호출하여 분석 요청 (issueId 획득)
      // 이슈 상태가 없으면 기본값 OPEN 사용
      const statusToSend = formData.status ? formData.status.toUpperCase() : 'OPEN';

      const result = await analyzeIssueContent(currentProject.id, {
        title: formData.title,
        body: formData.body,
        status: statusToSend,
        assigneeIds
      });

      // issueId를 저장하고 SSE 연결
      if (result.issueId) {
        setAnalyzedData(result);
        // SSE 연결하여 실제 AI 분석 결과 대기
        connectSSE(currentProject.id, result.issueId);
      } else {
        throw new Error('issueId가 반환되지 않았습니다.');
      }
    } catch (error) {
      console.error('AI 분석 요청 실패:', error);
      alert('AI 분석에 실패했습니다.');
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    // 분석 중일 때는 저장 불가
    if (isAnalyzing) {
      alert('AI 분석이 진행 중입니다. 분석이 완료된 후 다시 시도해주세요.');
      return;
    }

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (isCreateMode) {
      if (!currentProject?.id) {
        alert('프로젝트 정보를 찾을 수 없습니다.');
        return;
      }

      // AI 분석 수행 여부 확인 - 분석 없이는 등록 불가
      if (!analyzedData) {
        alert('이슈 등록을 위해 AI 분석이 필요합니다. 먼저 "지금 분석하기" 버튼을 눌러주세요.');
        return;
      }

      // 저장소 정보 파싱 - 개선된 로직
      const rawUrl = currentProject.repoFullName || '';
      let orgName = '';
      let repoName = '';

      if (rawUrl) {
        // 1. .git 확장자 제거
        let cleanUrl = rawUrl.replace(/\.git$/, '');

        // 2. 프로토콜 (https://, http://) 및 github.com 도메인 제거
        // 예: https://github.com/owner/repo -> owner/repo
        cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');

        // 3. 앞뒤 슬래시 혹시 있으면 제거
        cleanUrl = cleanUrl.replace(/^\/+|\/+$/g, '');

        const parts = cleanUrl.split('/');
        if (parts.length >= 2) {
          orgName = parts[0];
          repoName = parts[1];
        }
      }

      if (!orgName || !repoName) {
        alert('GitHub 저장소 주소가 올바르지 않습니다. 프로젝트 설정에서 저장소 주소를 확인해주세요.');
        return;
      }

      const assigneeIds = formData.assignees
        .map(name => participants.find(p => p.name === name || p.nickname === name)?.id)
        .filter(id => id);

      try {
        await registerIssue(currentProject.id, {
          title: formData.title,
          body: formData.body,
          orgName,
          repoName,
          issueId: analyzedData.issueId, // 분석된 ID 사용
          issueStatus: formData.status.toUpperCase(),
          issuePriority: formData.priority.toUpperCase(), // AI가 추천하고 사용자가 수정한 Priority 사용
          assigneeIds,
        });
        alert('✅ 새 이슈가 등록되었습니다! GitHub 저장소에도 이슈가 생성되었습니다.');
      } catch (e) {
        console.error('이슈 생성 실패:', e);
        // 에러 메시지 상세화
        const errorMessage = e?.response?.data?.message || e?.message || '';
        if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
          alert('❌ 이슈 생성에 실패했습니다.\n\n가능한 원인:\n• GitHub 계정 연동이 필요합니다\n• 저장소에 대한 쓰기 권한이 없습니다\n\n설정에서 GitHub 연동 상태를 확인해주세요.');
        } else if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
          alert('❌ 이슈 생성에 실패했습니다.\n\n저장소를 찾을 수 없습니다. GitHub 저장소 연동 정보를 확인해주세요.');
        } else {
          alert('❌ 이슈 생성에 실패했습니다.\n\n' + (errorMessage || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
        }
      }
    } else {
      updateIssue(selectedIssueId, {
        title: formData.title,
        body: formData.body,
        status: formData.status,
        priority: formData.priority,
        assignees: formData.assignees,
      });
      alert(`✅ 이슈가 수정되었습니다!`);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('정말 이 이슈를 삭제하시겠습니까?')) return;
    deleteIssue(selectedIssueId);
    alert('🗑️ 이슈가 삭제되었습니다.');
  };

  const handleBack = () => {
    if (isCreateMode && (formData.title || formData.body)) {
      if (!confirm("작성 중인 내용이 사라집니다. 목록으로 가시겠습니까?")) return;
    }
    if (isEditing && !isCreateMode) {
      if (!confirm("수정 중인 내용이 사라집니다. 목록으로 가시겠습니까?")) return;
    }
    setActivePanel('issue');
  };

  const handleAddAssignee = () => {
    if (!assigneeInput.trim()) return;
    if (formData.assignees.includes(assigneeInput.trim())) {
      alert('이미 추가된 담당자입니다.');
      return;
    }
    setFormData({
      ...formData,
      assignees: [...formData.assignees, assigneeInput.trim()]
    });
    setAssigneeInput('');
  };

  const handleRemoveAssignee = (name) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.filter(a => a !== name)
    });
  };

  // GitHub 저장소 연동 여부 확인
  const isGithubConnected = !!currentProject?.repoFullName;

  // GitHub 미연동 시 안내 화면 표시
  if (!isGithubConnected) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* 헤더 */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-default)] flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={18} />}
              onClick={() => setActivePanel('issue')}
              title="목록으로 돌아가기"
            />
            <h2 className="font-bold text-base truncate">이슈</h2>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<X size={18} />}
            onClick={closeSidebar}
            title="닫기"
          />
        </div>

        {/* GitHub 연동 안내 */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4">
            <Github size={32} className="text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            GitHub 저장소 연동이 필요합니다
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-[240px]">
            상단 GNB에서 GitHub 저장소를 연결하면 이슈를 생성하고 관리할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-default)] flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} />}
            onClick={handleBack}
            title="목록으로 돌아가기"
          />
          <h2 className="font-bold text-base truncate">
            {isCreateMode ? '새 이슈 생성' : `이슈 #${formData.issueNo || selectedIssueId}`}
          </h2>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<X size={18} />}
          onClick={closeSidebar}
          title="닫기"
        />
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            제목 <span className="text-[var(--color-error)]">*</span>
          </label>
          {isEditing ? (
            <Input
              placeholder="이슈 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              size="md"
              autoFocus={isCreateMode}
            />
          ) : (
            <div className="text-lg font-semibold text-[var(--text-bright)] break-words">
              {formData.title}
            </div>
          )}
        </div>

        <Divider />

        {/* 상태 & Priority */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              상태
            </label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-green-primary)] focus:ring-3 focus:ring-[var(--color-green-primary)]/20"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <Badge variant={STATUS_CONFIG[formData.status].variant} size="md">
                {STATUS_CONFIG[formData.status].label}
              </Badge>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              우선순위
            </label>
            {isEditing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-10 px-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-green-primary)] focus:ring-3 focus:ring-[var(--color-green-primary)]/20"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            ) : (
              <Badge
                variant={PRIORITY_CONFIG[formData.priority].variant}
                size="md"
                leftIcon={PRIORITY_CONFIG[formData.priority].icon}
              >
                {PRIORITY_CONFIG[formData.priority].label}
              </Badge>
            )}
          </div>
        </div>

        {/* AI 분석 알림 (생성 모드일 때만 표시) */}
        {isCreateMode && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                <Sparkles size={14} className="fill-blue-700" />
                AI 우선순위 분석 (필수)
              </span>
              {analyzedData ? (
                <span className="text-xs text-green-600 font-bold">
                  분석 완료! (추천: {analyzedData.priority})
                </span>
              ) : (
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !formData.title || !formData.body}
                >
                  {isAnalyzing ? '분석 중...' : '지금 분석하기'}
                </Button>
              )}
            </div>
            <p className="text-[11px] text-blue-600/80 leading-relaxed">
              제목과 내용을 작성하고 분석 버튼을 눌러주세요. 인공지능이 분석을 마쳐야 이슈를 등록할 수 있습니다.
            </p>
          </div>
        )}

        <Divider />

        {/* 담당자 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            담당자
          </label>

          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="이름 입력 후 Enter"
                  value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAssignee();
                    }
                  }}
                  size="sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAssignee}
                >
                  추가
                </Button>
              </div>

              {formData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.assignees.map((name, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-full text-sm"
                    >
                      <Avatar name={name} size="xs" />
                      <span className="text-[var(--text-primary)]">{name}</span>
                      <button
                        onClick={() => handleRemoveAssignee(name)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {formData.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.assignees.map((name, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-input)] rounded-full text-sm"
                    >
                      <Avatar name={name} size="xs" />
                      <span className="text-[var(--text-primary)]">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-[var(--text-tertiary)]">담당자 없음</span>
              )}
            </div>
          )}
        </div>

        <Divider />

        {/* 내용 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            내용
          </label>
          {isEditing ? (
            <textarea
              rows={10}
              placeholder="이슈 내용을 자세히 적어주세요."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-green-primary)] focus:ring-3 focus:ring-[var(--color-green-primary)]/20 resize-none"
            />
          ) : (
            <div className="bg-[var(--bg-app)] p-4 rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] min-h-[200px] whitespace-pre-wrap border border-[var(--border-default)]">
              {formData.body || '내용이 없습니다.'}
            </div>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-panel)] flex justify-between gap-2">
        {/* 삭제 버튼 (수정 모드일 때만) */}
        {!isCreateMode && (
          <Button
            variant="danger-outline"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={handleDelete}
          >
            삭제
          </Button>
        )}

        {/* 우측 버튼들 */}
        <div className="flex gap-2 ml-auto">
          {isCreateMode ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isLoading || isAnalyzing || (isCreateMode && !analyzedData)}
              >
                {isLoading ? '저장 중...' : (isCreateMode ? '등록하기' : '저장하기')}
              </Button>
            </>
          ) : (
            isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const found = getIssueById(selectedIssueId);
                    if (found) setFormData(found);
                    setIsEditing(false);
                  }}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장하기'}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                수정하기
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPanel;