import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../../context/auth-context-core";
import { apiGet, apiPatch } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import PageHeader from "../../common/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../ui/Dialog";
import { ScrollArea } from "../../../ui/scroll-area";
import { Skeleton } from "../../../ui/Skeleton";
import { Button } from "../../../ui/Button";
import { Eye } from "lucide-react";
import OrgAdminEngagement from "./OrgAdminEngagement";
import OrgEmployeeEngagement from "./OrgEmployeeEngagement";

interface OrgEngagement {
  id: string;
  companyName: string;
  name: string | null;
  serviceType: string;
  status: string;
  serviceRequestId: string | null;
}

interface OrgEngagementResponse {
  data: OrgEngagement[];
  total: number;
  page: number;
  limit: number;
}

interface ServiceRequest {
  id: string;
  companyName?: string;
  service: string;
  status: string;
  createdAt: string;
  generalDetails: any[];
  serviceDetails: any[];
  submittedDocuments: any[];
}

export default function Engagement() {
  const { user, organizationMember, selectedService } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectingEngagementId, setRejectingEngagementId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["employee-engagements", organizationMember?.organizationId, selectedService],
    enabled: !!hasToken && !!organizationMember?.organizationId,
    queryFn: async () => {
      if (!organizationMember?.organizationId) return [];
      const response = await apiGet<OrgEngagementResponse>(endPoints.ENGAGEMENTS.GET_ALL, {
        organizationId: organizationMember.organizationId,
        page: 1,
        limit: 100,
      });
      return response.data ?? [];
    },
  });

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["service-request", selectedRequestId],
    enabled: !!selectedRequestId,
    queryFn: () => apiGet<{ success: boolean; data: ServiceRequest }>(endPoints.SERVICE_REQUEST.GET_BY_ID(selectedRequestId!)).then(res => res.data),
  });

  const engagements = (data as OrgEngagement[] || []).filter(e => {
    if (user?.role === 'ORG_ADMIN') return true;
    const isEmployeeActionable = ['ACCEPTED', 'ACTIVE', 'COMPLETED'].includes(e.status);
    return isEmployeeActionable && (!selectedService || e.serviceType === selectedService);
  });

  const handleUpdateStatus = async (engagementId: string, status: string, reason?: string) => {
    setIsUpdating(engagementId);
    try {
      const payload: any = { status };
      if (reason) payload.reason = reason;
      await apiPatch(endPoints.ENGAGEMENTS.UPDATE_STATUS(engagementId), payload);
      refetch();
      setRejectingEngagementId(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewDetails = (engagement: OrgEngagement) => {
    const targetUrl = `/engagement-view/${engagement.id}?service=${encodeURIComponent(engagement.serviceType)}&tab=dashboard`;
    const targetName = `engagement_view_${engagement.id}`;
    const win = window.open(targetUrl, targetName);
    if (win) win.focus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'default';
      case 'ACCEPTED': return 'secondary';
      case 'REJECTED': return 'destructive';
      case 'ACTIVE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {user?.role === 'ORG_ADMIN' && (
        <PageHeader 
          title="Engagements" 
          subtitle="Manage and view all your organization's engagements" 
        />
      )}

      {user?.role === 'ORG_ADMIN' ? (
        <OrgAdminEngagement 
          engagements={data as OrgEngagement[] || []}
          loading={loading}
          handleUpdateStatus={handleUpdateStatus}
          setSelectedRequestId={setSelectedRequestId}
          setRejectingEngagementId={setRejectingEngagementId}
          isUpdating={isUpdating}
          handleViewDetails={handleViewDetails}
          getStatusColor={getStatusColor}
        />
      ) : (
        <OrgEmployeeEngagement 
          engagements={engagements}
          loading={loading}
          handleUpdateStatus={handleUpdateStatus}
          setSelectedRequestId={setSelectedRequestId}
          setRejectingEngagementId={setRejectingEngagementId}
          isUpdating={isUpdating}
          handleViewDetails={handleViewDetails}
          getStatusColor={getStatusColor}
        />
      )}

      <Dialog open={!!selectedRequestId} onOpenChange={() => setSelectedRequestId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[40px] border-none shadow-2xl">
          <DialogHeader className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <FileText size={24} />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Service Request Details</DialogTitle>
                        <p className="text-sm text-gray-500 font-medium">Review the formal request from the client</p>
                    </div>
                </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-10 py-8">
            {loadingRequest ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-32 w-full rounded-3xl" />
              </div>
            ) : request ? (
              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</p>
                    <p className="text-sm font-bold text-slate-900">{request.service.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    Form Responses
                  </h4>
                  <div className="grid gap-8">
                    {[...(request.generalDetails || []), ...(request.serviceDetails || [])].map((item, idx) => (
                      <div key={idx} className="space-y-3 group text-left">
                        <h5 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors flex items-start gap-3">
                          <span className="text-primary/40 font-black tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                          {item.question}
                        </h5>
                        <div className="pl-9">
                          <div className="text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl shadow-sm min-h-12">
                            {Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || <span className="text-slate-300 italic">No response</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {request.submittedDocuments && request.submittedDocuments.length > 0 && (
                  <div className="space-y-6 pb-6">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <div className="h-6 w-1 bg-primary rounded-full" />
                      Supporting Documents
                    </h4>
                    <div className="grid gap-3">
                      {request.submittedDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl text-primary shadow-sm group-hover:shadow-md transition-all">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">{doc.file_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Attachment</p>
                            </div>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                          >
                            <Eye size={14} />
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center">
                 <p className="text-slate-400 font-medium">Request details not available.</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="px-10 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-end shrink-0">
             <Button onClick={() => setSelectedRequestId(null)} className="px-8 rounded-xl bg-slate-900 text-white">
               Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rejectingEngagementId} onOpenChange={() => setRejectingEngagementId(null)}>
        <DialogContent className="max-w-md flex flex-col p-8 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <DialogHeader className="p-0 mb-6">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <XCircle size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Reject Engagement</DialogTitle>
                <p className="text-sm text-gray-500 font-medium">Please provide a reason for rejection</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <textarea
              className="w-full h-32 p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all outline-none resize-none text-sm font-medium"
              placeholder="Enter reason here..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            
            <div className="flex gap-3 justify-end pt-2">
              <Button 
                variant="outline" 
                onClick={() => setRejectingEngagementId(null)}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => rejectingEngagementId && handleUpdateStatus(rejectingEngagementId, 'REJECTED', rejectionReason)}
                disabled={!rejectionReason.trim() || isUpdating === rejectingEngagementId}
                className="rounded-xl px-8"
              >
                {isUpdating === rejectingEngagementId ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
