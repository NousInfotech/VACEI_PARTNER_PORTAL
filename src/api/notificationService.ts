import axiosInstance from '../config/axiosConfig';

export function getPortalRedirectUrl(url?: string): string {
  if (!url) return '';
  const cleaned = url.replace(/^\/(partner|platform|client)/, '');
  if (cleaned.startsWith('/dashboard') || cleaned.startsWith('/')) return cleaned;
  return `/${cleaned}`;
}

export interface Notification {
  id: string;
  userId: string;
  role: string;
  type: string;
  title: string;
  content: string;
  redirectUrl?: string;
  ctaUrl?: string;
  isRead: boolean;
  createdAt: string;
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

export interface FetchUnreadCountResponse {
  count: number;
}

export interface NotificationPreference {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
}

export async function fetchNotificationsAPI(filters?: {
  page?: number;
  limit?: number;
  read?: boolean;
}): Promise<FetchNotificationsResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.read !== undefined) params.append('isRead', String(filters.read));
  const res = await axiosInstance.get(`notifications?${params}`);
  const raw = res.data?.data ?? res.data ?? {};
  const items = (raw.items ?? []).map((n: Notification) => ({
    ...n,
    redirectUrl: getPortalRedirectUrl(n.redirectUrl),
  }));
  return { ...raw, items };
}

export async function fetchUnreadCountAPI(): Promise<number> {
  const res = await axiosInstance.get('notifications/unread-count');
  const data = res.data?.data ?? res.data;
  return data?.count ?? 0;
}

export async function markNotificationAsReadAPI(notificationId: string): Promise<void> {
  await axiosInstance.patch(`notifications/read/${notificationId}`);
}

export async function markAllNotificationsAsReadAPI(): Promise<void> {
  await axiosInstance.patch('notifications/read-all');
}

export async function fetchPreferencesAPI(): Promise<NotificationPreference> {
  const res = await axiosInstance.get('notifications/preferences');
  return res.data?.data ?? res.data;
}

export async function updatePreferencesAPI(
  preferences: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const res = await axiosInstance.patch('notifications/preferences', preferences);
  return res.data?.data ?? res.data;
}

export const notificationService = {
  async fetchNotifications(filters?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<FetchNotificationsResponse> {
    return fetchNotificationsAPI({
      page: filters?.page ?? 1,
      limit: filters?.limit ?? 10,
      read: filters?.isRead,
    });
  },
  async fetchUnreadCount(): Promise<FetchUnreadCountResponse> {
    const count = await fetchUnreadCountAPI();
    return { count };
  },
  async markAsRead(id: string): Promise<void> {
    return markNotificationAsReadAPI(id);
  },
  async markAllAsRead(): Promise<void> {
    return markAllNotificationsAsReadAPI();
  },
  async getPreferences(): Promise<NotificationPreference | { data: NotificationPreference }> {
    return fetchPreferencesAPI();
  },
  async updatePreferences(prefs: Partial<NotificationPreference>): Promise<NotificationPreference> {
    return updatePreferencesAPI(prefs);
  },
};
