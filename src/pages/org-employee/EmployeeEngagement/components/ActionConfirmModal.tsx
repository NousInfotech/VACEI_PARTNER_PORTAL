import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Textarea } from '@/ui/Textarea';
import { cn } from '@/lib/utils';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  showReasonField?: boolean;
  reasonPlaceholder?: string;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = 'primary',
  loading = false,
  showReasonField = false,
  reasonPlaceholder = "Provide a reason (optional)..."
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertCircle : Info;
  const iconColor = variant === 'danger' ? 'text-red-600' : variant === 'warning' ? 'text-amber-600' : 'text-primary';
  const iconBg = variant === 'danger' ? 'bg-red-100' : variant === 'warning' ? 'bg-amber-100' : 'bg-primary/10';
  const buttonClass = variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 
                      variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                      'bg-slate-900 hover:bg-black shadow-slate-200';

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl shrink-0 animate-in zoom-in-50 duration-300", iconBg, iconColor)}>
              <Icon size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <div className="text-slate-600 leading-relaxed font-medium">
            {message}
          </div>

          {showReasonField && (
            <div className="mt-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Additional Note (Optional)
              </label>
              <Textarea 
                placeholder={reasonPlaceholder}
                className="rounded-2xl border-slate-100 bg-slate-50/50 min-h-[100px] focus:bg-white transition-all text-sm font-medium resize-none p-4"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-6 pt-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-2xl h-12 text-slate-400 font-bold hover:bg-slate-50"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn("flex-2 rounded-2xl h-12 font-black text-white shadow-xl transition-all active:scale-95", buttonClass)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
