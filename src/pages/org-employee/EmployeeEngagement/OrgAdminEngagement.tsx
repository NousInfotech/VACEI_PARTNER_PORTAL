import { ArrowRight, Briefcase, FileText, CheckCircle2, XCircle } from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { Badge } from "../../../ui/badge";
import { cn } from "../../../lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../ui/Table";

interface OrgEngagement {
  id: string;
  companyName: string;
  name: string | null;
  serviceType: string;
  status: string;
  serviceRequestId: string | null;
}

interface OrgAdminEngagementProps {
  engagements: OrgEngagement[];
  loading: boolean;
  handleUpdateStatus: (id: string, status: string) => void;
  setSelectedRequestId: (id: string | null) => void;
  setRejectingEngagementId: (id: string | null) => void;
  isUpdating: string | null;
  handleViewDetails: (engagement: OrgEngagement) => void;
  getStatusColor: (status: string) => string;
}

export default function OrgAdminEngagement({
  engagements,
  loading,
  handleUpdateStatus,
  setSelectedRequestId,
  setRejectingEngagementId,
  isUpdating,
  handleViewDetails,
  getStatusColor,
}: OrgAdminEngagementProps) {
  return (
    <ShadowCard className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-xl shadow-slate-200/50">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase tracking-widest text-[10px] py-5 pl-8">Engagement Name</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase tracking-widest text-[10px] py-5">Service Type</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase tracking-widest text-[10px] py-5">Status</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase tracking-widest text-[10px] py-5 text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell className="py-4 pl-8"><Skeleton className="h-5 w-48 rounded-md" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                  <TableCell className="py-4 text-right pr-8"><Skeleton className="h-9 w-24 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : engagements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Briefcase className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">No engagements found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              engagements.map((engagement) => (
                <TableRow key={engagement.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-semibold text-slate-900 py-4 pl-8">
                    {engagement.name ?? engagement.companyName}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="bg-slate-50 font-medium text-slate-600 border-slate-200">
                      {engagement.serviceType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={getStatusColor(engagement.status) as any} 
                      className={cn(
                        "uppercase tracking-wider text-[10px] px-2.5 py-0.5",
                        ['ACTIVE', 'ASSIGNED', 'REJECTED'].includes(engagement.status) && "border-primary text-primary bg-white hover:bg-white"
                      )}
                    >
                      {engagement.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {engagement.status === 'ASSIGNED' && (
                        <>
                          {engagement.serviceRequestId && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl"
                              onClick={() => setSelectedRequestId(engagement.serviceRequestId!)}
                            >
                              <FileText size={14} />
                              <span>Request Form</span>
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-9 gap-1.5 bg-green-600 hover:bg-green-700 rounded-xl px-4 border-none text-white"
                            onClick={() => handleUpdateStatus(engagement.id, 'ACCEPTED')}
                            disabled={isUpdating === engagement.id}
                          >
                            <CheckCircle2 size={14} />
                            <span>Accept</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-9 gap-1.5 rounded-xl px-4"
                            onClick={() => setRejectingEngagementId(engagement.id)}
                            disabled={isUpdating === engagement.id}
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}
                      {(engagement.status === 'ACCEPTED' || engagement.status === 'ACTIVE') && (
                        <Button
                          onClick={() => handleViewDetails(engagement)}
                          className="h-9 gap-2 rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800 text-white"
                        >
                          <span>View Engagement</span>
                          <ArrowRight size={14} />
                        </Button>
                      )}
                      {(engagement.status !== 'ASSIGNED' && engagement.status !== 'ACCEPTED' && engagement.status !== 'ACTIVE') && (
                        <span className="text-xs text-slate-400 italic">No actions available</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ShadowCard>
  );
}
