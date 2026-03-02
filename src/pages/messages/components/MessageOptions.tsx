import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Reply, 
  Forward, 
  Trash2, 
  Copy, 
  CheckSquare, 
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export type MessageAction = 'reply' | 'forward' | 'delete' | 'copy' | 'select' | 'createTodo';

interface MessageOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: MessageAction, data?: string) => void;
  isMe: boolean;
  isDeleted?: boolean;
  triggerRect?: DOMRect | null;
  createdAt?: number;
  hasTodo?: boolean;
}



export const MessageOptions: React.FC<MessageOptionsProps> = ({
  isOpen,
  onClose,
  onAction,
  isMe,
  isDeleted,
  triggerRect,
  createdAt,
  hasTodo,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setNow(Date.now());
        setCoords(null);
      });
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && triggerRect && menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight;
      const menuWidth = menuRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = triggerRect.bottom + 16;
      let left = isMe ? triggerRect.right - menuWidth : triggerRect.left;
      let transformOrigin = isMe ? 'top right' : 'top left';

      // Flip to top if not enough space below
      if (top + menuHeight > viewportHeight - 20 && triggerRect.top > menuHeight + 20) {
        top = triggerRect.top - menuHeight - 16;
        transformOrigin = isMe ? 'bottom right' : 'bottom left';
      }

      // Horizontal edge detection
      if (left + menuWidth > viewportWidth - 20) {
        left = viewportWidth - menuWidth - 20;
      }
      if (left < 20) {
        left = 20;
      }

      requestAnimationFrame(() => {
        setCoords({ top, left, transformOrigin });
      });
    }
  }, [isOpen, triggerRect, isMe]);

  if (!isOpen) return null;

  const mainOptions = isDeleted ? [] : [
    { id: 'reply' as const, label: 'Reply', icon: Reply },
    { id: 'copy' as const, label: 'Copy', icon: Copy },
    { id: 'forward' as const, label: 'Forward', icon: Forward },
  ];

  const footerOptions = [
    { id: 'select' as const, label: 'Select', icon: CheckSquare },
    { 
      id: 'createTodo' as const, 
      label: hasTodo ? 'Edit Checklist' : 'Create Todo', 
      icon: CheckSquare, 
      className: 'text-amber-500' 
    },
    ...(isMe ? [{ id: 'delete' as const, label: 'Delete', icon: Trash2, className: 'text-[#ef5350]' }] : []),
  ];

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-490 cursor-default" 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div 
        ref={menuRef}
        style={coords ? {
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          transformOrigin: coords.transformOrigin,
        } : { opacity: 0 }}
        className={cn(
          "z-500 w-[280px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200",
          !coords && "opacity-0",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >


      {/* Main Actions */}
      {mainOptions.length > 0 && (
        <>
          <div className="py-0.5">
            {mainOptions.map((option) => (
              <button
                key={option.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(option.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <option.icon className="w-4 h-4 text-gray-400" />
                {option.label}
              </button>
            ))}
          </div>
          <div className="h-px bg-gray-50 mx-0 my-0.5" />
        </>
      )}

      {/* Footer Actions */}
      <div className="py-0.5">
        {footerOptions.map((option) => (
          <button
            key={option.id}
            onClick={(e) => {
              e.stopPropagation();
              onAction(option.id);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2 text-[14px] font-medium transition-colors hover:bg-gray-50",
              option.className || "text-gray-700"
            )}
          >
            <option.icon className={cn("w-4 h-4", !option.className && "text-gray-400")} />
            {option.label}
          </button>
        ))}
      </div>
      </div>
    </>,
    document.body
  );
};
