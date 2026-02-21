import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  ShieldCheck,
  LayoutDashboard, 
  ArrowRight,
  UserPlus,
  Briefcase
} from "lucide-react";
import { apiGet } from "../../config/base";
import { endPoints } from "../../config/endPoint";
import { useAuth } from "../../context/auth-context-core";
import { type ApiResponse } from "../../lib/types";

import { ShadowCard } from "../../ui/ShadowCard";
import { Skeleton } from "../../ui/Skeleton";
import { NoticeBoard } from "../common/NoticeBoard";
import { PageHeader } from "../common/PageHeader";
import EmployeeManagement from "./employee-management/EmployeeManagement";
import Engagement from "../org-employee/EmployeeEngagement/Engagement";
import Messages from "../messages/Messages";
import ProcedurePromptList from "./procedure-prompt/ProcedurePromptList";
import CreateProcedurePrompt from "./procedure-prompt/CreateProcedurePrompt";
import EditProcedurePrompt from "./procedure-prompt/EditProcedurePrompt";

interface AdminDashboardProps {
  activeSection?: string;
}

export default function AdminDashboard({ activeSection }: AdminDashboardProps) {
  const navigate = useNavigate();
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;

  // Fetch Employees Count
  const { data: employeesResponse, isLoading: loadingEmployees } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => apiGet<ApiResponse<unknown[]>>(endPoints.ORGANIZATION.GET_MEMBERS, { organizationId: orgId }),
    enabled: !!orgId
  });

  // Fetch Engagements Count
  const { data: engagementsResponse, isLoading: loadingEngagements } = useQuery({
    queryKey: ['org-engagements', orgId],
    queryFn: () => apiGet<ApiResponse<unknown[]>>(endPoints.ENGAGEMENTS.GET_ALL, { organizationId: orgId }),
    enabled: !!orgId
  });

  const loading = loadingEmployees || loadingEngagements;

  const stats = [
    { 
      label: "Total Employees", 
      value: employeesResponse?.meta?.total || employeesResponse?.data?.length || "0", 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Active Engagements", 
      value: engagementsResponse?.meta?.total || engagementsResponse?.data?.length || "0", 
      icon: ShieldCheck, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "Assigned Services", 
      value: organizationMember?.allowedServices?.length || "0", 
      icon: Briefcase, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
  ];

  const quickActions = [
    { 
      title: "Add Employee", 
      description: "Onboard new team member", 
      icon: UserPlus, 
      path: "/dashboard/employees", // Assuming sidebar handles this or navigate logic
      color: "bg-primary",
      action: () => {} // If we need specific modal triggers
    },
    { 
      title: "View Engagements", 
      description: "Manage active projects", 
      icon: Briefcase, 
      path: "/dashboard/messages", // Messages acts as engagement hub in some views, or update path
      color: "bg-indigo-600"
    }
  ];

  if (activeSection === "Employees") {
    return <EmployeeManagement />;
  }

  if (activeSection === "Messages") {
    return <Messages />;
  }

  if (activeSection === "Engagements") {
    return <Engagement />;
  }

  if (activeSection === "Procedure Prompt") {
    return <ProcedurePromptList />;
  }

  if (activeSection === "Create Procedure Prompt") {
    return <CreateProcedurePrompt />;
  }

  if (activeSection === "Edit Procedure Prompt") {
    return <EditProcedurePrompt />;
  }

  return (
    <div className="space-y-8 mx-auto">
      <PageHeader
        title="Admin Overview"
        subtitle="Welcome back! Here's what's happening in your organization today."
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ShadowCard key={i} className="p-6 flex items-center gap-4 border-none shadow-sm">
              <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </ShadowCard>
          ))
        ) : (
          stats.map((stat, index) => (
            <ShadowCard key={index} className="p-6 flex items-center gap-4 hover:translate-y-[-4px] transition-transform cursor-default border-none shadow-sm hover:shadow-md">
              <div className={`p-4 rounded-2xl ${stat.bg} shrink-0`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </ShadowCard>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Notice Board */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
            <NoticeBoard />
          </div>
        </div>

        {/* Right Column: Quick Actions */}
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

    </div>
  );
}
