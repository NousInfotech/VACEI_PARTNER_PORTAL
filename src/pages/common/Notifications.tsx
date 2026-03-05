import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    type Notification 
} from '../../api/notificationService';
import PageHeader from './PageHeader';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, CheckCheck, MessageSquare, Calendar, 
  AlertCircle, Clock, ArrowRight, Eye
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import EmptyState from "../../ui/EmptyState";
import { cn } from "../../lib/utils";

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
    const isRead = notification.isRead;
    const navigate = useNavigate();

    const getIconConfig = () => {
        switch (notification.type) {
            case 'chat_message':
                return {
                    icon: <MessageSquare className="h-5 w-5" />,
                    gradient: "from-blue-500/20 to-blue-600/20 text-blue-600",
                    bg: "bg-blue-50"
                };
            case 'meeting_scheduled':
            case 'meeting_updated':
                return {
                    icon: <Calendar className="h-5 w-5" />,
                    gradient: "from-purple-500/20 to-purple-600/20 text-purple-600",
                    bg: "bg-purple-50"
                };
            case 'error':
            case 'meeting_canceled':
                return {
                    icon: <AlertCircle className="h-5 w-5" />,
                    gradient: "from-red-500/20 to-red-600/20 text-red-600",
                    bg: "bg-red-50"
                };
            default:
                return {
                    icon: <Bell className="h-5 w-5" />,
                    gradient: "from-amber-500/20 to-orange-600/20 text-amber-600",
                    bg: "bg-amber-50"
                };
        }
    };

    const config = getIconConfig();

    const handleClick = () => {
        if (!isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.redirectUrl) {
            navigate(notification.redirectUrl);
        }
    };

    return (
        <div 
            className={cn(
                "group relative bg-white rounded-3xl p-5 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden",
                isRead ? "border-gray-100 opacity-80" : "border-primary/10 shadow-lg shadow-primary/5"
            )}
            onClick={handleClick}
        >
            {/* Background decorative element */}
            {!isRead && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            )}

            <div className="flex gap-5 relative z-10">
                <div className={cn(
                    "h-14 w-14 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-br transition-transform group-hover:scale-110 duration-500",
                    config.gradient
                )}>
                    {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className={cn(
                                    "font-bold text-[16px] tracking-tight",
                                    isRead ? "text-gray-600" : "text-gray-900"
                                )}>
                                    {notification.title}
                                </h4>
                                {!isRead && (
                                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                )}
                            </div>
                            <p className={cn(
                                "text-[14px] leading-relaxed line-clamp-2",
                                isRead ? "text-gray-500" : "text-gray-700"
                            )}>
                                {notification.content}
                            </p>
                        </div>
                        
                        {!isRead && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsRead(notification.id);
                                    }}
                                >
                                    <Eye className="h-4 w-4 mr-1.5" />
                                    Read
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            {notification.ctaUrl && (
                                <button 
                                    className="flex items-center gap-1 text-[11px] font-bold text-primary tracking-wider uppercase hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(notification.ctaUrl!, '_blank');
                                    }}
                                >
                                    Explore <ArrowRight className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Notifications() {
    const { 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead,
        totalItems,
    } = useNotifications();

    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<string>("all");

    const totalPages = Math.ceil(totalItems / 10);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchNotifications(currentPage, 10, activeTab === "unread" ? false : undefined);
            setLoading(false);
        };
        load();
    }, [currentPage, activeTab, fetchNotifications]);

    const groupedNotifications = useMemo(() => {
        const groups: Record<string, Notification[]> = {
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        notifications.forEach(n => {
            const date = new Date(n.createdAt);
            if (date.toDateString() === today.toDateString()) {
                groups['Today'].push(n);
            } else if (date.toDateString() === yesterday.toDateString()) {
                groups['Yesterday'].push(n);
            } else {
                groups['Older'].push(n);
            }
        });

        return groups;
    }, [notifications]);

    const handleMarkAsReadInternal = async (id: string) => {
        try {
            await markAsRead(id);
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsReadLocal = async () => {
        if (unreadCount === 0) return;
        try {
            await markAllAsRead();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    return (
        <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="">
              <PageHeader 
                  title="Notifications"
                  description={`Keep track of your latest updates and alerts.`}
              />
              
              {unreadCount > 0 && (
                <Button 
                    variant="ghost" 
                    onClick={handleMarkAllAsReadLocal}
                    className="h-12 px-6 text-primary hover:bg-primary/5 rounded-2xl group transition-all"
                >
                    <CheckCheck className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Mark all as read</span>
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }} className="w-full">
              <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl mb-8 w-fit gap-2">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary font-bold text-sm transition-all"
                >
                  All Alerts
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary font-bold text-sm transition-all flex items-center gap-2"
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[500px]">
                {loading ? (
                    <div className="space-y-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="mb-4">
                              <Skeleton className="h-32 w-full rounded-[32px]" />
                          </div>
                      ))}
                    </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-12">
                     {Object.entries(groupedNotifications).map(([group, list]) => list.length > 0 && (
                       <div key={group} className="space-y-6">
                          <div className="flex items-center gap-4">
                             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{group}</h3>
                             <div className="h-px bg-gray-100 flex-1" />
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {list.map((notif) => (
                                <NotificationItem 
                                    key={notif.id} 
                                    notification={notif} 
                                    onMarkAsRead={handleMarkAsReadInternal}
                                />
                            ))}
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                    <EmptyState 
                      icon={Bell}
                      title="All caught up!"
                      description={activeTab === 'unread' 
                        ? "You've read all your notifications. Great job keeping your inbox clean!" 
                        : "No notifications yet. We'll alert you as soon as something important happens."
                      }
                    />
                )}
              </div>
            </Tabs>

            {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center gap-6 pt-12">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-12 px-6 rounded-2xl font-bold bg-white shadow-sm border border-gray-100 disabled:opacity-30"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-gray-900">{currentPage}</span>
                       <span className="text-sm font-medium text-gray-400">of {totalPages}</span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-12 px-6 rounded-2xl font-bold bg-white shadow-sm border border-gray-100 disabled:opacity-30"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
