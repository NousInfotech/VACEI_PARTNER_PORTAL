import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPortalRedirectUrl } from '../api/notificationService';

const getBackendUrl = () => {
  return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1').replace(/\/?$/, '/');
};

export const useSSE = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (!token) return;

      const backendUrl = getBackendUrl();
      eventSource = new EventSource(`${backendUrl}notifications/sse?token=${token}`);

      eventSource.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        const lastHandleKey = `vacei_last_notif_handled_${newNotification.id}`;
        if (localStorage.getItem(lastHandleKey)) return;
        localStorage.setItem(lastHandleKey, Date.now().toString());
        setTimeout(() => localStorage.removeItem(lastHandleKey), 60000);

        if (newNotification.playSound !== false) {
          const audio = new Audio('/notification/mixkit-software-interface-back-2575.wav');
          audio.play().catch(() => {});
        }

        toast.info(newNotification.title, {
          description: newNotification.content,
          action: newNotification.redirectUrl
            ? {
                label: 'View',
                onClick: () => {
                  window.location.href = getPortalRedirectUrl(newNotification.redirectUrl) || '#';
                },
              }
            : undefined,
        });
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
  }, []);

  return { notifications, setNotifications, unreadCount, setUnreadCount };
};
