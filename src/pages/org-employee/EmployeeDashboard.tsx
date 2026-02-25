import { useQuery } from "@tanstack/react-query";
import {
  Users,
  MessageSquare,
  FileText,
  CheckCircle2,
  Search,
  // Filter,
  Activity
} from "lucide-react";
import { ShadowCard } from "../../ui/ShadowCard";
import { PageHeader } from "../common/PageHeader";
import { Skeleton } from "../../ui/Skeleton";
import { useAuth } from "../../context/auth-context-core";
import { cn } from "../../lib/utils";
import EmployeeCompliance from "./EmployeeCompliance";
import Engagement from "./EmployeeEngagement/Engagement";
import Messages from "../messages/Messages";
import { NoticeBoard } from "../common/NoticeBoard";


const MOCK_CLIENTS = [
  { id: 1, name: "Acme Corp", lastMessage: "Can we review the Q4 audit?", status: "online", sector: "Technology" },
  { id: 2, name: "Global Logistics", lastMessage: "Documents uploaded for VAT", status: "offline", sector: "Shipping" },
  { id: 3, name: "Bistro Malta", lastMessage: "Payroll details for Jan", status: "online", sector: "Hospitality" },
  { id: 4, name: "Nexus AI", lastMessage: "Ready for CFO consultation", status: "online", sector: "Technology" },
];

interface EmployeeDashboardProps {
  activeSection?: string;
}

export default function EmployeeDashboard({ activeSection = "Dashboard" }: EmployeeDashboardProps) {
  const { selectedService, selectedServiceLabel } = useAuth();

  const { isLoading: loading } = useQuery({
    queryKey: ['employee-dashboard', activeSection, selectedService],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
  });

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
                  { label: "Active Companies", value: "24", icon: Users, color: "blue", trend: "+12%" },
                  { label: "Open Engagements", value: "12", icon: Activity, color: "orange", trend: "+5%" },
                  { label: "Internal Tasks", value: "48", icon: CheckCircle2, color: "green", trend: "-2%" },
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
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full",
                        stat.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      )}>
                        {stat.trend}
                      </span>
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

          {/* Side Feedback/Chat List Area */}
          <div className="space-y-8">
            <ShadowCard className="overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="font-bold">Recent Chats</h2>
                  </div>
                  {loading ? (
                    <Skeleton className="h-5 w-16 rounded-full" />
                  ) : (
                    <span className="bg-primary text-light text-[10px] font-bold px-2 py-1 rounded-full">
                      {MOCK_CLIENTS.length} Active
                    </span>
                  )}
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  MOCK_CLIENTS.map((client) => (
                    <button key={client.id} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left group">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {client.name.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${client.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-sm text-gray-900 truncate">{client.name}</p>
                          <span className="text-[10px] text-gray-400">2m ago</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{client.lastMessage}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button className="w-full p-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-t border-gray-50">
                View All Messages
              </button>
            </ShadowCard>

            {/* Quick Actions/Shortcuts */}

          </div>
        </div>
      ) : activeSection === "Compliance" ? (
        <EmployeeCompliance />
      ) : activeSection === "Messages" ? (
        <Messages />
      ) : activeSection === "Engagements" ? (
        <Engagement />
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
