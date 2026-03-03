import React, { useState, useRef } from 'react';
import { Check, CheckCheck, FileText, ChevronDown, Clock, CheckSquare } from 'lucide-react';
import type { Message, User } from '../types';
import { cn } from '../../../lib/utils';
import { MessageOptions } from './MessageOptions';
import type { MessageAction } from './MessageOptions';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  sender?: User;
  showSenderName?: boolean;
  onMediaClick?: (message: Message) => void;
  onReply?: () => void;
  onDelete?: () => void;
  onForward?: () => void;
  onCreateTodo?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onEnterSelectMode?: () => void;
  showOptions?: boolean;
  onToggleOptions?: (show: boolean) => void;
  onImageLoad?: () => void;
  linkedTodo?: any;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  sender,
  showSenderName,
  onMediaClick,
  onReply,
  onDelete,
  onForward,
  isSelectMode,
  isSelected,
  onSelect,
  onEnterSelectMode,
  showOptions = false,
  onToggleOptions,
  onImageLoad,
  linkedTodo
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [triggerCoords, setTriggerCoords] = useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (showOptions && triggerRef.current) {
      setTriggerCoords(triggerRef.current.getBoundingClientRect());
    } else if (!showOptions) {
      setTriggerCoords(null);
    }
  }, [showOptions]);

  const handleAction = (action: MessageAction) => {
    if (action === 'reply') onReply?.();
    else if (action === 'delete') onDelete?.();
    else if (action === 'forward') onForward?.();
    // else if (action === 'createTodo') onCreateTodo?.();
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
            message.status === 'sending' && "opacity-70" // Visual cue for optimistic send
          )}
        >
          {/* Reply Preview - show replyToMessage content or fallback when replyToMessageId/replyToId present */}
          {(message.replyToMessage || message.replyToMessageId || message.replyToId) && (
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
                {message.replyToMessage?.text || message.replyToMessage?.fileName || 'Message'}
              </p>
            </div>
          )}

          {/* Dropdown Trigger */}
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

          <MessageOptions
            isOpen={showOptions}
            onClose={() => onToggleOptions?.(false)}
            onAction={handleAction}
            isMe={isMe}
            isDeleted={message.isDeleted}
            triggerRect={triggerCoords}
            createdAt={message.createdAt}
            hasTodo={Boolean(linkedTodo)}
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
          ) : message.isDeleted ? (
            <div className="flex items-center gap-2 py-1 pr-14 select-none italic opacity-60">
              <span className="text-gray-400">🚫</span>
              <p className="text-[13.5px]">
                {isMe ? "(your message was deleted)" : "(message was deleted)"}
              </p>
            </div>
          ) : (
            <p className="text-[14.5px] pr-8 pb-4 leading-normal wrap-break-word whitespace-pre-wrap">
              {message.text}
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
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </span>
            )}
            {linkedTodo && (
               <span className="flex items-center shrink-0" title="Linked to Todo">
                  <CheckSquare className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
               </span>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};
