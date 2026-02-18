import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { NewGroupSidebar } from './components/NewGroupSidebar';
import { MessageSearchPane } from './components/MessageSearchPane';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { GroupInfoPane } from './components/GroupInfoPane';
import { AddMemberModal } from './components/AddMemberModal';
import { EmojiPicker } from './components/EmojiPicker';
import { ConfirmModal } from './components/ConfirmModal';
import type { Chat, Message } from './types';
import { Inbox, X, Copy, Forward, Trash2, Check, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/auth-context-core';
import { apiGet, apiPost, apiDelete } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

  React.useEffect(() => {
    if (roomsResponse?.data) {
      // Map backend rooms to frontend Chat type
      const mappedChats: Chat[] = roomsResponse.data.map((room: any) => ({
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
      }));

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('chats');
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>(null);
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
  const [forwardingMessages, setForwardingMessages] = useState<Message[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedForwardChatIds, setSelectedForwardChatIds] = useState<string[]>([]);
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


  const confirmDelete = () => {
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
      setChats(prev => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, messages: [] } : chat
      ));
      setConfirmState({ isOpen: false, type: 'message' });
      return;
    }

    const isBulk = type === 'bulk-message';

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        if (isBulk) {
          return {
            ...chat,
            messages: chat.messages
              .filter(m => !selectedMessageIds.includes(m.id) || !m.isDeleted)
              .map(m => 
                selectedMessageIds.includes(m.id) ? { ...m, isDeleted: true, text: undefined, type: 'text', reactions: {} } : m
              )
          };
        }

        if (messageId) {
          const isAlreadyDeleted = chat.messages.find(m => m.id === messageId)?.isDeleted;
          
          if (isAlreadyDeleted) {
            return {
              ...chat,
              messages: chat.messages.filter(m => m.id !== messageId)
            };
          }

          return {
            ...chat,
            messages: chat.messages.map(m => 
              m.id === messageId ? { ...m, isDeleted: true, text: undefined, type: 'text', reactions: {} } : m
            )
          };
        }
      }
      return chat;
    }));

    if (isBulk) {
      setIsSelectMode(false);
      setSelectedMessageIds([]);
    }
    setConfirmState({ isOpen: false, type: 'message' });
  };

  const handleReactToMessage = (chatId: string, messageId: string, emoji: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === messageId) {
              if (emoji === '+') {
                setEmojiPickerMessageId(messageId);
              } else {
                const reactions = { ...(m.reactions || {}) };
                const alreadyHasThisReaction = (reactions[emoji] || []).includes('me');
                
                Object.keys(reactions).forEach(key => {
                  reactions[key] = reactions[key].filter(id => id !== 'me');
                  if (reactions[key].length === 0) delete reactions[key];
                });

                if (!alreadyHasThisReaction) {
                  const userReactions = reactions[emoji] || [];
                  reactions[emoji] = [...userReactions, 'me'];
                }
                
                return { ...m, reactions };
              }
              return m;
            }
            return m;
          })
        };
      }
      return chat;
    }));
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

  const activeChat = chats.find(c => c.id === activeChatId);
  
  const sortedChats = [...chats].sort((a, b) => {
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

  const handleSendMessage = (content: { 
    text?: string; 
    gifUrl?: string; 
    fileUrl?: string; 
    fileName?: string; 
    fileSize?: string;
    type: 'text' | 'gif' | 'image' | 'document' 
  }) => {
    if (!activeChatId) return;

    if (editingMessage) {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: chat.messages.map(m => 
              m.id === editingMessage.id 
                ? { ...m, text: content.text, isEdited: true }
                : m
            )
          };
        }
        return chat;
      }));
      setEditingMessage(null);
      return;
    }

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      type: content.type,
      text: content.text,
      gifUrl: content.gifUrl,
      fileUrl: content.fileUrl,
      fileName: content.fileName,
      fileSize: content.fileSize,
      replyToId: replyToMessage?.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      status: 'sent',
    };

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage,
        };
      }
      return chat;
    }));

    setReplyToMessage(null);
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

  const handleBulkDelete = () => {
    setConfirmState({ isOpen: true, type: 'bulk-message' });
  };

  const handleBulkForward = () => {
    if (!activeChat) return;
    const selectedMessages = activeChat.messages.filter(m => selectedMessageIds.includes(m.id));
    if (selectedMessages.length > 0) {
      setForwardingMessages(selectedMessages);
    }
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
                  onSelectChat={(chat) => setActiveChatId(chat.id)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onCreateGroup={() => setSidebarView('create-group')}
                  onTogglePin={handleTogglePin}
                  onToggleMute={handleToggleMute}
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
                onEditMessage={setEditingMessage}
                onDeleteMessage={(msgId: string) => handleDeleteMessage(activeChat.id, msgId)}
                onReactToMessage={(msgId: string, emoji: string) => handleReactToMessage(activeChat.id, msgId, emoji)}
                onForwardMessage={(msg: Message) => setForwardingMessages([msg])}
                replyingTo={replyToMessage}
                editingMessage={editingMessage}
                onCancelReply={() => setReplyToMessage(null)}
                onCancelEdit={() => setEditingMessage(null)}
                isSelectMode={isSelectMode}
                selectedMessageIds={selectedMessageIds}
                onSelectMessage={handleToggleSelectMessage}
                onEnterSelectMode={() => setIsSelectMode(true)}
              />
            </div>
            {isSelectMode && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#f0f2f5] border-t border-gray-200 z-50 flex items-center justify-between px-6 py-4 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setIsSelectMode(false); setSelectedMessageIds([]); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                  <span className="font-semibold text-gray-700">{selectedMessageIds.length} selected</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={handleBulkCopy} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex flex-col items-center gap-1 group">
                    <Copy className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                    <span className="text-[10px] text-gray-500 font-medium">Copy</span>
                  </button>
                  <button onClick={handleBulkForward} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex flex-col items-center gap-1 group">
                    <Forward className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                    <span className="text-[10px] text-gray-500 font-medium">Share</span>
                  </button>
                  <button onClick={handleBulkDelete} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex flex-col items-center gap-1 group">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span className="text-[10px] text-red-500 font-medium">Delete</span>
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
                    onAddMember={activeChat.type === 'GROUP' ? () => setIsAddMemberModalOpen(true) : undefined}
                    onRemoveMember={handleRemoveMemberRequest}
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
      {emojiPickerMessageId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEmojiPickerMessageId(null)}
              className="absolute -top-10 right-0 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="p-2">
              <EmojiPicker 
                onSelect={(emoji) => {
                  handleReactToMessage(activeChatId!, emojiPickerMessageId, emoji);
                  setEmojiPickerMessageId(null);
                }} 
                onClose={() => setEmojiPickerMessageId(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
