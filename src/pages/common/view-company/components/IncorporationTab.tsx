import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import { apiGet } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import { transformBackendDocReq } from '../../../../utils/documentTransform';
import type { Company, IncorporationCycle, IncorporationStatus } from '../../../../types/company';
import ClientDocumentRequest from './ClientDocumentRequest';
import { Skeleton } from '../../../../ui/Skeleton';
import { ShadowCard } from '../../../../ui/ShadowCard';

interface IncorporationTabProps {
    company: Company;
}

const statusSteps: IncorporationStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const IncorporationTab: React.FC<IncorporationTabProps> = ({ company }) => {
    const { data: cycle, isLoading } = useQuery<IncorporationCycle | null>({
        queryKey: ['incorporation-cycle', company.id],
        queryFn: async () => {
            try {
                const res = await apiGet<{ data: IncorporationCycle }>(endPoints.INCORPORATION.GET_BY_COMPANY(company.id));
                return res.data;
            } catch (error) {
                return null;
            }
        },
        enabled: !!company.id,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                    <ClipboardList size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Incorporation Process</h3>
                <p className="text-gray-500 mt-2 max-w-md text-center">
                    This company has not started the incorporation process yet. 
                    Please contact your platform administrator if this is an error.
                </p>
            </div>
        );
    }

    const currentStatusIndex = statusSteps.indexOf(cycle.status);
    const transformedDocs = cycle.documentRequests?.map(dr => transformBackendDocReq(dr)) || [];

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <ShadowCard className="p-8 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-widest border border-white/10">
                                {cycle.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Incorporation Status</h2>
                        <p className="text-indigo-200">Track your company registration progress</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;
                            
                            return (
                                <React.Fragment key={step}>
                                    <div className={`flex flex-col items-center gap-2 ${isCompleted ? 'text-white' : 'text-indigo-400/50'}`}>
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                            ${isCompleted ? 'bg-white text-indigo-900 border-white' : 'bg-transparent border-indigo-400/30'}
                                            ${isCurrent ? 'ring-4 ring-white/20 scale-110' : ''}
                                        `}>
                                            {index < currentStatusIndex ? <CheckCircle2 size={18} /> : 
                                             isCurrent ? <Loader2 size={18} className="animate-spin" /> : 
                                             <div className="w-2 h-2 rounded-full bg-current" />}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{step}</span>
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                        <div className={`w-12 h-0.5 transition-colors duration-500 ${index < currentStatusIndex ? 'bg-white/50' : 'bg-indigo-400/20'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </ShadowCard>

            {/* Document Requests */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Required Documents</h3>
                </div>

                {transformedDocs.length > 0 ? (
                    <div className="grid gap-6">
                    {transformedDocs.map((group: any) => (
                        <ShadowCard key={group._id} className="p-6 bg-white border border-gray-100 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                <h4 className="font-bold text-gray-900 text-lg">{group.category}</h4>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Single Documents */}
                                {group.documents?.map((doc: any) => (
                                    <ClientDocumentRequest 
                                        key={doc._id} 
                                        requestId={group._id} 
                                        document={doc} 
                                    />
                                ))}

                                {/* Multiple Documents (Parent-Child) */}
                                {group.multipleDocuments?.map((multiDoc: any) => (
                                    <div key={multiDoc._id} className="space-y-3 pl-4 border-l-2 border-gray-50">
                                        <h5 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">{multiDoc.name}</h5>
                                        {multiDoc.multiple?.map((doc: any) => (
                                            <ClientDocumentRequest 
                                                key={doc._id} 
                                                requestId={group._id} 
                                                document={{...doc, name: doc.label}} // Remap label to name for component
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </ShadowCard>
                    ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No documents required at this stage.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncorporationTab;
