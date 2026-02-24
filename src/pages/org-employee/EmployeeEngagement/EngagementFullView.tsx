import React from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import PillTab from "../../common/PillTab";
import { useParams, useSearchParams } from "react-router-dom";
import { useTabQuery } from "../../../hooks/useTabQuery";
import { useAuth } from "../../../context/auth-context-core";
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import PageHeader from "../../common/PageHeader";
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
import { CreateCycleComponent } from "./components/CreateCycleComponent";
import { PayrollOverview } from "./components/PayrollOverview";
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
  { id: 'vat', label: 'VAT', icon: Activity },
  { id: 'tax', label: 'TAX', icon: Landmark },
  { id: 'mbr', label: 'MBR', icon: PieChart },
  { id: 'payroll', label: 'Payroll', icon: Users },
  { id: 'cfo', label: 'CFO', icon: TrendingUp },
  { id: 'audit', label: 'AUDIT', icon: BookOpen },
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
  const [searchParams] = useSearchParams();
  const { selectedService, setSelectedService, selectedServiceLabel } = useAuth();

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

  React.useEffect(() => {
    if (engagement) {
      console.log('EngagementFullView: Loaded engagement', engagement);
    }
  }, [engagement]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        <PageHeader
          title={engagement ? (engagement.name ?? engagement.companyName) : `${serviceName} Dashboard`}
          subtitle={engagement ? `${serviceName} Dashboard` : undefined}
          actions={
            <div className="flex items-center gap-3">
              {organizationId && (
                <Button
                  variant="header"
                  onClick={toggleCompanySection}
                >
                  <Building2 size={14} />
                  {showCompanySection ? "Hide Company" : "View Company"}
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
                            <p className="text-lg font-black text-green-600">Active</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Health</p>
                            <p className="text-lg font-black text-primary">Stable</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions / Summary Right Panel */}
                    <div className="w-full lg:w-80 bg-gray-50/50 border-l border-gray-100 p-8 flex flex-col justify-center">
                      <div className="space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Quick Summary</h4>
                          <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
                            "This engagement is currently on track. Complete remaining {todos.filter(t => t.status !== TodoListStatus.COMPLETED).length} tasks to reach 100% compliance."
                          </p>
                        </div>
                        <div className="h-px bg-gray-200/50 w-full" />
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full h-11 rounded-xl shadow-lg shadow-primary/10 font-bold text-xs"
                            onClick={() => setActiveTab('requests')}
                          >
                            Add Documents
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full h-11 rounded-xl font-bold text-xs text-gray-400 hover:text-primary"
                            onClick={() => setActiveTab('todo')}
                          >
                            View Checklist
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
 
                {selectedService === 'PAYROLL' && (
                   <div className="space-y-6">
                      <PayrollOverview engagementId={engagementId!} />
                   </div>
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
                  {/* Document Requests Card */}
                  <button 
                    onClick={() => setActiveTab('requests')}
                    className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary">
                        <Plus size={16} />
                      </div>
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="p-4 rounded-2xl bg-primary/5 text-primary w-fit border border-primary/10">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">Document Requests</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Files & Compliance</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</span>
                        <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">Action Required</span>
                      </div>
                    </div>
                  </button>

                  {/* Team / Workforce Card */}
                  <button 
                    onClick={() => setActiveTab('teams')}
                    className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 text-left relative overflow-hidden"
                  >
                    <div className="relative z-10 space-y-6">
                      <div className="p-4 rounded-2xl bg-primary/5 text-primary w-fit border border-primary/10">
                        <Users size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">Team Management</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Members & Roles</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Members</span>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">8 Members</span>
                      </div>
                    </div>
                  </button>

                  {/* Todo / Checklist Card */}
                  <button 
                    onClick={() => setActiveTab('todo')}
                    className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 text-left relative overflow-hidden"
                  >
                    <div className="relative z-10 space-y-6">
                      <div className="p-4 rounded-2xl bg-primary/5 text-primary w-fit border border-primary/10">
                        <CheckSquare size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">Action Items</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Tasks & Milestones</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Remaining</span>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                          {todos.filter(t => t.status !== TodoListStatus.COMPLETED).length} Items
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Lifecycle Specific Card (VAT/Payroll/etc) */}
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
    </div>
  );
}
