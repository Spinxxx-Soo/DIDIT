import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, Send } from 'lucide-react';

import useChatStore from '@/store/useChatStore';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';

import { Avatar } from '@/components/common/Avatar';

/**
 * ChatChannelView
 * 
 * A full-screen chat interface for 'CHAT' mode channels.
 * Layout structure aligned with RightSidebar for consistent scrolling behavior.
 */
const ChatChannelView = () => {
    const { channelId, projectId } = useParams();
    const { user } = useAuthStore();
    const { fetchParticipants } = useProjectStore();

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
    const [showOptionId, setShowOptionId] = useState(null);
    const [memberMap, setMemberMap] = useState({});

    const messagesEndRef = useRef(null);

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

    return (
        <div className="flex flex-col h-full w-full absolute inset-0 bg-[#F8F9FA] overflow-hidden">
            {/* Header Removed as requested */}

            {/* Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-6 bg-[#F8F9FA]">
                {isLoadingChat ? (
                    <div className="flex justify-center p-4 text-gray-500">로딩 중...</div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                        대화 내용이 없습니다.
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'flex-row-reverse' : 'flex-row'} group`}>
                            {!msg.isMine && (
                                <Avatar
                                    name={memberMap[msg.sender] || `User(${msg.sender})`}
                                    size="sm"
                                    className="mt-1 flex-shrink-0"
                                />
                            )}
                            <div className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                {!msg.isMine && (
                                    <span className="text-[12px] text-gray-500 mb-1 ml-1">
                                        {memberMap[msg.sender] || msg.sender}
                                    </span>
                                )}

                                <div className="flex items-end gap-2">
                                    {/* Action Menu (Mine Only) */}
                                    {msg.isMine && !msg.isTemp && editingId !== msg.id && (
                                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleToggleOption(msg.id)}
                                                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {showOptionId === msg.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowOptionId(null)} />
                                                    <div className="absolute top-6 right-0 bg-white border border-gray-100 shadow-lg rounded-lg py-1 w-24 z-20 flex flex-col">
                                                        <button
                                                            onClick={() => handleInitEdit(msg)}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full text-left"
                                                        >
                                                            <Edit2 size={12} /> 수정
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                                                        >
                                                            <Trash2 size={12} /> 삭제
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Content / Edit Mode */}
                                    {editingId === msg.id ? (
                                        <div className="flex flex-col items-end gap-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="p-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 w-full min-w-[200px]"
                                                rows={3}
                                            />
                                            <div className="flex gap-1">
                                                <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">취소</button>
                                                <button onClick={() => handleSaveEdit(msg.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">저장</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`
                                                px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm break-words
                                                ${msg.isMine
                                                    ? 'bg-green-600 text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }
                                            `}
                                        >
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                        <input
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 bg-transparent border-none outline-none text-sm py-1"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim()}
                            className={`
                                p-2 rounded-full transition-all duration-200 
                                ${chatMessage.trim() ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            <Send size={16} fill={chatMessage.trim() ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatChannelView;
