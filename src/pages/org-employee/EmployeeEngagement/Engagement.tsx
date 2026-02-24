import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, 
  Briefcase, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  FileText,
} from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { useAuth } from "../../../context/auth-context-core";
import { apiGet, apiPatch } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import PageHeader from "../../common/PageHeader";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../ui/Table";
import { Badge } from "../../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../ui/Dialog";
import { ScrollArea } from "../../../ui/scroll-area";

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
  const { user, organizationMember } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectingEngagementId, setRejectingEngagementId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["employee-engagements", organizationMember?.organizationId],
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

  const engagements = data as OrgEngagement[];

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
    const targetUrl = `/engagement-view/${engagement.id}?service=${encodeURIComponent(engagement.serviceType)}`;
    const targetName = `engagement_view_${engagement.id}`;
    const win = window.open(targetUrl, targetName);
    if (win) win.focus();
  };

  if (user?.role !== "ORG_ADMIN") {
    return null;
  }

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
      <PageHeader 
        title="Engagements" 
        subtitle="Manage and view all your organization's engagements" 
      />

      <ShadowCard className="overflow-hidden border border-gray-100 bg-white shadow-sm rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="py-4 font-bold text-slate-900 border-none">Company Name</TableHead>
              <TableHead className="py-4 font-bold text-slate-900 border-none">Service Type</TableHead>
              <TableHead className="py-4 font-bold text-slate-900 border-none">Status</TableHead>
              <TableHead className="py-4 font-bold text-slate-900 text-right pr-8 border-none">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell className="text-right pr-8"><Skeleton className="h-8 w-32 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : engagements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Briefcase className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">No engagements found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              engagements.map((engagement) => (
                <TableRow key={engagement.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-semibold text-slate-900 py-4">
                    {engagement.name ?? engagement.companyName}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="bg-slate-50 font-medium text-slate-600 border-slate-200">
                      {engagement.serviceType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={getStatusColor(engagement.status) as any} className="uppercase tracking-wider text-white px-2.5 py-0.5">
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
                              onClick={() => setSelectedRequestId(engagement.serviceRequestId)}
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
      </ShadowCard>

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
