import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, Mic, Paperclip, Smile } from 'lucide-react';

import useChatStore from '@/store/useChatStore';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import useMeetingStore from '@/store/useMeetingStore';

import { Avatar } from '@/components/common/Avatar';
import { IconButton } from '@/components/common/Button/IconButton';

/**
 * ChatChannelView
 * 
 * A full-screen chat interface for 'CHAT' mode channels.
 * Replaces the ScreenShare/Video view in MeetingRoom.
 */
const ChatChannelView = () => {
    const { channelId, projectId } = useParams();
    const { user } = useAuthStore();
    const { fetchParticipants } = useProjectStore();
    const { currentChannelName } = useMeetingStore();

    // useChatStore hooks
    const {
        messages,
        isConnected,
        connect,
        disconnect,
        sendMessage,
        editMessage,
        deleteMessage,
        fetchRecentChats,
        isLoading: isLoadingChat
    } = useChatStore();

    // Local state
    const [chatMessage, setChatMessage] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showOptionId, setShowOptionId] = useState(null);
    const [memberMap, setMemberMap] = useState({});

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // 1. Connect to Chat
    useEffect(() => {
        if (channelId) {
            console.log(`[ChatChannelView] Connecting to chat room: ${channelId}`);
            fetchRecentChats(channelId, user);
            connect(channelId, user);
        }

        return () => {
            disconnect();
        };
    }, [channelId, user, connect, disconnect, fetchRecentChats]);

    // 2. Load Participants for Name Mapping
    useEffect(() => {
        let ignore = false;
        const loadParticipants = async () => {
            if (projectId) {
                try {
                    const participants = await fetchParticipants(projectId);
                    if (!ignore) {
                        const mapping = {};
                        participants.forEach(p => {
                            mapping[p.id] = p.name;
                        });
                        setMemberMap(mapping);
                    }
                } catch (error) {
                    console.error("Failed to load participants:", error);
                }
            }
        };
        loadParticipants();
        return () => { ignore = true; };
    }, [projectId, fetchParticipants]);

    // 3. Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handlers
    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !channelId) return;
        try {
            await sendMessage(channelId, chatMessage, user);
            setChatMessage('');
            // Optional: reset textarea height if auto-expanding
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!e.nativeEvent.isComposing) {
                handleSendMessage();
            }
        }
    };

    // Edit / Delete Logic
    const handleToggleOption = (id) => setShowOptionId(prev => (prev === id ? null : id));
    const handleInitEdit = (msg) => {
        setEditingId(msg.id);
        setEditContent(msg.content);
        setShowOptionId(null);
    };
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };
    const handleSaveEdit = async (msgId) => {
        if (!editContent.trim()) return;
        try {
            await editMessage(channelId, msgId, editContent);
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.error("Edit failed", error);
        }
    };
    const handleDeleteMessage = async (msgId) => {
        if (window.confirm("메시지를 삭제하시겠습니까?")) {
            try {
                await deleteMessage(channelId, msgId);
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    // --- RENDER HELPERS ---

    // 날짜 구분선 렌더링 (Optional enhancement)
    const renderDateDivider = (currentMsg, prevMsg) => {
        const currentDate = new Date(currentMsg.sentAtEpochMs || Date.now()).toLocaleDateString();
        const prevDate = prevMsg ? new Date(prevMsg.sentAtEpochMs || Date.now()).toLocaleDateString() : null;

        if (currentDate !== prevDate) {
            return (
                <div className="flex items-center justify-center my-6">
                    <div className="h-px bg-gray-200 w-full max-w-xs"></div>
                    <span className="px-4 text-xs text-gray-400 font-medium">{currentDate}</span>
                    <div className="h-px bg-gray-200 w-full max-w-xs"></div>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="flex flex-col h-full bg-[#fcfdfe]">
            {/* Header */}
            <header className="flex-none px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600">
                        <span className="text-xl font-bold">#</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{currentChannelName || 'Chat Channel'}</h1>
                        <p className="text-sm text-gray-500">이 채널의 대화 내용입니다.</p>
                    </div>
                </div>
                {/* Optional: Add search or other channel actions here */}
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-20 py-8 custom-scrollbar">
                {isLoadingChat ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">첫 메시지를 남겨보세요!</h3>
                        <p className="text-gray-400 max-w-md">
                            이 채널은 아직 조용하네요. 팀원들과 대화를 시작해보세요.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {messages.map((msg, index) => (
                            <div key={msg.id}>
                                {/* {renderDateDivider(msg, messages[index - 1])} */}

                                <div className={`flex gap-4 group ${msg.isMine ? '' : ''} hover:bg-gray-50/50 p-2 rounded-xl transition-colors`}>
                                    <div className="flex-shrink-0 mt-1">
                                        <Avatar
                                            name={memberMap[msg.sender] || `User ${msg.sender}`}
                                            size="md"
                                            className="ring-2 ring-white shadow-sm"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">
                                                    {memberMap[msg.sender] || msg.sender}
                                                </span>
                                                <span className="text-xs text-gray-400">{msg.time}</span>
                                            </div>

                                            {/* Action Buttons (Only for own messages) */}
                                            {msg.isMine && !msg.isTemp && editingId !== msg.id && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-gray-150 shadow-sm rounded-lg px-1">
                                                    <button
                                                        onClick={() => handleInitEdit(msg)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-500 rounded"
                                                        title="수정"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <div className="w-px h-3 bg-gray-200 mx-1"></div>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editingId === msg.id ? (
                                            <div className="border border-emerald-200 rounded-xl bg-emerald-50/50 p-3">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y min-h-[80px]"
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                                                    >
                                                        취소
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(msg.id)}
                                                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-all"
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-none p-6 md:px-20 bg-white border-t border-gray-100 z-10">
                <div className="max-w-5xl mx-auto relative group">
                    <div className="absolute left-3 bottom-3 flex items-center gap-1 text-gray-400">
                        {/* Placeholder for future features */}
                        <IconButton
                            icon={<Paperclip size={20} />}
                            variant="ghost"
                            size="sm"
                            className="hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        />
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`# ${currentChannelName || '채널'}에 메시지 보내기`}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none min-h-[50px] max-h-[200px]"
                        rows={1}
                        style={{ height: 'auto', minHeight: '52px' }}
                    />

                    <div className="absolute right-3 bottom-2">
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim()}
                            className={`p-2 rounded-xl transition-all duration-200 ${chatMessage.trim()
                                ? 'bg-emerald-600 text-white shadow-md hover:scale-105 active:scale-95'
                                : 'bg-transparent text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2 text-xs text-gray-300">
                    <strong>Shift + Enter</strong>로 줄바꿈, <strong>Enter</strong>로 전송
                </div>
            </div>
        </div>
    );
};

export default ChatChannelView;
