import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import type { User } from '../types';

interface ReactionDetailsModalProps {
  reactions: Record<string, string[]>;
  users: User[];
  isMe: boolean;
  onClose: () => void;
  onRemoveReaction: (emoji: string) => void;
  triggerRect?: DOMRect | null;
}

export const ReactionDetailsModal: React.FC<ReactionDetailsModalProps> = ({
  reactions,
  users,
  isMe,
  onClose,
  onRemoveReaction,
  triggerRect,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | string>('All');
  const popupRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ 
    top: number; 
    left: number; 
    right?: number; 
    transform?: string; 
    transformOrigin?: string; 
  } | null>(null);

  const allReactions = Object.entries(reactions).flatMap(([emoji, userIds]) => 
    userIds.map(userId => ({ emoji, userId }))
  );

  const tabs = ['All', ...Object.keys(reactions)];

  const filteredReactions = activeTab === 'All' 
    ? allReactions 
    : allReactions.filter(r => r.emoji === activeTab);

  useLayoutEffect(() => {
    if (!popupRef.current || !triggerRect) return;

    const rect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const newCoords: { top: number; left: number } = { top: triggerRect.top + (triggerRect.height / 2), left: 0 };
    let transform = 'translateY(-50%)';
    let transformOrigin = 'left center';

    // Horizontal positioning (Side anchoring)
    if (isMe) {
      // Sent messages: try to show on the left of emojis
      newCoords.left = triggerRect.left - rect.width - 16;
      transformOrigin = 'right center';
      if (newCoords.left < 10) {
        // Fallback to right if no space on left
        newCoords.left = triggerRect.right + 16;
        transformOrigin = 'left center';
      }
    } else {
      // Received messages: try to show on the right of emojis
      newCoords.left = triggerRect.right + 16;
      transformOrigin = 'left center';
      if (newCoords.left + rect.width > viewportWidth - 10) {
        // Fallback to left if no space on right
        newCoords.left = triggerRect.left - rect.width - 16;
        transformOrigin = 'right center';
      }
    }

    // Vertical boundary detection
    if (newCoords.top - (rect.height / 2) < 10) {
      newCoords.top = 10;
      transform = 'none';
    } else if (newCoords.top + (rect.height / 2) > viewportHeight - 10) {
      newCoords.top = viewportHeight - rect.height - 10;
      transform = 'none';
    }

    requestAnimationFrame(() => {
      setCoords({ ...newCoords, transform, transformOrigin });
    });
  }, [triggerRect, isMe]);

  return createPortal(
    <>
      {/* Click-away backdrop */}
      <div 
        className="fixed inset-0 z-490 pointer-events-auto" 
        onClick={onClose} 
      />
      
      <div 
        ref={popupRef}
        style={coords ? {
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          transform: coords.transform,
          transformOrigin: coords.transformOrigin,
        } : { opacity: 0 }}
        className={cn(
          "pointer-events-auto w-[200px] bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[300px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-500",
          !coords && "opacity-0"
        )}
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-1 overflow-x-auto no-scrollbar bg-gray-50/50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-2 text-[12px] font-semibold transition-all relative min-w-max",
                activeTab === tab ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="flex items-center gap-1.5">
                {tab === 'All' ? 'All' : tab}
                <span className={cn(
                  "text-[9px] px-1 py-0.5 rounded-full",
                  activeTab === tab ? "bg-primary/10" : "bg-gray-100"
                )}>
                  {tab === 'All' ? allReactions.length : reactions[tab].length}
                </span>
              </div>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar min-h-[120px]">
          {filteredReactions.map(({ emoji, userId }, index) => {
            const user = userId === 'me' ? { name: 'You', avatar: undefined } : users.find(u => u.id === userId);
            return (
              <div key={`${index}-${userId}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[12px] font-bold overflow-hidden shrink-0">
                    {userId === 'me' ? 'Y' : (user?.name?.[0] || '?')}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[13px] truncate">{user?.name || 'User'}</span>
                    {userId === 'me' && (
                      <button 
                        onClick={() => onRemoveReaction(emoji)}
                        className="text-[10px] text-primary hover:underline text-left whitespace-nowrap"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-[16px] shrink-0 ml-2">{emoji}</span>
              </div>
            );
          })}
        </div>
      </div>
    </> ,
    document.body
  );
};
