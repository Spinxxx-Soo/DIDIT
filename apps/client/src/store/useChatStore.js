import { create } from 'zustand';
import { chatApi } from '@/api/features';
import useAuthStore from '@/store/useAuthStore'; // Auth store for user ID check

const useChatStore = create((set, get) => ({
    messages: [],
    isConnected: false,
    eventSource: null,
    isLoading: false,
    error: null,

    // 1. SSE 연결
    connect: (channelId) => {
        const { eventSource, isConnected } = get();
        if (eventSource || isConnected) return;

        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        if (isMock) {
            console.log(`[Mock] Connecting to channel ${channelId}...`);
            set({ isConnected: true });
            return;
        }

        console.log(`[SSE] Connecting to channel ${channelId}...`);

        // 환경변수를 못잡아서 일단은 이렇게
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';
        console.log(`[SSE] Connecting using Base URL: ${baseUrl}`);
        const es = new EventSource(`${baseUrl}/api/v1/channels/${channelId}/stream`, {
            withCredentials: true
        });

        es.onopen = () => {
            console.log("[SSE] Connected!");
            set({ isConnected: true });
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // 백엔드 응답 필드: message, userId, createdAt, id
                const user = useAuthStore.getState().user;

                const newMessage = {
                    id: data.id,
                    content: data.message, // 응답 필드: message
                    sender: data.userId,   // 응답 필드: userId
                    time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMine: data.userId === user?.userId,
                };

                set((state) => {
                    // 중복 방지 (이미 존재하는 ID면 무시)
                    if (state.messages.find(m => m.id === newMessage.id)) return state;
                    return { messages: [...state.messages, newMessage] };
                });
            } catch (err) {
                console.error("[SSE] JSON Parse Error:", err);
            }
        };

        // 채팅 수정 이벤트 (이벤트명: chat_update)
        es.addEventListener('chat_update', (event) => {
            try {
                const updatedData = JSON.parse(event.data);
                set(state => ({
                    messages: state.messages.map(m =>
                        m.id === updatedData.id ? { ...m, content: updatedData.message } : m
                    )
                }));
            } catch (e) { console.error(e); }
        });

        // 채팅 삭제 이벤트 (이벤트명: chat_delete)
        es.addEventListener('chat_delete', (event) => {
            try {
                const deletedData = JSON.parse(event.data);
                set(state => ({
                    messages: state.messages.filter(m => m.id !== deletedData.id)
                }));
            } catch (e) { console.error(e); }
        });

        es.onerror = (err) => {
            console.error("[SSE] Connection Error:", err);
            es.close();
            set({ isConnected: false, eventSource: null });
        };

        setTimeout(() => {
            const { isConnected } = get();
            if (!isConnected) get().connect(channelId);
        }, 3000);
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
    fetchRecentChats: async (channelId) => {
        set({ isLoading: true });
        const user = useAuthStore.getState().user;
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        try {
            if (isMock) {
                set({ messages: [], isLoading: false });
                return;
            }

            const response = await chatApi.getChats(channelId, { size: 50, sort: 'createdAt,asc' });
            // API 응답 구조 매핑
            const fetchedMessages = response.data.map(msg => ({
                id: msg.id,
                content: msg.message,
                sender: msg.userId,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMine: msg.userId === user?.userId,
            }));

            set({ messages: fetchedMessages, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch chats:", error);
            set({ error: error.message, isLoading: false });
        }
    },

    // 4. 메시지 전송
    sendMessage: async (channelId, content) => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        if (isMock) {
            const myMsg = {
                id: Date.now(),
                content: content,
                sender: '나',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMine: true
            };
            set(state => ({ messages: [...state.messages, myMsg] }));
            return;
        }

        try {
            await chatApi.createChat(channelId, { content });
            // SSE를 통해 메시지가 들어오므로 여기서 수동으로 추가하지 않음 (중복 방지)
        } catch (error) {
            console.error("Message send failed:", error);
            throw error;
        }
    },
}));

export default useChatStore;
