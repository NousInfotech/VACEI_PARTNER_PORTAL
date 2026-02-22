import { apiGet, apiPatch } from '../config/base';
import { endPoints } from '../config/endPoint';

export function getPortalRedirectUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
        const dummyBase = 'http://localhost';
        const parsedUrl = new URL(url, dummyBase);
        const path = parsedUrl.pathname;
        const searchParams = parsedUrl.searchParams;

        if (path === '/library') {
            const engagementId = searchParams.get('engagementId');
            if (engagementId) {
                return `/engagement-view/${engagementId}?tab=library`;
            }
        }

        if (path === '/compliance' && searchParams.has('engagementId')) {
            return `/dashboard/compliance`;
        }

        if (path.startsWith('/dashboard')) return url;

        if (path.startsWith('/')) {
            return `/dashboard${url}`;
        }
    } catch (e) {
        return url;
    }
    return url;
}

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

            let mappedItems = response.data;
            if (Array.isArray(mappedItems)) {
                mappedItems = mappedItems.map(notif => ({
                    ...notif,
                    redirectUrl: getPortalRedirectUrl(notif.redirectUrl)
                }));
            }

            return {
                items: mappedItems,
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
