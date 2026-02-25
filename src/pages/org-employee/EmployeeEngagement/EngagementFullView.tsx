import React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../../../lib/utils";
import {
  LayoutDashboard,
  FileText,
  Library,
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Activity,
  BookOpen,
  BookMarked,
  PieChart,
  Landmark,
  Building2,
  ShieldCheck,
  ListChecks,
  Plus,
  Eye,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import PillTab from "../../common/PillTab";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTabQuery } from "../../../hooks/useTabQuery";
import { useAuth } from "../../../context/auth-context-core";
import { apiGet, apiPatch } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import PageHeader from "../../common/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../ui/Dialog";
import { ScrollArea } from "../../../ui/scroll-area";
import { LibraryExplorer } from "./library/LibraryExplorer";
import AuditContent from "./audit/AuditContent";
import AccountingContent from "./accounting/AccountingContent";

import VATCycleView from "./status-cycles/VATCycleView";
import PayrollCycleView from "./status-cycles/PayrollCycleView";
import MBRView from "./mbr/MBRView";
import TaxView from "./tax/TaxView";
// import MessagesView from "./messages/MessagesView";
import DocumentRequestsView from "./document-requests/DocumentRequestsView";
import TeamsView from "./teams/TeamsView";
import CFOView from "./cfo/CFOView";
import CSPView from "./csp/CSPView";
import EngagementTodoView from "./EngagementTodoView";
import EngagementUpdatesView from "./updates/EngagementUpdatesView";
import ComplianceView from "./compliance/ComplianceView";
import MilestonesView from "./milestones/MilestonesView";
import CFOEngagementsTable from "./cfo/CFOEngagementsTable";
import CSPCoverageTable from "./csp/CSPCoverageTable";
import ViewCompanySection from "../../common/view-company/ViewCompanySection";
import EngagementChatTab from "./chat/EngagementChatTab";
import AuditChecklist from "./checklist/AuditChecklist";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { ChevronDown, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CreateCycleComponent } from "./components/CreateCycleComponent";
import { MiniChatPreview } from './components/MiniChatPreview';
import { GenericServiceOverview } from "./components/GenericServiceOverview";
import { todoService, TodoListStatus } from "../../../api/todoService";
import { cspService, CSPStatus } from "../../../api/cspService";
import { vatService, VATStatus } from "../../../api/vatService";
import { taxService, TAXStatus } from "../../../api/taxService";
import { mbrService, MBRStatus } from "../../../api/mbrService";
import { payrollService, PayrollStatus } from "../../../api/payrollService";
import { cfoService, CFOStatus } from "../../../api/cfoService";

const ENGAGEMENT_TABS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'requests', label: 'Document Requests', icon: FileText },
  { id: 'audit', label: 'AUDIT', icon: BookOpen },
  { id: 'accounting', label: "BOOKEEPING", icon: BookMarked },
  { id: 'csp', label: 'CSP', icon: Building2 },
  // { id: 'vat', label: 'VAT', icon: Activity },
  // { id: 'tax', label: 'TAX', icon: Landmark },
  // { id: 'mbr', label: 'MBR', icon: PieChart },
  { id: 'payroll', label: 'Payroll', icon: Users },
  // { id: 'cfo', label: 'CFO', icon: TrendingUp },
  // { id: 'audit', label: 'AUDIT', icon: BookOpen },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
  { id: 'todo', label: 'Todo', icon: CheckSquare },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'milestones', label: 'Milestones', icon: Landmark },
  { id: 'updates', label: 'Updates', icon: MessageSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'teams', label: 'Team', icon: Users },
  { id: 'services-coverage', label: 'Services & Coverage', icon: CheckSquare }, 
];


