import { create } from 'zustand';
import { chatApi } from '@/api/features';

const EVENT_SOURCE_URL = "http://localhost:8080/sse/subscribe";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const useChatStore = create((set, get) => ({
    messages: [],
    isConnected: false,
    eventSource: null,
    isLoading: false,
    error: null,

    // 1. SSE 연결
    connect: (channelId, user) => {
        const { eventSource, isConnected } = get();
        if (eventSource || isConnected) {
            console.log('[connect] Already connected, skipping');
            return;
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
            // console.log('[SSE] ✉️ Message received:', event.data);
            try {
                if (!event.data) return;
                const data = JSON.parse(event.data);
                // console.log('[SSE] 📦 Parsed data:', data);

                // Spec: channelId, senderId, content, sentAtEpochMs
                const newMessage = {
                    id: data.sentAtEpochMs, // Fallback ID
                    content: data.content,
                    sender: data.senderId,
                    time: new Date(data.sentAtEpochMs).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                    }),
                    isMine: data.senderId === user?.userId,
                };

                set((state) => {
                    // 중복 방지 (ID 기준)
                    const exists = state.messages.find(m => m.id === newMessage.id);
                    if (exists) return state;
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

        es.onerror = (err) => {
            console.error("[SSE] Connection Error:", err);
            es.close();
            set({ isConnected: false, eventSource: null });
        };

        // Keep-alive check or Auto-reconnect logic could go here
    },

    // 2. 연결 종료
    disconnect: () => {
        const { eventSource } = get();
        if (eventSource) {
            console.log("[SSE] Disconnecting...");
            eventSource.close();
            set({ eventSource: null, isConnected: false, messages: [] });
        } else {
            set({ messages: [] });
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
        // Note: SSE 메시지는 타임스탬프를 ID로 쓰므로, 여기서도 타임스탬프를 씁니다.
        // 다만 정확히 일치하지 않을 수 있어 중복 가능성은 존재합니다.
        const tempId = Date.now();

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

            // 성공 시 별도 처리 없음. SSE가 'message' 이벤트를 보내주길 기다림.
            // SSE가 오면 ID 매칭을 할 수 없으므로(SSE엔 DB ID 없음), 
            // 쿨하게 SSE 메시지를 추가하고 이 임시 메시지는 제거하는 전략을 쓸 수도 있으나,
            // 현재 구조에선 SSE가 오면 중복으로 뜰 가능성이 큼.

            /* 
               [개선 전략]
               임시 메시지를 남겨두고, SSE가 들어오면 `content`와 `sender`가 같고 `time`이 비슷한 메시지를 찾아 교체?
               -> 너무 복잡함. 
               -> 일단 성공했으면 isTemp를 false로 바꿔주는 것만 처리.
            */

            set(state => ({
                messages: state.messages.map(m =>
                    m.id === tempId ? { ...m, isTemp: false } : m
                )
            }));

        } catch (error) {
            console.error("Message send failed:", error);
            // 실패 시 제거
            set(state => ({ messages: state.messages.filter(m => m.id !== tempId) }));
            throw error;
        }
    },
}));

export default useChatStore;
