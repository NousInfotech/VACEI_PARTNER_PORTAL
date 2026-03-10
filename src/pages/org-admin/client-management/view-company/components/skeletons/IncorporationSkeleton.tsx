import React from 'react';
import { ShadowCard } from '../../../../../../ui/ShadowCard';
import { Skeleton } from '../../../../../../ui/Skeleton';

const IncorporationSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <ShadowCard key={i} className="p-8 bg-white border border-gray-100 rounded-3xl space-y-4 h-32">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-24" />
                    </ShadowCard>
                ))}
            </div>
        </div>
    );
};

export default IncorporationSkeleton;
