"use client"

import React from 'react';
import { FolderIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { useLibrary } from '../../../../../context/LibraryContext';

export const Sidebar: React.FC = () => {
  const { sidebarFolders, currentFolderId, breadcrumbs, handleFolderClick, setIsMobileSidebarOpen, handleMoveItem } = useLibrary();

  const onFolderClick = (id: string | null) => {
    handleFolderClick(id);
    setIsMobileSidebarOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-primary/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-primary/10');
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/10');
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (dragData.id !== targetFolderId) {
        handleMoveItem(dragData.id, dragData.type, targetFolderId);
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  return (
    <div className="w-64 lg:w-64 h-full border-r border-gray-200 flex flex-col bg-white lg:bg-gray-50/20 shadow-2xl lg:shadow-none">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Navigation</p>
          <button
            onClick={() => onFolderClick(null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all text-sm text-left",
              currentFolderId === null ? "bg-primary shadow-md text-white border-0" : "text-gray-600 hover:bg-gray-100/50"
            )}
          >
            <FolderIcon className={cn("w-4 h-4", currentFolderId === null ? "text-white fill-white/10" : "text-gray-400")} />
            All Files
          </button>
          {sidebarFolders.map(folder => {
            const isActive = currentFolderId === folder.id || breadcrumbs.some(b => b.id === folder.id);
            return (
              <button
                key={folder.id}
                onClick={() => onFolderClick(folder.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group text-left",
                  isActive ? "bg-primary shadow-md text-white border-0" : "text-gray-600 hover:bg-gray-100/50"
                )}
              >
                <FolderIcon className={cn("w-4 h-4 transition-colors", isActive ? "text-white fill-white/10" : "text-gray-400 group-hover:text-primary")} />
                {folder.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
