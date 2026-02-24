import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../../../../api/payrollService';
import PayrollStatusTimeline from '../status-cycles/components/PayrollStatusTimeline';
import { Skeleton } from '../../../../ui/Skeleton';

interface PayrollOverviewProps {
    engagementId: string;
}

export function PayrollOverview({ engagementId }: PayrollOverviewProps) {
    const { data: cycles, isLoading } = useQuery({
        queryKey: ['service-cycles', 'Payroll', engagementId],
        queryFn: () => payrollService.getAll(engagementId),
    });

    if (isLoading) return <Skeleton className="h-64 w-full rounded-[32px]" />;
    
    // Find the most recent active cycle
    const currentCycle = (cycles as any)?.data?.[0] || (Array.isArray(cycles) ? cycles[0] : null); 

    if (!currentCycle) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Active Payroll Cycle</h3>
            <PayrollStatusTimeline currentCycle={currentCycle} engagementId={engagementId} />
        </div>
    );
}
