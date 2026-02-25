import { useChat } from '@/hooks/useChat';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { ScrollArea } from '../../../../ui/scroll-area';
import { Skeleton } from '../../../../ui/Skeleton';
import { cn } from '@/lib/utils';

interface MiniChatPreviewProps {
  engagementId: string;
  chatRoomId?: string;
  onViewAll: () => void;
}

export function MiniChatPreview({ engagementId, chatRoomId, onViewAll }: MiniChatPreviewProps) {
  const { messages, room, isLoading, currentUserId } = useChat(engagementId, { roomId: chatRoomId });

  const latestMessages = messages.slice(-4).reverse();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <MessageSquare size={14} />
          </div>
          <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Latest Activity</h4>
        </div>
        <button 
          onClick={onViewAll}
          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 group"
        >
          Full Chat
          <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="flex-1 bg-white/50 rounded-2xl border border-gray-100/50 flex flex-col shadow-inner overflow-hidden min-h-[150px]">
        <ScrollArea className="flex-1 p-4 h-[150px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
              <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" />
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
            </div>
          ) : latestMessages.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[85%]",
                    msg.senderId === currentUserId ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                    {msg.senderId === currentUserId ? 'You' : 
                      room?.participants?.find(p => p.id === msg.senderId)?.name || 'Unknown'}
                  </span>
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm",
                    msg.senderId === currentUserId 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white border border-gray-100 text-gray-600 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
