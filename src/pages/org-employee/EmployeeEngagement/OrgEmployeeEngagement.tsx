import { ArrowRight, Briefcase, FileText, CheckCircle2, XCircle } from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { Badge } from "../../../ui/badge";
import { cn } from "../../../lib/utils";

interface OrgEngagement {
  id: string;
  companyName: string;
  name: string | null;
  serviceType: string;
  status: string;
  serviceRequestId: string | null;
}

interface OrgEmployeeEngagementProps {
  engagements: OrgEngagement[];
  loading: boolean;
  handleUpdateStatus: (id: string, status: string) => void;
  setSelectedRequestId: (id: string | null) => void;
  setRejectingEngagementId: (id: string | null) => void;
  isUpdating: string | null;
  handleViewDetails: (engagement: OrgEngagement) => void;
  getStatusColor: (status: string) => string;
}

export default function OrgEmployeeEngagement({
  engagements,
  loading,
  handleUpdateStatus,
  setSelectedRequestId,
  setRejectingEngagementId,
  isUpdating,
  handleViewDetails,
  getStatusColor,
}: OrgEmployeeEngagementProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        [1, 2, 3].map((i) => (
          <ShadowCard key={i} className="p-6 space-y-4 rounded-2xl border border-gray-100">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </ShadowCard>
        ))
      ) : engagements.length === 0 ? (
        <div className="col-span-full py-20 bg-white border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">No engagements found</p>
          <p className="text-gray-400 text-sm mt-1">Your assigned engagements will appear here</p>
        </div>
      ) : (
        engagements.map((engagement) => (
          <ShadowCard key={engagement.id} className="p-6 group hover:shadow-xl transition-all duration-300 border border-gray-50 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                  {engagement.name ?? engagement.companyName}
                </h3>
                <Badge 
                  variant={getStatusColor(engagement.status) as any} 
                  className={cn(
                    "uppercase tracking-wider text-[10px] px-2.5 py-0.5 shrink-0",
                    ['ACTIVE', 'ASSIGNED', 'REJECTED'].includes(engagement.status) && "border-primary text-primary bg-white hover:bg-white"
                  )}
                >
                  {engagement.status.replace(/_/g, " ")}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-slate-50 font-medium text-slate-600 border-slate-200">
                  <FileText size={12} className="mr-1" />
                  {engagement.serviceType.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex flex-col gap-2">
                {engagement.status === 'ASSIGNED' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 rounded-xl border-none text-white h-10"
                      onClick={() => handleUpdateStatus(engagement.id, 'ACCEPTED')}
                      disabled={isUpdating === engagement.id}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Accept
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full rounded-xl h-10"
                      onClick={() => setRejectingEngagementId(engagement.id)}
                      disabled={isUpdating === engagement.id}
                    >
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {(engagement.status === 'ACCEPTED' || engagement.status === 'ACTIVE' || engagement.status === 'COMPLETED') && (
                  <Button
                    onClick={() => handleViewDetails(engagement)}
                    className="w-full gap-2 rounded-xl bg-slate-900 font-bold hover:bg-slate-800 text-white h-11"
                  >
                    View Details
                    <ArrowRight size={18} />
                  </Button>
                )}

                {engagement.status === 'ASSIGNED' && engagement.serviceRequestId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-10 mt-1"
                    onClick={() => setSelectedRequestId(engagement.serviceRequestId)}
                  >
                    <FileText size={16} />
                    Review Request
                  </Button>
                )}
                
                {!['ASSIGNED', 'ACCEPTED', 'ACTIVE', 'COMPLETED'].includes(engagement.status) && (
                  <p className="text-center text-xs text-slate-400 italic">No actions available</p>
                )}
              </div>
            </div>
          </ShadowCard>
        ))
      )}
    </div>
  );
}
