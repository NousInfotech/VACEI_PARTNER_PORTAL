import React from 'react';
import { cn } from '../../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-[15px] leading-relaxed">{message}</p>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[14px] font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-2.5 text-[14px] font-semibold text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-black/5",
              variant === 'danger' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onCancel} />
    </div>
  );
};
