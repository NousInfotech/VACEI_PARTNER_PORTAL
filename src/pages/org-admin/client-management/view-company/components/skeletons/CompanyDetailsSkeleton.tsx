import React from 'react';
import { ShadowCard } from '../../../../../../ui/ShadowCard';
import { Skeleton } from '../../../../../../ui/Skeleton';

const CompanyDetailsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Header Section Skeleton */}
            <ShadowCard className="p-4 border border-gray-100">
                <div className="flex items-center space-x-5">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </ShadowCard>

            {/* Share Information Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ShadowCard className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-40" />
                </ShadowCard>
                <ShadowCard className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-40" />
                </ShadowCard>
            </div>

            {/* Shares Breakdown Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <ShadowCard key={i} className="p-4 rounded-xl border-gray-100 flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                    </ShadowCard>
                ))}
            </div>

            {/* Additional Details Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <ShadowCard key={i} className="p-4 bg-gray-50 rounded-xl border-gray-100 border h-24">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-full" />
                    </ShadowCard>
                ))}
                <ShadowCard className="p-4 bg-gray-50 rounded-xl border-gray-100 border md:col-span-3 h-32">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-12 w-full" />
                </ShadowCard>
            </div>
        </div>
    );
};

export default CompanyDetailsSkeleton;
