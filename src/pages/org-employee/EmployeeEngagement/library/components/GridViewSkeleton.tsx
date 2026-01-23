"use client"

import React from 'react';
import { Skeleton } from '../../../../../ui/Skeleton';
 
export const GridViewSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-4 bg-white"
        >
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="w-full space-y-2">
            <Skeleton className="h-3 w-3/4 mx-auto" />
            <Skeleton className="h-2 w-1/2 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
};
