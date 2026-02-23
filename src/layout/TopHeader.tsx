import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect } from "react";
import { PanelLeft, PanelLeftClose, Search, Bell, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../context/auth-context-core";
import { Select } from "../ui/Select";
import { AVAILABLE_SERVICES } from "../lib/types";
import { fetchNotificationsAPI, fetchUnreadCountAPI, markNotificationAsReadAPI } from "../api/notificationService";
import { useSSE } from "../hooks/useSSE";

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

    const handleLogout = () => {
        logout();
        navigate("/login");
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

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            const res = await fetchNotificationsAPI({ page: 1, limit: 10 });
            setNotifications(res.items ?? []);
        } catch {
            setNotifications([]);
        }
    }, []);

    const loadUnreadCount = useCallback(async () => {
        try {
            const c = await fetchUnreadCountAPI();
            setUnreadCount(c);
        } catch {
            setUnreadCount(0);
        }
    }, []);

    const onNewNotification = useCallback(() => {
        loadUnreadCount();
        loadNotifications();
    }, [loadUnreadCount, loadNotifications]);
    useSSE(onNewNotification);

    useEffect(() => {
        loadUnreadCount();
    }, [loadUnreadCount]);

    useEffect(() => {
        if (showNotifications) loadNotifications();
    }, [showNotifications, loadNotifications]);

    // Poll unread count periodically (fallback when SSE does not connect)
    useEffect(() => {
        const interval = setInterval(loadUnreadCount, 30_000);
        return () => clearInterval(interval);
    }, [loadUnreadCount]);

    // Refresh when user returns to tab
    useEffect(() => {
        const onFocus = () => loadUnreadCount();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [loadUnreadCount]);
    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) {
            try {
                await markNotificationAsReadAPI(n.id);
                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch {}
        }
        setShowNotifications(false);
        if (n.redirectUrl) navigate(n.redirectUrl);
    };

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

                <div className="flex items-center gap-2 w-64">
                    <div className="relative flex w-full">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-gray-50 text-gray-900 border border-gray-200 border-r-0 placeholder-gray-500 rounded-l-lg focus:outline-none w-full h-[37px] ps-4 text-sm"
                        />
                        <Button
                            className="h-[37px] rounded-l-none px-3"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

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
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl relative"
                        onClick={() => setShowNotifications((v) => !v)}
                    >
                        <Bell className="h-5 w-5 text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Button>
                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotifications(false)}
                                aria-hidden
                            />
                            <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <h3 className="px-4 py-2 text-sm font-bold text-gray-900">Notifications</h3>
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.content}</p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-4 py-6 text-sm text-gray-500">No notifications</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
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
