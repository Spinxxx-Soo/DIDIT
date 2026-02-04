import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Edit2, Trash2, Send } from 'lucide-react';

import useChatStore from '@/store/useChatStore';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import useMeetingStore from '@/store/useMeetingStore';

import { Avatar } from '@/components/common/Avatar';

/**
 * ChatChannelView
 * 
 * A full-screen chat interface for 'CHAT' mode channels.
 * Redesigned for premium aesthetics and better UX.
 */
const ChatChannelView = () => {
    const { channelId, projectId } = useParams();
    const { user } = useAuthStore();
    const { fetchParticipants } = useProjectStore();
    const { currentChannelName } = useMeetingStore();

    // useChatStore hooks
    const {
        messages,
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

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [chatMessage]);

    // Handlers
    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !channelId) return;
        try {
            await sendMessage(channelId, chatMessage, user);
            setChatMessage('');
            // Reset height
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
    const handleInitEdit = (msg) => {
        setEditingId(msg.id);
        setEditContent(msg.content);
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

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            {/* Header: Solid background to prevent content bleed */}
            <header className="flex-none px-6 py-4 bg-white border-b border-gray-200 z-20 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                        <span className="text-2xl font-bold">#</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">
                            {currentChannelName || 'Chat Channel'}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">프로젝트 멤버들과의 대화</p>
                    </div>
                </div>
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-20 py-8 custom-scrollbar">
                {isLoadingChat ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-2 border border-blue-50">
                            <span className="text-4xl filter drop-shadow-sm">👋</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">첫 메시지를 남겨보세요!</h3>
                            <p className="text-gray-400 text-sm">팀원들과 자유롭게 이야기를 나누어보세요.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 max-w-4xl mx-auto">
                        {messages.map((msg, index) => (
                            <div key={msg.id} className={`flex gap-3 group animate-fade-in ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                                {!msg.isMine && (
                                    <div className="flex-shrink-0 mt-1">
                                        <Avatar
                                            name={memberMap[msg.sender] || `User ${msg.sender}`}
                                            size="md"
                                            className="ring-2 ring-white shadow-sm"
                                        />
                                    </div>
                                )}

                                <div className={`flex flex-col max-w-[70%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                                    {/* Sender Info (Only if not mine) */}
                                    {!msg.isMine && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {memberMap[msg.sender] || msg.sender}
                                            </span>
                                            <span className="text-[11px] text-gray-400">{msg.time}</span>
                                        </div>
                                    )}

                                    {/* Message Bubble Layer */}
                                    <div className="group relative">
                                        {editingId === msg.id ? (
                                            <div className="border border-emerald-300 rounded-2xl bg-white p-3 shadow-md min-w-[300px]">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-transparent text-sm focus:outline-none resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        취소
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(msg.id)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className={`
                                                        px-5 py-3 rounded-[20px] text-[15px] leading-relaxed shadow-sm break-words border
                                                        ${msg.isMine
                                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-transparent rounded-tr-sm'
                                                            : 'bg-white text-gray-800 border-gray-100 rounded-tl-sm hover:border-gray-200 transition-colors'
                                                        }
                                                    `}
                                                >
                                                    {msg.content}
                                                </div>

                                                {/* Actions (Only mine) */}
                                                {msg.isMine && !msg.isTemp && (
                                                    <div className="absolute top-0 -left-14 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                                        <div className="flex bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => handleInitEdit(msg)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <div className="w-px bg-gray-100"></div>
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Timestamp for own messages */}
                                    {msg.isMine && (
                                        <span className="text-[10px] text-gray-300 mt-1 mr-1">{msg.time}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-none p-6 bg-white border-t border-gray-100 z-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-[28px] px-2 py-2 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white focus-within:border-emerald-500 transition-all duration-300">
                        {/* Removed File Button as requested */}

                        <textarea
                            ref={textareaRef}
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`#${currentChannelName || 'Send a message...'}`}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-400 px-4 py-2 resize-none max-h-[150px] min-h-[24px] overflow-y-auto"
                            rows={1}
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim()}
                            className={`
                                flex-none p-2.5 rounded-full transition-all duration-200
                                ${chatMessage.trim()
                                    ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:scale-105 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            <Send size={18} fill={chatMessage.trim() ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <div className="text-center mt-3 text-[11px] text-gray-400 font-medium">
                        <strong>Enter</strong> to send &nbsp;•&nbsp; <strong>Shift + Enter</strong> for new line
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatChannelView;
