import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '../api/notificationService';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: (page?: number, limit?: number, isRead?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  totalItems: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.fetchUnreadCount();
      const count = typeof response.count === 'number' ? response.count : 0;
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (page = 1, limit = 10, isRead?: boolean) => {
    try {
      const response = await notificationService.fetchNotifications({ page, limit, isRead });
      if (page === 1) {
        setNotifications(response.items);
      } else {
        setNotifications((prev) => [...prev, ...response.items]);
      }
      setTotalItems(response.meta.total);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  };

  // SSE logic
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token) return;

    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1').replace(/\/?$/, '/');
    const eventSource = new EventSource(`${backendUrl}notifications/sse?token=${token}`);

    eventSource.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (newNotification.playSound !== false) {
        const audio = new Audio('/notification/mixkit-software-interface-back-2575.wav');
        audio.play().catch(() => {});
      }

      toast.info(newNotification.title, {
        description: newNotification.content,
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUnreadCount();
      fetchNotifications(1, 10);
    }
  }, [fetchUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        setUnreadCount,
        setNotifications,
        totalItems,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
