import { useEffect, useRef, useCallback } from 'react';
import useLoungeStore from '@/store/useLoungeStore';
import useChatStore from '@/store/useChatStore';

const RECONNECT_DELAY = 3000;
const MAX_CONNECTION_TIME = 30 * 60 * 1000; // 30분

/**
 * 프로젝트 진입 시 SSE 연결을 관리하는 커스텀 훅
 *
 * 2개의 EventSource를 관리:
 * 1. /api/v1/projects/{projectId}/stream → ai_sort_result
 * 2. /api/v1/channels/{projectId}/stream → chat_update, chat_delete (백엔드 워크어라운드)
 */
const useProjectSSE = (projectId) => {
    const projectESRef = useRef(null);
    const chatWorkaroundESRef = useRef(null);

    const reconnectTimerRef = useRef(null);
    const chatReconnectTimerRef = useRef(null);
    const connectionTimerRef = useRef(null);
    const chatConnectionTimerRef = useRef(null);

    const isMock = import.meta.env.VITE_USE_MOCK === 'true';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';

    // 모든 타이머 정리
    const clearAllTimers = useCallback(() => {
        [reconnectTimerRef, chatReconnectTimerRef, connectionTimerRef, chatConnectionTimerRef].forEach(ref => {
            if (ref.current) {
                clearTimeout(ref.current);
                ref.current = null;
            }
        });
    }, []);

    // 모든 연결 정리
    const disconnectAll = useCallback(() => {
        clearAllTimers();
        [projectESRef, chatWorkaroundESRef].forEach(ref => {
            if (ref.current) {
                ref.current.close();
                ref.current = null;
            }
        });
    }, [clearAllTimers]);

    // --- Connection A: 프로젝트 스트림 ---
    const connectProjectStream = useCallback(() => {
        if (!projectId || isMock) return;

        if (projectESRef.current) {
            projectESRef.current.close();
        }
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (connectionTimerRef.current) {
            clearTimeout(connectionTimerRef.current);
            connectionTimerRef.current = null;
        }

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
    }, [projectId, baseUrl, isMock]);

    // --- Connection B: chat_update/delete 워크어라운드 ---
    const connectChatWorkaroundStream = useCallback(() => {
        if (!projectId || isMock) return;

        if (chatWorkaroundESRef.current) {
            chatWorkaroundESRef.current.close();
        }
        if (chatReconnectTimerRef.current) {
            clearTimeout(chatReconnectTimerRef.current);
            chatReconnectTimerRef.current = null;
        }
        if (chatConnectionTimerRef.current) {
            clearTimeout(chatConnectionTimerRef.current);
            chatConnectionTimerRef.current = null;
        }

        const es = new EventSource(
            `${baseUrl}/api/v1/channels/${projectId}/stream`,
            { withCredentials: true }
        );
        chatWorkaroundESRef.current = es;

        es.onopen = () => {
            console.log('[ProjectSSE] chat 워크어라운드 스트림 연결 성공');
        };

        // chat_update (projectId를 channelId로 사용하는 백엔드 이슈 대응)
        es.addEventListener('chat_update', (event) => {
            console.log('[ProjectSSE] chat_update (workaround):', event.data);
            try {
                const updatedData = JSON.parse(event.data);
                useChatStore.setState(state => ({
                    messages: state.messages.map(m =>
                        m.id === updatedData.chatId
                            ? { ...m, content: updatedData.content }
                            : m
                    )
                }));
            } catch (e) { console.error('[ProjectSSE] chat_update 파싱 오류:', e); }
        });

        // chat_delete (projectId를 channelId로 사용하는 백엔드 이슈 대응)
        es.addEventListener('chat_delete', (event) => {
            console.log('[ProjectSSE] chat_delete (workaround):', event.data);
            try {
                const deletedData = JSON.parse(event.data);
                useChatStore.setState(state => ({
                    messages: state.messages.filter(m => m.id !== deletedData.chatId)
                }));
            } catch (e) { console.error('[ProjectSSE] chat_delete 파싱 오류:', e); }
        });

        es.addEventListener('ping', () => {
            // keep-alive, no action
        });

        es.onerror = () => {
            console.error('[ProjectSSE] chat 워크어라운드 스트림 연결 오류');
            es.close();
            chatWorkaroundESRef.current = null;

            chatReconnectTimerRef.current = setTimeout(() => {
                connectChatWorkaroundStream();
            }, RECONNECT_DELAY);
        };

        // 30분 타임아웃 재연결
        chatConnectionTimerRef.current = setTimeout(() => {
            console.log('[ProjectSSE] chat 워크어라운드 30분 타임아웃, 재연결...');
            es.close();
            chatWorkaroundESRef.current = null;
            connectChatWorkaroundStream();
        }, MAX_CONNECTION_TIME);
    }, [projectId, baseUrl, isMock]);

    // 라이프사이클 관리
    useEffect(() => {
        connectProjectStream();
        connectChatWorkaroundStream();

        return () => {
            disconnectAll();
        };
    }, [connectProjectStream, connectChatWorkaroundStream, disconnectAll]);

    return { disconnectAll };
};

export default useProjectSSE;
