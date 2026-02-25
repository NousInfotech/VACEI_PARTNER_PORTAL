import { useState } from 'react';
import { Building2, PenLine, Download, CheckCircle2 } from 'lucide-react';
import { ShadowCard } from '../../../../../ui/ShadowCard';
import { Button } from '../../../../../ui/Button';
import { cn } from '../../../../../lib/utils';
import { PayrollCycleStatus } from '../types';
import ChangeStatusDialog from './ChangeStatusDialog';
import { payrollService } from '../../../../../api/payrollService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ORG_STATUS_STEPS = [
    { id: PayrollCycleStatus.DRAFT, label: 'Draft' },
    { id: PayrollCycleStatus.DATA_COLLECTION, label: 'Data Collection' },
    { id: PayrollCycleStatus.CALCULATION_IN_PROGRESS, label: 'Calculating' },
    { id: PayrollCycleStatus.REVIEW_IN_PROGRESS, label: 'Review' },
    { id: PayrollCycleStatus.APPROVED, label: 'Approved' },
    { id: PayrollCycleStatus.PROCESSING_PAYMENTS, label: 'Processing' },
    { id: PayrollCycleStatus.PAID, label: 'Paid' },
    { id: PayrollCycleStatus.STATUTORY_FILING, label: 'Filing' },
    { id: PayrollCycleStatus.COMPLETED, label: 'Completed' },
];

interface PayrollStatusTimelineProps {
    currentCycle: any; // Using any for now to match current local data structure
    engagementId: string;
    onUpdate?: () => void;
}

export default function PayrollStatusTimeline({ currentCycle, engagementId, onUpdate }: PayrollStatusTimelineProps) {
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const currentStepIndex = currentCycle?.status 
        ? ORG_STATUS_STEPS.findIndex(s => s.id === currentCycle.status)
        : -1;

    const updateStatusMutation = useMutation({
        mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
            payrollService.updateStatus(currentCycle?.id, status, reason),
        onSuccess: () => {
            toast.success('Status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['service-cycles', 'Payroll', engagementId] });
            if (onUpdate) onUpdate();
        },
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    return (
        <ShadowCard className="p-6">
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Payroll Run: {currentCycle?.period || currentCycle?.periodStart || 'Unknown Period'}</h3>
                        <p className="text-sm text-gray-500">{currentCycle?.employeeCount || 0} Employees • Total: €{(currentCycle?.totalSalaries || 0).toLocaleString()}</p>
                    </div>
                </div>
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                    currentCycle?.status === PayrollCycleStatus.COMPLETED ? "bg-green-100 text-green-700" :
                        currentCycle?.status === PayrollCycleStatus.CLARIFICATION_NEEDED ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                )}>
                    {currentCycle?.status?.replace(/_/g, " ") || 'Unknown'}
                </span>
            </div>

            {/* Timeline */}
            <div className="relative mb-12 px-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (ORG_STATUS_STEPS.length - 1)) * 100}%` }}
                />

                <div className="relative flex justify-between w-full">
                    {ORG_STATUS_STEPS.map((step, index) => {
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
                <Button variant="outline" className="gap-2">
                    <Download size={16} />
                    Download Summary
                </Button>
                <Button
                    variant="outline"
                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setIsStatusDialogOpen(true)}
                >
                    <PenLine size={16} />
                    Update Status
                </Button>
                {currentCycle.status === PayrollCycleStatus.REVIEW_IN_PROGRESS && (
                    <Button 
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => updateStatusMutation.mutate({ status: PayrollCycleStatus.APPROVED })}
                        isLoading={updateStatusMutation.isPending}
                    >
                        <CheckCircle2 size={16} />
                        Approve Payroll
                    </Button>
                )}
            </div>

            <ChangeStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                currentStatus={currentCycle.status}
                onStatusChange={(newStatus) => updateStatusMutation.mutate({ status: newStatus })}
                statusOptions={Object.values(PayrollCycleStatus).map(s => ({ value: s, label: s.replace(/_/g, " ") }))}
                title="Update Payroll Status"
            />
        </ShadowCard>
    );
}
