import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';

import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import useAuthStore from '@/store/useAuthStore';

const ProjectSidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { logout } = useAuthStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 임시 프로젝트 데이터
  const projects = [
    { id: '1', name: '공통 프로젝트', color: '#3B82F6' },
    { id: '2', name: '특화 프로젝트', color: '#10B981' },
    { id: '3', name: '자율 프로젝트', color: '#F59E0B' },
  ];

  const handleProjectClick = (id) => {
    navigate(`/workspace/${id}`);
  };

  const handleAddProject = () => {
    // 방 추가 모달 나중에 추가
    alert("추가/삭제."); 
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 w-full h-full bg-[var(--bg-sidebar)]">
        {/* === 1. 프로젝트 리스트 === */}
        <div className="flex flex-col gap-3 w-full items-center flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide pt-3">
          {projects.map((project) => {
            const isActive = projectId === project.id;

            return (
              <div key={project.id} className="relative group">
                <button
                  onClick={() => handleProjectClick(project.id)}
                  className={`
                    w-10 h-10 flex items-center justify-center 
                    text-white font-bold text-sm shadow-sm
                    rounded-[12px] /* 기본 모양: 둥근 사각형 */
                    transition-all duration-200 ease-in-out
                    
                    /* [수정] Hover 시: 크기만 살짝 커짐 */
                    hover:scale-110
                    
                    /* [수정] 선택 시: 초록색 테두리 추가 */
                    ${isActive 
                      ? 'ring-2 ring-[var(--color-green-primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)]' 
                      : ''
                    }
                  `}
                  style={{ backgroundColor: project.color }}
                  title={project.name}
                >
                  {project.name.charAt(0)}
                </button>

                {/* 툴팁 (이름 표시) */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {project.name}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-black/80"></div>
                </div>
              </div>
            );
          })}
                    {/* === 3. 프로젝트 추가 버튼 === */}
          <div className="relative group">
            <IconButton
              icon={<Plus size={20} />}
              variant="ghost"
              size="md"
              onClick={handleAddProject}
              className="rounded-[12px] bg-[var(--bg-input)] text-[var(--color-green-primary)] hover:bg-[var(--color-green-primary)] hover:text-white transition-all duration-200 hover:scale-105"
              title="새 프로젝트 만들기"
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
    </>
  );
};

export default ProjectSidebar;