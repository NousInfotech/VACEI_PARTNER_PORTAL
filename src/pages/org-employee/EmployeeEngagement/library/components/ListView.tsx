"use client"

import React, { useState } from 'react';
import { FolderIcon, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import { cn } from '../../../../../lib/utils';
import { getFileIcon } from '../../../../../lib/libraryData';
import { useLibrary } from '../../../../../context/LibraryContext';

export const ListView: React.FC = () => {
  const { currentItems, selectedItems, handleDoubleClick, handleSelection, handleContextMenu, handleDownload, handleDelete } = useLibrary();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <table className="w-full text-left border-separate border-spacing-y-2">
      <thead>
        <tr className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          <th className="pb-2 pl-4">Name</th>
          <th className="pb-2 hidden sm:table-cell">Type</th>
          <th className="pb-2 hidden md:table-cell">Date Modified</th>
          <th className="pb-2 text-right pr-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentItems.map((item) => {
          const Icon = item.type === 'folder' ? FolderIcon : getFileIcon(item.fileType);
          const isSelected = selectedItems.includes(item.id);
          
          return (
            <tr 
              key={item.id}
              onDoubleClick={() => handleDoubleClick(item)}
              onClick={(e) => handleSelection(item.id, e)}
              onContextMenu={(e) => handleContextMenu(e, item.id)}
              className={cn(
                "group hover:bg-gray-100 cursor-pointer transition-all border border-gray-100 rounded-xl overflow-hidden",
                isSelected && "bg-primary/5 border-primary/20 hover:bg-primary/5"
              )}
            >
              <td className="py-1 pl-3 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border border-transparent",
                    isSelected ? "border-primary/20" : "border-gray-100",
                    item.type === 'folder' ? "bg-amber-50" : "bg-blue-50"
                  )}>
                    <Icon className={cn("w-5 h-5", item.type === 'folder' ? "text-amber-500 fill-amber-500/10" : "text-blue-500")} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                </div>
              </td>
              <td className="py-3 hidden sm:table-cell">
                <span className="text-xs text-gray-500 uppercase font-medium">{item.fileType || 'Folder'}</span>
              </td>
              <td className="py-3 hidden md:table-cell">
                <span className="text-xs text-gray-500">{item.updatedAt}</span>
              </td>
              <td className="pr-4 text-right rounded-r-xl relative">
                <div className="flex items-center justify-end gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                    className="h-10 w-10 p-0 rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </Button>
                  {item.type === 'file' && (item.fileType === 'PDF' || ['PNG', 'JPG', 'JPEG'].includes(item.fileType || '')) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); handleDoubleClick(item); }}
                      className="h-10 w-10 p-0 rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setDeleteTargetId(item.id);
                    }}
                    className="h-10 w-10 p-0 rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                {deleteTargetId === item.id && (
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 text-xs z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
