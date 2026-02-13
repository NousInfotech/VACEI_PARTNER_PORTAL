import { Search, MessageSquarePlus, Users, Pin, PinOff, VolumeX, Volume2 } from 'lucide-react';
import type { Chat } from '../types';
import { cn } from '../../../lib/utils';
import { useState, useEffect, useRef } from 'react';

interface ChatListProps {
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateGroup: () => void;
  onTogglePin: (chatId: string) => void;
  onToggleMute: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
  onCreateGroup,
  onTogglePin,
  onToggleMute,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, chatId: string, isPinned: boolean, isMuted: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      chatId: chat.id,
      isPinned: !!chat.isPinned,
      isMuted: !!chat.isMuted
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Sidebar Header - WhatsApp style */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#f0f2f5] shrink-0">
        <h1 className="text-xl font-medium text-gray-800">Messages</h1>
        <div className="flex items-center gap-2 text-gray-500">
          <button
            type="button"
            onClick={onCreateGroup}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 bg-white border-b border-gray-100 flex items-center px-3">
        <div className="relative flex-1 group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-transparent rounded-lg text-sm focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              onContextMenu={(e) => handleContextMenu(e, chat)}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-[#f5f6f6] transition-colors text-left relative group",
                activeChatId === chat.id && "bg-[#ebebeb]"
              )}
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  chat.type === 'GROUP' 
                    ? "bg-[#dfe5e7] text-[#54656f]" 
                    : "bg-primary/10 text-primary font-bold"
                )}>
                  {chat.type === 'GROUP' ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    chat.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                {chat.type === 'INDIVIDUAL' && chat.participants[0]?.isOnline && (
                  <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0 border-b border-gray-100 pb-3 h-full flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    {chat.isPinned && (
                      <Pin className="w-3 h-3 text-gray-400 shrink-0 rotate-45" />
                    )}
                  </div>
                  {chat.lastMessage && (
                    <span className={cn(
                      "text-[10px] whitespace-nowrap ml-2",
                      chat.unreadCount > 0 ? "text-primary font-semibold" : "text-gray-400"
                    )}>
                      {chat.lastMessage.timestamp}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {chat.isMuted && (
                      <VolumeX className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            No chats found
          </div>
        )}
      </div>

      {/* Context Menu Portal-like */}
      {contextMenu && (
        <div 
          ref={menuRef}
          className="fixed z-50 bg-white shadow-xl rounded-lg py-1 border border-gray-100 min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onTogglePin(contextMenu.chatId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
          >
            {contextMenu.isPinned ? (
              <>
                <PinOff className="w-4 h-4 text-gray-500" />
                Unpin Chat
              </>
            ) : (
              <>
                <Pin className="w-4 h-4 text-gray-500" />
                Pin Chat
              </>
            )}
          </button>
          <button 
            onClick={() => {
              onToggleMute(contextMenu.chatId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors"
          >
            {contextMenu.isMuted ? (
              <>
                <Volume2 className="w-4 h-4 text-gray-500" />
                Unmute notifications
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-gray-500" />
                Mute notifications
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
