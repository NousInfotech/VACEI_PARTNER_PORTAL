import { Search, Users } from 'lucide-react';
import React from 'react';
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
}) => {
  const isOnline = chat.type === 'INDIVIDUAL' && chat.participants[0]?.isOnline;
  const subtitle = chat.type === 'GROUP'
    ? `${chat.participants.length} members`
    : (isOnline ? 'Online' : chat.participants[0]?.lastSeen || 'Offline');

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-[#f0f2f5] shrink-0 border-l border-gray-200 relative z-20">
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
              (chat.name || 'Chat').substring(0, 2).toUpperCase()
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

      <div className="flex items-center gap-1 text-gray-500 shrink-0 relative">
        <button
          onClick={onSearchToggle}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
