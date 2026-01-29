import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';

/**
 * TransferOwnershipModal - 팀장 위임 모달
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {Function} props.onConfirm - 확인 핸들러 (newOwnerId) => void
 * @param {Array} props.participants - 참여자 목록 [{ id, name, avatarUrl }]
 * @param {number} props.currentUserId - 현재 사용자 ID (본인 제외용)
 * @param {boolean} props.isLoading - 로딩 상태
 */
export function TransferOwnershipModal({
  isOpen,
  onClose,
  onConfirm,
  participants = [],
  currentUserId,
  isLoading = false,
}) {
  const [selectedUserId, setSelectedUserId] = useState(null);

  // 본인 제외한 참여자 목록
  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  const handleConfirm = () => {
    if (selectedUserId) {
      onConfirm(selectedUserId);
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="프로젝트 관리"
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      {/* 안내 메시지 */}
      <div className="mb-4">
        <p className="text-[14px] text-[var(--text-primary)] mb-2">
          팀장은 프로젝트를 나가기 전 다음 팀장을 선택해야 합니다.
        </p>
        <p className="text-[13px] text-[var(--text-secondary)]">
          다음 팀장을 선택해주세요.
        </p>
      </div>

      {/* 참여자 목록 */}
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
        {otherParticipants.length === 0 ? (
          <p className="text-[14px] text-[var(--text-tertiary)] text-center py-4">
            위임할 수 있는 팀원이 없습니다.
          </p>
        ) : (
          otherParticipants.map((participant) => (
            <label
              key={participant.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer
                border transition-colors
                ${selectedUserId === participant.id
                  ? 'border-[var(--color-green-primary)] bg-[var(--success-bg)]'
                  : 'border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              <input
                type="radio"
                name="newOwner"
                value={participant.id}
                checked={selectedUserId === participant.id}
                onChange={() => setSelectedUserId(participant.id)}
                className="w-4 h-4 text-[var(--color-green-primary)] accent-[var(--color-green-primary)]"
              />
              <Avatar
                src={participant.avatarUrl}
                name={participant.name}
                size="sm"
              />
              <span className="text-[14px] text-[var(--text-primary)]">
                {participant.name}
              </span>
            </label>
          ))
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end mt-6">
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!selectedUserId || otherParticipants.length === 0}
          isLoading={isLoading}
        >
          Leave
        </Button>
      </div>
    </Modal>
  );
}
