import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  CheckCircle2,
  Activity,
  ArrowRight,
  Settings
} from "lucide-react";
import { ShadowCard } from "../../ui/ShadowCard";
import { PageHeader } from "../common/PageHeader";
import { Skeleton } from "../../ui/Skeleton";
import { useAuth } from "../../context/auth-context-core";
import { useOrganizationAnalytics } from "../../hooks/useOrganizationAnalytics";
import { cn } from "../../lib/utils";
import EmployeeCompliance from "./EmployeeCompliance";
import Engagement from "./EmployeeEngagement/Engagement";
import Messages from "../messages/Messages";
import { NoticeBoard } from "../common/NoticeBoard";
import TemplateManagement from "./template-management/TemplateManagement";
import CreateTemplateForm from "./template-management/CreateTemplateForm";
import EditTemplateForm from "./template-management/EditTemplateForm";
import ViewTemplateDetail from "./template-management/ViewTemplateDetail";




interface EmployeeDashboardProps {
  activeSection?: string;
}

export default function EmployeeDashboard({ activeSection = "Dashboard" }: EmployeeDashboardProps) {
  const { selectedServiceLabel } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } = useOrganizationAnalytics();
  const loading = analyticsLoading;
  const navigate = useNavigate();

  const quickActions = [
    { 
      title: "View Engagements", 
      description: "Manage active projects", 
      icon: Activity, 
      path: "/dashboard/engagements", 
      color: "bg-indigo-600"
    },
    { 
      title: "Template Management", 
      description: "Manage templates", 
      icon: FileText, 
      path: "/dashboard/templates", 
      color: "bg-emerald-600"
    },
    { 
      title: "Messages", 
      description: "View messages", 
      icon: FileText, 
      path: "/dashboard/messages", 
      color: "bg-emerald-600"
    },
    { 
      title: "System Settings", 
      description: "Configure portal preferences", 
      icon: Settings, 
      path: "/dashboard/settings", 
      color: "bg-amber-600"
    }
  ];

  return (
    <div className="mx-auto space-y-8">
      {/* Header Section */}
      <PageHeader
        title={`${selectedServiceLabel} ${activeSection}`}
        subtitle={`Manage your ${selectedServiceLabel.toLowerCase()} ${activeSection.toLowerCase()} and clients`}
        actions={
          <div className="flex items-center gap-3">
            {/* <Button variant="header" className="rounded-xl">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button> */}
            {/* <Button variant="header" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> New Request
            </Button> */}
          </div>
        }
      />

      {activeSection === "Dashboard" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <ShadowCard key={i} className="p-6 border-none shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </ShadowCard>
                ))
              ) : (
                [
                  { label: "Active Companies", value: String(analytics.companies), icon: Users, color: "blue" as const },
                  { label: "Open Engagements", value: String(analytics.engagements), icon: Activity, color: "orange" as const },
                  { label: "Internal Tasks", value: String(analytics.checklists), icon: CheckCircle2, color: "green" as const },
                ].map((stat, i) => (
                  <ShadowCard key={i} className="p-6 group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "p-3 rounded-2xl group-hover:scale-110 transition-transform",
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                          stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                            'bg-green-50 text-green-600'
                      )}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                    </div>
                  </ShadowCard>
                ))
              )}
            </div>

            {/* Notice Board */}
            <div className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
              <NoticeBoard />
            </div>

            {/* Performance Analytics Section - Commented out */}


          </div>

          {/* Side Feedback/Quick Actions Area */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {quickActions.map((action, index) => (
                  <ShadowCard 
                    key={index} 
                    className="group p-6 hover:border-primary/50 cursor-pointer overflow-hidden relative border-none shadow-sm hover:shadow-xl transition-all duration-300"
                    onClick={() => action.path && navigate(action.path)}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{action.title}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${action.color} opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-700`} />
                  </ShadowCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSection === "Compliance" ? (
        <EmployeeCompliance />
      ) : activeSection === "Messages" ? (
        <Messages />
      ) : activeSection === "Engagements" ? (
        <Engagement />
      ) : activeSection === "Templates" ? (
        <TemplateManagement />
      ) : activeSection === "Create Template" ? (
        <CreateTemplateForm />
      ) : activeSection === "Edit Template" ? (
        <EditTemplateForm />
      ) : activeSection === "View Template" ? (
        <ViewTemplateDetail />
      ) : (
        <ShadowCard className="p-20 flex flex-col items-center justify-center text-center">
          <div className="p-6 bg-gray-50 rounded-full mb-6 text-gray-400">
            <FileText className="h-16 w-16" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{activeSection} Section</h2>
          <p className="text-gray-500 max-w-md mt-2">
            This module is currently being optimized for the {selectedServiceLabel} service.
            Check back soon for the full feature set.
          </p>
        </ShadowCard>
      )}
    </div>
  );
}
