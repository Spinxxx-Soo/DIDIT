import { useState, useEffect } from 'react';
import { Check, Pencil } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LeaveProjectModal } from './LeaveProjectModal';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import useProjectStore from '@/store/useProjectStore';
import useAuthStore from '@/store/useAuthStore';
import { getProjectColor } from '@/utils/projectUtils';

/**
 * ProjectManageModal - 프로젝트 관리 메인 모달
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 */
export function ProjectManageModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const {
    projects,
    updateProjectName,
    leaveProject,
    transferOwnership,
    fetchParticipants,
  } = useProjectStore();

  // 편집 상태
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Leave 모달 상태
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Transfer 모달 상태
  const [transferTarget, setTransferTarget] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingProjectId(null);
      setEditingName('');
      setLeaveTarget(null);
      setTransferTarget(null);
    }
  }, [isOpen]);

  // 팀장 여부 확인
  const isOwner = (project) => project.ownerId === user?.id;

  // Edit 버튼 클릭
  const handleEditClick = (project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  // Save 버튼 클릭 (인라인 수정 완료)
  const handleSaveClick = async (projectId) => {
    if (!editingName.trim()) return;

    setIsSaving(true);
    await updateProjectName(projectId, editingName.trim());
    setIsSaving(false);
    setEditingProjectId(null);
    setEditingName('');
  };

  // Leave 버튼 클릭
  const handleLeaveClick = async (project) => {
    if (isOwner(project)) {
      // 팀장인 경우 참여자 목록 조회 후 Transfer 모달 열기
      const participantList = await fetchParticipants(project.id);
      setParticipants(participantList);
      setTransferTarget(project);
    } else {
      // 일반 멤버인 경우 Leave 확인 모달 열기
      setLeaveTarget(project);
    }
  };

  // Leave 확인
  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;

    setIsLeaving(true);
    await leaveProject(leaveTarget.id);
    setIsLeaving(false);
    setLeaveTarget(null);
  };

  // Transfer 확인 (팀장 위임 후 Leave)
  const handleTransferConfirm = async (newOwnerId) => {
    if (!transferTarget) return;

    setIsTransferring(true);
    await transferOwnership(transferTarget.id, newOwnerId);
    await leaveProject(transferTarget.id);
    setIsTransferring(false);
    setTransferTarget(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="프로젝트 관리"
        size="md"
      >
        {/* 프로젝트 목록 */}
        <div className="flex flex-col gap-3">
          {projects.length === 0 ? (
            <p className="text-[14px] text-[var(--text-tertiary)] text-center py-8">
              참여 중인 프로젝트가 없습니다.
            </p>
          ) : (
            projects.map((project) => {
              const editing = editingProjectId === project.id;
              const owner = isOwner(project);

              return (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]"
                >
                  {/* 프로젝트 아이콘 */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: getProjectColor(project.id) }}
                  >
                    {project.name.charAt(0)}
                  </div>

                  {/* 프로젝트 이름 (일반/편집 모드) */}
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClick(project.id);
                            if (e.key === 'Escape') {
                              setEditingProjectId(null);
                              setEditingName('');
                            }
                          }}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveClick(project.id)}
                          isLoading={isSaving}
                          leftIcon={<Check size={14} />}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">
                          {project.name}
                        </span>
                        {owner && (
                          <Pencil
                            size={12}
                            className="text-[var(--text-tertiary)] flex-shrink-0"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 버튼 영역 */}
                  {!editing && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {owner && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditClick(project)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleLeaveClick(project)}
                      >
                        Leave
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Leave 확인 모달 */}
      <LeaveProjectModal
        isOpen={!!leaveTarget}
        onClose={() => setLeaveTarget(null)}
        onConfirm={handleLeaveConfirm}
        projectName={leaveTarget?.name || ''}
        isLoading={isLeaving}
      />

      {/* 팀장 위임 모달 */}
      <TransferOwnershipModal
        isOpen={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        onConfirm={handleTransferConfirm}
        participants={participants}
        currentUserId={user?.id}
        isLoading={isTransferring}
      />
    </>
  );
}
