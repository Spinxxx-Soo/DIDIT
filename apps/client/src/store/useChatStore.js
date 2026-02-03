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

        // 환경변수를 못잡아서 일단은 이렇게
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.did-it.xyz';
        console.log(`[SSE] Connecting using Base URL: ${baseUrl}`);
        const es = new EventSource(`${baseUrl}/api/v1/channels/${channelId}/stream`, {
            withCredentials: true
        });

        // ⭐ 중요: state에 저장!
        set({ eventSource: es });

        es.onopen = () => {
            console.log("[SSE] Connected!");
            set({ isConnected: true });
        };

        es.onmessage = (event) => {
            console.log('[SSE] ✉️ Message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('[SSE] 📦 Parsed data:', data);

                // ⭐ 백엔드 응답 구조에 맞게 수정
                const newMessage = {
                    id: data.sentAtEpochMs, // ID가 없으니 timestamp 사용
                    content: data.content,   // ← message가 아니라 content
                    sender: data.senderId,   // ← userId가 아니라 senderId
                    time: new Date(data.sentAtEpochMs).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                    }),
                    isMine: data.senderId === user?.userId,
                };

                console.log('[SSE] 🎯 New message object:', newMessage);
                console.log('[SSE] 👤 isMine check:', {
                    senderId: data.senderId,
                    userId: user?.userId,
                    isMine: data.senderId === user?.userId
                });

                set((state) => {
                    const exists = state.messages.find(m => m.id === newMessage.id);
                    console.log('[SSE] 🔍 Duplicate check:', exists ? 'DUPLICATE' : 'NEW');

                    if (exists) return state;

                    console.log('[SSE] ➕ Adding message to state');
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
                        m.id === updatedData.sentAtEpochMs
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
                    messages: state.messages.filter(m => m.id !== deletedData.sentAtEpochMs)
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
            if (!isConnected) {
                console.log('[SSE] Reconnecting...');
                get().connect(channelId, user);
            }
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
    fetchRecentChats: async (channelId, user) => {
        set({ isLoading: true });
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        try {
            if (isMock) {
                set({ messages: [], isLoading: false });
                return;
            }

            const response = await chatApi.getChats(channelId, { size: 50, sort: 'createdAt,asc' });

            console.log('[fetchRecentChats] 🔍 response.data:', response.data);
            const dataToMap = Array.isArray(response.data) ? response.data : (response.data.content || []);

            const fetchedMessages = dataToMap.map(msg => ({
                id: msg.id,
                content: msg.message,
                sender: msg.userId,
                time: new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                }),
                isMine: msg.userId === user?.userId,
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

        // 1. 임시 메시지 생성 (Optimistic UI)
        const tempId = Date.now() + Math.random(); // 유니크성을 위해 난수 추가

        const tempMsg = {
            id: tempId,
            content: content,
            sender: user?.userId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
            isTemp: true, // 임시 상태 표시
        };

        // 2. 스토어에 즉시 추가
        set(state => ({ messages: [...state.messages, tempMsg] }));

        try {
            const response = await chatApi.createChat(channelId, { content });
            console.log('[sendMessage] 📦 Full response:', response);
            console.log('[sendMessage] 📦 response.data:', response.data);

            // ⭐ 백엔드 응답 구조 확인
            const data = response.data;
            const realId = data.id;

            set(state => {
                // SSE로 이미 들어왔는지 확인
                const exists = state.messages.find(m => m.id === realId);
                if (exists) {
                    // 임시 메시지만 제거
                    return { messages: state.messages.filter(m => m.id !== tempId) };
                }

                // 임시 메시지를 실제 데이터로 교체
                return {
                    messages: state.messages.map(m =>
                        m.id === tempId
                            ? {
                                id: realId,
                                content: data.message || content,
                                sender: data.userId || user?.userId,
                                time: new Date(data.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit'
                                }),
                                isMine: true,
                                isTemp: false
                            }
                            : m
                    )
                };
            });

        } catch (error) {
            console.error("Message send failed:", error);
            set(state => ({ messages: state.messages.filter(m => m.id !== tempId) }));
            throw error;
        }
    },
}));

export default useChatStore;
