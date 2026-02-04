import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Github } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { PROJECT_COLORS, getProjectInitial } from '@/utils/projectUtils';
import { validateImageFile, compressImage } from '@/utils/imageUtils';

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
 * 에러 메시지 상수
 */
const ERROR_MESSAGES = {
  NAME_REQUIRED: '프로젝트 이름을 입력해주세요',
  NAME_DUPLICATE: '이미 존재하는 프로젝트 이름입니다',
  REPO_INVALID: '유효한 레퍼지토리가 아닙니다',
  REPO_NOT_ORG: '조직 레퍼지토리가 아닙니다',
  REPO_NO_PERMISSION: '권한 없는 저장소입니다',
  GITHUB_AUTH_REQUIRED: 'GitHub 인증이 필요합니다',
  REPO_REQUIRED: 'GitHub 저장소를 입력해주세요 (추후 수정 예정)',
};

/**
 * CreateProjectModal 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onSubmit - 제출 핸들러 ({ name, imageFile, githubRepo })
 * @param {Function} props.onValidateName - 프로젝트 이름 중복 검증 (async, returns boolean)
 * @param {Function} props.onValidateRepo - GitHub 저장소 검증 (async, returns { success, error })
 * @param {boolean} props.isGithubAuthenticated - GitHub 인증 여부
 * @param {boolean} props.isLoading - 생성 중 로딩 상태
 */
