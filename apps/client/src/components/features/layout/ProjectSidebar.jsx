import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';

const ProjectSidebar = () => {
  const navigate = useNavigate();

  // 임시 프로젝트 데이터
  const projects = [
    { id: '1', name: '공통 프로젝트', color: 'var(--color-info)' },
    { id: '2', name: '특화 프로젝트', color: 'var(--color-green-primary)' },
    { id: '3', name: '자율 프로젝트', color: 'var(--color-warning)' },
  ];

  const handleProjectClick = (projectId) => {
    navigate(`/workspace/${projectId}`);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full bg-[var(--bg-sidebar)]">
      {/* 로고 (홈으로 가기) */}
      <Link
        to="/mypage"
        className="w-10 h-10 bg-[var(--bg-panel)] rounded-[var(--radius-lg)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-hover)] transition-colors duration-200 border border-[var(--border-default)]"
      >
        <span className="font-bold text-[var(--text-bright)] text-xs">PJT</span>
      </Link>

      <Divider className="w-8 my-1" />

      {/* 프로젝트 리스트 */}
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => handleProjectClick(project.id)}
          className="w-10 h-10 rounded-full cursor-pointer hover:rounded-[var(--radius-lg)] transition-all duration-200 flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: project.color }}
          title={project.name}
        >
          {project.name.charAt(0)}
        </button>
      ))}

      <Divider className="w-8 my-1" />

      {/* 추가 버튼 */}
      <IconButton
        icon={<Plus size={18} />}
        variant="ghost"
        size="md"
        className="rounded-full hover:bg-[var(--color-green-primary)] hover:text-white"
        title="새 프로젝트 만들기"
      />
    </div>
  );
};

export default ProjectSidebar;
