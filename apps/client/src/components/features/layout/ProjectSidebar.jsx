/**
 * Apple-Style Project Sidebar
 * Clean design, smooth animations, elegant hover effects
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LogOut, Loader2 } from 'lucide-react';

import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import { ProjectManageModal } from '@/components/features/project/ProjectManageModal';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import useMeetingStore from '@/store/useMeetingStore';
import useOpenVidu from '@/hooks/useOpenVidu';
import { getProjectColor, getProjectInitial } from '@/utils/projectUtils';

const ProjectSidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { logout } = useAuthStore();
  const { allProjects, fetchAllProjects, loadNextProjects, hasMoreProjects, error, isLoading } = useProjectStore();

  // 회의 상태
  const { isInMeeting } = useMeetingStore();
  const { leaveSession } = useOpenVidu();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState(null);

  // 툴팁 상태 관리
  const [hoveredItem, setHoveredItem] = useState(null); // { text: string, top: number, left: number }

  const handleMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      text,
      top: rect.top + rect.height / 2, // 아이콘의 수직 중앙
      left: rect.right + 10,           // 아이콘의 오른쪽 + 여백
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // 마운트 시 프로젝트 목록 조회
  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // 디버깅: 프로젝트 개수 확인
  useEffect(() => {
    console.log('[ProjectSidebar] allProjects:', allProjects?.length, allProjects);
  }, [allProjects]);

  const handleProjectClick = (id) => {
    // 회의 중이고, 다른 프로젝트를 클릭했을 때만 경고 모달 표시
    if (isInMeeting && String(id) !== projectId) {
      setPendingProjectId(id);
      setIsLeaveModalOpen(true);
      return;
    }
    // 회의 중이고 같은 프로젝트를 클릭하면 아무것도 하지 않음
    if (isInMeeting && String(id) === projectId) {
      return;
    }
    navigate(`/workspace/${id}`);
  };

  // 회의 종료 후 프로젝트 이동
  const handleConfirmLeave = async () => {
    await leaveSession();
    setIsLeaveModalOpen(false);
    if (pendingProjectId) {
      navigate(`/workspace/${pendingProjectId}`);
      setPendingProjectId(null);
    }
  };

  const handleManageClick = () => {
    setIsManageModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
        {/* 수정: 아이콘 잘림 방지를 위해 py-3 추가 및 loading/error 처리 (Incoming Logic + HEAD Design) */}
        <div className="flex flex-col gap-3 w-full items-center flex-1 overflow-y-auto min-h-0 scrollbar-hide px-3 py-3 overflow-x-visible">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="animate-spin text-[var(--color-green-primary)]" />
            </div>
          ) : error ? (
            <div className="text-center px-3 py-4 text-red-400 text-xs">
              프로젝트를 불러올 수 없습니다
            </div>
          ) : Array.isArray(allProjects) && allProjects.length > 0 ? (
            allProjects.map((project, index) => {
              const isActive = projectId === String(project.id);
              return (
                <div
                  key={project.id}
                  className="relative group animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, project.name)}
                    onMouseLeave={handleMouseLeave}
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
                  >
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="w-full h-full object-cover rounded-[var(--radius-lg)]"
                      />
                    ) : (
                      getProjectInitial(project.name)
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center px-3 py-4 text-[var(--text-tertiary)] text-xs">
              프로젝트가 없습니다
            </div>
          )}

          {/* 더 보기 버튼 (아이콘 형태) */}
          {hasMoreProjects && (
            <div className="relative group animate-fade-in">
              <button
                onClick={loadNextProjects}
                onMouseEnter={(e) => handleMouseEnter(e, '더 보기')}
                onMouseLeave={handleMouseLeave}
                disabled={isLoading}
                className="
                  w-11 h-11 
                  flex items-center justify-center
                  bg-[var(--bg-input)]
                  text-[var(--text-tertiary)]
                  rounded-[var(--radius-lg)]
                  transition-all 
                  duration-300 
                  hover:scale-110
                  hover:bg-[var(--bg-elevated)]
                  hover:text-[var(--text-primary)]
                  active:scale-95
                  disabled:opacity-50
                "
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* === 2. 프로젝트 관리 버튼 === */}
        <div className="px-3 w-full flex flex-col items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="relative group">
            <div
              onMouseEnter={(e) => handleMouseEnter(e, '프로젝트 관리')}
              onMouseLeave={handleMouseLeave}
            >
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
              />
            </div>
          </div>

          {/* === 3. 로그아웃 버튼 === */}
          <div className="relative group">
            <div
              onMouseEnter={(e) => handleMouseEnter(e, '로그아웃')}
              onMouseLeave={handleMouseLeave}
            >
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* === 4. 로그아웃 확인 모달 === */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
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

      {/* === 6. 회의 종료 확인 모달 === */}
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setPendingProjectId(null);
        }}
        onConfirm={handleConfirmLeave}
        title="회의 종료"
        message="현재 회의에서 나가시겠습니까?"
        confirmText="나가기"
        confirmVariant="danger"
      />

      {/* === 6. 공통 툴팁 (Fixed Position) === */}
      {hoveredItem && (
        <div
          className="
            fixed
            bg-[var(--text-bright)]
            text-[var(--bg-app)]
            text-xs 
            font-medium
            px-3 
            py-1.5 
            rounded-[var(--radius-md)]
            shadow-[var(--shadow-lg)]
            z-[9999]
            pointer-events-none
            animate-fade-in
            whitespace-nowrap
          "
          style={{
            top: hoveredItem.top,
            left: hoveredItem.left,
            transform: 'translateY(-50%)',
          }}
        >
          {hoveredItem.text}
          {/* 화살표 */}
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
      )}
    </>
  );
};

export default ProjectSidebar;