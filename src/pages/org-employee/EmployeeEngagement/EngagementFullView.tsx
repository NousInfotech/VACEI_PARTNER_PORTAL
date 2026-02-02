import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Library,
  CheckSquare,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  MoreVertical,
  Activity,
  CheckCircle2,
  BookOpen,
  PieChart,
  Landmark,
} from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import PillTab from "../../common/PillTab";
import { useParams } from "react-router-dom";
import { useTabQuery } from "../../../hooks/useTabQuery";
import { useAuth } from "../../../context/auth-context-core";
import { cn } from "../../../lib/utils";
import PageHeader from "../../common/PageHeader";
import { LibraryExplorer } from "./library/LibraryExplorer";
import AuditContent from "./audit/AuditContent";

import VATCycleView from "./status-cycles/VATCycleView";
import PayrollCycleView from "./status-cycles/PayrollCycleView";
import MBRView from "./mbr/MBRView";
import TaxView from "./tax/TaxView";
import MessagesView from "./messages/MessagesView";
import TeamsView from "./teams/TeamsView";

const ENGAGEMENT_TABS = [
  { id: 'dashboard', label: 'Engagement Dashboard', icon: LayoutDashboard },
  { id: 'requests', label: 'Document Requests', icon: FileText },
  { id: 'audit', label: 'AUDIT', icon: BookOpen },
  { id: 'vat', label: 'VAT', icon: Activity },
  { id: 'payroll', label: 'Payroll', icon: Users },
  { id: 'mbr', label: 'MBR', icon: PieChart },
  { id: 'tax', label: 'TAX', icon: Landmark },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'todo', label: 'Todo/Checklists', icon: CheckSquare },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'teams', label: 'Teams (Read Only)', icon: Users },
];

const MOCK_DEADLINES = [
  { id: 1, title: 'Quarterly VAT Filing', date: 'Oct 24, 2024', priority: 'High', status: 'Pending' },
  { id: 2, title: 'Annual Financial Audit', date: 'Nov 12, 2024', priority: 'Medium', status: 'In Review' },
  { id: 3, title: 'Employee Tax Forms', date: 'Dec 05, 2024', priority: 'Low', status: 'Not Started' },
];

const MOCK_STATUS = {
  overall: 75,
  stages: [
    { name: 'Onboarding', status: 'Completed', date: 'Sep 10, 2024' },
    { name: 'Data Collection', status: 'In Progress', date: 'Oct 01, 2024' },
    { name: 'Analysis', status: 'Pending', date: '-' },
    { name: 'Reporting', status: 'Pending', date: '-' },
  ]
};

