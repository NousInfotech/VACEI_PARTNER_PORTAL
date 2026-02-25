import React, { useState } from "react";
import {
    CheckCircle2,
    Clock,
    ArrowRight,
    Upload,
    FileText,
    Phone,
    MessageSquare,
    Download,
    ExternalLink,
    Activity,
    Calendar
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
    overviewTabLabel?: string;
    hideTabs?: boolean;
}

interface ServiceDashboardLayoutProps {
    config: DashboardConfig;
}

export default function ServiceDashboardLayout({ config }: ServiceDashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingUploadContext, setPendingUploadContext] = useState<string | null>(null);

    const tabs = [
        { id: 'overview', label: config.overviewTabLabel || 'Overview' },
        ...(config.additionalTabs ? config.additionalTabs.map(t => ({ id: t.id, label: t.label })) : [])
    ];

    const handleUploadClick = (context: string) => {
        setPendingUploadContext(context);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && pendingUploadContext) {
            alert(`File "${file.name}" uploaded successfully for: ${pendingUploadContext}`);
        }
        setPendingUploadContext(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownload = (title: string) => {
        alert(`Downloading document: "${title}"...`);
    };

    const handleAction = (type: string, label: string, context?: string) => {
        if (type === 'upload') {
            handleUploadClick(context || label);
        } else if (type === 'approve') {
            alert(`Approved: ${label}`);
        } else if (type === 'confirm') {
            alert(`Confirmed: ${label}`);
        } else if (type === 'schedule') {
            alert(`Opening scheduler for: ${label}`);
        }
    };

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
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Tabs */}
            {!config.hideTabs && (
                <div className="flex items-center gap-4">
                    <PillTab
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
            )}

            {activeTab === 'overview' ? (
                    <div className="lg:col-span-3 space-y-8">
                        {/* 1. Service Header */}
                        <ShadowCard className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.serviceName}</h2>
                                    <p className="text-gray-500 text-sm max-w-2xl">{config.description}</p>
                                </div>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm",
                                    getStatusColor(config.statusPill.status)
                                )}>
                                    {config.statusPill.label}
                                </span>
                            </div>
                        </ShadowCard>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* 2. Compliance & Actions (Top Priority) */}
                                <ShadowCard className="p-0 overflow-hidden border-l-4 border-l-indigo-500">
                                    <div className="p-8 bg-white">
                                        <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-indigo-600" />
                                            Actions & Compliance
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Left: Current Cycle Status */}
                                            <div className="space-y-6 md:border-r md:border-gray-100 md:pr-10">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Coverage</p>
                                                    <p className="font-bold text-gray-900 text-xl">{config.compliance.coverage}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded text-xs font-bold uppercase",
                                                            getStageStatusColor(config.compliance.status)
                                                        )}>
                                                            {config.compliance.status.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-base text-gray-600 font-medium italic">"{config.compliance.statusLine}"</p>
                                                </div>
                                            </div>

                                            {/* Right: What we need from you */}
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Required Actions</p>
                                                {config.compliance.requiredActions.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {config.compliance.requiredActions.map((action) => (
                                                            <div key={action.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all group">
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{action.label}</p>
                                                                    {action.context && <p className="text-xs text-gray-500 mt-0.5">{action.context}</p>}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant={action.type === 'upload' ? 'default' : 'outline'}
                                                                    className={cn(
                                                                        "h-9 text-xs gap-2 px-4 shadow-sm",
                                                                        action.type === 'upload' && "bg-indigo-600 hover:bg-indigo-700",
                                                                        action.type === 'confirm' && "text-green-600 border-green-200 hover:bg-green-50"
                                                                    )}
                                                                    onClick={() => handleAction(action.type, action.label, action.context)}
                                                                >
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
                                                    <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100">
                                                        <div className="p-2 bg-white rounded-full">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <span className="text-sm font-bold uppercase tracking-tight">Nothing required from you right now.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ShadowCard>

                                {/* Reference List Section - Now Prominent */}
                                <ShadowCard className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            Reference Documents & Reports
                                        </h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {config.referenceList.map((group, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{group.group}</h4>
                                                <div className="space-y-2">
                                                    {group.items.map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between p-3.5 hover:bg-indigo-50/50 rounded-xl group/item cursor-pointer transition-all border border-gray-50 hover:border-indigo-100"
                                                            onClick={() => handleDownload(item.title)}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={cn(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm",
                                                                    item.type === 'pdf' ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                )}>
                                                                    {item.type.toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700 truncate group-hover/item:text-indigo-700 transition-colors">{item.title}</span>
                                                            </div>
                                                            <Download size={16} className="text-gray-300 group-hover/item:text-indigo-400 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ShadowCard>

                                {/* Summary Card moved to bottom of main column */}
                                <ShadowCard className="p-8 bg-linear-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden rounded-[32px]">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em] mb-2">Active Cycle Coverage</p>
                                                <h3 className="text-3xl font-bold text-white tracking-tight">{config.currentCycle.label}</h3>
                                            </div>
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
                                                <Clock className="h-7 w-7 text-white" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mb-8 p-5 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                                            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
                                            <p className="font-semibold text-base text-white/90">{config.currentCycle.statusLine}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm font-medium text-white/40 pt-6 border-t border-white/5">
                                            <CheckCircle2 size={18} className="text-emerald-500/50" />
                                            {config.currentCycle.reassuranceText}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[80px]" />
                                </ShadowCard>
                            </div>

                            <div className="space-y-8">
                                {/* Direct Messages - Now on the right grid but equally prominent */}
                                <ShadowCard className="flex flex-col h-[520px] rounded-[32px] overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <MessageSquare size={18} />
                                            </div>
                                            Direct Messages
                                        </h3>
                                        <span className="px-2.5 py-1 bg-indigo-100/50 text-indigo-700 text-[10px] font-black rounded-lg">
                                            {config.messages.length} THREADS
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
                                        {config.messages.map(msg => (
                                            <div key={msg.id} className={cn(
                                                "p-4 rounded-[20px] max-w-[95%] text-sm shadow-sm transition-all hover:shadow-md",
                                                msg.isSystem ? "bg-gray-100 text-gray-600 mx-auto text-center w-full" :
                                                    "bg-indigo-50 text-indigo-900 ml-auto border border-indigo-100/50"
                                            )}>
                                                {!msg.isSystem && <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{msg.sender}</p>}
                                                <p className="leading-relaxed font-medium">{msg.content}</p>
                                                <p className="text-[10px] opacity-40 mt-2 text-right font-bold italic">{msg.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 border-t border-gray-100 bg-white">
                                        <Button variant="outline" className="w-full justify-between h-12 rounded-xl group border-gray-200" disabled>
                                            <span className="text-gray-400 font-medium italic">Type your reply...</span>
                                            <ArrowRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </ShadowCard>

                                {/* Quick Links - Sidebar Card */}
                                <ShadowCard className="p-6 rounded-[32px]">
                                    <div className="space-y-5">
                                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Activity size={18} className="text-indigo-600" />
                                            Quick Navigation
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-indigo-200">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold">Service Library</span>
                                                </div>
                                                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                                            </a>
                                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-indigo-200">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold">Compliance Calendar</span>
                                                </div>
                                                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                                            </a>
                                        </div>
                                    </div>
                                </ShadowCard>
                            </div>
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
