import { useQuery } from '@tanstack/react-query';
import ServiceStatusTimeline from './ServiceStatusTimeline';

interface GenericServiceOverviewProps {
    engagementId: string;
    serviceName: string;
    serviceApi: any;
    statusSteps: { id: string; label: string }[];
}

export function GenericServiceOverview({ 
    engagementId, 
    serviceName, 
    serviceApi, 
    statusSteps 
}: GenericServiceOverviewProps) {
    const { data: cycles } = useQuery({
        queryKey: ['service-cycles', serviceName, engagementId],
        queryFn: () => serviceApi.getAll(engagementId),
        enabled: !!engagementId && !!serviceApi,
    });

    
    // Find the current active cycle
    // Data structure might be { data: [...] } or just [...]
    const cycleList = (cycles as any)?.data || (Array.isArray(cycles) ? cycles : []);
    const currentCycle = cycleList[0]; // Assuming the most recent/active one is first

    if (!currentCycle) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 px-1">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Active {serviceName} Cycle</h3>
            </div>
            <ServiceStatusTimeline 
                currentCycle={currentCycle} 
                engagementId={engagementId} 
                serviceName={serviceName}
                statusSteps={statusSteps}
                updateStatusFn={(id, status, reason) => serviceApi.updateStatus(id, status, reason)}
            />
        </div>
    );
}
