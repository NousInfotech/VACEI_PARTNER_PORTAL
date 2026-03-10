import React from 'react';
import { ShadowCard } from '../../../../../../ui/ShadowCard';
import { Skeleton } from '../../../../../../ui/Skeleton';

const KycSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            <ShadowCard className="flex items-center justify-between p-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-12 w-12 rounded-4xl" />
            </ShadowCard>

            <div className="space-y-8">
                <div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-3xl border border-gray-100">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {[1, 2].map((i) => (
                        <ShadowCard key={i} className="p-8 border border-gray-100 bg-white space-y-6 h-64">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-2xl" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full rounded-2xl" />
                                <Skeleton className="h-20 w-full rounded-2xl" />
                            </div>
                        </ShadowCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KycSkeleton;
