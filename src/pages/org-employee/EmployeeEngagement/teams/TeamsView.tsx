import { Users, Mail, Phone, Shield } from "lucide-react";
import { ShadowCard } from "../../../../ui/ShadowCard";
import { useAuth } from "../../../../context/auth-context-core";

const MOCK_TEAM_MEMBERS = [
    {
        id: 1,
        name: "Sarah Williams",
        role: "Engagement Partner",
        email: "sarah.w@vacei.com",
        phone: "+1 (555) 123-4567",
        department: "Audit & Assurance",
        status: "online",
        initials: "SW",
        color: "bg-blue-100 text-blue-700"
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Senior Manager",
        email: "m.chen@vacei.com",
        phone: "+1 (555) 987-6543",
        department: "Tax Services",
        status: "offline",
        initials: "MC",
        color: "bg-purple-100 text-purple-700"
    },
    {
        id: 3,
        name: "Emma Davis",
        role: "Associate",
        email: "emma.d@vacei.com",
        phone: "+1 (555) 456-7890",
        department: "Advisory",
        status: "busy",
        initials: "ED",
        color: "bg-amber-100 text-amber-700"
    },
    {
        id: 4,
        name: "James Wilson",
        role: "Technical Specialist",
        email: "j.wilson@vacei.com",
        phone: "+1 (555) 234-5678",
        department: "IT Risk",
        status: "online",
        initials: "JW",
        color: "bg-emerald-100 text-emerald-700"
    }
];

export default function TeamsView() {
    const { selectedService } = useAuth();
    const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShadowCard className="p-0 overflow-hidden border border-gray-100 bg-white">
                {/* Header Section */}
                <div className="p-8 border-b border-gray-50 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight font-secondary">
                                    {serviceName} TEAM
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    Qualified professionals assigned to your engagement
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Grid */}
                <div className="p-8 bg-gray-50/50 min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {MOCK_TEAM_MEMBERS.map((member) => (
                            <div
                                key={member.id}
                                className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Top decoration */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`h-10 w-10 rounded-xl ${member.color} flex items-center justify-center text-sm font-bold shadow-xs`}>
                                        {member.initials}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-bold text-slate-900 text-base">
                                            {member.name}
                                        </h3>
                                        {member.role.includes("Partner") && (
                                            <Shield size={12} className="text-indigo-500 fill-indigo-500/20" />
                                        )}
                                    </div>
                                    <p className="text-indigo-600 font-medium text-xs mb-0.5">{member.role}</p>
                                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{member.department}</p>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-gray-50">
                                    <a href={`mailto:${member.email}`} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors group/link">
                                        <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover/link:bg-blue-100 transition-colors">
                                            <Mail size={12} />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">{member.email}</span>
                                    </a>

                                    <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors group/link">
                                        <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/link:bg-emerald-100 transition-colors">
                                            <Phone size={12} />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">{member.phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ShadowCard>
        </div>
    );
}
