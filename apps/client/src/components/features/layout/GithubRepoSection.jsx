import { useState } from 'react';
import { Github, Check, AlertCircle, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

/**
 * GitHub 저장소 검증 상태
 */
const GITHUB_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * GNB 내 GitHub 저장소 연결 섹션
 * @param {Object} props
 * @param {string|null} props.repoFullName - 현재 연결된 저장소 (null이면 미연결)
 * @param {number} props.projectId - 프로젝트 ID
 * @param {Function} props.onValidateRepo - 저장소 검증 함수
 * @param {Function} props.onUpdateRepo - 저장소 업데이트 함수
 */
export function GithubRepoSection({
  repoFullName,
  projectId,
  onValidateRepo,
  onUpdateRepo,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [githubStatus, setGithubStatus] = useState(GITHUB_STATUS.IDLE);
  const [repoError, setRepoError] = useState('');
  const [validatedRepoId, setValidatedRepoId] = useState(null);

  /**
   * 입력값 변경 핸들러
   */
  const handleInputChange = (e) => {
    setRepoInput(e.target.value);
    if (repoError) setRepoError('');
    if (githubStatus !== GITHUB_STATUS.IDLE) {
      setGithubStatus(GITHUB_STATUS.IDLE);
    }
  };

  /**
   * 저장소 검증 핸들러
   */
  const handleValidate = async () => {
    if (!repoInput.trim()) {
      setRepoError('저장소 주소를 입력해주세요');
      return;
    }

    // 형식 체크 (organization/repository)
    const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    if (!repoPattern.test(repoInput.trim())) {
      setRepoError('organization/repository 형식으로 입력해주세요');
      return;
    }

    setGithubStatus(GITHUB_STATUS.LOADING);
    setRepoError('');

    try {
      const result = await onValidateRepo(projectId, repoInput.trim());

      if (result.success) {
        setGithubStatus(GITHUB_STATUS.SUCCESS);
        // 검증 성공 시 repoId 저장
        setValidatedRepoId(result.data?.repoId || result.data?.id);
      } else {
        setGithubStatus(GITHUB_STATUS.ERROR);
        setRepoError(result.error || '유효한 저장소가 아닙니다');
      }
    } catch (error) {
      setGithubStatus(GITHUB_STATUS.ERROR);
      setRepoError('저장소 검증에 실패했습니다');
    }
  };

  /**
   * 저장소 연결 완료 핸들러
   */
  const handleConnect = async () => {
    if (githubStatus !== GITHUB_STATUS.SUCCESS) return;

    const result = await onUpdateRepo(projectId, validatedRepoId, repoInput.trim());

    if (result.success) {
      setIsEditing(false);
      setRepoInput('');
      setGithubStatus(GITHUB_STATUS.IDLE);
      setValidatedRepoId(null);
    } else {
      setRepoError(result.error || '저장소 연결에 실패했습니다');
    }
  };

  /**
   * 편집 취소 핸들러
   */
  const handleCancel = () => {
    setIsEditing(false);
    setRepoInput('');
    setGithubStatus(GITHUB_STATUS.IDLE);
    setRepoError('');
    setValidatedRepoId(null);
  };

  // 저장소가 연결된 경우 - 주소 표시
  if (repoFullName && !isEditing) {
    // [Modified] 백엔드 @URL 검증으로 인해 repoFullName이 전체 URL로 저장될 수 있음.
    // 따라서 형식에 따라 href와 표시 텍스트를 조정함.
    const isUrl = repoFullName.startsWith('http');
    const href = isUrl ? repoFullName : `https://github.com/${repoFullName}`;
    const displayText = isUrl ? repoFullName.replace(/^https?:\/\/github\.com\//, '') : repoFullName;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex items-center gap-2
          px-3 py-1.5
          bg-[var(--bg-input)]
          rounded-[var(--radius-md)]
          border border-[var(--border-default)]
          text-[13px] text-[var(--text-primary)]
          hover:border-[var(--color-green-primary)]
          hover:text-[var(--color-green-primary)]
          transition-colors
        "
      >
        <Github size={14} />
        <span>{displayText}</span>
        <LinkIcon size={12} className="text-[var(--text-tertiary)]" />
      </a>
    );
  }

  // 미연결 + 편집 모드가 아닌 경우 - 연결 버튼
  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Github size={14} />}
        onClick={() => setIsEditing(true)}
        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        저장소 연결
      </Button>
    );
  }

  // 편집 모드 - 입력창 + 버튼
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          size="sm"
          placeholder="organization/repository"
          value={repoInput}
          onChange={handleInputChange}
          isError={!!repoError}
          disabled={githubStatus === GITHUB_STATUS.LOADING}
          className={`
            w-[200px]
            ${githubStatus === GITHUB_STATUS.SUCCESS ? 'border-[var(--color-green-primary)] pr-8' : ''}
          `}
        />
        {githubStatus === GITHUB_STATUS.SUCCESS && (
          <Check
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-green-primary)]"
          />
        )}
      </div>

      {githubStatus === GITHUB_STATUS.SUCCESS ? (
        <Button
          variant="primary"
          size="sm"
          onClick={handleConnect}
        >
          연결
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleValidate}
          disabled={!repoInput.trim() || githubStatus === GITHUB_STATUS.LOADING}
          isLoading={githubStatus === GITHUB_STATUS.LOADING}
          leftIcon={<Github size={14} />}
        >
          인증
        </Button>
      )}

      <button
        type="button"
        onClick={handleCancel}
        className="
          p-1.5
          text-[var(--text-tertiary)]
          hover:text-[var(--text-primary)]
          hover:bg-[var(--bg-hover)]
          rounded-[var(--radius-sm)]
          transition-colors
        "
      >
        <X size={14} />
      </button>

      {/* 에러 메시지 */}
      {repoError && (
        <div className="flex items-center gap-1 text-[12px] text-[var(--color-error)]">
          <AlertCircle size={12} />
          <span>{repoError}</span>
        </div>
      )}
    </div>
  );
}

export default GithubRepoSection;
