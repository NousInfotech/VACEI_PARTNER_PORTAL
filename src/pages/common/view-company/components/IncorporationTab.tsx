import React from 'react';
import { Building2, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import StatusBadge from './StatusBadge';
import type { IncorporationCycle } from '../../../../types/company';

interface IncorporationTabProps {
    incCycle: IncorporationCycle | undefined;
}

const IncorporationTab: React.FC<IncorporationTabProps> = ({ incCycle }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Incorporation Trajectory</h2>
                        <p className="text-sm text-gray-500 font-medium">Tracking company formation and registration status</p>
                    </div>
                </div>
                <StatusBadge status={incCycle?.status || 'PENDING'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ShadowCard className="p-8 bg-white border border-gray-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Process Started</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {incCycle?.startedAt ? new Date(incCycle.startedAt).toLocaleDateString() : 'N/A'}
                    </p>
                </ShadowCard>

                <ShadowCard className="p-8 bg-white border border-gray-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-gray-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Completed On</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {incCycle?.completedAt ? new Date(incCycle.completedAt).toLocaleDateString() : 'In Progress'}
                    </p>
                </ShadowCard>

                <ShadowCard className="p-8 bg-white border border-gray-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-gray-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verification</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {incCycle?.status === 'APPROVED' ? 'Verified' : 'Pending'}
                    </p>
                </ShadowCard>
            </div>
        </div>
    );
};

export default IncorporationTab;
