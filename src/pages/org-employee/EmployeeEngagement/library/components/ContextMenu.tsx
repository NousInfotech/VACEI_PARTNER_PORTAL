"use client"

import React, { useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import { useLibrary } from '../../../../../context/LibraryContext';
import type { LibraryItem } from '../../../../../context/LibraryContext';

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, currentItems, handleDownload, handleDoubleClick, handleDelete } = useLibrary();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  if (!contextMenu) return null;

  const item = currentItems.find((i: LibraryItem) => i.id === contextMenu.itemId);
  if (!item) return null;

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 w-48 animate-in fade-in zoom-in duration-100"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {!isConfirmingDelete ? (
        <>
          <button 
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors text-left"
            onClick={() => { handleDownload(item); closeContextMenu(); }}
          >
            <Download className="w-4 h-4" />
            Download {item.type === 'folder' ? 'Folder' : ''}
          </button>
          <button 
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            onClick={() => { setIsConfirmingDelete(true); }}
          >
            <Trash2 className="w-4 h-4" />
            Delete {item.type === 'folder' ? 'Folder' : 'File'}
          </button>
          {item.type === 'file' && (item.fileType === 'PDF' || ['PNG', 'JPG', 'JPEG'].includes(item.fileType || '')) && (
            <button 
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors text-left"
              onClick={() => { handleDoubleClick(item); closeContextMenu(); }}
            >
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          )}
        </>
      ) : (
        <div className="px-3 py-2 space-y-2">
          <p className="text-xs text-gray-700">Delete "{item.name}"?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </button>
            <button
              className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                handleDelete(item);
                setIsConfirmingDelete(false);
                closeContextMenu();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
