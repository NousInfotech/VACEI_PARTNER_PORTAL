import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  Search,
  Filter,
  Plus,
  Activity
} from "lucide-react";
import { Button } from "../../ui/Button";
import { ShadowCard } from "../../ui/ShadowCard";
import { Select } from "../../ui/Select";
import { PageHeader } from "../common/PageHeader";
import { Skeleton } from "../../ui/Skeleton";
import { useAuth } from "../../context/auth-context-core";
import { cn } from "../../lib/utils";
import EmployeeCompliance from "./EmployeeCompliance";
import Engagement from "./EmployeeEngagement/Engagement";
import Messages from "../messages/Messages";
 
 
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
            <Button variant="header" className="rounded-xl">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
            <Button variant="header" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> New Request
            </Button>
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

            {/* Analytics Section */}
            <ShadowCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Performance Analytics</h2>
                    <p className="text-sm text-gray-500">Service delivery vs. Target</p>
                  </div>
                </div>
                {loading ? (
                    <Skeleton className="h-10 w-32 rounded-xl" />
                ) : (
                    <Select 
                      label="Last 30 Days"
                      items={[
                        { id: '30d', label: 'Last 30 Days', onClick: () => {} },
                        { id: '6m', label: 'Last 6 Months', onClick: () => {} },
                        { id: '1y', label: 'This Year', onClick: () => {} },
                      ]}
                    />
                )}
              </div>
              
              <div className="relative h-64 bg-gray-50/0 rounded-2xl overflow-hidden group/graph">
                {loading ? (
                    <Skeleton className="w-full h-full rounded-2xl" />
                ) : (
                    <>
                        {/* CSS for Drawing Animation */}
                        <style>{`
                          @keyframes drawLine {
                            from { stroke-dashoffset: 1200; }
                            to { stroke-dashoffset: 0; }
                          }
                          .animate-draw {
                            stroke-dasharray: 1200;
                            stroke-dashoffset: 1200;
                            animation: drawLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                          }
                          @keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                          }
                          .animate-fade-up {
                            animation: fadeInUp 1s ease-out forwards;
                          }
                        `}</style>

                        {/* SVG Graph */}
                        <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          {[0, 50, 100, 150].map((y) => (
                            <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                          ))}

                          {/* Area Fill */}
                          <path
                            d="M 0 200 L 0 120 C 100 120, 150 40, 200 60 C 250 80, 300 160, 400 140 C 500 120, 550 40, 600 30 C 650 20, 750 150, 850 130 C 950 110, 1000 80, 1000 80 L 1000 200 Z"
                            fill="url(#chartGradient)"
                            className="opacity-0 animate-[fadeIn_1.5s_ease-out_0.5s_forwards]"
                          />

                          {/* Line */}
                          <path
                            d="M 0 120 C 100 120, 150 40, 200 60 C 250 80, 300 160, 400 140 C 500 120, 550 40, 600 30 C 650 20, 750 150, 850 130 C 950 110, 1000 80, 1000 80"
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-draw"
                          />

                          {/* Interactive Points */}
                          {[
                            { x: 200, y: 60, val: "65", delay: '0.8s' },
                            { x: 400, y: 140, val: "45", delay: '1s' },
                            { x: 600, y: 30, val: "90", delay: '1.2s' },
                            { x: 850, y: 130, val: "60", delay: '1.4s' }
                          ].map((pt, i) => (
                            <g key={i} className="cursor-pointer group/pt opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style={{ animationDelay: pt.delay }}>
                              <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke="#6366f1" strokeWidth="3" className="drop-shadow-sm" />
                              <circle cx={pt.x} cy={pt.y} r="15" fill="#6366f1" fillOpacity="0" className="group-hover/pt:fill-opacity-10 transition-all duration-300" />
                              
                              {/* Tooltip on hover */}
                              <g className="opacity-0 group-hover/pt:opacity-100 transition-opacity duration-300">
                                <rect x={pt.x - 20} y={pt.y - 35} width="40" height="20" rx="6" fill="#0f1729" />
                                <text x={pt.x} y={pt.y - 21} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{pt.val}%</text>
                              </g>
                            </g>
                          ))}
                        </svg>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-2 left-0 w-full flex justify-between px-6 text-[10px] font-bold text-gray-400 capitalize tracking-wider animate-fade-up">
                          {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'].map((label, i) => (
                            <span key={i} className="hover:text-primary transition-colors cursor-default">{label}</span>
                          ))}
                        </div>
                    </>
                )}
              </div>
            </ShadowCard>
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
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${
                            client.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
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
