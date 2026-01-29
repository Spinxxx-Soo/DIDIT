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
      <section className="py-8">
        <div className="flex items-center gap-10">
          {/* Avatar with glow effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-light)] rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
            <Avatar
              src={user?.avatarUrl}
              name={user?.name || '사용자'}
              size="2xl"
              className="ring-4 ring-[var(--border-subtle)] transition-all duration-500 group-hover:ring-[var(--color-green-primary)]/40 group-hover:scale-105 relative z-10"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-hover)] rounded-full flex items-center justify-center text-white shadow-[var(--shadow-glow)] z-20">
              <span className="text-sm font-bold">✓</span>
            </div>
          </div>

          {/* Greeting Text - Hero Typography */}
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-green-primary)] tracking-wide uppercase mb-2">
              Welcome back
            </p>
            <h1 className="text-display text-[var(--text-bright)] mb-3">
              {user?.name || '사용자'}님
            </h1>
            <p className="text-xl text-[var(--text-secondary)] font-light">
              오늘도 멋진 하루가 되길 바랍니다 ✨
            </p>
          </div>

          {/* Profile Edit Button */}
          <Button
            variant="secondary"
            leftIcon={<Settings size={16} />}
            onClick={() => setIsEditProfileModalOpen(true)}
            className="rounded-full px-6 py-3 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300"
          >
            프로필 편집
          </Button>
        </div>
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