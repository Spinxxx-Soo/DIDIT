import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/Button/IconButton';
import { Trash2, Crown } from 'lucide-react';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import useToastStore from '@/store/useToastStore';
import { projectApi } from '@/api/project';

export const ManageMembersModal = ({
    isOpen,
    onClose,
    members = [],
    projectId,
    currentUserId,
    isOwner,
    onMemberRemoved
}) => {
    const { addToast } = useToastStore();
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemoveClick = (member) => {
        setMemberToRemove(member);
        setIsConfirmOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!memberToRemove) return;

        try {
            setIsRemoving(true);
            // Backend api call
            // Note: Backend might not support this yet, but we try.
            await projectApi.removeParticipant(projectId, memberToRemove.id);

            addToast({
                type: 'success',
                message: `${memberToRemove.name}님을 프로젝트에서 제외했습니다.`
            });

            if (onMemberRemoved) {
                onMemberRemoved(memberToRemove.id);
            }
        } catch (error) {
            console.error("Remove failed:", error);
            addToast({
                type: 'error',
                message: error.response?.data?.message || '팀원 추방에 실패했습니다.'
            });
        } finally {
            setIsRemoving(false);
            setIsConfirmOpen(false);
            setMemberToRemove(null);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`팀원 관리 (${members.length})`}
                size="md"
            >
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={member.name}
                                    src={member.avatarUrl}
                                    size="sm"
                                    status={member.isOnline ? 'online' : 'offline'}
                                />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            {member.name}
                                        </span>
                                        {/* If we had role info in member object, we could check 'OWNER' */}
                                        {/* Assuming the caller passes logic or we infer owner differently */}
                                        {/* For now we don't know which member is owner from the list, unless passed */}
                                        {/* But we know if WE are owner via isOwner prop */}
                                    </div>
                                    <span className="text-xs text-[var(--text-tertiary)]">
                                        {member.email || member.githubLogin || "팀원"}
                                    </span>
                                </div>
                            </div>

                            {isOwner && currentUserId !== member.id && (
                                <IconButton
                                    icon={<Trash2 size={16} />}
                                    variant="ghost"
                                    size="sm"
                                    className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-red-50"
                                    onClick={() => handleRemoveClick(member)}
                                    title="팀원 추방"
                                />
                            )}

                            {/* If this member is me (or owner) maybe show badge? */}
                            {/* We don't have easy way to know if 'member' is owner unless we check project ownerId */}
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-8 text-[var(--text-tertiary)]">
                            팀원이 없습니다.
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={onClose} variant="secondary">
                        닫기
                    </Button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmRemove}
                title="팀원 추방"
                message={`정말로 '${memberToRemove?.name}'님을 프로젝트에서 제외하시겠습니까?`}
                confirmText="추방하기"
                cancelText="취소"
                confirmVariant="danger"
                isLoading={isRemoving}
            />
        </>
    );
};
