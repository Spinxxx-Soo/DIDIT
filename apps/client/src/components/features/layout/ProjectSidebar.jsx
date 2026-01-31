import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LogOut, Loader2 } from 'lucide-react';

import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import { ProjectManageModal } from '@/components/features/project/ProjectManageModal';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import { getProjectColor, getProjectInitial } from '@/utils/projectUtils';

const ProjectSidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { logout } = useAuthStore();
  const { allProjects, fetchAllProjects, error, isLoading } = useProjectStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // 마운트 시 프로젝트 목록 조회
  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // 디버깅: 프로젝트 개수 확인
  useEffect(() => {
    console.log('[ProjectSidebar] allProjects:', allProjects?.length, allProjects);
  }, [allProjects]);

  const handleProjectClick = (id) => {
    navigate(`/workspace/${id}`);
  };

  const handleManageClick = () => {
    setIsManageModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 w-full h-full bg-[var(--bg-sidebar)]">
        {/* === 1. 프로젝트 리스트 === */}
        <div className="flex flex-col gap-3 w-full items-center flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide pt-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="animate-spin text-[var(--color-green-primary)]" />
            </div>
          ) : error ? (
            <div className="text-center px-3 py-4 text-red-400 text-xs">
              프로젝트를 불러올 수 없습니다
            </div>
          ) : Array.isArray(allProjects) && allProjects.length > 0 ? (
            allProjects.map((project) => {
              const isActive = projectId === String(project.id);

              return (
                <div key={project.id} className="relative group">
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    className={`
                      w-10 h-10 flex items-center justify-center
                      text-white font-bold text-sm shadow-sm
                      rounded-[12px]
                      transition-all duration-200 ease-in-out
                      hover:scale-110
                      ${isActive
                        ? 'ring-2 ring-[var(--color-green-primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)]'
                        : ''
                      }
                    `}
                    style={{ backgroundColor: getProjectColor(project.id) }}
                    title={project.name}
                  >
                    {getProjectInitial(project.name)}
                  </button>

                  {/* 툴팁 (이름 표시) */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {project.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-black/80"></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center px-3 py-4 text-[var(--text-tertiary)] text-xs">
              프로젝트가 없습니다
            </div>
          )}

          {/* === 3. 프로젝트 관리 버튼 === */}
          <div className="relative group">
            <IconButton
              icon={<Plus size={20} />}
              variant="ghost"
              size="md"
              onClick={handleManageClick}
              className="rounded-[12px] bg-[var(--bg-input)] text-[var(--color-green-primary)] hover:bg-[var(--color-green-primary)] hover:text-white transition-all duration-200 hover:scale-105"
              title="프로젝트 관리"
            />
          </div>
        </div>



        {/* === 4. 로그아웃 버튼 (하단 고정) === */}
        <div className="mt-auto mb-2">
          <IconButton
            icon={<LogOut size={18} />}
            variant="ghost"
            size="md"
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
            title="로그아웃"
          />
        </div>

      </div>

      {/* === 5. 로그아웃 확인 모달 === */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        confirmVariant="danger"
      />

      {/* === 6. 프로젝트 관리 모달 === */}
      <ProjectManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </>
  );
};

export default ProjectSidebar;