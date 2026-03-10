import React from 'react';
import { 
  Building2, 
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { Badge } from '@/ui/badge';
import type { ServiceRequest } from '../../../../types/service-request-template';

interface RequestCardProps {
  request: ServiceRequest;
  activeDropdownId: string | null;
  setActiveDropdownId: (id: string | null) => void;
  onView: (request: ServiceRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  activeDropdownId,
  setActiveDropdownId,
  onView,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT': return { variant: 'gray' as const, icon: Clock };
      case 'SUBMITTED': return { variant: 'primary' as const, icon: Clock };
      case 'IN_REVIEW': return { variant: 'primary' as const, icon: AlertCircle };
      case 'APPROVED': return { variant: 'success' as const, icon: CheckCircle2 };
      case 'REJECTED': return { variant: 'danger' as const, icon: XCircle };
      default: return { variant: 'gray' as const, icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="group p-5 bg-white border border-gray-100 hover:border-gray-400 transition-all duration-300 rounded-[28px] grid grid-cols-12 items-center gap-4">
      <div className="col-span-4 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/5 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-md font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight uppercase tracking-tight">
            {request.company?.name || 'Unknown Company'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <User className="h-3 w-3" />
            <span>{request.clientId.split('-')[0]}</span>
          </div>
        </div>
      </div>

      <div className="col-span-3 flex flex-col items-start gap-1">
        <Badge >Service Type</Badge>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-xs font-bold leading-none uppercase tracking-tight">
            {request.service.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="col-span-2 flex flex-col items-start gap-1">
        <Badge >Status</Badge>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          request.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 
          request.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
          request.status === 'IN_REVIEW' || request.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
        }`}>
          <StatusIcon className="h-3 w-3" />
          {request.status.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="col-span-3 flex justify-end items-center gap-2">
        <div className="flex flex-col items-end gap-1 mr-4">
          <Badge >Submitted</Badge>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px] font-bold">{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Button
          onClick={() => onView(request)}
          variant="secondary"
          className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 border-none transition-all group/btn"
          title="View Request"
        >
          <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
        </Button>

        <div className="relative dropdown-trigger">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdownId(activeDropdownId === request.id ? null : request.id);
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeDropdownId === request.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 rotate-90' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {activeDropdownId === request.id && (
            <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
              <button
                onClick={() => onView(request)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors group/item"
              >
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover/item:bg-indigo-100 transition-colors">
                  <Eye className="h-4 w-4" />
                </div>
                View Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
