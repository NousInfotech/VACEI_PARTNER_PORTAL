import React, { useState, useRef } from 'react';
import { Check, CheckCheck, FileText, ChevronDown, Clock } from 'lucide-react';
import type { Message, User } from '../types';
import { cn } from '../../../lib/utils';
import { MessageOptions } from './MessageOptions';
import type { MessageAction } from './MessageOptions';
import { ReactionDetailsModal } from './ReactionDetailsModal';
import { users as mockUsers } from '../mockData';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  sender?: User;
  showSenderName?: boolean;
  onMediaClick?: (message: Message) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  onForward?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onEnterSelectMode?: () => void;
  showOptions?: boolean;
  onToggleOptions?: (show: boolean) => void;
  onImageLoad?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  sender,
  showSenderName,
  onMediaClick,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  isSelectMode,
  isSelected,
  onSelect,
  onEnterSelectMode,
  showOptions = false,
  onToggleOptions,
  onImageLoad
}) => {
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reactionContainerRef = useRef<HTMLDivElement>(null);

  const [triggerCoords, setTriggerCoords] = useState<DOMRect | null>(null);
  const [reactionCoords, setReactionCoords] = useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (showOptions && triggerRef.current) {
      setTriggerCoords(triggerRef.current.getBoundingClientRect());
    } else if (!showOptions) {
      setTriggerCoords(null);
    }
  }, [showOptions]);

  React.useEffect(() => {
    if (showReactionDetails && reactionContainerRef.current) {
      setReactionCoords(reactionContainerRef.current.getBoundingClientRect());
    } else if (!showReactionDetails) {
      setReactionCoords(null);
    }
  }, [showReactionDetails]);

  const handleAction = (action: MessageAction, data?: string) => {
    if (action === 'reply') onReply?.();
    else if (action === 'edit') onEdit?.();
    else if (action === 'delete') onDelete?.();
    else if (action === 'forward') onForward?.();
    else if (action === 'react' && data) onReact?.(data as string);
    else if (action === 'copy') {
      if (message.text) navigator.clipboard.writeText(message.text);
    }
    else if (action === 'select') {
      onEnterSelectMode?.();
      onSelect?.();
    }
  };

  return (
    <div
      className={cn(
        "flex mb-4 group/item relative",
        isMe ? "flex-row-reverse" : "flex-row",
        isSelectMode && "cursor-pointer"
      )}
      onClick={() => isSelectMode && onSelect?.()}
    >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <div className="flex items-center px-4 shrink-0 transition-opacity">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "bg-primary border-primary" : "border-gray-300 bg-white"
          )}>
            {isSelected && <Check className="w-3 h-3 text-white stroke-3" />}
          </div>
        </div>
      )}

      <div className={cn("flex flex-col max-w-[85%]", isMe ? "items-end" : "items-start")}>
        {!isMe && showSenderName && sender && !message.isDeleted && (
          <span className="text-[10px] font-semibold text-primary mb-1 ml-2">
            {sender.name}
          </span>
        )}

        <div
          className={cn(
            "relative shadow-sm px-3 py-1.5 min-w-[120px] max-w-full group/bubble",
            isMe
              ? "bg-primary text-white rounded-lg rounded-tr-none"
              : "bg-white text-gray-800 rounded-lg rounded-tl-none border border-[#e2e8f0]/30",
            message.type === 'gif' ? "p-1" : "",
            message.isDeleted && "bg-gray-50/50 border-gray-100 text-gray-400",
            message.status === 'sending' && "opacity-70" // Visual cue for optimistic send
          )}
        >
          {/* Reply Preview */}
          {message.replyToId && (
            <div className={cn(
              "mb-2 p-2 rounded-lg border-l-4 bg-black/5 flex flex-col gap-0.5 min-w-[120px]",
              isMe ? "border-white/40" : "border-primary/40"
            )}>
              <span className={cn(
                "text-[11px] font-bold",
                isMe ? "text-white/90" : "text-primary/90"
              )}>
                Reply
              </span>
              <p className={cn(
                "text-[12px] truncate opacity-70 italic",
                isMe ? "text-white" : "text-gray-600"
              )}>
                Message has been replied to
              </p>
            </div>
          )}

          {/* Dropdown Trigger */}
          {!message.isDeleted && (
            <button
              ref={triggerRef}
              onClick={(e) => {
                e.stopPropagation();
                onToggleOptions?.(!showOptions);
              }}
              className={cn(
                "absolute top-1 right-1 p-1 rounded-full bg-inherit bg-opacity-80 opacity-0 group-hover/bubble:opacity-100 transition-all z-10 hover:bg-black/5 hover:scale-110",
                showOptions && "opacity-100",
                isMe ? "text-white/80" : "text-gray-400"
              )}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          <MessageOptions
            isOpen={showOptions}
            onClose={() => onToggleOptions?.(false)}
            onAction={handleAction}
            isMe={isMe}
            isDeleted={message.isDeleted}
            triggerRect={triggerCoords}
            createdAt={message.createdAt}
          />

          {message.type === 'image' ? (
            <div
              className="overflow-hidden rounded-xl mb-1 cursor-pointer hover:opacity-95 transition-opacity bg-black/5"
              onClick={() => onMediaClick?.(message)}
            >
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="w-[300px] h-full object-cover"
                onLoad={onImageLoad}
              />
            </div>
          ) : message.type === 'document' ? (
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg mb-1 border group cursor-pointer transition-colors",
                isMe
                  ? "bg-white/10 border-white/10 hover:bg-white/20"
                  : "bg-black/5 border-black/5 hover:bg-black/10"
              )}
              onClick={() => {
                if (message.fileUrl) {
                  window.open(message.fileUrl, '_blank');
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#7f66ff] flex items-center justify-center text-white shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[14px] font-medium truncate",
                  isMe ? "text-white" : "text-gray-900"
                )}>
                  {message.fileName}
                </p>
                <p className={cn(
                  "text-[12px] uppercase",
                  isMe ? "text-white/60" : "text-gray-500"
                )}>
                  {message.fileSize}
                </p>
              </div>
            </div>
          ) : message.type === 'gif' ? (
            <div className="overflow-hidden rounded-lg">
              <img src={message.gifUrl} alt="GIF" className="max-w-full h-auto min-w-[200px]" />
            </div>
          ) : message.isDeleted ? (
            <div className="flex items-center gap-2 py-1 select-none italic opacity-60">
              <span className="text-gray-400">🚫</span>
              <p className="text-[13.5px]">
                {isMe ? "You deleted this message" : "This message was deleted"}
              </p>
            </div>
          ) : (
            <p className="text-[14.5px] pr-8 pb-4 leading-normal wrap-break-word whitespace-pre-wrap">
              {message.text}
              {message.isEdited && (
                <span className="ml-1 text-[10px] opacity-60 italic">(edited)</span>
              )}
            </p>
          )}

          <div className={cn(
            "absolute bottom-1 right-2 flex items-center gap-1.5",
            isMe ? "text-white/60" : "text-gray-400",
            message.type === 'gif' && "bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-white/90"
          )}>
            <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isMe && (
              <span className="flex items-center shrink-0">
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                ) : message.status === 'sending' ? (
                  <Clock className="w-3 h-3 text-white/70" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Display */}
        {!message.isDeleted && message.reactions && Object.keys(message.reactions).length > 0 && (
          <div
            ref={reactionContainerRef}
            className={cn(
              "flex flex-wrap gap-1 -mt-2.5 relative z-20",
              isMe ? "justify-end mr-4" : "justify-start ml-4"
            )}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              userIds.length > 0 && (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionDetails(!showReactionDetails);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[14px] leading-none transition-all duration-200 hover:scale-110 shadow-sm border",
                    userIds.includes('me') ? "bg-primary/10 border-primary/20" : "bg-white border-gray-100"
                  )}
                >
                  <span>{emoji}</span>
                  {userIds.length > 1 && <span className="font-bold text-gray-500 text-[10px]">{userIds.length}</span>}
                </button>
              )
            ))}

            {showReactionDetails && message.reactions && (
              <ReactionDetailsModal
                reactions={message.reactions}
                users={mockUsers}
                isMe={isMe}
                onClose={() => setShowReactionDetails(false)}
                onRemoveReaction={(emoji) => {
                  onReact?.(emoji);
                  setShowReactionDetails(false);
                }}
                triggerRect={reactionCoords}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
