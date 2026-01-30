import { FileText, CheckCircle2, Clock, Send } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";

interface MBRManagementCardProps {
    status: 'Approved' | 'Pending' | 'Submitted';
}

export default function MBRManagementCard({ status }: MBRManagementCardProps) {
    const getStatusParams = (status: string) => {
        switch (status) {
            case 'Approved': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' };
            case 'Submitted': return { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' };
            default: return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' };
        }
    };

    const { icon: StatusIcon, color, bg } = getStatusParams(status);

    return (
        <ShadowCard className="p-6 h-full flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <FileText size={24} />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${bg} ${color}`}>
                        <StatusIcon size={14} />
                        {status.toUpperCase()}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">MBR Management</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Manage MBR documents and workflow for GlobalTech Annual Audit.
                </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Last updated: 2 hours ago</span>
                <span className="font-medium text-gray-600">ID: #MBR-2024-001</span>
            </div>
        </ShadowCard>
    );
}
