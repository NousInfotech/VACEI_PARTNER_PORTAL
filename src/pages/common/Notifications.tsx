import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    type Notification 
} from '../../api/notificationService';
import PageHeader from './PageHeader';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import { ShadowCard } from '../../ui/ShadowCard';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, Filter, AlertCircle, MessageSquare, Calendar } from 'lucide-react';
import { Badge } from '../../ui/badge';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
    const isRead = notification.isRead;
    const navigate = useNavigate();

    const getIcon = () => {
        switch (notification.type) {
            case 'chat_message':
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'meeting_scheduled':
            case 'meeting_updated':
                return <Calendar className="h-5 w-5 text-purple-500" />;
            case 'error':
            case 'meeting_canceled':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const handleClick = () => {
        if (!isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.redirectUrl) {
            navigate(notification.redirectUrl);
        }
    };

    return (
        <ShadowCard 
            className={`p-4 mb-4 border-l-4 transition-all hover:bg-gray-50 cursor-pointer ${
                isRead ? 'border-gray-200' : 'border-primary bg-primary/5'
            }`}
            onClick={handleClick}
        >
            <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-xl ${isRead ? 'bg-gray-100' : 'bg-white'}`}>
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-gray-900 ${isRead ? 'opacity-70' : ''}`}>
                            {notification.title}
                        </h4>
                        {!isRead && <Badge variant="default" className="bg-primary">New</Badge>}
                    </div>
                    <p className={`text-sm text-gray-600 mt-1 ${isRead ? 'opacity-60' : ''}`}>
                        {notification.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                            {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.ctaUrl && (
                            <button 
                                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(notification.ctaUrl!, '_blank');
                                }}
                            >
                                View Details
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ShadowCard>
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
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

    const totalPages = Math.ceil(totalItems / 10);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchNotifications(currentPage, 10, showUnreadOnly ? false : undefined);
            setLoading(false);
        };
        load();
    }, [currentPage, showUnreadOnly, fetchNotifications]);

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
        <div className="space-y-6">
            <PageHeader 
                title="Notifications"
                description={`You have ${unreadCount} unread notifications.`}
            />

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button 
                        variant={showUnreadOnly ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => {
                            setShowUnreadOnly(true);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Unread
                    </Button>
                    <Button 
                        variant={!showUnreadOnly ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => {
                            setShowUnreadOnly(false);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl"
                    >
                        All
                    </Button>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsReadLocal}
                    disabled={unreadCount === 0}
                    className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all as read
                </Button>
            </div>

            <div className="min-h-[400px]">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="mb-4">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    ))
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <NotificationItem 
                            key={notif.id} 
                            notification={notif} 
                            onMarkAsRead={handleMarkAsReadInternal}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Bell className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No notifications</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            When you receive alerts or updates, they'll show up here.
                        </p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-bold text-gray-500">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
