"use client"

import React from 'react';
import { Skeleton } from '../../../../../ui/Skeleton';

export const ListViewSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Row Skeletons */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border border-gray-100 rounded-xl px-4 bg-white">
          <div className="flex items-center gap-3 w-1/3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="w-1/6">
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="w-1/6">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
