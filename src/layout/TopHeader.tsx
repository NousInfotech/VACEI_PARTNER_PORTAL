import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { PanelLeft, PanelLeftClose, Bell, LogOut, Settings, MessageSquare, Calendar, AlertCircle, CheckCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../context/auth-context-core";
import { Select } from "../ui/Select";
import { Dropdown } from "../ui/Dropdown";
import { AVAILABLE_SERVICES } from "../lib/types";
import BackButton from "../pages/common/BackButton";
import { useNotifications } from "../context/NotificationContext";

interface TopHeaderProps {
    onSidebarToggle: () => void;
    isSidebarCollapsed: boolean;
    username: string;
    role: string;
}

export default function TopHeader({
    onSidebarToggle,
    isSidebarCollapsed,
    username,
    role
}: TopHeaderProps) {
    const navigate = useNavigate();
    const { logout, organizationMember, setSelectedService, selectedServiceLabel } = useAuth();
    const { unreadCount, markAsRead, markAllAsRead, notifications: latestNotifications, fetchNotifications: fetchLatestNotifications, fetchUnreadCount } = useNotifications();
    const { pathname } = useLocation();

    useEffect(() => {
        fetchUnreadCount();
        fetchLatestNotifications(1, 10);
    }, [fetchUnreadCount, fetchLatestNotifications]);

    const handleMarkAsReadInternal = async (id: string) => {
        try {
            await markAsRead(id);
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'chat_message':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'meeting_scheduled':
            case 'meeting_updated':
                return <Calendar className="h-4 w-4 text-purple-500" />;
            case 'error':
            case 'meeting_canceled':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const services = useMemo(() => {
        const allowedServices = organizationMember?.allowedServices || [];
        const allowedCustomServiceCycles = organizationMember?.allowedCustomServiceCycles || [];

        const standardItems = allowedServices.map(serviceId => {
            const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === serviceId);
            return {
                id: serviceId,
                label: serviceInfo?.label || serviceId.replace(/_/g, " "),
                onClick: () => setSelectedService(serviceId)
            };
        });

        const customItems = allowedCustomServiceCycles.map(cycle => ({
            id: cycle.id,
            label: cycle.title,
            onClick: () => setSelectedService(cycle.id)
        }));

        return [...standardItems, ...customItems];
    }, [organizationMember?.allowedServices, organizationMember?.allowedCustomServiceCycles, setSelectedService]);

    const currentServiceLabel = selectedServiceLabel;

    // Poll unread count periodically (fallback when SSE does not connect)
    useEffect(() => {
        const interval = setInterval(fetchUnreadCount, 30_000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Refresh when user returns to tab
    useEffect(() => {
        const onFocus = () => fetchUnreadCount();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchUnreadCount]);

    return (
        <header
            className="h-16 backdrop-blur-xl border flex items-center justify-between px-6 sticky top-0 z-40 rounded-4xl m-2 mb-0 bg-white/80 shadow-lg border-gray-200"
        >
            <div className="flex items-center gap-4">
                <button
                    className="p-2 rounded-2xl hover:bg-gray-100 transition-colors group"
                    onClick={onSidebarToggle}
                >
                    {isSidebarCollapsed ? (
                        <PanelLeft className="h-5 w-5 text-gray-700" />
                    ) : (
                        <PanelLeftClose className="h-5 w-5 text-gray-700" />
                    )}
                </button>

                <div className="h-6 w-px bg-gray-200" />

                {pathname !== '/dashboard' && (
                    <BackButton className="h-10 px-3 rounded-xl" />
                )}

                {organizationMember && role !== 'Admin' && (
                    <div className="flex items-center gap-2 ml-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Service:</p>
                        <div className="relative group">
                            <Select
                                label={currentServiceLabel}
                                items={services}
                                className="w-auto"
                                contentClassName="w-64"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <Dropdown
                    align="right"
                    contentClassName="w-80 overflow-hidden"
                    trigger={
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl relative" onClick={() => fetchLatestNotifications(1, 10)}>
                            <Bell className="h-5 w-5 text-gray-700" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    }
                    closeOnClick={false}
                >
                    <div className="flex flex-col max-h-[480px]">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest text-[10px]">Latest Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Mark all
                                </button>
                            )}
                        </div>
                        <div className="p-2 overflow-y-auto">
                            {latestNotifications.length > 0 ? (
                                latestNotifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        onClick={() => {
                                            if (!notification.isRead) handleMarkAsReadInternal(notification.id);
                                            if (notification.redirectUrl) navigate(notification.redirectUrl);
                                        }}
                                        className={`p-3 rounded-xl mb-1 cursor-pointer transition-all hover:bg-gray-50 flex gap-3 ${!notification.isRead ? 'bg-primary/5 border border-primary/10' : 'bg-white'}`}
                                    >
                                        <div className={`mt-1 p-2 rounded-lg ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold text-gray-900 truncate ${!notification.isRead ? '' : 'opacity-70'}`}>
                                                {notification.title}
                                            </p>
                                            <p className={`text-[10px] text-gray-500 line-clamp-1 mt-0.5 ${!notification.isRead ? '' : 'opacity-60'}`}>
                                                {notification.content}
                                            </p>
                                            <span className="text-[8px] font-bold text-gray-400 mt-1 block uppercase tracking-tighter">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                                    <Bell className="h-8 w-8 text-gray-200 mb-2" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No notifications</p>
                                </div>
                            )}
                        </div>
                        {/* <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                            <Button 
                                variant="ghost" 
                                className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary rounded-xl h-9"
                                onClick={() => navigate('/notifications')}
                            >
                                View all
                            </Button>
                        </div> */}
                    </div>
                </Dropdown>

                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => navigate('/dashboard/settings')}>
                    <Settings className="h-5 w-5 text-gray-700" />
                </Button>

                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{username}</p>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{role}</p>
                    </div>

                    <div className="relative group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white shadow-lg">
                            <span className="text-sm font-medium">{username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
