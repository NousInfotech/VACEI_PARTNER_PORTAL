"use client"

import React from 'react';
import { FolderIcon } from 'lucide-react';
import { ScrollArea } from '../../../../../ui/scroll-area';
import { cn } from '../../../../../lib/utils';
import { useLibrary } from '../../../../../context/LibraryContext';

export const Sidebar: React.FC = () => {
  const { rootFolders, currentFolderId, handleFolderClick, setIsMobileSidebarOpen } = useLibrary();

  const onFolderClick = (id: string | null) => {
    handleFolderClick(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="w-64 lg:w-64 h-full border-r border-gray-200 flex flex-col bg-white lg:bg-gray-50/20 shadow-2xl lg:shadow-none">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Navigation</p>
          <button
            onClick={() => onFolderClick(null)}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all text-sm text-left",
              currentFolderId === null ? "bg-primary shadow-md text-white border-0" : "text-gray-600 hover:bg-gray-100/50"
            )}
          >
            <FolderIcon className={cn("w-4 h-4", currentFolderId === null ? "text-white fill-white/10" : "text-gray-400")} />
            All Files
          </button>
          {rootFolders.map(folder => (
            <button
              key={folder.id}
              onClick={() => onFolderClick(folder.id)}
              className={cn(
                "flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group text-left",
                currentFolderId === folder.id ? "bg-primary shadow-md text-white border-0" : "text-gray-600 hover:bg-gray-100/50"
              )}
            >
              <FolderIcon className={cn("w-4 h-4 transition-colors", currentFolderId === folder.id ? "text-white fill-white/10" : "text-gray-400 group-hover:text-primary")} />
              {folder.name}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
