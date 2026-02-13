import { X, Search } from 'lucide-react';
import type { Message, User } from '../types';
import { useState } from 'react';

interface MessageSearchPaneProps {
  messages: Message[];
  participants: User[];
  onClose: () => void;
  onMessageClick: (messageId: string) => void;
}

export const MessageSearchPane: React.FC<MessageSearchPaneProps> = ({
  messages,
  participants,
  onClose,
  onMessageClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => {
        const query = searchQuery.toLowerCase();
        return (
          msg.text?.toLowerCase().includes(query) || 
          msg.fileName?.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="w-full bg-white h-full flex flex-col animate-in fade-in duration-500 shadow-xl z-20">
      {/* Header */}
      <div className="h-16 flex items-center px-4 bg-[#f0f2f5] shrink-0 gap-6">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-medium text-gray-900">Search Messages</span>
      </div>

      {/* Search Input Area */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-primary transition-colors" />
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border border-transparent rounded-lg text-sm outline-none transition-all focus:bg-white focus:border-primary/20 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!searchQuery.trim() ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <p className="text-sm">Search for messages with Sarah Wilson</p>
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="py-2">
            <p className="px-5 py-2 text-[13px] text-primary font-medium">
              {filteredMessages.length} messages found
            </p>
            {filteredMessages.map((msg) => {
              const sender = participants.find(p => p.id === msg.senderId);
              
              return (
                <button
                  key={msg.id}
                  onClick={() => onMessageClick(msg.id)}
                  className="w-full px-5 py-3 hover:bg-[#f5f6f6] transition-colors text-left border-b border-gray-50/50"
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-primary">
                      {sender?.name || 'Me'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-700 leading-normal line-clamp-2">
                    {msg.text || (msg.type === 'image' || msg.type === 'document' ? `📎 ${msg.fileName}` : '')}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <p className="text-sm">No messages found</p>
          </div>
        )}
      </div>
    </div>
  );
};
