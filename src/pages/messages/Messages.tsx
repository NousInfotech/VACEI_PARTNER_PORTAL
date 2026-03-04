import React, { useState, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import { useQuery } from '@tanstack/react-query';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { NewGroupSidebar } from './components/NewGroupSidebar';
import { MessageSearchPane } from './components/MessageSearchPane';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { GroupInfoPane } from './components/GroupInfoPane';
import { AddMemberModal } from './components/AddMemberModal';
import { ConfirmModal } from './components/ConfirmModal';
import type { Chat, Message } from './types';
import { Inbox, X, Copy, Forward, Check, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/auth-context-core';
import { apiGet, apiPost, apiDelete } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { chatService } from '../../api/chatService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

type RightPaneMode = 'search' | 'info' | null;
type SidebarView = 'chats' | 'create-group';

interface MessagesProps {
  isSingleChat?: boolean;
  contextualChatId?: string;
  engagementId?: string;
}

const Messages: React.FC<MessagesProps> = ({ isSingleChat = false, engagementId }) => {
  const { organizationMember } = useAuth();
  const queryClient = useQueryClient();
  const isOrgAdmin = organizationMember?.role === 'ORG_ADMIN' || organizationMember?.role === 'OWNER';

  const { data: roomsResponse, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms', engagementId],
    queryFn: () => apiGet<{ data: any[] }>(endPoints.CHAT.ROOMS),
  });

  const createRoomMutation = useMutation({
    mutationFn: () => apiPost(endPoints.ENGAGEMENTS.CHAT_ROOM(engagementId!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-view', engagementId] });
    },
    onError: (error: any) => {
      console.error(error.response?.data?.message || 'Failed to create chat room');
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ roomId, userIds }: { roomId: string; userIds: string[] }) =>
      apiPost(endPoints.CHAT.MEMBERS(roomId), { userIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', engagementId] });
      setIsAddMemberModalOpen(false);
    },
    onError: (error: any) => {
      console.error(error.response?.data?.message || 'Failed to add members to group');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
      apiDelete(endPoints.CHAT.MEMBER_DELETE(roomId, userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms', engagementId] });
    },
    onError: (error: any) => {
      console.error(error.response?.data?.message || 'Failed to remove member');
    }
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>();
  // Tracks live unread increments from background rooms (not yet opened)
  const [unreadOverrides, setUnreadOverrides] = useState<Record<string, number>>({});
  const bgSubscriptionsRef = useRef<any[]>([]);

  React.useEffect(() => {
    if (roomsResponse?.data) {
      // Map backend rooms to frontend Chat type
      const mappedChats: Chat[] = roomsResponse.data.map((room: any) => {
        const lastMsg = room.lastMessage;

        return {
          id: room.id,
          type: room.contextType === 'DIRECT' ? 'INDIVIDUAL' : 'GROUP',
          name: room.title || 'Chat',
          participants: room.members?.map((m: any) => ({
            id: m.userId,
            name: `${m.user?.firstName} ${m.user?.lastName}`,
            email: m.user?.email,
            role: m.user?.role,
            isOnline: false,
          })) || [],
          unreadCount: room.unreadCount || 0,
          messages: [],
          contextId: room.contextId,
          ...(lastMsg ? {
            lastMessage: {
              id: lastMsg.id,
              senderId: lastMsg.senderId || lastMsg.sender_id || '',
              text: lastMsg.content || lastMsg.text || '',
              type: (lastMsg.type || 'text').toLowerCase() as any,
              timestamp: (() => {
                let t = lastMsg.sentAt || lastMsg.sent_at || lastMsg.createdAt || lastMsg.created_at;
                if (t && !t.endsWith('Z') && !t.includes('+') && !t.match(/-\d{2}:\d{2}$/)) t += 'Z';
                return t || new Date().toISOString();
              })(),
              isDeleted: !!lastMsg.deletedAt,
              status: 'sent',
            }
          } : {})
        };
      });

      setChats(mappedChats);

      if (isSingleChat && engagementId) {
        const engRoom = mappedChats.find(c => (c as any).contextId === engagementId);
        if (engRoom) {
          setActiveChatId(engRoom.id);
        }
      } else if (!activeChatId && mappedChats.length > 0) {
        setActiveChatId(mappedChats[0].id);
      }
    }
  }, [roomsResponse, isSingleChat, engagementId, activeChatId]);

  // Subscribe to ALL rooms for background unread badge updates (WhatsApp behaviour)
  React.useEffect(() => {
    if (!chats.length) return;

    // Tear down previous subscriptions
    bgSubscriptionsRef.current.forEach(ch => supabase.removeChannel(ch));
    bgSubscriptionsRef.current = [];

    // NOTE: We are not using Supabase Auth sessions in this app.
    // Do not set realtime auth with the backend JWT; it can cause RLS/functions
    // that rely on auth.uid() to fail because auth.uid() remains NULL.

    chats.forEach(chat => {
      const channel = supabase
        .channel(`bg-room:${chat.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ChatMessage', filter: `roomId=eq.${chat.id}` },
          (payload) => {
            const newMsg = payload.new as any;
            const lastMsgTimestamp = newMsg.sentAt || newMsg.sent_at || newMsg.created_at;
            const lastMsgText = newMsg.content || newMsg.text || '';
            const lastMsgSenderId = newMsg.senderId || newMsg.sender_id || '';

            // Update sidebar last message preview for this room
            setChats(prev => prev.map(c => {
              if (c.id !== chat.id) return c;
              return {
                ...c,
                lastMessage: {
                  id: newMsg.id,
                  senderId: lastMsgSenderId,
                  text: lastMsgText,
                  type: (newMsg.type || 'text').toLowerCase() as any,
                  timestamp: lastMsgTimestamp,
                  status: 'sent',
                },
              };
            }));

            // Only increment unread for BACKGROUND rooms
            setActiveChatId(currentActive => {
              if (chat.id !== currentActive) {
                setUnreadOverrides(prev => ({
                  ...prev,
                  [chat.id]: (prev[chat.id] ?? 0) + 1,
                }));
              }
              return currentActive;
            });
          }
        )
        .subscribe();

      bgSubscriptionsRef.current.push(channel);
    });

    return () => {
      bgSubscriptionsRef.current.forEach(ch => supabase.removeChannel(ch));
      bgSubscriptionsRef.current = [];
    };
  }, [chats.length]); // re-run only when room list changes

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('chats');
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>(null);
  const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
  const [scrollTargetId, setScrollTargetId] = useState<string | undefined>(undefined);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'message' | 'bulk-message' | 'clear-chat' | 'remove-member';
    messageId?: string;
    userId?: string;
  }>({ isOpen: false, type: 'message' });
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedForwardChatIds, setSelectedForwardChatIds] = useState<string[]>([]);
  const [forwardingMessages, setForwardingMessages] = useState<Message[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setRightPaneMode(null);
    setScrollTargetId(undefined);
  }, [activeChatId]);

  const toggleRightPane = (mode: RightPaneMode) => {
    setRightPaneMode(prev => prev === mode ? null : mode);
    if (!mode) setScrollTargetId(undefined);
  };

  const handleSearchMessageClick = (messageId: string) => {
    setScrollTargetId(messageId);
  };

  const handleCreateGroup = (_name: string, _participantIds: string[]) => {
    // Create group functionality can be implemented later with real API
  };

  const handleTogglePin = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
  };

  const handleToggleMute = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, isMuted: !chat.isMuted } : chat
    ));
  };

  const handleDeleteMessage = (_chatId: string, messageId: string) => {
    setConfirmState({ isOpen: true, type: 'message', messageId });
  };

  const handleClearChat = () => {
    setConfirmState({ isOpen: true, type: 'clear-chat' });
  };

  const handleRemoveMemberRequest = (userId: string) => {
    setConfirmState({ isOpen: true, type: 'remove-member', userId });
  };


  const confirmDelete = async () => {
    const { messageId, type, userId } = confirmState;
    if (!activeChatId) return;

    if (type === 'remove-member') {
      if (userId) {
        removeMemberMutation.mutate({ roomId: activeChatId, userId });
      }
      setConfirmState({ isOpen: false, type: 'message' });
      return;
    }

    if (type === 'clear-chat') {
      try {
        await chatService.clearRoom(activeChatId!);
        clearMessages();
        setChats(prev => prev.map(chat =>
          chat.id === activeChatId ? { ...chat, lastMessage: undefined } : chat
        ));
      } catch (e) {
        console.error('Failed to clear chat:', e);
      }
      setConfirmState({ isOpen: false, type: 'message' });
      return;
    }


    const isBulk = type === 'bulk-message';

    try {
      if (isBulk) {
        // Bulk delete currently not implemented in backend as a single call, 
        // could loop or we just focus on individual for now per user request.
        // User said "when i click the delete show the popup conformation after delete them"
        for (const id of selectedMessageIds) {
          await deleteChatMessage(id);
        }
        setIsSelectMode(false);
        setSelectedMessageIds([]);
      } else if (messageId) {
        await deleteChatMessage(messageId);
      }
    } catch (e) {
      console.error('Failed to delete message(s):', e);
    }

    setConfirmState({ isOpen: false, type: 'message' });
  };



  const handleForwardMessages = () => {
    if (forwardingMessages.length === 0 || selectedForwardChatIds.length === 0) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChats(prev => prev.map(chat => {
      if (selectedForwardChatIds.includes(chat.id)) {
        const newMessages: Message[] = forwardingMessages.map(msg => ({
          ...msg,
          id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          senderId: 'me',
          timestamp: timestamp,
          createdAt: Date.now(),
          status: 'sent',
          reactions: {},
          replyToId: undefined
        }));

        const updatedMessages = [...chat.messages, ...newMessages];
        return {
          ...chat,
          messages: updatedMessages,
          lastMessage: updatedMessages[updatedMessages.length - 1]
        };
      }
      return chat;
    }));

    setForwardingMessages([]);
    setSelectedForwardChatIds([]);
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };

  // Load messages & realtime subscription for the active room
  const {
    messages: activeChatMessages,
    sendMessage: sendChatMessage,
    deleteMessage: deleteChatMessage,
    currentUserId,
    clearMessages,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  } = useChat(undefined, { roomId: activeChatId ?? undefined });

  /** Open a room: reset its unread count and mark as read on the server */
  const handleSelectChat = useCallback((chat: Chat) => {
    setActiveChatId(chat.id);
    // Clear unread badge immediately
    setUnreadOverrides(prev => ({ ...prev, [chat.id]: 0 }));
    // Best-effort server mark-as-read
    apiPost(endPoints.CHAT.MARK_READ(chat.id)).catch(() => { });
  }, []);

  const activeChatBase = chats.find(c => c.id === activeChatId);
  // Merge real messages from useChat into the active chat object and enforce time ordering
  const activeChat = activeChatBase
    ? {
        ...activeChatBase,
        messages: [...activeChatMessages].sort((a, b) => {
          const aTime = a.createdAt ?? (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const bTime = b.createdAt ?? (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return aTime - bTime;
        }),
      }
    : undefined;

  // Merge unreadOverrides into the displayed chat list
  const sortedChats = [...chats]
    .map(c => ({
      ...c,
      unreadCount: c.id === activeChatId
        ? 0                                    // always 0 for the open room
        : (unreadOverrides[c.id] !== undefined
          ? unreadOverrides[c.id]            // live-updated
          : c.unreadCount),                  // initial from API
    }))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const filteredChats = sortedChats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerLeft = containerRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - containerLeft;
        if (newWidth >= 280 && newWidth <= 450) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleSendMessage = async (content: {
    text?: string;
    gifUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    type: 'text' | 'gif' | 'image' | 'document'
  }) => {
    if (!activeChatId) return;

    try {
      const payload = replyToMessage?.id
        ? { ...content, replyToMessageId: replyToMessage.id, replyToMessage }
        : content;
      await sendChatMessage(payload);
      setReplyToMessage(null);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const handleToggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    );
  };

  const handleBulkCopy = () => {
    if (!activeChat) return;
    const selectedMessages = activeChat.messages.filter(m => selectedMessageIds.includes(m.id));
    const text = selectedMessages.map(m => `[${m.timestamp}] ${m.senderId}: ${m.text || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };



  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative"
    >
      {!isSingleChat && (
        <>
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="shrink-0 h-full overflow-hidden flex flex-col"
          >
            <div className="flex-1 overflow-hidden">
              {sidebarView === 'chats' ? (
                <ChatList
                  chats={filteredChats}
                  activeChatId={activeChatId}
                  onSelectChat={handleSelectChat}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onCreateGroup={() => setSidebarView('create-group')}
                  onTogglePin={handleTogglePin}
                  onToggleMute={handleToggleMute}
                  currentUserId={currentUserId || organizationMember?.userId}
                />
              ) : (
                <NewGroupSidebar
                  onBack={() => setSidebarView('chats')}
                  onCreateGroup={handleCreateGroup}
                  users={[]} // TODO: Populate with organization members
                />
              )}
            </div>
          </div>

          <div
            onMouseDown={startResizing}
            className={cn(
              "w-px hover:w-0.5 h-full cursor-col-resize hover:bg-primary/30 transition-all z-10 shrink-0",
              isResizing ? "bg-primary/50 w-1" : "bg-gray-200"
            )}
          />
        </>
      )}

      <div className="flex-1 h-full min-w-0 flex overflow-hidden">
        {activeChat ? (
          <>
            <div className="flex-1 h-full min-w-0">
              <ChatWindow
                chat={activeChat}
                onSendMessage={handleSendMessage}
                onSearchToggle={() => toggleRightPane('search')}
                onInfoToggle={() => toggleRightPane('info')}
                onMute={() => handleToggleMute(activeChat.id)}
                onClearChat={handleClearChat}
                onSelectMessages={() => setIsSelectMode(true)}
                onMediaClick={setPreviewMessage}
                scrollToMessageId={scrollTargetId}
                onScrollComplete={() => setScrollTargetId(undefined)}
                onReplyMessage={setReplyToMessage}
                onDeleteMessage={(msgId: string) => handleDeleteMessage(activeChat.id, msgId)}
                onForwardMessage={(msg: Message) => setForwardingMessages([msg])}
                replyingTo={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                isSelectMode={isSelectMode}
                selectedMessageIds={selectedMessageIds}
                onSelectMessage={handleToggleSelectMessage}
                onEnterSelectMode={() => setIsSelectMode(true)}
                currentUserId={currentUserId || organizationMember?.userId || ''}
                onLoadMore={loadMoreMessages}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
            </div>
            {isSelectMode && (
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-between px-8 py-4 animate-in slide-in-from-bottom duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{selectedMessageIds.length} messages selected</span>
                    <button 
                      onClick={() => { setIsSelectMode(false); setSelectedMessageIds([]); }}
                      className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setIsSelectMode(false); setSelectedMessageIds([]); }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkCopy}
                    disabled={selectedMessageIds.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Messages
                  </button>
                </div>
              </div>
            )}
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
                    onMessageClick={handleSearchMessageClick}
                  />
                ) : rightPaneMode === 'info' && activeChat ? (
                  <GroupInfoPane
                    name={activeChat.name}
                    type={activeChat.type}
                    participants={activeChat.participants}
                    onClose={() => setRightPaneMode(null)}
                    onAddMember={(activeChat.type === 'GROUP' && isOrgAdmin) ? () => setIsAddMemberModalOpen(true) : undefined}
                    onRemoveMember={isOrgAdmin ? handleRemoveMemberRequest : undefined}
                  />
                ) : null}
              </div>
            </div>
            {activeChat && (
              <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                isAdding={addMemberMutation.isPending}
                onAddMembers={(userIds) => {
                  if (activeChatId) {
                    addMemberMutation.mutate({ roomId: activeChatId, userIds });
                  }
                }}
                existingParticipantIds={activeChat?.participants.map(p => p.id) || []}
              />
            )}
          </>
        ) : isSingleChat ? (
          <div className="h-full flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center border-l border-gray-200">
            {roomsLoading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <div className="max-w-md flex flex-col items-center">
                <div className="w-48 h-48 relative mb-8 opacity-40">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
                  <MessageSquare className="w-full h-full text-primary relative z-10" />
                </div>
                <h2 className="text-3xl font-light text-gray-700 mb-4">No Chat Room Found</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  {isOrgAdmin
                    ? "This engagement doesn't have a chat room yet. Create one to start communicating with the client."
                    : "This engagement doesn't have a chat room yet. Please contact your administrator to create one."}
                </p>
                {isOrgAdmin && (
                  <button
                    onClick={() => createRoomMutation.mutate()}
                    disabled={createRoomMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {createRoomMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Create Chat Room
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center border-l border-gray-200">
            <div className="max-w-md flex flex-col items-center">
              <div className="w-48 h-48 relative mb-8 opacity-40">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <Inbox className="w-full h-full text-primary relative z-10" />
              </div>
              <h2 className="text-3xl font-light text-gray-700 mb-4">Vacei Organization Portal</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Send and receive messages without keeping your phone online.<br />
                Use Vacei Organization Portal on up to 4 linked devices and 1 phone at the same time.
              </p>
              <div className="flex items-center gap-2 text-gray-400 text-xs mt-auto">
                <div className="w-3 h-3 border border-current rounded-full flex items-center justify-center text-[8px]">!</div>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {previewMessage && (
        <MediaPreviewModal
          message={previewMessage}
          onClose={() => setPreviewMessage(null)}
        />
      )}

      {forwardingMessages.length > 0 && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-[15px]">Forward message</h3>
                <p className="text-xs text-gray-500 mt-0.5">{forwardingMessages.length} message{forwardingMessages.length > 1 ? 's' : ''} selected</p>
              </div>
              <button
                onClick={() => setForwardingMessages([])}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[300px]">
              {chats.map(chat => {
                const isSelected = selectedForwardChatIds.includes(chat.id);
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedForwardChatIds(prev =>
                        isSelected ? prev.filter(id => id !== chat.id) : [...prev, chat.id]
                      );
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                      isSelected ? "bg-primary/5 shadow-sm" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary text-white scale-95"
                          : chat.type === 'GROUP'
                            ? "bg-[#dfe5e7] text-[#54656f]"
                            : "bg-primary/10 text-primary font-bold"
                      )}>
                        {chat.type === 'GROUP' ? <Users className="w-5 h-5" /> : chat.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold truncate transition-colors",
                        isSelected ? "text-primary" : "text-gray-900"
                      )}>{chat.name}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected ? "bg-primary border-primary" : "border-gray-200 group-hover:border-primary/30"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                disabled={selectedForwardChatIds.length === 0}
                onClick={handleForwardMessages}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  selectedForwardChatIds.length > 0
                    ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Forward className="w-5 h-5" />
                Forward to {selectedForwardChatIds.length || ''} recipient{selectedForwardChatIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={
          confirmState.type === 'clear-chat' ? "Clear this chat?" :
            confirmState.type === 'bulk-message' ? "Delete selected messages?" :
              confirmState.type === 'remove-member' ? "Remove member?" :
                "Delete message?"
        }
        message={
          confirmState.type === 'clear-chat' ? "This will delete all messages in this chat. This action cannot be undone." :
            confirmState.type === 'bulk-message'
              ? `Are you sure you want to delete these ${selectedMessageIds.length} messages? This action cannot be undone.`
              : confirmState.type === 'remove-member'
                ? "Are you sure you want to remove this member from the group? They will no longer be able to see or send messages."
                : "Are you sure you want to delete this message? This action cannot be undone."
        }
        confirmLabel={
          confirmState.type === 'clear-chat' ? "Clear chat" :
            confirmState.type === 'remove-member' ? "Remove" :
              "Delete"
        }
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, type: 'message' })}
      />

    </div>
  );
};

export default Messages;
