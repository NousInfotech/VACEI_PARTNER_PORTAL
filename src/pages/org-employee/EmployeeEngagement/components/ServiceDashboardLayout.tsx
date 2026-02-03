import { useState } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowRight,
    Upload,
    FileText,
    Phone,
    MessageSquare,
    Download,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Activity
} from "lucide-react";
import { ShadowCard } from "../../../../ui/ShadowCard";
import { Button } from "../../../../ui/Button";
import { cn } from "../../../../lib/utils";
import PillTab from "../../../common/PillTab";

export interface DashboardConfig {
    serviceName: string;
    description: string;
    statusPill: {
        label: string;
        status: 'on_track' | 'due_soon' | 'action_required' | 'overdue';
    };
    compliance: {
        coverage: string;
        cycleLabel: string;
        status: 'waiting_on_you' | 'in_progress' | 'submitted' | 'completed';
        statusLine: string;
        requiredActions: {
            id: string;
            type: 'upload' | 'approve' | 'confirm' | 'schedule';
            label: string;
            context?: string;
        }[];
    };
    currentCycle: {
        label: string;
        statusLine: string;
        reassuranceText: string;
    };
    inlineRequests?: {
        id: string;
        title: string;
        details: string;
        ctaType: 'upload' | 'approve' | 'confirm';
        ctaLabel: string;
        priority: 'high' | 'normal';
    }[];
    referenceList: {
        group: string;
        items: { title: string; type: 'pdf' | 'excel'; link: string }[];
    }[];
    serviceLibraryLink?: string;
    messages: {
        id: string;
        sender: string;
        content: string;
        date: string;
        isSystem?: boolean;
    }[];
    additionalTabs?: {
        id: string;
        label: string;
        content: React.ReactNode;
    }[];
}

interface ServiceDashboardLayoutProps {
    config: DashboardConfig;
}

