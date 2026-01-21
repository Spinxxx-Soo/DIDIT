import { Modal } from './Modal';
import { Button } from '@/components/common/Button';

/**
 * ConfirmModal 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onConfirm - 확인 핸들러
 * @param {string} props.title - 모달 제목
 * @param {string} props.message - 확인 메시지
 * @param {string} props.confirmText - 확인 버튼 텍스트
 * @param {string} props.cancelText - 취소 버튼 텍스트
 * @param {'primary' | 'danger'} props.confirmVariant - 확인 버튼 스타일
 * @param {boolean} props.isLoading - 로딩 상태
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소하기',
  confirmVariant = 'danger',
  isLoading = false,
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      hasCloseButton={false}
      closeOnOverlayClick={!isLoading}
    >
      {/* Content */}
      <div className="text-center">
        <h3 className="text-[18px] font-semibold text-[var(--text-bright)] mb-3">
          {title}
        </h3>
        {message && (
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          isLoading={isLoading}
          className="w-full"
        >
          {confirmText}
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="w-full"
        >
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
}