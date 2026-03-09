import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPatch } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import { useAuth } from "../../../context/auth-context-core";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../ui/Table";
import { Skeleton } from "../../../ui/Skeleton";
import { 
  ShieldCheck, 
  ExternalLink, 
  Briefcase,
  FileText,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "../../../ui/Button";

// Shared Components
import TableSearch from "./components/shared/TableSearch";
import TablePagination from "./components/shared/TablePagination";
import TableEmptyState from "./components/shared/TableEmptyState";

// Engagement Components
import EngagementStatusBadge from "./components/Engagement/EngagementStatusBadge";
import ServiceRequestDialog from "./components/Engagement/ServiceRequestDialog";
import RejectEngagementDialog from "./components/Engagement/RejectEngagementDialog";

interface EngagementListProps {
  companyId: string;
}

const ITEMS_PER_PAGE = 8;

export default function EngagementList({ companyId }: EngagementListProps) {
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectingEngagementId, setRejectingEngagementId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { data: engagementsResponse, isLoading, refetch } = useQuery({
    queryKey: ['company-engagements', companyId, orgId],
    queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_ALL, { 
      companyId,
      organizationId: orgId 
    }),
    enabled: !!companyId && !!orgId
  });

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["service-request", selectedRequestId],
    enabled: !!selectedRequestId,
    queryFn: () => apiGet<{ success: boolean; data: any }>(endPoints.SERVICE_REQUEST.GET_BY_ID(selectedRequestId!)).then(res => res.data),
  });

  const allEngagements = engagementsResponse?.data || [];

  // Filter engagements
  const filteredEngagements = useMemo(() => {
    return allEngagements.filter((engagement: any) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        engagement.name?.toLowerCase().includes(searchStr) ||
        engagement.serviceType?.toLowerCase().includes(searchStr) ||
        engagement.id.toLowerCase().includes(searchStr)
      );
    });
  }, [allEngagements, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEngagements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEngagements = filteredEngagements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewEngagement = (engagementId: string, serviceType: string) => {
    const targetUrl = `/engagement-view/${engagementId}?service=${encodeURIComponent(serviceType)}&tab=dashboard`;
    window.open(targetUrl, `engagement_${engagementId}`)?.focus();
  };

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

  if (isLoading && allEngagements.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableSearch 
        placeholder="Search engagements by name or type..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-gray-100">
                <TableHead className="py-5 pl-8 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Service Type</TableHead>
                <TableHead className="py-5 font-bold text-gray-600 uppercase tracking-widest text-[10px]">Engagement Name</TableHead>
                <TableHead className="py-5 text-center font-bold text-gray-600 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="py-5 pr-8 text-right font-bold text-gray-600 uppercase tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEngagements.length === 0 ? (
                <TableEmptyState 
                  colSpan={4}
                  icon={Briefcase}
                  message="No engagements found"
                />
              ) : (
                paginatedEngagements.map((engagement: any) => (
                  <TableRow key={engagement.id} className="group hover:bg-gray-50/50 transition-colors border-slate-100">
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">{engagement.serviceType.replace(/_/g, ' ')}</p>
                       </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-bold text-gray-600">
                      {engagement.name || 'Annual Filings'}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <EngagementStatusBadge status={engagement.status} />
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
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
                                <span>Form</span>
                              </Button>
                            )}
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-9 gap-1.5 bg-green-600 hover:bg-green-700 rounded-xl px-4 border-none text-white transition-all"
                              onClick={() => handleUpdateStatus(engagement.id, 'ACCEPTED')}
                              disabled={isUpdating === engagement.id}
                            >
                              <CheckCircle2 size={14} />
                              <span>Accept</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-9 gap-1.5 rounded-xl px-4 transition-all"
                              onClick={() => setRejectingEngagementId(engagement.id)}
                              disabled={isUpdating === engagement.id}
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}
                        {(engagement.status === 'ACCEPTED' || engagement.status === 'ACTIVE' || engagement.status === 'COMPLETED') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="rounded-xl font-black text-[11px] uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 gap-2 h-10 px-4"
                            onClick={() => handleViewEngagement(engagement.id, engagement.serviceType)}
                          >
                            <ExternalLink size={16} />
                            View Engagement
                          </Button>
                        )}
                        {['REJECTED', 'CANCELLED'].includes(engagement.status) && (
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

        {totalPages > 1 && (
          <TablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startIndex={startIndex}
            totalItems={filteredEngagements.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="engagements"
          />
        )}
      </div>

      <ServiceRequestDialog 
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        request={request}
        isLoading={loadingRequest}
      />

      <RejectEngagementDialog 
        isOpen={!!rejectingEngagementId}
        onClose={() => setRejectingEngagementId(null)}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirm={() => rejectingEngagementId && handleUpdateStatus(rejectingEngagementId, 'REJECTED', rejectionReason)}
        isUpdating={isUpdating === rejectingEngagementId}
      />
    </div>
  );
}
