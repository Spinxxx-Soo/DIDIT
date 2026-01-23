import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, User } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { validateImageFile, compressImage } from '@/utils/imageUtils';

/**
 * EditProfileModal 컴포넌트
 * - 프로필 이미지 업로드/수정/삭제 기능
 * - CreateProjectModal의 이미지 처리 로직 재사용
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onSubmit - 제출 핸들러 ({ imageFile, removeImage })
 * @param {Object} props.currentUser - 현재 유저 정보 { name, avatarUrl }
 * @param {boolean} props.isLoading - 저장 중 로딩 상태
 */
export function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) {
  // Form State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Validation State
  const [imageError, setImageError] = useState('');

  // Refs
  const fileInputRef = useRef(null);

  // 모달이 열릴 때 현재 GitHub 프로필 이미지로 초기화
  useEffect(() => {
    if (isOpen) {
      setImagePreview(currentUser?.avatarUrl || null);
      setImageFile(null);
      setRemoveImage(false);
      setImageError('');
    }
  }, [isOpen, currentUser?.avatarUrl]);

  /**
   * 모달 닫기 및 상태 초기화
   */
  const handleClose = () => {
    // 상태 초기화
    setImageFile(null);
    setImagePreview(currentUser?.avatarUrl || null);
    setRemoveImage(false);
    setImageError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

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
    setRemoveImage(false);

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
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 이름에서 이니셜 추출
   */
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async () => {
    // 변경사항이 없으면 그냥 닫기
    if (!imageFile && !removeImage) {
      handleClose();
      return;
    }

    const submitData = {
      imageFile: imageFile,
      removeImage: removeImage,
    };

    onSubmit?.(submitData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="프로필 이미지 수정"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!imageFile && !removeImage}
          >
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 프로필 이미지 미리보기 */}
        <div className="flex flex-col items-center gap-4">
          {/* 이미지 미리보기 */}
          <div
            className="
              relative
              w-24 h-24
              rounded-full
              overflow-hidden
              flex-shrink-0
              border-2
              border-[var(--border-default)]
              bg-[var(--bg-input)]
            "
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="프로필 이미지 미리보기"
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
                text-[var(--text-secondary)]
              ">
                {currentUser?.name ? (
                  <span className="text-[24px] font-semibold">
                    {getInitials(currentUser.name)}
                  </span>
                ) : (
                  <User size={40} className="text-[var(--text-tertiary)]" />
                )}
              </span>
            )}
          </div>

          {/* 업로드 버튼 영역 */}
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="profile-image-upload"
            />
            <label
              htmlFor="profile-image-upload"
              className="
                inline-flex items-center gap-2
                px-4 py-2
                bg-[var(--bg-input)]
                border border-[var(--border-default)]
                rounded-[var(--radius-md)]
                text-[14px] font-medium
                text-[var(--text-primary)]
                cursor-pointer
                hover:bg-[var(--bg-hover)]
                hover:border-[var(--color-green-primary)]
                hover:text-[var(--color-green-primary)]
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              <Upload size={16} />
              이미지 업로드
            </label>

            {imageError ? (
              <p className="text-[13px] text-[var(--color-error)] flex items-center gap-1">
                <AlertCircle size={14} />
                {imageError}
              </p>
            ) : (
              <p className="text-[13px] text-[var(--text-tertiary)] text-center">
                JPG, PNG, GIF, WebP (최대 5MB)
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
