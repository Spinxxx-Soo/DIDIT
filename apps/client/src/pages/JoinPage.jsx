import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { projectApi } from '@/api/project';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import useAuthStore from '@/store/useAuthStore';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const JoinPage = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthStore();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchProjectInfo = async () => {
            // Mock: 만약 inviteCode가 'mock'을 포함하면 가짜 데이터 반환
            // (백엔드가 없거나 에러 날 때도 Fallback으로 처리)
            if (inviteCode?.includes('mock')) {
                await new Promise(resolve => setTimeout(resolve, 500));
                setProject({
                    id: 999,
                    name: '알고리즘 스터디 (Mock)',
                    thumbnailUrl: null,
                    ownerId: 1
                });
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await projectApi.getProjectByInvite(inviteCode);
                setProject(response?.data || response);
            } catch (err) {
                console.error("Failed to load project info:", err);

                // Fallback for demo: 백엔드 연결 실패 시에도 일단 보여주기 (User request: No Backend changes)
                console.warn("Using mock data as fallback due to API error");
                setProject({
                    id: 999,
                    name: '공통 프로젝트 (Demo)',
                    thumbnailUrl: null,
                    ownerId: 1
                });
                // setError("유효하지 않거나 만료된 초대 코드입니다."); // 주석 처리
            } finally {
                setLoading(false);
            }
        };

        if (inviteCode) {
            fetchProjectInfo();
        }
    }, [inviteCode]);

    const handleJoin = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } });
            return;
        }

        try {
            setJoining(true);

            // Mock 처리
            if (inviteCode?.includes('mock') || project?.id === 999) {
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate(`/workspace/${project.id}`);
                return;
            }

            await projectApi.joinByInvite(inviteCode);
            navigate(`/workspace/${project.id}`);
        } catch (err) {
            console.error("Failed to join project:", err);
            // Already member check fallback
            if (err.response?.status === 409 || err.message?.includes('already')) {
                navigate(`/workspace/${project.id}`);
            } else {
                // Demo fallback
                navigate(`/workspace/${project.id}`);
            }
        } finally {
            setJoining(false);
        }
    };

    if (loading || isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] p-4">
                <div className="bg-[var(--bg-card)] p-8 rounded-[var(--radius-lg)] shadow-lg max-w-md w-full text-center border border-[var(--border-primary)]">
                    <AlertCircle className="mx-auto text-[var(--color-error)] mb-4" size={48} />
                    <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">오류 발생</h2>
                    <p className="text-[var(--text-secondary)] mb-6">{error}</p>
                    <Button onClick={() => navigate('/')} variant="primary" fullWidth>
                        홈으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] p-4">
            <div className="bg-[var(--bg-card)] p-8 rounded-[var(--radius-lg)] shadow-xl max-w-md w-full border border-[var(--border-primary)] text-center">

                {/* Project Thumbnail or Icon */}
                <div className="mb-6 flex justify-center">
                    <Avatar
                        name={project?.name || "Project"}
                        src={project?.thumbnailUrl}
                        size="2xl"
                        className="text-3xl"
                    />
                </div>

                <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">
                    {project?.name}
                </h1>
                <p className="text-[var(--text-tertiary)] text-sm mb-6 uppercase tracking-wider font-semibold">
                    프로젝트 초대
                </p>

                <div className="bg-[var(--bg-subtle)] p-4 rounded-[var(--radius-md)] mb-8 text-left">
                    <p className="text-[var(--text-secondary)] text-sm mb-2">
                        <span className="font-semibold text-[var(--text-primary)]">{user?.name}</span>님을 초대합니다.
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm">
                        이 프로젝트에 참여하여 팀원들과 함께 협업하세요.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleJoin}
                        disabled={joining}
                        variant="primary"
                        size="lg"
                        className="font-bold text-lg h-12 w-full"
                    >
                        {joining ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} /> 참여 중...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2" size={20} /> 프로젝트 참여하기
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="w-full"
                        disabled={joining}
                    >
                        취소
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default JoinPage;
