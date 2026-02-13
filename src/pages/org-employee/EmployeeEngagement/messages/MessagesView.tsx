import { MessageSquare, Bell, CheckCircle2, Clock } from "lucide-react";
import { ShadowCard } from "../../../../ui/ShadowCard";
import { useAuth } from "../../../../context/auth-context-core";
import { cn } from "../../../../lib/utils";

const NOTIFICATION_TRIGGERS = [
    "New updates are available",
    "Documents are processed",
    "Actions are required from your side",
    "Statutory submissions are completed"
];

const MOCK_MESSAGES = [
    {
        id: 1,
        content: "The preliminary audit plan for 2025 has been uploaded. Please review the materiality thresholds.",
        date: "January 30, 2026",
        isUnread: true
    },
    {
        id: 2,
        content: "Q4 VAT return has been prepared and is ready for your signature. Deadline for submission is February 15th.",
        date: "January 28, 2026",
        isUnread: false
    },
    {
        id: 3,
        content: "Corporate tax compliance checklist has been updated. Please verify the new requirements for the upcoming fiscal year.",
        date: "January 25, 2026",
        isUnread: false
    }
];

export default function MessagesView() {
    const { selectedService } = useAuth();
    const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShadowCard className="p-0 overflow-hidden border border-gray-100 bg-white">
                {/* Header Section */}
                <div className="p-8 border-b border-gray-50 bg-white">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight font-secondary">
                                {serviceName} UPDATES
                            </h2>
                            <p className="text-gray-500 text-sm">
                                All {serviceName.toLowerCase()}-related updates appear here.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-6 space-y-8">
                    {/* Notification Info Box */}
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-6 relative overflow-hidden group">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative">
                            <div className="flex items-center gap-2.5 mb-4">
                                <Bell className="h-4 w-4 text-gray-900" />
                                <h3 className="font-bold text-gray-900 text-sm">You'll be notified when:</h3>
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                {NOTIFICATION_TRIGGERS.map((trigger, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-gray-900 transition-colors">
                                        <CheckCircle2 className="h-4 w-4 text-green-500/80" />
                                        <span className="font-medium">{trigger}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="space-y-4">
                        {MOCK_MESSAGES.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "group relative rounded-2xl p-6 transition-all duration-300 border",
                                    message.isUnread
                                        ? "bg-white border-primary/20 shadow-sm hover:shadow-md hover:border-primary/30"
                                        : "bg-gray-50/50 border-gray-100"
                                )}
                            >
                                {/* Unread Indicator */}
                                {message.isUnread && (
                                    <div className="absolute top-6 right-6 flex items-center gap-2">
                                        <span className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <p className="text-gray-900 font-medium text-[15px] leading-relaxed max-w-3xl">
                                        {message.content}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {message.date}
                                        </div>
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