export default function EngagementFullView() {
  const { id: engagementId, serviceId } = useParams();
  const queryClient = useQueryClient();
  const { selectedService, setSelectedService, selectedServiceLabel } = useAuth();
  const [searchParams] = useSearchParams();
  const [showRequestModal, setShowRequestModal] = React.useState(false);

  const serviceFromQuery = searchParams.get("service") ?? undefined;

  React.useEffect(() => {
    const effectiveService = serviceFromQuery ?? serviceId;
    if (effectiveService && effectiveService !== selectedService) {
      setSelectedService(effectiveService);
    }
  }, [serviceFromQuery, serviceId, selectedService, setSelectedService]);

  const serviceName = selectedServiceLabel;

  const initialTab = React.useMemo(() => {
    if (!selectedService) return 'dashboard';
    const serviceMap: Record<string, string> = {
      'ACCOUNTING': 'accounting',
      'AUDITING': 'audit',
      'VAT': 'dashboard', // default to dashboard instead of vat tab
      'PAYROLL': 'payroll',
      'MBR': 'mbr',
      'TAX': 'tax',
      'CFO': 'cfo',
      'CSP': 'csp'
    };
    return serviceMap[selectedService] || 'dashboard';
  }, [selectedService]);

  const [cfoSelectedId, setCfoSelectedId] = React.useState<string | null>(null);
  const [cspSelectedId, setCspSelectedId] = React.useState<string | null>(null);

  const handleCopyAnswer = (answer: any) => {
    const textToCopy = Array.isArray(answer) ? answer.join(', ') : answer;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Answer copied to clipboard");
    } else {
      toast.error("Nothing to copy");
    }
  };

  const [activeTab, setActiveTab] = useTabQuery(initialTab);
  const [showCompanySection, setShowCompanySection] = React.useState(false);

  const toggleCompanySection = () => {
    const newState = !showCompanySection;
    setShowCompanySection(newState);
    if (newState) {
      // Small delay to allow the section to start rendering
      setTimeout(() => {
        const section = document.getElementById('company-details-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const filteredTabs = React.useMemo(() => {
    if (!selectedService) return ENGAGEMENT_TABS;

    const serviceMap: Record<string, string> = {
      'ACCOUNTING':'accounting',
      'AUDITING': 'audit',
      'VAT': 'dashboard', // default to dashboard instead of vat tab
      'PAYROLL': 'payroll',
      'MBR': 'mbr',
      'TAX': 'tax',
      'CFO': 'cfo',
      'CSP': 'csp'
    };

    const activeServiceTab = serviceMap[selectedService];

    const tabs = ENGAGEMENT_TABS.filter(tab => {
      if (['dashboard', 'requests', 'library', 'checklist', 'todo', 'compliance', 'milestones', 'updates', 'chat', 'teams'].includes(tab.id)) {
        return true;
      }
      if (tab.id === 'services-coverage' && (activeServiceTab === 'cfo' || activeServiceTab === 'csp')) {
        return true;
      }
      return tab.id === activeServiceTab;
    });

    return tabs;
  }, [selectedService]);

  const { data: engagementResponse } = useQuery({
    queryKey: ['engagement-view', engagementId],
    enabled: !!engagementId,
    queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)),
  });

  const engagement = engagementResponse?.data || engagementResponse;
  const organizationId = engagement?.organizationId || engagement?.organization?._id;

  const companyId = engagement?.companyId || engagement?.company?.id;

  // Fetch todos for analytics
  const { data: todos = [] } = useQuery({
    queryKey: ['engagement-todos', engagementId],
    queryFn: () => todoService.list(engagementId!),
    enabled: !!engagementId,
  });

  const analytics = React.useMemo(() => {
    if (todos.length === 0) return 0;
    const completed = todos.filter(t => t.status === TodoListStatus.COMPLETED || t.status === TodoListStatus.ACTION_TAKEN).length;
    return Math.round((completed / todos.length) * 100);
  }, [todos]);

  const serviceConfig = React.useMemo(() => {
    if (!selectedService) return null;
    const config: Record<string, any> = {
      'CSP': { service: cspService, statuses: CSPStatus, label: 'CSP' },
      'VAT': { service: vatService, statuses: VATStatus, label: 'VAT' },
      'TAX': { service: taxService, statuses: TAXStatus, label: 'TAX' },
      'MBR': { service: mbrService, statuses: MBRStatus, label: 'MBR' },
      'PAYROLL': { service: payrollService, statuses: PayrollStatus, label: 'Payroll' },
      'CFO': { service: cfoService, statuses: CFOStatus, label: 'CFO' },
    };
    return config[selectedService] || null;
  }, [selectedService]);

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["service-request", engagement?.serviceRequestId],
    enabled: !!engagement?.serviceRequestId && showRequestModal,
    queryFn: () => apiGet<{ success: boolean; data: any }>(endPoints.SERVICE_REQUEST.GET_BY_ID(engagement.serviceRequestId)).then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => 
      apiPatch(endPoints.ENGAGEMENTS.UPDATE_STATUS(engagementId!), { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-view', engagementId] });
      toast.success("Engagement status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'text-green-600 bg-green-50 border-green-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-100';
      case 'TERMINATED': return 'text-gray-600 bg-gray-50 border-gray-100';
      case 'DRAFT': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'ASSIGNED': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return <Activity size={14} />;
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const StatusSelector = () => {
    if (!engagement) return null;
    
    const currentStatus = engagement.status || 'ACTIVE';
    const statusOptions = ['ACTIVE', 'COMPLETED', 'CANCELLED'];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="header" 
            className={cn(
              "h-10 min-w-[160px] justify-between px-4 border shadow-sm transition-all hover:scale-[1.02]", 
              getStatusColor(currentStatus)
            )}
          >
            <div className="flex items-center gap-2.5">
              {getStatusIcon(currentStatus)}
              <span className="font-bold uppercase tracking-wider text-[11px]">{currentStatus}</span>
            </div>
            <ChevronDown size={14} className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-2xl border-gray-100 shadow-2xl">
          <div className="px-2 py-2 mb-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Engagement Status</p>
          </div>
          {statusOptions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => updateStatusMutation.mutate(status)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer mb-1 last:mb-0",
                currentStatus === status ? "bg-primary/5 text-primary" : "hover:bg-gray-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", getStatusColor(status).split(' ')[1])}>
                {getStatusIcon(status)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider">{status}</p>
              </div>
              {currentStatus === status && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const SERVICE_STATUS_STEPS: Record<string, { id: string, label: string }[]> = {
    'PAYROLL': [
      { id: 'DRAFT', label: 'Draft' },
      { id: 'DATA_COLLECTION', label: 'Data Collection' },
      { id: 'CALCULATION_IN_PROGRESS', label: 'Calculation In Progress' },
      { id: 'REVIEW_IN_PROGRESS', label: 'Review In Progress' },
      { id: 'APPROVED', label: 'Approved' },
      { id: 'PROCESSING_PAYMENTS', label: 'Processing Payments' },
      { id: 'PAID', label: 'Paid' },
      { id: 'STATUTORY_FILING', label: 'Statutory Filing' },
      { id: 'COMPLETED', label: 'Completed' },
    ],
    'VAT': [
      { id: 'ACTIVE', label: 'Active' },
      { id: 'RETURN_PENDING', label: 'Return Pending' },
      { id: 'FILED', label: 'Filed' },
      { id: 'PAID', label: 'Paid' },
      { id: 'OVERDUE', label: 'Overdue' },
      { id: 'CLOSED', label: 'Closed' },
    ],
    'TAX': [
      { id: 'DRAFT', label: 'Draft' },
      { id: 'RETURN_PENDING', label: 'Return Pending' },
      { id: 'FILED', label: 'Filed' },
      { id: 'PAID', label: 'Paid' },
      { id: 'UNDER_REVIEW', label: 'Under Review' },
      { id: 'OVERDUE', label: 'Overdue' },
      { id: 'CLOSED', label: 'Closed' },
    ],
    'MBR': [
      { id: 'ACTIVE', label: 'Active' },
      { id: 'ANNUAL_RETURN_PENDING', label: 'Annual Return Pending' },
      { id: 'FILED', label: 'Filed' },
      { id: 'OVERDUE', label: 'Overdue' },
      { id: 'STRUCK_OFF', label: 'Struck Off' },
      { id: 'CLOSED', label: 'Closed' },
    ],
    'CSP': [
      { id: 'ACTIVE', label: 'Active' },
      { id: 'COMPLIANT', label: 'Compliant' },
      { id: 'PENDING_ACTION', label: 'Pending Action' },
      { id: 'OVERDUE', label: 'Overdue' },
      { id: 'SUSPENDED', label: 'Suspended' },
      { id: 'CLOSED', label: 'Closed' },
    ],
    'CFO': [
      { id: 'ACTIVE', label: 'Active' },
      { id: 'REPORTING', label: 'Reporting' },
      { id: 'ON_HOLD', label: 'On Hold' },
      { id: 'COMPLETED', label: 'Completed' },
      { id: 'TERMINATED', label: 'Terminated' },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        <PageHeader
          className="relative z-30"
          title={engagement ? (engagement.name ?? engagement.companyName) : `${serviceName} Dashboard`}
          subtitle={engagement ? `${serviceName} Dashboard` : undefined}
          actions={
            <div className="flex items-center gap-3">
                <StatusSelector />
              {organizationId && (
                
                <Button
                  variant="header"
                  onClick={toggleCompanySection}
                >
                  <Building2 size={14} />
                  {showCompanySection ? "Hide Company" : "View Company"}
                </Button>
              )}
            
              {engagement?.serviceRequestId && (
                <Button
                  variant="header"
                  onClick={() => setShowRequestModal(true)}
                >
                  <FileText size={14} />
                  Request Form
                </Button>
              )}
              <Button variant="header" onClick={() => window.close()}>
                Close View
              </Button>
            </div>
          }
        />


        {!showCompanySection && (
          <div className="w-full overflow-hidden flex items-center animate-in fade-in duration-300">
            <PillTab
              tabs={filteredTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        )}

        {showCompanySection ? (
          <div className="mt-6 md:mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <ViewCompanySection
              companyId={engagement?.companyId}
              engagementId={engagementId}
            />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' ? (
              <div className="flex flex-col gap-6 md:gap-8">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-indigo-500/5 overflow-hidden group">
                  <div className="flex flex-col lg:flex-row">
                    {/* Main Stats */}
                    <div className="flex-1 p-8 lg:p-10 relative">
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl transition-all duration-500 group-hover:scale-110" />
                      
                      <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-5">
                          <div className="p-4 rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-sm">
                            <TrendingUp className="h-7 w-7" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Engagement Dashboard</h2>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Overview & Analytics</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-end justify-between px-1">
                            <div>
                              <p className="text-4xl font-black text-gray-900 tracking-tighter">{analytics}%</p>
                              <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mt-1">Overall Progress</p>
                            </div>
                            <div className="text-right flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Updates</span>
                            </div>
                          </div>

                          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 shadow-inner group/progress">
                            <div
                              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                              style={{ width: `${analytics}%` }}
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/progress:animate-shimmer" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                            <p className="text-lg font-black text-gray-900">{todos.filter(t => t.status === TodoListStatus.COMPLETED).length} <span className="text-xs font-bold text-gray-400">Tasks</span></p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                            <p className="text-lg font-black text-primary">{todos.filter(t => t.status !== TodoListStatus.COMPLETED).length} <span className="text-xs font-bold text-gray-400">Tasks</span></p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                            <p className={cn("text-lg font-black uppercase tracking-tight", getStatusColor(engagement?.status || 'Active').split(' ')[0])}>
                              {engagement?.status || 'Active'}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Health</p>
                            <p className="text-lg font-black text-primary">Stable</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Activity / Chat Preview Right Panel */}
                    <div className="w-full lg:w-80 bg-gray-50/50 border-l border-gray-100 p-6 flex flex-col min-h-[200px]">
                      <MiniChatPreview 
                        engagementId={engagementId!} 
                        chatRoomId={engagement?.chatRoomId}
                        onViewAll={() => setActiveTab('chat')}
                      />
                    </div>
                  </div>
                </div>
 
                {selectedService && !['ACCOUNTING', 'AUDITING'].includes(selectedService) && serviceConfig && (
                  <GenericServiceOverview
                    engagementId={engagementId!}
                    serviceName={serviceConfig.label}
                    serviceApi={serviceConfig.service}
                    statusSteps={SERVICE_STATUS_STEPS[selectedService] || []}
                  />
                )}

                {serviceConfig && (
                  <CreateCycleComponent
                    serviceName={serviceConfig.label}
                    engagementId={engagementId!}
                    companyId={companyId!}
                    service={serviceConfig.service}
                    statuses={serviceConfig.statuses}
                  />
                )}

                <div className="h-px bg-gray-200/50 w-full my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-150">
                  {selectedService && (
                    <button 
                      onClick={() => setActiveTab(initialTab)}
                      className="group bg-primary p-8 rounded-[32px] border border-primary shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 text-left relative overflow-hidden lg:col-span-3 lg:flex lg:items-center lg:justify-between"
                    >
                      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl transition-all duration-700 group-hover:scale-125" />
                      
                      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 w-full">
                        <div className="p-5 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl">
                          {filteredTabs.find(t => t.id === initialTab)?.icon ? 
                            React.createElement(filteredTabs.find(t => t.id === initialTab)!.icon!, { size: 40 }) : 
                            <Activity size={40} />
                          }
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="text-2xl font-black text-white tracking-tight">Manage {serviceName} Operations</h4>
                          <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">Access cycles, status tracking, and reporting</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-3 text-white font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                          Enter Module
                        </div>
                      </div>
                    </button>
                  )}
                </div>

              </div>
            ) : activeTab === 'library' ? (
              <LibraryExplorer engagementId={engagementId ?? undefined} />
            ) : activeTab === 'audit' ? (
              <AuditContent engagementId={engagementId ?? undefined} />
            ) : activeTab === 'accounting' ? (
              <AccountingContent engagementId={engagementId ?? undefined} companyId={companyId ?? undefined} />
            ) : activeTab === 'vat' ? (
              <VATCycleView />
            ) : activeTab === 'payroll' ? (
              <PayrollCycleView />
            ) : activeTab === 'mbr' ? (
              <MBRView />
            ) : activeTab === 'tax' ? (
              <TaxView />
            ) : activeTab === 'cfo' ? (
              <CFOView selectedId={cfoSelectedId} />
            ) : activeTab === 'csp' ? (
              <CSPView selectedId={cspSelectedId} engagementId={engagementId!} companyId={companyId!} />
            ) : activeTab === 'services-coverage' ? (
              selectedService === 'CFO' ? (
                <CFOEngagementsTable selectedId={cfoSelectedId} onSelect={setCfoSelectedId} />
              ) : selectedService === 'CSP' ? (
                <CSPCoverageTable selectedId={cspSelectedId} onSelect={setCspSelectedId} />
              ) : (
                <div className="p-8 text-center text-gray-500">Select CFO or CSP to view services.</div>
              )
            ) : activeTab === 'updates' ? (
              <EngagementUpdatesView engagementId={engagementId ?? undefined} />
            ) : activeTab === 'chat' ? (
              <EngagementChatTab engagementId={engagementId || ''} companyId={engagement?.companyId} chatRoomId={engagement?.chatRoomId} />
            ) : activeTab === 'teams' ? (
              <TeamsView engagementId={engagementId ?? undefined} />
            ) : activeTab === 'checklist' ? (
              <AuditChecklist engagementId={engagementId} />
            ) : activeTab === 'todo' ? (
              <EngagementTodoView engagementId={engagementId} service={engagement?.service} />
            ) : activeTab === 'compliance' ? (
              <ComplianceView engagementId={engagementId ?? undefined} />
            ) : activeTab === 'milestones' ? (
              <MilestonesView engagementId={engagementId ?? undefined} />
            ) : activeTab === 'requests' ? (
              <DocumentRequestsView engagementId={engagementId ?? undefined} />
            ) : (
              <ShadowCard className="p-10 md:p-20 flex flex-col items-center justify-center text-center bg-gray-50/10 border-dashed min-h-[400px]">
                <div className="p-8 bg-white shadow-sm rounded-full mb-8 text-gray-300 transform transition-transform hover:scale-110 duration-500">
                  {activeTab === 'requests' && <FileText className="h-20 w-20" />}
                  {activeTab === 'todo' && <CheckSquare className="h-20 w-20" />}
                  {activeTab === 'teams' && <Users className="h-20 w-20" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-secondary">
                  {filteredTabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-gray-500 max-w-md mt-4 text-lg">
                  This module is being prepared for your specific engagement type.
                  Full functionality will be available shortly.
                </p>
                <div className="mt-10 flex gap-4">
                  <div className="h-2 w-2 bg-primary/20 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce delay-75" />
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce delay-150" />
                </div>
              </ShadowCard>
            )}
          </>
        )}
      </div>

      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[40px] border-none shadow-2xl bg-white">
          <DialogHeader className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <FileText size={24} />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900 font-primary">Service Request Details</DialogTitle>
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
                    <p className="text-sm font-bold text-slate-900">{request.service?.replace(/_/g, ' ')}</p>
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
                    {[...(request.generalDetails || []), ...(request.serviceDetails || [])].map((item: any, idx: number) => (
                      <div key={idx} className="space-y-3 group text-left">
                        <h5 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors flex items-start gap-3">
                          <span className="text-primary/40 font-black tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                          {item.question}
                        </h5>
                        <div className="pl-9 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl shadow-sm min-h-12">
                              {Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || <span className="text-slate-300 italic">No response</span>}
                            </div>
                            {item.answer && (
                              <button
                                onClick={() => handleCopyAnswer(item.answer)}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-md transition-all shrink-0"
                                title="Copy Answer"
                              >
                                <Copy size={16} />
                              </button>
                            )}
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
             <Button onClick={() => setShowRequestModal(false)} className="px-8 rounded-xl bg-slate-900 text-white">
               Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
