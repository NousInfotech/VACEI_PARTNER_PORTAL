"use client"

import React, { useState } from 'react';
import { FolderIcon, Trash2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { getFileIcon } from '../../../../../lib/libraryData';
import { useLibrary } from '../../../../../context/LibraryContext';
export const GridView: React.FC = () => {
  const { currentItems, selectedItems, handleDoubleClick, handleSelection, handleContextMenu, handleDelete, handleMoveItem } = useLibrary();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {currentItems.map((item) => {
        const Icon = item.type === 'folder' ? FolderIcon : getFileIcon(item.fileType);
        const isSelected = selectedItems.includes(item.id);
        const canDelete = !item.isProtected && item.createdBy === 'user';
        const canDrag = !item.isProtected && item.createdBy === 'user';

        return (
          <div 
            key={item.id}
            onDoubleClick={() => handleDoubleClick(item)}
            onClick={(e) => handleSelection(item.id, e)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
            draggable={canDrag}
            onDragStart={(e) => {
              if (!canDrag) return;
              e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, type: item.type }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              if (item.type === 'folder') {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget.classList.add('ring-2', 'ring-primary', 'ring-inset');
              }
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset');
            }}
            onDrop={(e) => {
              if (item.type === 'folder') {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset');
                const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (dragData.id !== item.id) {
                  handleMoveItem(dragData.id, dragData.type, item.id);
                }
              }
            }}
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
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTargetId(item.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1.5 bg-white shadow border border-gray-200"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            )}

            {deleteTargetId === item.id && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 text-xs">
                  <span className="text-gray-600 hidden sm:inline">Delete this item?</span>
                  <button
                    className="px-2 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                    onClick={() => {
                      handleDelete(item);
                      setDeleteTargetId(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                    onClick={() => setDeleteTargetId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
