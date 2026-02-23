import { useEffect, useState } from 'react';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

export const useSSE = (onNotification?: (n: any) => void) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (!token) return;

      const base = getBackendUrl().replace(/\/?$/, '/');
      const url = `${base}notifications/sse`;
      eventSource = new EventSource(`${url}?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const n = JSON.parse(event.data);
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((prev) => prev + 1);
          onNotification?.(n);
        } catch (_) {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [onNotification]);

  return { notifications, setNotifications, unreadCount, setUnreadCount };
};
