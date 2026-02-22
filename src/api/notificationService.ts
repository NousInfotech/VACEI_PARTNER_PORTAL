import { apiGet, apiPatch } from '../config/base';
import { endPoints } from '../config/endPoint';

export interface Notification {
    id: string;
    userId: string;
    role: string;
    type: string;
    title: string;
    content: string;
    redirectUrl: string | null;
    ctaUrl: string | null;
    isRead: boolean;
    createdAt: string;
    channels: string[];
    emailStatus: string | null;
}

export interface NotificationPreference {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    pushEnabled: boolean;
    soundEnabled: boolean;
}

export interface FetchNotificationsResponse {
    items: Notification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const notificationService = {
    fetchNotifications: async (filters?: { page?: number; limit?: number; isRead?: boolean }) => {
        try {
            const response = await apiGet<any>(endPoints.NOTIFICATION.BASE, filters);
            return {
                items: response.data,
                meta: response.meta
            } as FetchNotificationsResponse;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await apiGet<any>(endPoints.NOTIFICATION.UNREAD_COUNT);
            return response.data as { count: number };
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    },

    markAsRead: async (id: string) => {
        try {
            return await apiPatch(endPoints.NOTIFICATION.MARK_READ(id));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    markAllAsRead: async () => {
        try {
            return await apiPatch(endPoints.NOTIFICATION.MARK_ALL_READ);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    getPreferences: async () => {
        try {
            return await apiGet<any>(endPoints.NOTIFICATION.PREFERENCES);
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    },

    updatePreferences: async (data: any) => {
        try {
            return await apiPatch(endPoints.NOTIFICATION.PREFERENCES, data);
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }
};
