import { useEffect, useRef, useCallback } from 'react';
import useLoungeStore from '@/store/useLoungeStore';
import useMeetingStore from '@/store/useMeetingStore';
import useToastStore from '@/store/useToastStore';

const RECONNECT_DELAY = 3000;
const MAX_CONNECTION_TIME = 30 * 60 * 1000; // 30분

/**
 * 프로젝트 진입 시 SSE 연결을 관리하는 커스텀 훅
 *
 * /api/v1/projects/{projectId}/stream → ai_sort_result, ping
 */
const useProjectSSE = (projectId) => {
    const projectESRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const connectionTimerRef = useRef(null);

    const isMock = import.meta.env.VITE_USE_MOCK === 'true';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';

    const disconnect = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (connectionTimerRef.current) {
            clearTimeout(connectionTimerRef.current);
            connectionTimerRef.current = null;
        }
        if (projectESRef.current) {
            projectESRef.current.close();
            projectESRef.current = null;
        }
    }, []);

    const connectProjectStream = useCallback(() => {
        if (!projectId || isMock) return;

        // 기존 연결 정리
        disconnect();

        const es = new EventSource(
            `${baseUrl}/api/v1/projects/${projectId}/stream`,
            { withCredentials: true }
        );
        projectESRef.current = es;

        es.onopen = () => {
            console.log('[ProjectSSE] 프로젝트 스트림 연결 성공');
        };

        // ai_sort_result: 이슈 정렬 순서 수신
        es.addEventListener('ai_sort_result', (event) => {
            console.log('[ProjectSSE] ai_sort_result:', event.data);
            try {
                const sortedIds = JSON.parse(event.data); // [100, 101, 102]
                const { issues } = useLoungeStore.getState();

                const issueMap = new Map(issues.map(issue => [issue.id, issue]));
                const reordered = [];

                sortedIds.forEach(id => {
                    const issue = issueMap.get(id);
                    if (issue) {
                        reordered.push(issue);
                        issueMap.delete(id);
                    }
                });

                // 정렬 목록에 없는 나머지 이슈는 뒤에 유지
                issueMap.forEach(issue => reordered.push(issue));

                useLoungeStore.setState({ issues: reordered });
            } catch (e) {
                console.error('[ProjectSSE] ai_sort_result 파싱 오류:', e);
            }
        });

        // media_summary_generated: 회의록 생성 완료
        es.addEventListener('media_summary_generated', (event) => {
            console.log('[ProjectSSE] media_summary_generated:', event.data);
            try {
                const data = JSON.parse(event.data);
                const meetingStore = useMeetingStore.getState();
                meetingStore.setGenerating(false);
                meetingStore.setGeneratedSummaryId(data.summeryId);

                const { addToast } = useToastStore.getState();
                addToast({ type: 'success', message: '회의록 생성이 완료되었습니다.' });
            } catch (e) {
                console.error('[ProjectSSE] media_summary_generated 파싱 오류:', e);
            }
        });

        es.addEventListener('ping', () => {
            // keep-alive, no action
        });

        es.onerror = () => {
            console.error('[ProjectSSE] 프로젝트 스트림 연결 오류');
            es.close();
            projectESRef.current = null;

            reconnectTimerRef.current = setTimeout(() => {
                connectProjectStream();
            }, RECONNECT_DELAY);
        };

        // 30분 타임아웃 재연결
        connectionTimerRef.current = setTimeout(() => {
            console.log('[ProjectSSE] 프로젝트 스트림 30분 타임아웃, 재연결...');
            es.close();
            projectESRef.current = null;
            connectProjectStream();
        }, MAX_CONNECTION_TIME);
    }, [projectId, baseUrl, isMock, disconnect]);

    // 라이프사이클 관리
    useEffect(() => {
        connectProjectStream();

        return () => {
            disconnect();
        };
    }, [connectProjectStream, disconnect]);

    return { disconnect };
};

export default useProjectSSE;
