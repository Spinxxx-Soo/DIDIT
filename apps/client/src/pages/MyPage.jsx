/**
 * Apple-Style MyPage
 * Bento Grid project cards, elegant greeting, clean design
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Clock, ArrowRight } from 'lucide-react';
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
    <div className="space-y-12">
      {/* 인사말 섹션 */}
      <section
        className="
          flex 
          items-center 
          gap-8 
          py-8
          animate-fade-up
        "
      >
        <div className="relative group">
          <Avatar
            src={user?.avatarUrl}
            name={user?.name || '사용자'}
            size="2xl"
            className="ring-4 ring-[var(--border-subtle)] transition-all duration-300 group-hover:ring-[var(--color-green-primary)]/30"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-green-primary)] rounded-full flex items-center justify-center text-white">
            <span className="text-xs">✓</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-[var(--text-tertiary)] mb-1">안녕하세요,</p>
          <h1 className="text-headline text-[var(--text-bright)]">
            {user?.name || '사용자'}님!
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            오늘 하루도 힘차게 시작해보아요 ✨
          </p>
        </div>

        <Button
          variant="secondary"
          leftIcon={<Settings size={16} />}
          onClick={() => setIsEditProfileModalOpen(true)}
          className="rounded-full"
        >
          프로필 편집
        </Button>
      </section>

      {/* 최근 접속한 프로젝트 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title text-[var(--text-bright)]">
            최근 프로젝트
          </h2>
          <span className="text-sm text-[var(--text-tertiary)]">
            {projects.length}개의 프로젝트
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.slice(0, 4).map((project, index) => (
            <div
              key={project.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card
                variant="elevated"
                isClickable
                onClick={() => handleProjectClick(project.id)}
                className="group"
              >
                <div className="flex items-start gap-5">
                  {/* 프로젝트 아이콘 */}
                  <div
                    className="
                      w-14 h-14 
                      rounded-[var(--radius-xl)] 
                      flex items-center justify-center 
                      text-white 
                      font-bold 
                      text-lg 
                      flex-shrink-0 
                      overflow-hidden
                      shadow-[var(--shadow-sm)]
                      transition-all duration-300
                      group-hover:scale-105
                      group-hover:shadow-[var(--shadow-md)]
                    "
                    style={{ backgroundColor: project.thumbnailUrl ? 'transparent' : getProjectColor(project.id) }}
                  >
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getProjectInitial(project.name)
                    )}
                  </div>

                  {/* 프로젝트 정보 */}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="group-hover:text-[var(--color-green-primary)] transition-colors flex items-center gap-2">
                      {project.name}
                      <ArrowRight
                        size={16}
                        className="
                          opacity-0 
                          -translate-x-2 
                          group-hover:opacity-100 
                          group-hover:translate-x-0 
                          transition-all 
                          duration-200
                          text-[var(--color-green-primary)]
                        "
                      />
                    </CardTitle>
                    <CardDescription className="truncate">
                      {project.repoFullName || '연결된 저장소 없음'}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-[13px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-green-primary)]" />
                        멤버 {project.memberCount}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {project.lastAccessed}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* 새 프로젝트 만들기 */}
      <section className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <Card
          variant="outline"
          isClickable
          onClick={() => setIsCreateModalOpen(true)}
          className="
            border-dashed 
            border-2
            hover:border-[var(--color-green-primary)] 
            hover:bg-[var(--success-bg)]
            transition-all
            duration-300
          "
        >
          <div className="flex items-center justify-center gap-4 py-4">
            <div
              className="
                w-12 h-12 
                rounded-full 
                bg-[var(--bg-input)] 
                flex items-center justify-center
                transition-all
                duration-300
                group-hover:bg-[var(--color-green-primary)]
                group-hover:text-white
              "
            >
              <Plus size={22} className="text-[var(--text-secondary)]" />
            </div>
            <div className="text-left">
              <span className="block text-[16px] font-semibold text-[var(--text-primary)]">
                새 프로젝트 만들기
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                팀원을 초대하고 협업을 시작하세요
              </span>
            </div>
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