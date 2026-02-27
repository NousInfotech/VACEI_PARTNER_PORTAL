import { useState, useEffect, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useQuery } from '@tanstack/react-query';
import { todoService } from '@/api/todoService';
import type { Chat, Message } from '@/pages/messages/types';
import { ChatWindow } from '@/pages/messages/components/ChatWindow';
import { MessageSearchPane } from '@/pages/messages/components/MessageSearchPane';
import { GroupInfoPane } from '@/pages/messages/components/GroupInfoPane';
import { AddMemberModal } from '@/pages/messages/components/AddMemberModal';
import { MediaPreviewModal } from '@/pages/messages/components/MediaPreviewModal';
import { ConfirmModal } from '@/pages/messages/components/ConfirmModal';
import { EmojiPicker } from '@/pages/messages/components/EmojiPicker';
import { Loader2, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep as cn
import { useAuth } from '@/context/auth-context-core';
import TodoModal from '../components/TodoModal';

interface EngagementChatTabProps {
    engagementId: string;
    companyId?: string;
    chatRoomId?: string; // Add explicit chatRoomId
}

// EngagementChatTab.tsx
export default function EngagementChatTab({ engagementId, companyId: propCompanyId, chatRoomId }: EngagementChatTabProps) {
    const { organizationMember } = useAuth();
    const isOrgAdmin = organizationMember?.role === 'ORG_ADMIN' || organizationMember?.role === 'OWNER';

    const {
        room,
        messages,
        isLoading,
        error,
        sendMessage,
        markAsRead,
        currentUserId: chatCurrentUserId,
    } = useChat(engagementId, { roomId: chatRoomId });

    // UI State matching Messages.tsx logic
    const [rightPaneMode, setRightPaneMode] = useState<'search' | 'info' | null>(null);
    const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
    const [scrollTargetId, setScrollTargetId] = useState<string | undefined>(undefined);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        type: 'message' | 'bulk-message' | 'clear-chat' | 'remove-member';
        messageId?: string;
        userId?: string;
    }>({ isOpen: false, type: 'message' });
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
    const [todoInitialData, setTodoInitialData] = useState<any>(null);
    const [todoSourceId, setTodoSourceId] = useState<string | undefined>(undefined);
    const [todoMode, setTodoMode] = useState<"from-chat" | "edit" | "create">("from-chat");

    // construct active chat object
    const activeChat: Chat | null = room ? {
        ...room,
        messages: messages,
        name: room.name || 'Engagement Chat',
        type: room.type || 'GROUP',
        participants: (room.participants || (room as any).members || []).map((m: any) => ({
            ...m,
            // Fallbacks for avatar/name rendering
            id: m.userId || m.id,
            name: m.firstName && m.lastName
                ? `${m.firstName} ${m.lastName}`
                : m.user?.firstName && m.user?.lastName
                    ? `${m.user.firstName} ${m.user.lastName}`
                    : m.name || m.user?.name || 'Unknown User',
            email: m.email || m.user?.email || '',
            role: m.role || m.user?.role || 'MEMBER',
        }))
    } : null;

    const { data: engagementTodos } = useQuery({
        queryKey: ['engagement-todos', engagementId],
        enabled: !!engagementId,
        queryFn: () => todoService.list(engagementId),
    });

    const todoMap = useMemo(() => {
        const map: Record<string, any> = {};
        engagementTodos?.forEach(todo => {
            if (todo.moduleId) map[todo.moduleId] = todo;
        });
        return map;
    }, [engagementTodos]);

    useEffect(() => {
        if (activeChat) {
            markAsRead();
        }
    }, [activeChat, markAsRead]);

    // Auto-add client members if the room has only 1 member (the current user)
    // This fixes the issue where the backend created the room but didn't add the client.
    useEffect(() => {
        const checkAndAddMembers = async () => {
            if (activeChat && activeChat.participants.length === 1 && !isLoading) {
                console.log('Chat: Only 1 member in room. Attempting to add Client members...');
                try {
                    // We need the engagement details to get the companyId
                    // If passed as prop, use it. Otherwise fetch.
                    let companyId = propCompanyId;

                    if (!companyId) {
                        const engagementRes = await import('@/config/base').then(m => m.apiGet<any>(`/engagements/${engagementId}`));
                        companyId = engagementRes.data?.companyId;
                    }

                    if (companyId) {
                        const membersRes = await import('@/config/base').then(m => m.apiGet<any>(`/companies/${companyId}/members`));
                        const companyMembers = membersRes.data || [];

                        // Filter out the current user and get valid userIds
                        const missingMemberIds = companyMembers
                            .map((m: any) => m.userId)
                            .filter((id: string) => id && id !== activeChat.participants[0].id);

                        if (missingMemberIds.length > 0) {
                            console.log('Chat: Found missing members:', missingMemberIds);
                            // Import chatService dynamically or use the one from props/context if available
                            const { chatService } = await import('@/api/chatService');
                            await chatService.addMembers(activeChat.id, missingMemberIds);
                            console.log('Chat: Automatically added missing members.');
                            // Trigger a reload of the chat room? 
                            // The realtime subscription or a window reload might be needed to see them immediately.
                            // For receiving messages, just adding them is enough for RLS.
                        } else {
                            console.log('Chat: No other company members found to add.');
                        }
                    }
                } catch (err) {
                    console.error('Chat: Failed to auto-add members:', err);
                }
            }
        };

        checkAndAddMembers();
    }, [activeChat?.id, activeChat?.participants.length, isLoading, engagementId]);

    const handleSendMessage = async (content: any) => {
        try {
            const payload = replyToMessage?.id
                ? { ...content, replyToMessageId: replyToMessage.id, replyToMessage }
                : content;
            await sendMessage(payload);
            setReplyToMessage(null);
        } catch (e) {
            console.error('Failed to send message:', e);
        }
    };

    // Handlers (simplified/mocked where API is missing)
    const handleToggleMute = () => { console.log('Mute toggle not implemented'); };
    const handleClearChat = () => { setConfirmState({ isOpen: true, type: 'clear-chat' }); };
    const handleDeleteMessage = (msgId: string) => { setConfirmState({ isOpen: true, type: 'message', messageId: msgId }); };
    const handleReactToMessage = (msgId: string, emoji: string) => { console.log('React:', msgId, emoji); }; // API missing
    const handleForwardMessage = (msg: Message) => { console.log('Forward:', msg); }; // Logic in Messages.tsx was local state

    const confirmDelete = () => {
        // TODO: Implement delete via API
        console.log('Delete confirmed', confirmState);
        setConfirmState({ isOpen: false, type: 'message' });
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !activeChat) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-dashed">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {error || "Chat Unavailable"}
                </h3>
                <p className="text-gray-500 max-w-md mb-6">
                    {isOrgAdmin
                        ? "This engagement doesn't have a chat room configured yet."
                        : "Unable to access chat for this engagement."}
                </p>

                {/* We can add a "Create Room" button here if we want to support manual creation, 
            but the hook tries to resolve/create automatically. */}
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative">
            <div className="flex-1 h-full min-w-0 flex overflow-hidden">
                <div className="flex-1 h-full min-w-0">
                    <ChatWindow
                        chat={activeChat}
                        onSendMessage={handleSendMessage}
                        onSearchToggle={() => setRightPaneMode(mode => mode === 'search' ? null : 'search')}
                        onInfoToggle={() => setRightPaneMode(mode => mode === 'info' ? null : 'info')}
                        onMute={handleToggleMute}
                        onClearChat={handleClearChat}
                        onSelectMessages={() => setIsSelectMode(true)}
                        onMediaClick={setPreviewMessage}
                        scrollToMessageId={scrollTargetId}
                        onScrollComplete={() => setScrollTargetId(undefined)}
                        onReplyMessage={setReplyToMessage}
                        onEditMessage={setEditingMessage}
                        onDeleteMessage={handleDeleteMessage}
                        onReactToMessage={(msgId, emoji) => {
                            if (emoji === '+') setEmojiPickerMessageId(msgId);
                            else handleReactToMessage(msgId, emoji);
                        }}
                        onForwardMessage={handleForwardMessage}
                        onCreateTodoMessage={(msg) => {
                            const existingTodo = todoMap[msg.id];
                            if (existingTodo) {
                                setTodoInitialData(existingTodo);
                                setTodoMode("edit" as any); // Use "edit" if supported by context otherwise "create"
                            } else {
                                setTodoInitialData({
                                    title: `Follow up: ${msg.text?.substring(0, 30)}${msg.text && msg.text.length > 30 ? '...' : ''}`,
                                    description: msg.text || '',
                                });
                                setTodoMode("from-chat" as any);
                            }
                            setTodoSourceId(msg.id);
                            setIsTodoModalOpen(true);
                        }}
                        replyingTo={replyToMessage}
                        editingMessage={editingMessage}
                        onCancelReply={() => setReplyToMessage(null)}
                        onCancelEdit={() => setEditingMessage(null)}
                        isSelectMode={isSelectMode}
                        selectedMessageIds={selectedMessageIds}
                        onSelectMessage={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                        onEnterSelectMode={() => setIsSelectMode(true)}
                        currentUserId={chatCurrentUserId || organizationMember?.userId || ''}
                        todoMap={todoMap}
                    />
                </div>

                {/* Right Pane */}
                <div
                    className={cn(
                        "h-full border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden shrink-0",
                        rightPaneMode ? "w-[400px]" : "w-0 border-transparent"
                    )}
                >
                    <div className="w-[400px] h-full">
                        {rightPaneMode === 'search' ? (
                            <MessageSearchPane
                                messages={activeChat.messages}
                                participants={activeChat.participants}
                                onClose={() => setRightPaneMode(null)}
                                onMessageClick={setScrollTargetId}
                            />
                        ) : rightPaneMode === 'info' ? (
                            <GroupInfoPane
                                name={activeChat.name}
                                type={activeChat.type}
                                participants={activeChat.participants}
                                onClose={() => setRightPaneMode(null)}
                                onAddMember={() => setIsAddMemberModalOpen(true)}
                                onRemoveMember={(id) => setConfirmState({ isOpen: true, type: 'remove-member', userId: id })}
                            />
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeChat && (
                <AddMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    isAdding={false}
                    onAddMembers={(ids) => { console.log('Add members:', ids); setIsAddMemberModalOpen(false); }}
                    existingParticipantIds={activeChat.participants.map(p => p.id)}
                />
            )}

            {previewMessage && (
                <MediaPreviewModal
                    message={previewMessage}
                    onClose={() => setPreviewMessage(null)}
                />
            )}

            {/* Emoji Picker */}
            {emojiPickerMessageId && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-2xl relative">
                        <button
                            onClick={() => setEmojiPickerMessageId(null)}
                            className="absolute -top-10 right-0 p-2 bg-white/80 rounded-full"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="p-2">
                            <EmojiPicker
                                onSelect={(emoji) => {
                                    handleReactToMessage(emojiPickerMessageId, emoji);
                                    setEmojiPickerMessageId(null);
                                }}
                                onClose={() => setEmojiPickerMessageId(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title="Confirm Action"
                message="Are you sure?"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setConfirmState({ isOpen: false, type: 'message' })}
            />

            <TodoModal
                isOpen={isTodoModalOpen}
                onClose={() => setIsTodoModalOpen(false)}
                onSuccess={() => {
                    // Optional: toast already handled in modal
                }}
                engagementId={engagementId}
                mode={todoMode as any}
                sourceId={todoSourceId}
                initialData={todoInitialData}
                service={(room as any)?.service || 'AUDITING'}
            />
        </div>
    );
}
