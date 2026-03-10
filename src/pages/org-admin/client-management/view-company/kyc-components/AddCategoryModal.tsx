import React, { useState } from 'react';
import { X, FolderPlus, Loader2 } from "lucide-react";
import { Button } from '../../../../../ui/Button';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string) => void;
  isPending?: boolean;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  const [title, setTitle] = useState("Document Request");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <FolderPlus size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Add New Category</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Category Name
              </label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Legal Documents, Founder KYC"
                className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-gray-900"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) onConfirm(title);
                }}
              />
            </div>
            
            <p className="text-xs text-gray-500 font-medium leading-relaxed px-1">
              Create a new group to organize related document requirements for this incorporation cycle.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-gray-100 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
            >
              Cancel
            </Button>
            <Button 
                onClick={() => onConfirm(title)} 
                disabled={isPending || !title.trim()}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus size={14} />}
              Create Category
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