export default function EngagementFullView() {
  const { serviceId } = useParams();
  const { selectedService, setSelectedService } = useAuth();

  React.useEffect(() => {
    if (serviceId && serviceId !== selectedService) {
      setSelectedService(serviceId);
    }
  }, [serviceId, selectedService, setSelectedService]);

  const serviceName = selectedService?.replace(/_/g, " ") || 'Engagement';

  const initialTab = React.useMemo(() => {
    if (!selectedService) return 'dashboard';
    const serviceMap: Record<string, string> = {
      'AUDITING': 'audit',
      'VAT': 'vat',
      'PAYROLL': 'payroll',
      'MBR': 'mbr',
      'TAX': 'tax'
    };
    return serviceMap[selectedService] || 'dashboard';
  }, [selectedService]);

  const [activeTab, setActiveTab] = useTabQuery(initialTab);

  const filteredTabs = React.useMemo(() => {
    if (!selectedService) return ENGAGEMENT_TABS;

    const serviceMap: Record<string, string> = {
      'AUDITING': 'audit',
      'VAT': 'vat',
      'PAYROLL': 'payroll',
      'MBR': 'mbr',
      'TAX': 'tax'
    };

    const activeServiceTab = serviceMap[selectedService];

    return ENGAGEMENT_TABS.filter(tab => {
      if (['dashboard', 'requests', 'library', 'todo', 'messages', 'teams'].includes(tab.id)) {
        return true;
      }
      return tab.id === activeServiceTab;
    });
  }, [selectedService]);

  const { isLoading: loading } = useQuery({
    queryKey: ['engagement-view', activeTab],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        <PageHeader
          title={`${serviceName} Dashboard`}
          actions={
            <Button variant="header" onClick={() => window.close()}>
              Close View
            </Button>
          }
        />

        <div className="w-full overflow-hidden flex items-center">
          <PillTab
            tabs={filteredTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <ShadowCard className="p-5 md:p-8 group relative overflow-hidden">
                {loading ? (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl transition-all duration-500 group-hover:scale-110" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 md:p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                          <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div>
                          <h2 className="text-lg md:text-xl font-bold text-gray-900 font-secondary leading-tight">Engagement Analytics</h2>
                          <p className="text-xs md:text-sm text-gray-500">Overall progress and efficiency metrics</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        <span className="text-2xl md:text-3xl font-bold text-primary">{MOCK_STATUS.overall}%</span>
                        <span className="text-xs md:text-sm text-gray-400 font-medium">Completed</span>
                      </div>
                    </div>

                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-12 group/progress">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                        style={{ width: `${MOCK_STATUS.overall}%` }}
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/progress:animate-shimmer" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      {MOCK_STATUS.stages.map((stage, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 transition-all hover:shadow-md group/item">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110",
                              stage.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                stage.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                            )}>
                              {stage.status === 'Completed' ? <CheckCircle2 size={18} /> :
                                stage.status === 'In Progress' ? <Activity size={18} /> :
                                  <Clock size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{stage.name}</p>
                              <p className="text-[11px] text-gray-500">{stage.date}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-lg",
                            stage.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              stage.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          )}>
                            {stage.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ShadowCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {loading ? (
                  [1, 2].map((i) => (
                    <ShadowCard key={i} className="p-6 space-y-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </ShadowCard>
                  ))
                ) : (
                  <>
                    <ShadowCard className="p-5 md:p-6 border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <Users size={18} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">Assigned Team</h3>
                      <p className="text-sm text-gray-500 mb-4">Professional experts handling your account</p>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((_, i) => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                          +2
                        </div>
                      </div>
                    </ShadowCard>

                    <ShadowCard className="p-5 md:p-6 border-l-4 border-l-orange-500 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                          <AlertCircle size={18} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">Compliance Health</h3>
                      <p className="text-sm text-gray-500 mb-4">Current compliance rating based on activities</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="text-sm font-bold text-orange-600">Good</span>
                      </div>
                    </ShadowCard>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <ShadowCard className="overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="font-bold text-gray-900">Upcoming Deadlines</h2>
                  </div>
                  {loading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {MOCK_DEADLINES.length} Action Items
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="p-4 space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                        <Skeleton className="h-3 w-48" />
                      </div>
                    ))
                  ) : (
                    MOCK_DEADLINES.map((deadline) => (
                      <div key={deadline.id} className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">{deadline.title}</h4>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            deadline.priority === 'High' ? 'bg-red-50 text-red-600' :
                              deadline.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          )}>
                            {deadline.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{deadline.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              deadline.status === 'Pending' ? 'bg-orange-400' :
                                deadline.status === 'In Review' ? 'bg-blue-400' : 'bg-gray-400'
                            )} />
                            <span>{deadline.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button className="w-full p-4 text-xs font-bold text-primary hover:bg-primary/5 transition-colors border-t border-gray-50 flex items-center justify-center gap-2 group">
                  View Full Schedule
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </ShadowCard>

              <ShadowCard className="p-6 bg-linear-to-br from-primary to-primary/80 text-white relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Live Support Available</h3>
                  <p className="text-white/80 text-sm mb-6">Need help with your {serviceName.toLowerCase()}? Our experts are online and ready to assist you.</p>
                  <Button variant="outline" className="w-full bg-white text-primary border-white hover:bg-gray-50 rounded-xl font-bold py-6">
                    Contact Manager
                  </Button>
                </div>
              </ShadowCard>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          <LibraryExplorer />
        ) : activeTab === 'audit' ? (
          <AuditContent />
        ) : activeTab === 'vat' ? (
          <VATCycleView />
        ) : activeTab === 'payroll' ? (
          <PayrollCycleView />
        ) : activeTab === 'mbr' ? (
          <MBRView />
        ) : activeTab === 'tax' ? (
          <TaxView />
        ) : activeTab === 'messages' ? (
          <MessagesView />
        ) : activeTab === 'teams' ? (
          <TeamsView />
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
      </div>
    </div>
  );
}
