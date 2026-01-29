/**
 * Apple-Style Project Sidebar
 * Clean design, smooth animations, elegant hover effects
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';

import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import { ProjectManageModal } from '@/components/features/project/ProjectManageModal';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import { getProjectColor } from '@/utils/projectUtils';

const ProjectSidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // 마운트 시 프로젝트 목록 조회
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (id) => {
    navigate(`/workspace/${id}`);
  };

  const handleManageClick = () => {
    setIsManageModalOpen(true);
  };

  return (
    <>
      <div
        className="
          flex 
          flex-col 
          items-center 
          gap-3 
          w-full 
          h-full 
          bg-[var(--bg-glass-strong)]
          backdrop-blur-xl
          py-4
        "
      >
        {/* === 1. 프로젝트 리스트 === */}
        <div className="flex flex-col gap-3 w-full items-center flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide px-3">
          {projects.map((project, index) => {
            const isActive = projectId === String(project.id);

            return (
              <div
                key={project.id}
                className="relative group animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => handleProjectClick(project.id)}
                  className={`
                    w-11 h-11 
                    flex items-center justify-center
                    text-white 
                    font-semibold 
                    text-sm
                    rounded-[var(--radius-lg)]
                    transition-all 
                    duration-300 
                    ease-out
                    hover:scale-110
                    hover:shadow-[var(--shadow-lg)]
                    active:scale-95
                    ${isActive
                      ? 'ring-2 ring-[var(--color-green-primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)] shadow-[var(--shadow-glow)]'
                      : 'shadow-[var(--shadow-sm)]'
                    }
                  `}
                  style={{ backgroundColor: getProjectColor(project.id) }}
                  title={project.name}
                >
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="w-full h-full object-cover rounded-[var(--radius-lg)]"
                    />
                  ) : (
                    project.name.charAt(0).toUpperCase()
                  )}
                </button>

                {/* 툴팁 (이름 표시) */}
                <div
                  className="
                    absolute 
                    left-14 
                    top-1/2 
                    -translate-y-1/2 
                    bg-[var(--text-bright)]
                    text-[var(--bg-app)]
                    text-xs 
                    font-medium
                    px-3 
                    py-1.5 
                    rounded-[var(--radius-md)]
                    opacity-0 
                    group-hover:opacity-100 
                    transition-all
                    duration-200
                    pointer-events-none 
                    whitespace-nowrap 
                    z-50
                    shadow-[var(--shadow-lg)]
                    translate-x-1
                    group-hover:translate-x-0
                  "
                >
                  {project.name}
                  <div
                    className="
                      absolute 
                      left-0 
                      top-1/2 
                      -translate-y-1/2 
                      -translate-x-1 
                      border-4 
                      border-transparent 
                      border-r-[var(--text-bright)]
                    "
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* === 2. 프로젝트 관리 버튼 === */}
        <div className="px-3 w-full flex flex-col items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="relative group">
            <IconButton
              icon={<Plus size={18} />}
              variant="ghost"
              size="md"
              onClick={handleManageClick}
              className="
                w-11 h-11
                rounded-[var(--radius-lg)]
                bg-[var(--bg-input)]
                text-[var(--color-green-primary)]
                hover:bg-[var(--color-green-primary)]
                hover:text-white
                hover:shadow-[var(--shadow-glow)]
                transition-all 
                duration-300
                hover:scale-105
                active:scale-95
              "
              title="프로젝트 관리"
            />

            {/* 툴팁 */}
            <div
              className="
                absolute 
                left-14 
                top-1/2 
                -translate-y-1/2 
                bg-[var(--text-bright)]
                text-[var(--bg-app)]
                text-xs 
                font-medium
                px-3 
                py-1.5 
                rounded-[var(--radius-md)]
                opacity-0 
                group-hover:opacity-100 
                transition-all
                duration-200
                pointer-events-none 
                whitespace-nowrap 
                z-50
                shadow-[var(--shadow-lg)]
              "
            >
              프로젝트 관리
            </div>
          </div>

          {/* === 3. 로그아웃 버튼 === */}
          <div className="relative group">
            <IconButton
              icon={<LogOut size={16} />}
              variant="ghost"
              size="md"
              onClick={() => setIsLogoutModalOpen(true)}
              className="
                w-11 h-11
                rounded-full
                text-[var(--text-tertiary)]
                hover:text-[var(--color-error)]
                hover:bg-[var(--error-bg)]
                transition-all 
                duration-200
              "
              title="로그아웃"
            />

            {/* 툴팁 */}
            <div
              className="
                absolute 
                left-14 
                top-1/2 
                -translate-y-1/2 
                bg-[var(--text-bright)]
                text-[var(--bg-app)]
                text-xs 
                font-medium
                px-3 
                py-1.5 
                rounded-[var(--radius-md)]
                opacity-0 
                group-hover:opacity-100 
                transition-all
                duration-200
                pointer-events-none 
                whitespace-nowrap 
                z-50
                shadow-[var(--shadow-lg)]
              "
            >
              로그아웃
            </div>
          </div>
        </div>
      </div>

      {/* === 4. 로그아웃 확인 모달 === */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        confirmVariant="danger"
      />

      {/* === 5. 프로젝트 관리 모달 === */}
      <ProjectManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </>
  );
};

export default ProjectSidebar;