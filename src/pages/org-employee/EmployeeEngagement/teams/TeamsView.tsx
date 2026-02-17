import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Mail, Phone, Shield, UserPlus, Info } from "lucide-react";
import { ShadowCard } from "../../../../ui/ShadowCard";
import { Skeleton } from "../../../../ui/Skeleton";
import { Button } from "../../../../ui/Button";
import { useAuth } from "../../../../context/auth-context-core";
import { apiGet } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";
import { type ApiResponse } from "../../../../lib/types";
import CreateTeamModal from "./components/CreateTeamModal";

interface EngagementOrgTeamMember {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
}

interface EngagementDetail {
  id: string;
  name: string | null;
  orgTeam: EngagementOrgTeamMember[];
  libraryFolderId: string | null;
  companyName: string;
  serviceType: string;
  status: string;
}

export default function TeamsView({ engagementId }: { engagementId?: string }) {
    const { user, selectedService, selectedServiceLabel } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const isAdmin = user?.role === "ORG_ADMIN" || localStorage.getItem("userRole") === "ORG_ADMIN";
    const serviceName = selectedServiceLabel || selectedService?.replace(/_/g, " ") || "Engagement";

    const { data: response, isLoading } = useQuery({
        queryKey: ["engagement-team", engagementId],
        enabled: !!engagementId,
        queryFn: async () => {
            if (!engagementId) return null;
            return apiGet<ApiResponse<EngagementDetail>>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId));
        },
    });

    const engagement = response?.data ?? null;
    const teamMembers = engagement?.orgTeam ?? [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShadowCard className="p-0 overflow-hidden border border-gray-100 bg-white shadow-sm">
                {/* Header Section */}
                <div className="p-8 border-b border-gray-50 bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <Users className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-secondary leading-tight">
                                    {serviceName} TEAM
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    A dedicated team of experts assigned to manage your organization's engagement.
                                </p>
                            </div>
                        </div>

                        {isAdmin && (
                            <Button 
                                onClick={() => setIsModalOpen(true)}
                                className="rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 px-6 py-6"
                            >
                                <UserPlus size={18} />
                                {teamMembers.length > 0 ? "Manage Team" : "Create Team"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Team Grid */}
                <div className="p-8 bg-gray-50/30 min-h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <ShadowCard key={i} className="p-6 space-y-4 border-none shadow-sm">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                </ShadowCard>
                            ))}
                        </div>
                    ) : teamMembers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {teamMembers.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold shadow-xs transition-transform group-hover:scale-110 duration-500">
                                            {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:text-primary transition-colors">
                                            <Shield size={16} />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors duration-300">
                                            {member.fullName}
                                        </h3>
                                        <p className="text-primary font-bold text-[11px] uppercase tracking-widest mt-1">
                                            {member.role.replace(/_/g, ' ')}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-5 border-t border-gray-50">
                                        {member.email && (
                                            <a 
                                                href={`mailto:${member.email}`} 
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 transition-all group/link"
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover/link:bg-blue-100 transition-colors">
                                                    <Mail size={14} />
                                                </div>
                                                <span className="text-sm text-gray-600 font-medium truncate">{member.email}</span>
                                            </a>
                                        )}
                                        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 transition-all group/link">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/link:bg-emerald-100 transition-colors">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-sm text-gray-400 italic">No phone listed</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                                <Users size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No team members assigned</h3>
                            <p className="text-gray-500 max-w-sm mt-3 leading-relaxed">
                                {isAdmin 
                                    ? "Start building your engagement team by selecting qualified members from your organization." 
                                    : "An engagement team has not been assigned yet. Please contact your organization administrator."
                                }
                            </p>
                            {isAdmin && (
                                <Button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-8 rounded-xl font-bold px-8 py-6 shadow-lg shadow-primary/20"
                                >
                                    Create Team Now
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </ShadowCard>

            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <Info size={18} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    The engagement team consists of internal and external professionals responsible for executing and overseeing the scope of work defined for this specific engagement.
                </p>
            </div>

            {engagementId && (
                <CreateTeamModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    engagementId={engagementId}
                    currentTeamIds={teamMembers.map(m => m.id)}
                />
            )}
        </div>
    );
}
