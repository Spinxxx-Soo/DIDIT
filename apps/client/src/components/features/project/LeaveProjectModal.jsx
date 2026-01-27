import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

/**
 * LeaveProjectModal - 프로젝트 떠나기 확인 모달
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onConfirm - 확인 핸들러
 * @param {string} props.projectName - 프로젝트 이름
 * @param {boolean} props.isLoading - 로딩 상태
 */
export function LeaveProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isLoading = false,
}) {
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
          정말 프로젝트를 떠나시겠습니까?
        </h3>
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          프로젝트를 나가게 되면 '{projectName}'에 더 이상 접속할 수 없으며,
          프로젝트 내에 자료들에 대한 접근 권한을 모두 잃습니다.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isLoading}
          className="w-full"
        >
          나가기
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="w-full"
        >
          취소하기
        </Button>
      </div>
    </Modal>
  );
}