export default function ServiceDashboardLayout({ config }: ServiceDashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        ...(config.additionalTabs ? config.additionalTabs.map(t => ({ id: t.id, label: t.label })) : [])
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on_track': return 'bg-green-100 text-green-700';
            case 'due_soon': return 'bg-amber-100 text-amber-700';
            case 'action_required': return 'bg-red-100 text-red-700';
            case 'overdue': return 'bg-red-100 text-red-800 font-bold';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStageStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'submitted': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-blue-50 text-blue-600';
            case 'waiting_on_you': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tabs */}
            <div className="flex items-center gap-4">
                <PillTab
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Service Header */}
                        <ShadowCard className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">{config.serviceName}</h2>
                                    <p className="text-gray-500 text-sm max-w-xl">{config.description}</p>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                    getStatusColor(config.statusPill.status)
                                )}>
                                    {config.statusPill.label}
                                </span>
                            </div>
                        </ShadowCard>

                        {/* 2. Compliance & Actions (Top Priority) */}
                        <ShadowCard className="p-0 overflow-hidden border-l-4 border-l-indigo-500">
                            <div className="p-6 bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-600" />
                                    Actions & Compliance
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Current Cycle Status */}
                                    <div className="space-y-4 border-r border-gray-100 pr-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Coverage</p>
                                            <p className="font-bold text-gray-900 text-lg">{config.compliance.coverage}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded text-xs font-bold uppercase",
                                                    getStageStatusColor(config.compliance.status)
                                                )}>
                                                    {config.compliance.status.replace(/_/g, " ")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium italic">"{config.compliance.statusLine}"</p>
                                        </div>
                                    </div>

                                    {/* Right: What we need from you */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Required Actions</p>
                                        {config.compliance.requiredActions.length > 0 ? (
                                            <div className="space-y-3">
                                                {config.compliance.requiredActions.map((action) => (
                                                    <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-colors group">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                                                            {action.context && <p className="text-xs text-gray-500">{action.context}</p>}
                                                        </div>
                                                        <Button size="sm" variant={action.type === 'upload' ? 'default' : 'outline'} className={cn(
                                                            "h-8 text-xs gap-1.5",
                                                            action.type === 'upload' && "bg-indigo-600 hover:bg-indigo-700",
                                                            action.type === 'confirm' && "text-green-600 border-green-200 hover:bg-green-50"
                                                        )}>
                                                            {action.type === 'upload' && <Upload size={14} />}
                                                            {action.type === 'approve' && <CheckCircle2 size={14} />}
                                                            {action.type === 'confirm' && <CheckCircle2 size={14} />}
                                                            {action.type === 'schedule' && <Phone size={14} />}
                                                            {action.type === 'upload' ? 'Upload' : action.type === 'approve' ? 'Approve' : action.type === 'confirm' ? 'Confirm' : 'Call'}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                                <CheckCircle2 size={18} />
                                                <span className="text-sm font-bold">Nothing required from you right now.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ShadowCard>

                        {/* 4. Inline Requests (Conditional) */}
                        {config.inlineRequests && config.inlineRequests.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pending Requests</h3>
                                {config.inlineRequests.map(request => (
                                    <ShadowCard key={request.id} className="p-4 border-l-4 border-l-amber-400 flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{request.title}</h4>
                                                <p className="text-xs text-gray-500">{request.details}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" className="gap-2">
                                            {request.ctaType === 'upload' && <Upload size={14} />}
                                            {request.ctaType === 'approve' && <CheckCircle2 size={14} />}
                                            {request.ctaLabel}
                                        </Button>
                                    </ShadowCard>
                                ))}
                            </div>
                        )}

                        {/* 3. Current Cycle / Coverage Summary */}
                        <ShadowCard className="p-6 bg-linear-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Active Cycle</p>
                                        <h3 className="text-2xl font-bold text-white">{config.currentCycle.label}</h3>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-6 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                    <p className="font-medium text-sm text-white/90">{config.currentCycle.statusLine}</p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-white/50 border-t border-white/10 pt-4 mt-2">
                                    <CheckCircle2 size={14} />
                                    {config.currentCycle.reassuranceText}
                                </div>
                            </div>
                        </ShadowCard>

                        {/* 5. Reference List (Collapsed) */}
                        <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
                            <button
                                onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-700 text-sm">Reference Documents & Reports</h3>
                                </div>
                                {isReferenceExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            </button>

                            {isReferenceExpanded && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                    {config.referenceList.map((group, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{group.group}</h4>
                                            <ul className="space-y-2">
                                                {group.items.map((item, i) => (
                                                    <li key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group/item cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className={cn(
                                                                "h-8 w-8 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                                                                item.type === 'pdf' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                                            )}>
                                                                {item.type.toUpperCase()}
                                                            </div>
                                                            <span className="text-sm text-gray-600 truncate group-hover/item:text-indigo-600 transition-colors">{item.title}</span>
                                                        </div>
                                                        <Download size={14} className="text-gray-300 group-hover/item:text-gray-500" />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Messages & Library */}
                    <div className="space-y-6">
                        {/* 7. Messages */}
                        <ShadowCard className="flex flex-col h-[500px]">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-indigo-600" />
                                    Direct Messages
                                </h3>
                                <span className="text-xs font-medium text-gray-500">{config.messages.length} thread(s)</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {config.messages.map(msg => (
                                    <div key={msg.id} className={cn(
                                        "p-3 rounded-xl max-w-[90%] text-sm",
                                        msg.isSystem ? "bg-gray-100 text-gray-600 mx-auto text-center w-full" :
                                            "bg-indigo-50 text-indigo-900 ml-auto border border-indigo-100"
                                    )}>
                                        {!msg.isSystem && <p className="text-[10px] font-bold text-indigo-400 mb-1">{msg.sender}</p>}
                                        <p>{msg.content}</p>
                                        <p className="text-[10px] opacity-50 mt-1 text-right">{msg.date}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-gray-100">
                                <Button variant="outline" className="w-full justify-between" disabled>
                                    <span className="text-gray-400">Reply to thread...</span>
                                    <ArrowRight size={14} />
                                </Button>
                            </div>
                        </ShadowCard>

                        {/* 6. Library & Links */}
                        <ShadowCard className="p-5">
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 mb-2">Quick Links</h3>
                                <a href="#" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-indigo-100">
                                            <FileText size={16} />
                                        </div>
                                        <span className="text-sm font-medium">Service Library</span>
                                    </div>
                                    <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                                </a>
                                <a href="#" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-indigo-100">
                                            <Clock size={16} />
                                        </div>
                                        <span className="text-sm font-medium">Compliance Calendar</span>
                                    </div>
                                    <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                                </a>
                            </div>
                        </ShadowCard>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Render active tab content */}
                    {config.additionalTabs?.find(t => t.id === activeTab)?.content}
                </div>
            )}
        </div>
    );
}
