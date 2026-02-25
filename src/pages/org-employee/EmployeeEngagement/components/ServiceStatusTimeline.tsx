import { useState } from 'react';
import { Activity, PenLine } from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Button } from '../../../../ui/Button';
import { cn } from '../../../../lib/utils';
import ChangeStatusDialog from '../status-cycles/components/ChangeStatusDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface StatusStep {
    id: string;
    label: string;
}

interface ServiceStatusTimelineProps {
    currentCycle: any;
    engagementId: string;
    serviceName: string;
    statusSteps: StatusStep[];
    updateStatusFn: (id: string, status: string, reason?: string) => Promise<any>;
    onUpdate?: () => void;
}

export default function ServiceStatusTimeline({ 
    currentCycle, 
    engagementId, 
    serviceName, 
    statusSteps,
    updateStatusFn,
    onUpdate 
}: ServiceStatusTimelineProps) {
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const currentStepIndex = currentCycle?.status 
        ? statusSteps.findIndex(s => s.id === currentCycle.status)
        : -1;

    const currentStepLabel = currentCycle?.status 
        ? statusSteps.find(s => s.id === currentCycle.status)?.label 
        : currentCycle?.status?.replace(/_/g, " ");

    const updateStatusMutation = useMutation({
        mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
            updateStatusFn(currentCycle?.id, status, reason),
        onSuccess: () => {
            toast.success('Status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['service-cycles', serviceName, engagementId] });
            if (onUpdate) onUpdate();
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update status');
        }
    });

    return (
        <ShadowCard className="p-6">
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{serviceName} Cycle: {currentCycle?.period || currentCycle?.id?.slice(0, 8) || 'Active Cycle'}</h3>
                        <p className="text-sm text-gray-500">
                            {currentCycle?.id ? `ID: ${currentCycle.id}` : 'Current active service period'}
                        </p>
                    </div>
                </div>
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                    currentCycle?.status?.includes('COMPLETED') ? "bg-green-100 text-green-700" :
                        currentCycle?.status?.includes('CLARIFICATION') || currentCycle?.status?.includes('OVERDUE') ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                )}>
                    {currentStepLabel}
                </span>
            </div>

            {/* Timeline */}
            <div className="relative mb-12 px-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
                />

                <div className="relative flex justify-between w-full">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default relative">
                                <div className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center border-2 z-10 transition-all bg-white",
                                    isCompleted ? "bg-blue-500 border-blue-500" : "border-gray-200",
                                    isCurrent && "ring-4 ring-blue-50 scale-125"
                                )} />
                                <div className="absolute -bottom-8 flex flex-col items-center w-20 text-center">
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap",
                                        isCompleted ? "text-blue-600" : "text-gray-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Button
                    variant="outline"
                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setIsStatusDialogOpen(true)}
                >
                    <PenLine size={16} />
                    Update Status
                </Button>
            </div>

            <ChangeStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                currentStatus={currentCycle.status}
                onStatusChange={(newStatus) => updateStatusMutation.mutate({ status: newStatus })}
                statusOptions={statusSteps.map(s => ({ value: s.id, label: s.label }))}
                title={`Update ${serviceName} Status`}
            />
        </ShadowCard>
    );
}
