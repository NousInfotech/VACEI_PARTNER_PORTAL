import { apiGet, apiPatch } from '../config/base';
import { endPoints } from '../config/endPoint';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  redirectUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface UnreadCountResponse {
  count: number;
}

export async function fetchNotificationsAPI(params?: { page?: number; limit?: number; isRead?: boolean }) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.isRead !== undefined) search.set('isRead', String(params.isRead));
  const url = endPoints.NOTIFICATIONS.BASE + (search.toString() ? `?${search}` : '');
  const res = await apiGet<{ data?: Notification[]; meta?: NotificationsResponse['meta'] }>(url);
  const items = Array.isArray((res as any).data) ? (res as any).data : [];
  const meta = (res as any).meta ?? { total: items.length, page: 1, limit: 10, totalPages: 1 };
  return { items, meta } as NotificationsResponse;
}

export async function fetchUnreadCountAPI(): Promise<number> {
  const res = await apiGet<{ data?: { count?: number }; count?: number }>(endPoints.NOTIFICATIONS.UNREAD_COUNT);
  const data = (res as any).data ?? res;
  return data?.count ?? 0;
}

export async function markNotificationAsReadAPI(id: string): Promise<void> {
  await apiPatch(endPoints.NOTIFICATIONS.READ(id), {});
}