export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  onValidateName,
  onValidateRepo,
  isGithubAuthenticated = false,
  isLoading = false,
}) {
  // Form State
  const [projectName, setProjectName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [githubRepo, setGithubRepo] = useState('');

  // Validation State
  const [nameError, setNameError] = useState('');
  const [repoError, setRepoError] = useState('');
  const [imageError, setImageError] = useState('');
  const [githubStatus, setGithubStatus] = useState(GITHUB_STATUS.IDLE);

  // Refs
  const fileInputRef = useRef(null);

  // 미리보기용 기본 색상 (첫 번째 색상 사용)
  // 실제 색상은 생성 후 id 기반으로 결정됨
  const previewColor = PROJECT_COLORS[0];

  /**
   * 모달 닫기 및 상태 초기화
   */
  const handleClose = () => {
    if (isLoading) return;

    // 상태 초기화
    setProjectName('');
    setImageFile(null);
    setImagePreview(null);
    setGithubRepo('');
    setNameError('');
    setRepoError('');
    setImageError('');
    setGithubStatus(GITHUB_STATUS.IDLE);

    onClose();
  };

  /**
   * 이미지 파일 선택 핸들러
   * - 파일 시그니처 검증 (확장자 위조 방지)
   * - 이미지 압축/리사이즈
   */
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 에러 초기화
    setImageError('');

    // 이미지 파일 검증 (시그니처 체크 포함)
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      setImageError(validation.error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      // 이미지 압축 (200x200, 80% 품질)
      const compressed = await compressImage(file, {
        maxSize: 200,
        quality: 0.8,
      });

      setImageFile(compressed.file);
      setImagePreview(compressed.dataUrl);
    } catch (error) {
      setImageError('이미지 처리 중 오류가 발생했습니다');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * 이미지 제거 핸들러
   */
  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 프로젝트 이름 변경 핸들러
   */
  const handleNameChange = (e) => {
    const value = e.target.value;
    setProjectName(value);

    // 에러 초기화
    if (nameError) {
      setNameError('');
    }
  };

  /**
   * GitHub 저장소 입력 변경 핸들러
   */
  const handleRepoChange = (e) => {
    const value = e.target.value;
    setGithubRepo(value);

    // 에러 및 상태 초기화
    if (repoError) {
      setRepoError('');
    }
    if (githubStatus !== GITHUB_STATUS.IDLE) {
      setGithubStatus(GITHUB_STATUS.IDLE);
    }
  };

  /**
   * GitHub 저장소 인증/검증 핸들러
   */
  const handleRepoValidate = async () => {
    // GitHub 인증 체크
    if (!isGithubAuthenticated) {
      setRepoError(ERROR_MESSAGES.GITHUB_AUTH_REQUIRED);
      return;
    }

    // 빈 값 체크
    if (!githubRepo.trim()) {
      setRepoError(ERROR_MESSAGES.REPO_INVALID);
      return;
    }

    // 형식 체크 (organization/repository)
    const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    if (!repoPattern.test(githubRepo.trim())) {
      setRepoError(ERROR_MESSAGES.REPO_INVALID);
      return;
    }

    setGithubStatus(GITHUB_STATUS.LOADING);
    setRepoError('');

    try {
      // 외부 검증 함수 호출
      if (onValidateRepo) {
        const result = await onValidateRepo(githubRepo.trim());

        if (result.success) {
          setGithubStatus(GITHUB_STATUS.SUCCESS);
        } else {
          setGithubStatus(GITHUB_STATUS.ERROR);
          setRepoError(result.error || ERROR_MESSAGES.REPO_INVALID);
        }
      } else {
        // 검증 함수 없으면 성공 처리 (개발용)
        setGithubStatus(GITHUB_STATUS.SUCCESS);
      }
    } catch (error) {
      setGithubStatus(GITHUB_STATUS.ERROR);
      setRepoError(ERROR_MESSAGES.REPO_INVALID);
    }
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async () => {
    // 프로젝트 이름 필수 체크
    if (!projectName.trim()) {
      setNameError(ERROR_MESSAGES.NAME_REQUIRED);
      return;
    }

    // 프로젝트 이름 중복 체크
    // if (onValidateName) {
    //   const isDuplicate = await onValidateName(projectName.trim());
    //   if (isDuplicate) {
    //     setNameError(ERROR_MESSAGES.NAME_DUPLICATE);
    //     return;
    //   }
    // }

    // 저장소 값이 있는 경우에만 검증 여부 확인
    if (githubRepo.trim()) {
      // 값이 있는데 인증되지 않았다면(GITHUB_STATUS.SUCCESS가 아니면) 에러 처리
      if (githubStatus !== GITHUB_STATUS.SUCCESS) {
        setRepoError(ERROR_MESSAGES.GITHUB_AUTH_REQUIRED);
        return;
      }
    }

    // 제출 데이터 구성 (color 제외, 가이드에 따라 ID 기반 결정)
    const submitData = {
      name: projectName.trim(),
      imageFile: imageFile,
      // 저장소 값이 있는 경우에만 전달하고 없으면 그냥 null로 전달시킴
      githubRepo: githubRepo.trim() || null,
    };

    onSubmit?.(submitData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새로운 프로젝트 만들기"
      size="md"
      closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            생성하기
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 프로젝트 이미지 업로드 */}
        <div>
          <label className="block mb-3 text-[14px] font-medium text-[var(--text-primary)]">
            프로젝트 이미지
            <span className="ml-2 text-[13px] font-normal text-[var(--text-tertiary)]">
              (선택)
            </span>
          </label>

          <div className="flex items-center gap-5">
            {/* 이미지 미리보기 */}
            <div
              className="
                relative
                w-16 h-16
                rounded-[var(--radius-xl)]
                overflow-hidden
                flex-shrink-0
                border-2
                border-[var(--border-default)]
              "
              style={{
                backgroundColor: imagePreview ? 'transparent' : previewColor,
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="프로젝트 이미지 미리보기"
                    className="w-full h-full object-cover"
                  />
                  {/* 이미지 제거 버튼 */}
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="
                      absolute top-1 right-1
                      w-6 h-6
                      bg-black/60
                      hover:bg-black/80
                      rounded-full
                      flex items-center justify-center
                      transition-colors
                    "
                  >
                    <X size={14} className="text-white" />
                  </button>
                </>
              ) : (
                <span className="
                  w-full h-full
                  flex items-center justify-center
                  text-white
                  text-[28px]
                  font-bold
                ">
                  {getProjectInitial(projectName)}
                </span>
              )}
            </div>

            {/* 업로드 버튼 */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="project-image-upload"
              /><label
                htmlFor="project-image-upload"
                className="
                    inline-flex items-center gap-2
                    px-3.5 py-1.5                  {/* 여백을 살짝 줄여 콤팩트하게 */}
                    bg-[var(--bg-input)]
                    border border-[var(--border-default)]
                    rounded-[var(--radius-md)]
                    text-[13px] font-medium        {/* 폰트 크기를 살짝 줄이고 두께감 부여 */}
                    text-[var(--text-primary)]
                    cursor-pointer
                    hover:bg-[var(--bg-hover)]     {/* 호버 시 배경색 변화 추가 */}
                    hover:border-[var(--color-green-primary)]
                    hover:text-[var(--color-green-primary)]
                    transition-all duration-200
                    active:scale-[0.98]            {/* 클릭 시 살짝 눌리는 효과 */}
                  "
              >
                <Upload size={14} />             {/* 아이콘 크기도 14로 살짝 축소 */}
                이미지 업로드
              </label>
              {imageError ? (
                <p className="mt-2 text-[13px] text-[var(--color-error)] flex items-center gap-1">
                  <AlertCircle size={14} />
                  {imageError}
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
                  업로드하지 않으면 기본 색상과 첫 글자로 표시됩니다
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 프로젝트 이름 */}
        <Input
          label="프로젝트 이름"
          placeholder="멋진 프로젝트의 이름을 지어주세요!"
          value={projectName}
          onChange={handleNameChange}
          isRequired
          isError={!!nameError}
          errorMessage={nameError}
          disabled={isLoading}
        />

        {/* GitHub 저장소 연결 */}
        <div>
          <label className="block mb-2 text-[14px] font-medium text-[var(--text-primary)]">
            GitHub 저장소 연결
            <span className="ml-2 text-[13px] font-normal text-[var(--text-tertiary)]">
              (선택)
            </span>
          </label>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="organization/repository"
                value={githubRepo}
                onChange={handleRepoChange}
                isError={!!repoError}
                disabled={isLoading || githubStatus === GITHUB_STATUS.LOADING}
                className={
                  githubStatus === GITHUB_STATUS.SUCCESS
                    ? 'border-[var(--color-green-primary)] pr-10'
                    : ''
                }
              />
              {/* 성공 아이콘 */}
              {githubStatus === GITHUB_STATUS.SUCCESS && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={18} className="text-[var(--color-green-primary)]" />
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={handleRepoValidate}
              disabled={isLoading || githubStatus === GITHUB_STATUS.LOADING || !githubRepo.trim()}
              isLoading={githubStatus === GITHUB_STATUS.LOADING}
              leftIcon={<Github size={16} />}
            >
              인증
            </Button>
          </div>

          {/* 에러 메시지 */}
          {repoError && (
            <p className="mt-1.5 text-[13px] text-[var(--color-error)] flex items-center gap-1">
              <AlertCircle size={14} />
              {repoError}
            </p>
          )}

          {/* 성공 메시지 */}
          {githubStatus === GITHUB_STATUS.SUCCESS && !repoError && (
            <p className="mt-1.5 text-[13px] text-[var(--color-green-primary)] flex items-center gap-1">
              <Check size={14} />
              저장소가 연결되었습니다
            </p>
          )}

          {/* 안내 메시지 */}
          {githubStatus === GITHUB_STATUS.IDLE && !repoError && (
            <p className="mt-1.5 text-[13px] text-[var(--text-tertiary)]">
              나중에 프로젝트 홈에서도 연결할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
