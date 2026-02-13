import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import type { Message } from '../types';

interface MediaPreviewModalProps {
  message: Message;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ message, onClose }) => {
  const isImage = message.type === 'image';
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center animate-in fade-in duration-200">
      {/* Header */}
      <div className="w-full h-16 flex items-center justify-between px-6 bg-black/20 shrink-0">
        <div className="flex items-center gap-4 text-white">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {isImage ? (
              <img src={message.fileUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <FileText className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{message.fileName || (isImage ? 'Image' : 'Document')}</span>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">{message.timestamp}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <a 
            href={message.fileUrl} 
            download={message.fileName}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden">
        {isImage ? (
          <img 
            src={message.fileUrl} 
            alt={message.fileName} 
            className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" 
          />
        ) : (
          <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-300 text-center max-w-md">
            <div className="w-24 h-24 rounded-2xl bg-[#7f66ff]/10 flex items-center justify-center text-[#7f66ff]">
              <FileText className="w-12 h-12" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-gray-900">{message.fileName}</h3>
              <p className="text-gray-500 uppercase tracking-wide text-sm">{message.fileSize}</p>
            </div>
            <a 
              href={message.fileUrl} 
              download={message.fileName}
              className="mt-4 px-8 py-3 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
