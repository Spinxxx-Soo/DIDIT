import { create } from 'zustand';
import { chatApi } from '@/api/features';
import useMeetingStore from '@/store/useMeetingStore';
import { toast } from '@/store/useToastStore';

const EVENT_SOURCE_URL = "http://localhost:8080/sse/subscribe";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const useChatStore = create((set, get) => ({
    messages: [],
    isConnected: false,
    connectedChannelId: null, // 추가: 현재 연결된 채널 ID 추적
    eventSource: null,
    isLoading: false,
    error: null,

    // 1. SSE 연결
    connect: (channelId, user) => {
        const { eventSource, isConnected, connectedChannelId } = get();

        // A) 같은 채널에 이미 연결되어 있다면 패스
        if (isConnected && connectedChannelId === channelId && eventSource) {
            console.log('[connect] Already connected to same channel, skipping');
            return;
        }

        // B) 다른 채널로 이동하거나, 연결이 끊긴 상태라면
        if (eventSource) {
            console.log('[connect] Closing existing connection...');
            eventSource.close();
            set({ eventSource: null, isConnected: false });
        }

        // 채널이 변경된 경우에만 메시지 초기화 (UX 개선)
        if (connectedChannelId !== channelId) {
            set({ messages: [], connectedChannelId: channelId });
        }

        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        if (isMock) {
            console.log(`[Mock] Connecting to channel ${channelId}...`);
            set({ isConnected: true });
            return;
        }

        console.log(`[SSE] Connecting to channel ${channelId}...`);

        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';
        console.log(`[SSE] Connecting using Base URL: ${baseUrl}`);
        const es = new EventSource(`${baseUrl}/api/v1/channels/${channelId}/stream`, {
            withCredentials: true
        });

        set({ eventSource: es });

        es.onopen = () => {
            console.log("[SSE] Connected!");
            set({ isConnected: true });
        };

        es.onmessage = (event) => {
            try {
                if (!event.data) return;
                const data = JSON.parse(event.data);

                // Spec: channelId, senderId, content, sentAtEpochMs
                const epoch = data.sentAtEpochMs ?? data.sentAt ?? data.createdAtEpochMs ?? Date.now();
                const messageId = data.id ?? data.chatId ?? data.sentAtEpochMs ?? `sse-${epoch}-${data.senderId ?? 'unknown'}`;

                const newMessage = {
                    id: messageId,                 // 가능하면 DB id(chatId/id) 우선, 없으면 안정 fallback
                    content: data.content ?? '',    // content 없으면 빈 문자열로 방어
                    sender: data.senderId ?? null,  // senderId 없을 때도 안전
                    sentAtEpochMs: epoch,           // 나중에 temp 교체/정렬에도 쓰기 좋음
                    time: new Date(epoch).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    isMine: (data.senderId ?? null) === (user?.userId ?? null),
                    isTemp: false,
                };


                set((state) => {
                    // 1. 이미 동일한 ID(서버 ID)가 있는지 확인
                    const isAlreadyExists = state.messages.some(m => m.id === newMessage.id);
                    if (isAlreadyExists) return state;

                    // 2. 내가 보낸 메시지라면, 현재 목록에 'isTemp' 상태인 내 메시지가 있는지 확인
                    if (newMessage.isMine) {
                        const tempMsgIndex = state.messages.findLastIndex(
                            m => m.isTemp && m.sender === newMessage.sender && m.content === newMessage.content
                        );

                        if (tempMsgIndex !== -1) {
                            // 임시 메시지를 서버에서 온 진짜 메시지로 교체
                            const newMessages = [...state.messages];
                            newMessages[tempMsgIndex] = newMessage;
                            return { messages: newMessages };
                        }
                    }

                    // 3. 남이 보낸 거거나 교체할 대상이 없다면 새로 추가
                    return { messages: [...state.messages, newMessage] };
                });
            } catch (err) {
                console.error("[SSE] Parse Error:", err);
            }
        };

        // 채팅 수정 이벤트 (이벤트명: chat_update)
        es.addEventListener('chat_update', (event) => {
            console.log('[SSE] 🔄 chat_update:', event.data);
            try {
                const updatedData = JSON.parse(event.data);
                set(state => ({
                    messages: state.messages.map(m =>
                        // 주의: SSE로 받은 메시지는 ID가 없을 수 있어 수정 안될 수 있음 (DB ID vs Timestamp ID 문제)
                        m.id === updatedData.chatId
                            ? { ...m, content: updatedData.content }
                            : m
                    )
                }));
            } catch (e) { console.error(e); }
        });

        // 채팅 삭제 이벤트 (이벤트명: chat_delete)
        es.addEventListener('chat_delete', (event) => {
            console.log('[SSE] 🗑️ chat_delete:', event.data);
            try {
                const deletedData = JSON.parse(event.data);
                set(state => ({
                    // 주의: 위와 동일한 ID 불일치 문제 존재 가능
                    messages: state.messages.filter(m => m.id !== deletedData.chatId)
                }));
            } catch (e) { console.error(e); }
        });

        // 미디어 참가자 입장 이벤트
        es.addEventListener('media_participant_joined', (event) => {
            console.log('[SSE] media_participant_joined:', event.data);
            try {
                const data = JSON.parse(event.data);
                const meetingStore = useMeetingStore.getState();
                meetingStore.addParticipant({
                    id: data.connectionId,
                    name: data.user?.name || data.user?.githubLogin || '참가자',
                    avatarUrl: data.user?.avatarUrl || null,
                    stream: null,
                    isSpeaking: false,
                    isLocal: false,
                });
            } catch (e) { console.error('[SSE] media_participant_joined parse error:', e); }
        });

        // 미디어 참가자 퇴장 이벤트
        es.addEventListener('media_participant_left', (event) => {
            console.log('[SSE] media_participant_left:', event.data);
            try {
                const data = JSON.parse(event.data);
                const meetingStore = useMeetingStore.getState();
                meetingStore.removeParticipant(data.connectionId);
            } catch (e) { console.error('[SSE] media_participant_left parse error:', e); }
        });

        // 녹화 시작 이벤트
        es.addEventListener('media_recording_start', (event) => {
            console.log('[SSE] media_recording_start:', event.data);
            const meetingStore = useMeetingStore.getState();
            meetingStore.setRecording(true);
        });

        // 녹화 종료 이벤트
        es.addEventListener('media_recording_stop', (event) => {
            console.log('[SSE] media_recording_stop:', event.data);
            const meetingStore = useMeetingStore.getState();
            meetingStore.setRecording(false);
        });

        // 미디어 에러 이벤트
        es.addEventListener('media_error', (event) => {
            console.log('[SSE] media_error:', event.data);
            try {
                const data = JSON.parse(event.data);
                toast.error(data.errorResponse?.Message || '미디어 오류가 발생했습니다.');
            } catch (e) {
                toast.error('미디어 오류가 발생했습니다.');
            }
        });

        es.onerror = (err) => {
            console.error("[SSE] Connection Error:", err);
            es.close();
            set({ isConnected: false, eventSource: null });

            // Auto-reconnect Logic
            const { connectedChannelId } = get();
            if (connectedChannelId === channelId) {
                console.log("[SSE] Attempting to reconnect in 3s...");
                setTimeout(() => {
                    const { connectedChannelId: currentChannelId } = get();
                    // 사용자가 여전히 같은 채널에 있는지 확인 후 재연결
                    if (currentChannelId === channelId) {
                        get().connect(channelId, user);
                    }
                }, 3000);
            }
        };

        // Keep-alive check or Auto-reconnect logic could go here
    },

    // 2. 연결 종료
    disconnect: () => {
        const { eventSource } = get();
        if (eventSource) {
            console.log("[SSE] Disconnecting...");
            eventSource.close();
            // 메시지는 비우지 않음 (UX: 재연결 시 보여주기 위함)
            // 다만 connectedChannelId는 남겨두거나 비울 수 있는데,
            // 완전히 '나가기' 개념이라면 비우는게 맞지만, 단순 탭 닫기면 남길 수도 있음.
            // 여기서는 연결 상태만 끊는 것으로 처리.
            set({ eventSource: null, isConnected: false });
        }
    },

    // 3. 이전 메시지 불러오기
    fetchRecentChats: async (channelId, user) => {
        set({ isLoading: true });
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        try {
            if (isMock) {
                set({ messages: [], isLoading: false });
                return;
            }

            const response = await chatApi.getChats(channelId, { size: 50, sort: 'createdAt,asc' });
            const dataToMap = Array.isArray(response.data) ? response.data : (response.data.content || []);

            // console.log('[fetchRecentChats] Raw Data:', dataToMap);

            const fetchedMessages = dataToMap.map(msg => ({
                id: msg.id, // DB ID
                content: msg.content || msg.message, // Fallback for safety
                sender: msg.senderId || msg.userId, // Fallback for safety
                time: new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                }),
                isMine: (msg.senderId || msg.userId) === user?.userId,
            }));

            set({ messages: fetchedMessages, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch chats:", error);
            set({ error: error.message, isLoading: false });
        }
    },

    // 4. 메시지 전송
    sendMessage: async (channelId, content, user) => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        // 1. 임시 메시지 생성 (Optimistic UI)
        // 임시 ID는 문자열로 구분하여 충돌 방지
        const tempId = `temp-${Date.now()}`;

        const tempMsg = {
            id: tempId,
            content: content,
            sender: user?.userId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
            isTemp: true,
        };

        if (isMock) {
            set(state => ({ messages: [...state.messages, { ...tempMsg, isTemp: false }] }));
            return;
        }

        // 스토어에 즉시 추가
        set(state => ({ messages: [...state.messages, tempMsg] }));

        try {
            // Spec: 200 OK (No Body)
            await chatApi.createChat(channelId, { content });

            // 성공 시, SSE가 오면 자동으로 교체되므로 여기서는 별도 처리가 필요 없음.
            // 다만, 혹시 SSE가 너무 늦거나 안 올 경우를 대비해 isTemp를 false로 바꿔주는 방어 로직만 유지할 수도 있으나,
            // 현재 로직상 SSE가 와야 ID가 서버 시간으로 동기화되므로 그냥 둡니다.

        } catch (error) {
            console.error("Message send failed:", error);
            // 실패 시 제거
            set(state => ({ messages: state.messages.filter(m => m.id !== tempId) }));
            throw error;
        }
    },

    // 5. 메시지 수정
    editMessage: async (channelId, chatId, content) => {
        try {
            await chatApi.updateChat(chatId, { content });
            // API 성공 시 로컬 상태 즉시 업데이트
            set(state => ({
                messages: state.messages.map(m =>
                    m.id === chatId ? { ...m, content } : m
                )
            }));
        } catch (error) {
            console.error("Message edit failed:", error);
            throw error;
        }
    },

    // 6. 메시지 삭제
    deleteMessage: async (channelId, chatId) => {
        try {
            await chatApi.deleteChat(chatId);
            // API 성공 시 로컬 상태 즉시 업데이트
            set(state => ({
                messages: state.messages.filter(m => m.id !== chatId)
            }));
        } catch (error) {
            console.error("Message delete failed:", error);
            throw error;
        }
    },
}));

export default useChatStore;
