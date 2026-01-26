import { create } from 'zustand';
import { chatApi } from '@/api/features';

const EVENT_SOURCE_URL = "http://localhost:8080/sse/subscribe";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true; // 강제 Mock 모드 (테스트용)

const useChatStore = create((set, get) => ({
    messages: [],
    isConnected: false,
    eventSource: null,
    isLoading: false,
    error: null,

    // 1. SSE 연결
    connect: (roomId) => {
        if (get().eventSource || get().isConnected) return;

        if (IS_MOCK) {
            console.log(`[Mock] Connecting to room ${roomId}...`);
            setTimeout(() => {
                console.log("[Mock] Connected!");
                set({ isConnected: true });
                // 초기 웰컴 메시지 시뮬레이션
                set(state => ({
                    messages: [...state.messages, {
                        id: Date.now(),
                        sender: "시스템",
                        content: "채팅방에 연결되었습니다. (Mock Mode)",
                        isMine: false,
                        time: new Date().toLocaleTimeString()
                    }]
                }));
            }, 500);
            return;
        }

        console.log(`[SSE] Connecting to room ${roomId}...`);

        // SSE 연결 생성
        // endpoint 예시: http://localhost:8080/sse/subscribe?roomId=1
        const es = new EventSource(`${EVENT_SOURCE_URL}?roomId=${roomId}`);

        es.addEventListener("open", () => {
            console.log("[SSE] Connected!");
            set({ isConnected: true });
        });

        es.addEventListener("message", (e) => {
            try {
                const newMessage = JSON.parse(e.data);
                console.log("[SSE] Message received:", newMessage);

                set((state) => ({
                    messages: [...state.messages, newMessage]
                }));
            } catch (err) {
                console.error("[SSE] JSON Parse Error:", err);
            }
        });

        es.addEventListener("heartbeat", (e) => {
            // Heartbeat logic if needed
            // console.log("[SSE] Heartbeat");
        });

        es.onerror = (err) => {
            console.error("[SSE] Error:", err);
            es.close();
            set({ isConnected: false, eventSource: null });
        };

        set({ eventSource: es });
    },

    // 2. 연결 종료
    disconnect: () => {
        const { eventSource } = get();
        if (eventSource) {
            console.log("[SSE] Disconnecting...");
            eventSource.close();
            set({ eventSource: null, isConnected: false, messages: [] });
        }
    },

    // 3. 이전 메시지 불러오기
    fetchRecentChats: async (roomId) => {
        set({ isLoading: true });
        try {
            const response = await chatApi.getChats(roomId);
            // 서버 응답 구조에 따라 조정 필요 (Array라고 가정)
            set({ messages: response.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch chats:", error);
            set({ error: error.message, isLoading: false });
        }
    },

    // 4. 메시지 전송
    sendMessage: async (roomId, content) => {
        if (IS_MOCK) {
            // Mock: 내가 보낸 메시지 즉시 추가
            const myMsg = {
                id: Date.now(),
                sender: "나",
                content: content,
                isMine: true,
                time: new Date().toLocaleTimeString()
            };
            set(state => ({ messages: [...state.messages, myMsg] }));

            // Mock: 상대방 응답 시뮬레이션 (1초 뒤)
            setTimeout(() => {
                const replyMsg = {
                    id: Date.now() + 1,
                    sender: "팀원",
                    content: `Re: ${content}`,
                    isMine: false,
                    time: new Date().toLocaleTimeString()
                };
                set(state => ({ messages: [...state.messages, replyMsg] }));
            }, 1000);
            return;
        }

        try {
            // Optimistic UI? 
            // SSE가 즉시 반응한다면 굳이 Optimistic Update 안 해도 됨.
            // 일단 API 호출만 수행
            await chatApi.createChat(roomId, { content });
        } catch (error) {
            console.error("Message send failed:", error);
            alert("메시지 전송 실패");
        }
    },
}));

export default useChatStore;
