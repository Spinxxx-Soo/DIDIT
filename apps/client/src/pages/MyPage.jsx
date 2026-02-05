import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Clock, ArrowRight, Loader2 } from 'lucide-react';
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
    isLoading,
    error
  } = useProjectStore();

  // 페이지 진입 시 프로젝트 목록 조회
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error('프로젝트 ID가 없습니다:', projectId);
      return;
    }
    navigate(`/workspace/${projectId}`);
  };

  // 프로젝트 생성 핸들러
  const handleCreateProject = async (submitData) => {
    const result = await createProject(submitData);
    if (result.success) {
      setIsCreateModalOpen(false);
      await fetchProjects();  // 최신 데이터 다시 조회
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
    <div className="space-y-6">
      {/* 인사말 섹션 */}
      <section className="py-5 animate-fade-up" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-8">
          {/* Avatar with glow effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-light)] rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
            <Avatar
              src={user?.avatarUrl}
              name={user?.name || '사용자'}
              size="2xl"
              className="rounded-fullring-4 ring-[var(--border-subtle)] transition-all duration-500 group-hover:ring-[var(--color-green-primary)]/40 group-hover:scale-105 relative z-10"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[var(--color-green-primary)] to-[var(--color-green-hover)] rounded-full flex items-center justify-center text-white shadow-[var(--shadow-glow)] z-20">
              <span className="text-sm font-bold">✓</span>
            </div>
          </div>

          {/* Greeting Text - Hero Typography */}
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-green-primary)] tracking-wide uppercase mb-3">
              Welcome back
            </p>
            <h1 className="text-5xl font-bold text-[var(--text-bright)] mb-3">
              {user?.name || '사용자'}님
            </h1>
            <p className="text-xl text-[var(--text-secondary)] font-light">
              오늘도 멋진 하루가 되길 바랍니다 ✨
            </p>
          </div>

          {/* Profile Edit Button - API 미구현으로 임시 주석처리 */}
          {/* <Button
            variant="secondary"
            leftIcon={<Settings size={16} />}
            onClick={() => setIsEditProfileModalOpen(true)}
            className="rounded-full px-6 py-3 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300"
          >
            프로필 편집
          </Button> */}
        </div>
      </section>

      {/* 최근 접속한 프로젝트 */}
      <section className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-title text-[var(--text-bright)]">
            최근 프로젝트
          </h2>
          <span className="text-sm text-[var(--text-tertiary)]">
            {projects.length}개의 프로젝트
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-green-primary)]">
            <Loader2 size={40} className="animate-spin mb-4" />
            <span className="text-[14px]">프로젝트를 불러오는 중입니다...</span>
          </div>
        ) : error ? (
          <Card variant="outline" className="py-12 border-red-500/20 bg-red-500/5">
            <div className="text-center space-y-3">
              <p className="text-red-500 text-[16px] font-medium">
                {error}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchProjects()}
              >
                다시 시도
              </Button>
            </div>
          </Card>
        ) : Array.isArray(projects) && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-up"
                style={{ animationDelay: `${150 + index * 75}ms` }}
              >
                <Card
                  variant="elevated"
                  isClickable
                  onClick={() => handleProjectClick(project.id)}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    {/* 프로젝트 아이콘 */}
                    <div
                      className="
                        w-12 h-12 
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
                      <CardTitle className="group-hover:text-[var(--color-green-primary)] transition-colors flex items-center gap-2 mb-0">
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
                      <CardDescription className="truncate !mt-0 !leading-tight">
                        {project.repoFullName?.replace(/^https?:\/\/github\.com\//, '') || '연결된 저장소 없음'}
                      </CardDescription>
                      <div className="flex items-center gap-3 mt-3 text-[13px] text-[var(--text-tertiary)]">
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
        ) : (
          <Card variant="outline" className="py-12">
            <div className="text-center space-y-3">
              <p className="text-[var(--text-secondary)] text-[16px]">
                아직 참여 중인 프로젝트가 없습니다
              </p>
              <p className="text-[var(--text-tertiary)] text-[14px]">
                아래에서 새 프로젝트를 만들거나 초대 코드로 참여해보세요
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* 새 프로젝트 만들기 */}
      <section className="animate-fade-up" style={{ animationDelay: '450ms' }}>
        <Card
          variant="outline"
          isClickable
          onClick={() => setIsCreateModalOpen(true)}
          className="
            !p-3
            border-dashed 
            border-2
            hover:border-[var(--color-green-primary)] 
            hover:bg-[var(--success-bg)]
            transition-all
            duration-300
          "
        >
          <div className="flex items-center justify-center gap-4 py-2">
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
              <span className="block text-[16px] font-semibold text-[var(--text-primary)] !leading-tight">
                새 프로젝트 만들기
              </span>
              <span className="text-sm text-[var(--text-tertiary)] !leading-tight">
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

      {/* 프로필 이미지 수정 모달 - API 미구현으로 임시 주석처리 */}
      {/* <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSubmit={handleUpdateProfile}
        currentUser={user}
      /> */}
    </div>
  );
}

export default MyPage;