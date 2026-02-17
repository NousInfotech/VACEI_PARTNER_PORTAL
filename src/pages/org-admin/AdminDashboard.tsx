import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  PlusCircle, 
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
import { Button } from "../../ui/Button";
import { NoticeBoard } from "./components/NoticeBoard";
import EmployeeManagement from "./employee-management/EmployeeManagement";
import Messages from "../messages/Messages";

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

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Admin Overview
          </h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening in your organization today.</p>
        </div>
      </div>

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
        {/* Left Column: Quick Actions & Getting Started */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <ShadowCard 
                  key={index} 
                  className="group p-8 hover:border-primary/50 cursor-pointer overflow-hidden relative border-none shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => action.path && navigate(action.path)}
                >
                  <div className="space-y-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mt-2">{action.description}</p>
                    </div>
                    <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-2 transition-all duration-300 mt-4">
                      Go to {action.title.split(' ')[1]} <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className={`absolute -right-4 -bottom-4 w-32 h-32 ${action.color} opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-700`} />
                </ShadowCard>
              ))}
            </div>
          </div>

          {/* Simple Guide / Welcome */}
          <ShadowCard className="p-8 bg-linear-to-br from-primary/5 to-transparent border-primary/10">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Get Started with VACEI</h3>
                <p className="text-gray-500 mt-2 leading-relaxed">
                  Start by adding your team members and assigning them to service cycles. 
                  You can track all active engagements and communicate with your dedicated support team through the Messages section.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Button onClick={() => navigate('/dashboard/employees')}>
                    Manage Team
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard/messages')}>
                    View All Projects
                  </Button>
                </div>
              </div>
            </div>
          </ShadowCard>
        </div>

        {/* Right Column: Notice Board & Alerts */}
        <div className="space-y-8">
          <div>
            <NoticeBoard />
          </div>

          <ShadowCard className="p-6 bg-amber-50 border-amber-100 border">
            <div className="flex gap-4">
              <div className="bg-white p-2 rounded-lg shadow-xs h-fit">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Security Tip</h4>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  Always ensure your team members have the correct service assignments to maintain security and compliance standards.
                </p>
              </div>
            </div>
          </ShadowCard>
        </div>
      </div>
    </div>
  );
}
