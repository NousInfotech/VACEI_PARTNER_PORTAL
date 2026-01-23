"use client"

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { useLibrary } from '../../../../../context/LibraryContext';

export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, handleFolderClick } = useLibrary();

  return (
    <div className="flex items-center px-4 py-2 bg-gray-50/30 border-b border-gray-200 gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <button 
        onClick={() => handleFolderClick(null)}
        className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
      >
        Library
      </button>
      {breadcrumbs.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          <button 
            onClick={() => handleFolderClick(folder.id)}
            className={cn(
              "text-sm hover:text-primary transition-colors",
              index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "text-gray-500"
            )}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
