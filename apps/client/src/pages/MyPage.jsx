// src/pages/MyPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Clock } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import {
  Card,
  CardTitle,
  CardDescription,
} from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';

/**
 * MyPage - 마이페이지 (프로젝트 리스트)
 */
export function MyPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // 임시 사용자 데이터
  const user = {
    name: '이다연',
    avatar: null,
  };

  // 임시 프로젝트 데이터
  const recentProjects = [
    {
      id: '1',
      name: '공통 프로젝트',
      color: '#3B82F6',
      description: 'SSAFY 공통 프로젝트',
      memberCount: 6,
      lastAccessed: '2시간 전',
    },
    {
      id: '2',
      name: '특화 프로젝트',
      color: '#10B981',
      description: 'AI 기반 회의 플랫폼',
      memberCount: 6,
      lastAccessed: '1일 전',
    },
    {
      id: '3',
      name: '자율 프로젝트',
      color: '#F59E0B',
      description: '개발자 협업 도구',
      memberCount: 5,
      lastAccessed: '3일 전',
    },
  ];

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      // TODO: API 호출
      console.log('프로젝트 생성:', newProjectName);
      setIsCreateModalOpen(false);
      setNewProjectName('');
    }
  };

  return (
    <div className="space-y-10">
      {/* 인사말 섹션 */}
      <section className="flex items-center gap-6">
        <Avatar name={user.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-[28px] font-bold text-[var(--text-bright)] leading-tight">
            오늘 하루도 힘차게 시작해보아요,
            <br />
            {user.name}님!
          </h1>
        </div>
        <Button variant="secondary" leftIcon={<Settings size={18} />}>
          Edit
        </Button>
      </section>

      {/* 최근 접속한 프로젝트 */}
      <section className="space-y-4">
        <h2 className="text-[20px] font-semibold text-[var(--text-bright)]">
          최근 접속한 프로젝트
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentProjects.map((project) => (
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.charAt(0)}
                </div>

                {/* 프로젝트 정보 */}
                <div className="flex-1 min-w-0">
                  <CardTitle className="group-hover:text-[var(--color-green-primary)] transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription>{project.description}</CardDescription>
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
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
              <Plus size={20} className="text-[var(--text-secondary)]" />
            </div>
            <span className="text-[16px] font-medium text-[var(--text-secondary)]">
              새 프로젝트 만들기
            </span>
          </div>
        </Card>
      </section>

      {/* 프로젝트 생성 모달 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="새 프로젝트 만들기"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              생성하기
            </Button>
          </>
        }
      >
        <Input
          label="프로젝트 이름"
          placeholder="멋진 프로젝트의 이름을 지어주세요!"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          isRequired
        />
      </Modal>
    </div>
  );
}

export default MyPage;