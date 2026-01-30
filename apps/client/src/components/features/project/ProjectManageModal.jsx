import { useState, useEffect } from 'react';
import { Check, Pencil, Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { LeaveProjectModal } from './LeaveProjectModal';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { CreateProjectModal } from './CreateProjectModal';
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
    createProject,
    validateProjectName,
    validateGithubRepo,
    isLoading,
  } = useProjectStore();

  // 편집 상태
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Leave 모달 상태
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Transfer 모달 상태
  const [transferTarget, setTransferTarget] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingProjectId(null);
      setEditingName('');
      setNameError('');
      setLeaveTarget(null);
      setTransferTarget(null);
      setIsCreateModalOpen(false);
    }
  }, [isOpen]);

  // 팀장 여부 확인
  const isOwner = (project) => project.ownerId === user?.userId;

  // Edit 버튼 클릭, 이제는 이모티콘 클릭시 실행 (나중 이미지 수정까지 진행시 edit 버튼(주석처리됨) 사용)
  const handleEditClick = (project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
    setNameError('');
  };

  // Save 버튼 클릭 (인라인 수정 완료)
  const handleSaveClick = async (projectId) => {
    if (!editingName.trim()) return;

    // 현재 프로젝트 찾기
    const currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) return;

    // 같은 이름이면 그냥 종료
    if (editingName.trim() === currentProject.name) {
      setEditingProjectId(null);
      setEditingName('');
      setNameError('');
      return;
    }

    // 중복 확인 추가
    const isDuplicate = await validateProjectName(editingName.trim());
    if (isDuplicate) {
      setNameError('이미 존재하는 프로젝트 이름입니다');
      return;
    }

    setIsSaving(true);
    await updateProjectName(projectId, editingName.trim());
    setIsSaving(false);
    setEditingProjectId(null);
    setEditingName('');
    setNameError('');
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

  // 프로젝트 생성 핸들러 추가
  const handleCreateProject = async (submitData) => {
    const result = await createProject(submitData);
    if (result.success) {
      setIsCreateModalOpen(false);
    }
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
                          onChange={(e) => {
                            setEditingName(e.target.value);
                            if (nameError) setNameError('');
                          }}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClick(project.id);
                            if (e.key === 'Escape') {
                              setEditingProjectId(null);
                              setEditingName('');
                              setNameError('');
                            }
                          }}
                          isError={!!nameError}
                          errorMessage={nameError}
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
                            onClick={() => handleEditClick(project)}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 버튼 영역 */}
                  {!editing && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* {owner && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditClick(project)}
                        >
                          Edit
                        </Button>
                      )} */}
                      <Button
                        variant="danger-outline"
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

        {/* 새 프로젝트 만들기 버튼 추가 */}
        <section className="mt-6">
          <Card
            variant="outline"
            padding='sm'
            isClickable
            onClick={() => setIsCreateModalOpen(true)}
            className="border-dashed hover:border-[var(--color-green-primary)] hover:bg-[var(--success-bg)]"
          >
            <div className="flex items-center justify-center gap-3 py-0">
              <div className="w-10 h-5 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                <Plus size={20} className="text-[var(--text-secondary)]" />
              </div>
              <span className="text-[16px] font-medium text-[var(--text-secondary)]">
                새 프로젝트 만들기
              </span>
            </div>
          </Card>
        </section>
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
        currentUserId={user?.userId}
        isLoading={isTransferring}
      />
      {/* 프로젝트 생성 모달 추가 */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        onValidateName={validateProjectName}
        onValidateRepo={validateGithubRepo}
        isGithubAuthenticated={true} // 또는 useAuthStore에서 가져오기
        isLoading={isLoading}
      />
    </>
  );
}
