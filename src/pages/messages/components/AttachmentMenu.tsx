import { Image as ImageIcon, FileText } from 'lucide-react';

interface AttachmentMenuProps {
  onSelect: (type: 'image' | 'document') => void;
  onClose: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onSelect, onClose }) => {
  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose}
      />
      
      <div className="absolute bottom-full mb-4 left-0 z-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={() => {
            onSelect('image');
            onClose();
          }}
          className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#bf59cf] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[15px] font-normal text-gray-700">Images</span>
        </button>

        <button
          onClick={() => {
            onSelect('document');
            onClose();
          }}
          className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#7f66ff] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[15px] font-normal text-gray-700">Documents</span>
        </button>
      </div>
    </>
  );
};
