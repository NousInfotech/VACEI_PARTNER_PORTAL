import React from 'react';
import { ShadowCard } from '../../../../../../ui/ShadowCard';
import { Skeleton } from '../../../../../../ui/Skeleton';

const InvolvementsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
                {[1, 2, 3].map((i) => (
                    <ShadowCard key={i} className="bg-white border border-indigo-100 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-6 w-48" />
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex gap-2">
                                <Skeleton className="h-7 w-24 rounded-lg" />
                                <Skeleton className="h-7 w-24 rounded-lg" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-7 w-32 rounded-lg" />
                                <Skeleton className="h-7 w-20 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-64" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </ShadowCard>
                ))}
            </div>
        </div>
    );
};

export default InvolvementsSkeleton;
