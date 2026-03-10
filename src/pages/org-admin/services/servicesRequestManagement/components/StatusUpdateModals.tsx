import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import { ShadowCard } from '../../../../../ui/ShadowCard';
import type { ServiceRequestStatus } from '../../../../../types/service-request-template';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: ServiceRequestStatus | null;
  title: string;
  message: string;
  showReasonInput?: boolean;
  reason?: string;
  onReasonChange?: (val: string) => void;
  loading?: boolean;
}

export const StatusConfirmModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  status,
  title,
  message,
  showReasonInput,
  reason,
  onReasonChange,
  loading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <ShadowCard className="w-full max-w-lg bg-white p-0 rounded-[40px] shadow-2xl relative overflow-hidden border border-gray-100">
        <div className="p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center shadow-xl border ${
              status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-primary/5 text-primary border-primary/10'
            }`}>
              <AlertCircle size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              <p className="text-gray-500 font-medium mt-2">{message}</p>
            </div>
          </div>

          {showReasonInput && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Reason for Rejection</label>
              <textarea 
                value={reason}
                onChange={(e) => onReasonChange?.(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-5 rounded-[24px] bg-gray-50 border border-gray-100 focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 outline-none transition-all font-medium min-h-[120px] resize-none"
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-gray-100 text-gray-400 hover:bg-gray-50 font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={loading || (showReasonInput && !reason?.trim())}
              className={`flex-1 py-4 rounded-2xl font-bold shadow-xl transition-all ${
                status === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-primary hover:bg-primary-dark shadow-primary/20'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm Action'}
            </Button>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </ShadowCard>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  engagementId?: string;
  onViewEngagement?: (id: string) => void;
}

export const StatusSuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  engagementId,
  onViewEngagement,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <ShadowCard className="w-full max-w-sm bg-white p-0 rounded-[40px] shadow-2xl relative overflow-hidden border border-gray-100">
        <div className="p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-[32px] bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-xl shadow-green-500/10 scale-110 animate-in zoom-in-50 duration-500">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">{message}</p>
          </div>
          
          <div className="w-full space-y-3">
            {engagementId && onViewEngagement && (
              <Button 
                onClick={() => onViewEngagement(engagementId)}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold shadow-xl shadow-primary/20 transition-all"
              >
                View Engagement
              </Button>
            )}
            <Button 
              onClick={onClose}
              variant={engagementId ? "outline" : "default"}
              className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all ${
                !engagementId ? "bg-gray-900 hover:bg-black text-white" : "border-gray-100 text-gray-400 hover:bg-gray-50"
              }`}
            >
              Close & Refresh
            </Button>
          </div>
        </div>
      </ShadowCard>
    </div>
  );
};
