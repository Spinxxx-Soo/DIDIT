// src/pages/MyPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Clock } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import {
  Card,
  CardTitle,
  CardDescription,
} from '@/components/common/Card';
import { CreateProjectModal } from '@/components/features/project/CreateProjectModal';
import { EditProfileModal } from '@/components/features/profile/EditProfileModal';
import useProjectStore from '@/store/useProjectStore';
import useAuthStore from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { getProjectColor, getProjectInitial } from '@/utils/projectUtils';


/**
 * MyPage - 마이페이지 (프로젝트 리스트)
 */
export function MyPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Store
  const { user, isAuthenticated, updateProfileImage } = useAuthStore();
  const {
    projects,
    fetchProjects,
    createProject,
    validateProjectName,
    validateGithubRepo,
    isLoading
  } = useProjectStore();

  // 페이지 진입 시 프로젝트 목록 조회
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (projectId) => {
    navigate(`/workspace/${projectId}`);
  };

  // 프로젝트 생성 핸들러
  const handleCreateProject = async (submitData) => {
    const result = await createProject(submitData);
    if (result.success) {
      setIsCreateModalOpen(false);
    }
  };

  // 프로필 이미지 수정 핸들러
  const handleUpdateProfile = async (submitData) => {
    const result = await updateProfileImage(submitData);
    if (result.success) {
      setIsEditProfileModalOpen(false);
      toast.success('프로필 이미지가 변경되었습니다');
    } else {
      toast.error('프로필 이미지 변경에 실패했습니다');
    }
  };

  return (
    <div className="space-y-10">
      {/* 인사말 섹션 */}
      <section className="flex items-center py-10 gap-10">
        <Avatar src={user?.avatarUrl} name={user?.name || '사용자'} size="2xl" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[var(--text-bright)] leading-tight">
            오늘 하루도 힘차게 시작해보아요,
            <br />
            {user?.name || '사용자'}님!
          </h1>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Settings size={18} />}
          onClick={() => setIsEditProfileModalOpen(true)}
        >
          Edit
        </Button>
      </section>

      {/* 최근 접속한 프로젝트 */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-[var(--text-bright)]">
          최근 접속한 프로젝트
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              variant="elevated"
              isClickable
              onClick={() => handleProjectClick(project.id)}
              className="group"
            >
              <div className="flex items-start gap-4">
                {/* 프로젝트 아이콘 */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: project.imageUrl ? 'transparent' : getProjectColor(project.id) }}
                >
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    getProjectInitial(project.name)
                  )}
                </div>

                {/* 프로젝트 정보 */}
                <div className="flex-1 min-w-0">
                  <CardTitle className="group-hover:text-[var(--color-green-primary)] transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    {project.githubRepo || '연결된 저장소 없음'}
                  </CardDescription>
                  <div className="flex items-center gap-3 mt-2 text-[13px] text-[var(--text-tertiary)]">
                    <span>멤버 {project.memberCount}명</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {project.lastAccessed}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 새 프로젝트 만들기 */}
      <section>
        <Card
          variant="outline"
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

      {/* 프로젝트 생성 모달 */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        onValidateName={validateProjectName}
        onValidateRepo={validateGithubRepo}
        isGithubAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />

      {/* 프로필 이미지 수정 모달 */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSubmit={handleUpdateProfile}
        currentUser={user}
      />
    </div>
  );
}

export default MyPage;