import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { XCircle } from "lucide-react";

interface RejectEngagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export const RejectEngagementDialog = ({
  isOpen,
  onClose,
  rejectionReason,
  setRejectionReason,
  onConfirm,
  isUpdating
}: RejectEngagementDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md flex flex-col p-8 overflow-hidden rounded-[32px] border-none shadow-2xl">
      <DialogHeader className="p-0 mb-6">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-red-100 rounded-2xl text-red-600">
            <XCircle size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-gray-900">Reject Engagement</DialogTitle>
            <p className="text-sm text-gray-500 font-medium">Please provide a reason for rejection</p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <textarea
          className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all outline-none resize-none text-sm font-medium"
          placeholder="Enter reason here..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
        
        <div className="flex gap-3 justify-end pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-6 font-bold"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={!rejectionReason.trim() || isUpdating}
            className="rounded-xl px-8 font-bold"
          >
            {isUpdating ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default RejectEngagementDialog;
