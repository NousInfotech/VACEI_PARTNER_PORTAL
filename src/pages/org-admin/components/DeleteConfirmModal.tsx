import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Button } from '../../../ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
  title?: string;
  description?: React.ReactNode;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  loading = false,
  title = "Confirm Deletion",
  description
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <AlertTriangle size={20} />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4 text-gray-600 leading-relaxed">
          {description || (
            <>
              Are you sure you want to delete <span className="font-bold text-gray-900">"{itemName}"</span>? 
              This action cannot be undone and will permanently remove this item from the system.
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Item'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
