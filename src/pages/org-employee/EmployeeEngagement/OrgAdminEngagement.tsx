import { useState, useMemo } from "react";
import { 
  ArrowRight, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal,
  Filter
} from "lucide-react";
import React from "react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { Badge } from "../../../ui/badge";
import { cn } from "../../../lib/utils";
import { Input } from "../../../ui/input";
import { Select } from "../../../ui/Select";
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

const ITEMS_PER_PAGE = 8;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter engagements
  const filteredEngagements = useMemo(() => {
    return engagements.filter((engagement) => {
      const nameMatch = (engagement.name ?? engagement.companyName)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "ALL" || engagement.status === statusFilter;
      const serviceMatch = serviceFilter === "ALL" || engagement.serviceType === serviceFilter;
      return nameMatch && statusMatch && serviceMatch;
    });
  }, [engagements, searchTerm, statusFilter, serviceFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEngagements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEngagements = filteredEngagements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serviceFilter]);

  const statusOptions = [
    { id: "ALL", label: "All Statuses" },
    { id: "ASSIGNED", label: "Assigned" },
    { id: "ACCEPTED", label: "Accepted" },
    { id: "ACTIVE", label: "Active" },
    { id: "REJECTED", label: "Rejected" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  const serviceOptions = [
    { id: "ALL", label: "All Services" },
    { id: "ACCOUNTING", label: "Accounting" },
    { id: "AUDIT", label: "Audit" },
    { id: "VAT", label: "VAT" },
    { id: "TAX", label: "Tax" },
    { id: "PAYROLL", label: "Payroll" },
    { id: "MBR", label: "MBR" },
    { id: "CFO", label: "CFO" },
    { id: "CSP", label: "CSP" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or company..." 
            className="pl-11 h-11 bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100 min-w-[150px]">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <Select 
              trigger={
                <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-full justify-between text-slate-600">
                  <span className="truncate">{statusOptions.find(o => o.id === statusFilter)?.label}</span>
                  <ChevronDown size={14} className="text-slate-300 shrink-0" />
                </button>
              }
              items={statusOptions.map(opt => ({
                id: opt.id,
                label: opt.label,
                onClick: () => setStatusFilter(opt.id)
              }))}
              contentClassName="rounded-2xl border-slate-100 shadow-xl"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100 min-w-[150px]">
            <Filter size={14} className="text-slate-400" />
            <Select 
              trigger={
                <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-full justify-between text-slate-600">
                  <span className="truncate">{serviceOptions.find(o => o.id === serviceFilter)?.label}</span>
                  <ChevronDown size={14} className="text-slate-300 shrink-0" />
                </button>
              }
              items={serviceOptions.map(opt => ({
                id: opt.id,
                label: opt.label,
                onClick: () => setServiceFilter(opt.id)
              }))}
              contentClassName="rounded-2xl border-slate-100 shadow-xl"
            />
          </div>
        </div>
      </div>

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
              ) : paginatedEngagements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Briefcase className="h-10 w-10 text-slate-200 mb-3" />
                      <p className="text-slate-500 font-medium">No engagements found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEngagements.map((engagement) => (
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
                        {(engagement.status === 'ACCEPTED' || engagement.status === 'ACTIVE' || engagement.status === 'COMPLETED') && (
                          <Button
                            onClick={() => handleViewDetails(engagement)}
                            className="h-9 gap-2 rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800 text-white"
                          >
                            <span>View Engagement</span>
                            <ArrowRight size={14} />
                          </Button>
                        )}
                        {(engagement.status !== 'ASSIGNED' && engagement.status !== 'ACCEPTED' && engagement.status !== 'ACTIVE' && engagement.status !== 'COMPLETED') && (
                          <span className="text-xs text-slate-400 italic">No actions available</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50 bg-slate-50/30">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredEngagements.length)}</span> of <span className="text-slate-900">{filteredEngagements.length}</span> engagements
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl border-slate-200"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={30} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 rounded-xl font-bold",
                      currentPage === page ? "bg-primary text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl border-slate-200"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </ShadowCard>
    </div>
  );
}
