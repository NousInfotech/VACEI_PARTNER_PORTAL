import { Search, Users, MoreVertical, Info, CheckSquare, Bell, BellOff, MessageSquareX } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import type { Chat } from '../types';

 interface ChatHeaderProps {
  chat: Chat;
  onSearchToggle: () => void;
  onInfoToggle: () => void;
  onMute: () => void;
  onClearChat: () => void;
  onSelectMessages: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chat, 
  onSearchToggle,
  onInfoToggle,
  onMute,
  onClearChat,
  onSelectMessages
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOnline = chat.type === 'INDIVIDUAL' && chat.participants[0]?.isOnline;
  const subtitle = chat.type === 'GROUP' 
    ? `${chat.participants.length} members` 
    : (isOnline ? 'Online' : chat.participants[0]?.lastSeen || 'Offline');

  const menuItems = [
    { label: 'Contact info', icon: Info, action: onInfoToggle },
    { label: 'Select messages', icon: CheckSquare, action: onSelectMessages },
    { label: chat.isMuted ? 'Unmute notifications' : 'Mute notifications', icon: chat.isMuted ? BellOff : Bell, action: onMute },
    { label: 'Clear chat', icon: MessageSquareX, action: onClearChat, className: 'text-red-600 hover:bg-red-50' },
  ];

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-[#f0f2f5] shrink-0 border-l border-gray-200 relative z-40">
      <button 
        onClick={onInfoToggle}
        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity min-w-0 h-full"
      >
        <div className="relative shrink-0">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
            chat.type === 'GROUP' 
              ? "bg-[#dfe5e7] text-[#54656f]" 
              : "bg-primary/20 text-primary font-bold text-sm"
          )}>
            {chat.type === 'GROUP' ? (
              <Users className="w-5 h-5" />
            ) : (
              chat.name.substring(0, 2).toUpperCase()
            )}
          </div>
          {chat.type === 'INDIVIDUAL' && isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#f0f2f5]" />
          )}
        </div>
        <div className="flex flex-col truncate">
          <span className="font-medium text-gray-900 leading-tight truncate">{chat.name}</span>
          <span className="text-[11px] text-gray-500 truncate">{subtitle}</span>
        </div>
      </button>

      <div className="flex items-center gap-1 text-gray-500 shrink-0 relative" ref={menuRef}>
        <button 
          onClick={onSearchToggle}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
        
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            showMenu ? "bg-gray-200 rotate-90" : "hover:bg-gray-200"
          )}
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {showMenu && (
          <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-gray-100 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setShowMenu(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-colors",
                  item.className || "text-gray-700 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
