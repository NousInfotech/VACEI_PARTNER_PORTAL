"use client"

import React from 'react';
import { FolderIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { getFileIcon } from '../../../../../lib/libraryData';
import { useLibrary } from '../../../../../context/LibraryContext';
export const GridView: React.FC = () => {
  const { currentItems, selectedItems, handleDoubleClick, handleSelection, handleContextMenu } = useLibrary();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {currentItems.map((item) => {
        const Icon = item.type === 'folder' ? FolderIcon : getFileIcon(item.fileType);
        const isSelected = selectedItems.includes(item.id);

        return (
          <div 
            key={item.id}
            onDoubleClick={() => handleDoubleClick(item)}
            onClick={(e) => handleSelection(item.id, e)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
            className={cn(
              "group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3 relative",
              isSelected 
                ? "bg-primary/5 border-primary/20 shadow-sm" 
                : "bg-white border-gray-200 hover:shadow-md hover:border-primary/20"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-transparent",
              isSelected ? "border-primary/20" : "border-gray-100",
              item.type === 'folder' ? "bg-amber-50" : "bg-blue-50"
            )}>
              <Icon className={cn("w-8 h-8", item.type === 'folder' ? "text-amber-500 fill-amber-500/10" : "text-blue-500")} />
            </div>
            <div className="text-center overflow-hidden w-full">
              <p className="text-sm text-gray-700 font-medium truncate px-2">{item.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">
                {item.fileType || 'Folder'} {item.size && `• ${item.size}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
