import { Bell, AlertCircle, Info, CheckCircle, AlertTriangle, Megaphone, Clock, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { apiGet } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import type { Notice as ApiNotice } from '../../types/notice';

// Simple Badge component
const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: string }) => (
  <span className={cn(
    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
    variant === 'secondary' ? "bg-gray-50 text-gray-600 ring-gray-500/10" : "bg-primary/10 text-primary ring-primary/20",
    className
  )}>
    {children}
  </span>
);

// Simple Spinner component
const Spinner = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg
    className={cn("animate-spin", className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

type NoticeTypeEnum = "emergency" | "warning" | "update" | "announcement" | "reminder" | "info" | "success";

interface Notice {
  id: string;
  title: string;
  description: string;
  roles: string[];
  createdBy: string;
  type: NoticeTypeEnum;
  createdAt: Date;
  updatedAt: Date;
}

const getNoticeTypeConfig = (type: NoticeTypeEnum) => {
  const configs: Record<NoticeTypeEnum, { icon: LucideIcon, badgeColor: string, gradient: string, label: string }> = {
    emergency: {
      icon: AlertCircle,
      badgeColor: "bg-red-500",
      gradient: "from-red-600 via-red-500 to-red-400",
      label: "Emergency",
    },
    warning: {
      icon: AlertTriangle,
      badgeColor: "bg-orange-500",
      gradient: "from-orange-600 via-orange-500 to-orange-400",
      label: "Warning",
    },
    update: {
      icon: Info,
      badgeColor: "bg-blue-500",
      gradient: "from-blue-600 via-blue-500 to-blue-400",
      label: "Update",
    },
    announcement: {
      icon: Megaphone,
      badgeColor: "bg-purple-500",
      gradient: "from-purple-600 via-purple-500 to-purple-400",
      label: "Announcement",
    },
    reminder: {
      icon: Clock,
      badgeColor: "bg-yellow-500",
      gradient: "from-yellow-600 via-yellow-500 to-yellow-400",
      label: "Reminder",
    },
    info: {
      icon: Info,
      badgeColor: "bg-gray-500",
      gradient: "from-gray-600 via-gray-500 to-gray-400",
      label: "Info",
    },
    success: {
      icon: CheckCircle,
      badgeColor: "bg-green-500",
      gradient: "from-green-600 via-green-500 to-green-400",
      label: "Success",
    }
  };
  return (configs[type] || configs.info) as { icon: LucideIcon, badgeColor: string, gradient: string, label: string };
};


export const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ success: boolean; data: ApiNotice[] }>(endPoints.NOTICE?.GET_TODAY || '/notices/today');
      const data = response.data || [];

      const mappedNotices: Notice[] = data.map((n: ApiNotice) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        roles: n.targetRoles,
        createdBy: "Admin",
        type: n.type as NoticeTypeEnum,
        createdAt: new Date(n.scheduledAt || n.createdAt),
        updatedAt: new Date(n.createdAt),
      }));

      setNotices(mappedNotices);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();

    // Refresh notices from API every 5 minutes
    const apiInterval = setInterval(loadNotices, 5 * 60 * 1000);
    // Update local time every minute for schedule filtering
    const timerInterval = setInterval(() => setCurrentTime(new Date()), 60 * 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const filteredNotices = notices.filter(n => new Date(n.createdAt) <= currentTime);

  useEffect(() => {
    if (filteredNotices.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredNotices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredNotices.length, isPaused]);

  useEffect(() => {
    if (currentIndex >= filteredNotices.length && filteredNotices.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredNotices.length, currentIndex]);

  const nextNotice = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredNotices.length);
  };

  const prevNotice = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredNotices.length) % filteredNotices.length);
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-widest">Notice Board</h2>
        </div>
        <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl p-12 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-center py-8">
            <Spinner size={32} className="text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-widest">Notice Board</h2>
        </div>
        <div className="bg-linear-to-br from-red-50 to-red-100 rounded-2xl p-8 border border-red-200 shadow-lg">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredNotices.length === 0) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-widest">Notice Board</h2>
        </div>
        <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Notices Available</h3>
            <p className="text-sm text-gray-500">
              No notices available at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-widest">Notice Board</h2>
          <Badge variant="secondary" className="rounded-full px-2 py-0">
            {filteredNotices.length}
          </Badge>
        </div>
        {filteredNotices.length > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={prevNotice}
              className="h-9 w-9 p-0 rounded-full border-gray-200 bg-primary hover:bg-white text-white transition-all shadow-sm flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 group-hover:text-primary" />
            </Button>
            <span className="text-[15px] font-medium min-w-[45px] text-center uppercase tracking-widest text-gray-500">
              {currentIndex + 1} / {filteredNotices.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextNotice}
              className="h-9 w-9 p-0 rounded-full border-gray-200 bg-primary hover:bg-white text-white transition-all shadow-sm flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5 group-hover:text-primary" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Notice Card - VISA Card Style with Parallax Carousel */}
      <div
        className="relative w-full overflow-hidden rounded-2xl min-h-[180px]"

        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {filteredNotices.map((notice, index) => {
          const noticeConfig = getNoticeTypeConfig(notice.type);
          const NoticeIcon = noticeConfig.icon;
          const noticeDate = notice.createdAt;
          const noticeFormattedDate = noticeDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          // Calculate position in stack
          const distanceFromCurrent = index - currentIndex;
          const isCurrent = index === currentIndex;
          const isNext = distanceFromCurrent === 1 || (currentIndex === filteredNotices.length - 1 && index === 0);
          const isPrev = distanceFromCurrent === -1 || (currentIndex === 0 && index === filteredNotices.length - 1);

          // Calculate transform and opacity based on position
          let transform = '';
          let opacity = 1;
          let zIndex = filteredNotices.length - Math.abs(distanceFromCurrent);

          if (isCurrent) {
            transform = 'translateX(0) translateY(0) rotate(0deg) scale(1)';
            opacity = 1;
            zIndex = filteredNotices.length + 2;
          } else if (isNext) {
            transform = 'translateX(20px) translateY(8px) rotate(2deg) scale(0.95)';
            opacity = 0.7;
            zIndex = filteredNotices.length + 1;
          } else if (isPrev) {
            transform = 'translateX(-20px) translateY(8px) rotate(-2deg) scale(0.95)';
            opacity = 0.7;
            zIndex = filteredNotices.length;
          } else {
            const offset = Math.abs(distanceFromCurrent) * 15;
            const rotation = distanceFromCurrent > 0 ? 3 : -3;
            transform = `translateX(${distanceFromCurrent > 0 ? offset : -offset}px) translateY(${Math.abs(distanceFromCurrent) * 10}px) rotate(${rotation}deg) scale(${1 - Math.abs(distanceFromCurrent) * 0.05})`;
            opacity = Math.max(0.2, 0.7 - Math.abs(distanceFromCurrent) * 0.15);
            zIndex = Math.max(1, filteredNotices.length - Math.abs(distanceFromCurrent));
          }

          return (
            <div
              key={notice.id}
              className={cn(
                "transition-all duration-500 ease-out",
                isCurrent ? "relative w-full h-auto" : "absolute inset-0 w-full h-full"
              )}
              style={{
                transform,
                opacity,
                zIndex,
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
              }}
            >
              <div
                className={cn(
                  "relative bg-[#0f1729] rounded-2xl shadow-xl transition-all duration-500",
                  "text-white overflow-hidden",
                  "w-full h-full",
                  isCurrent && "border border-white/10"
                )}
              >
                {/* Decorative Background Patterns */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full -ml-30 -mb-30 blur-2xl" />

                {/* Card Chip Effect (Top Left) */}
                <div className="absolute top-6 left-6 w-12 h-10 bg-linear-to-br from-white/20 to-white/5 rounded-md backdrop-blur-sm border border-white/10 shadow-md opacity-40" />

                {/* Contactless Symbol (Top Right) */}
                <div className="absolute top-6 right-6 flex items-center gap-1 opacity-30">
                  <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border border-white/30 rounded-full"></div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col px-8 py-7">
                  {/* Top Section - Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-inner", noticeConfig.badgeColor)}>
                        <NoticeIcon className="h-5 w-5 text-white" />
                      </div>
                      <Badge className={cn("text-white border-white/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1", noticeConfig.badgeColor)}>
                        {noticeConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Section - Title and Description */}
                  <div className="flex-1 flex flex-col justify-start mt-2 mb-4">
                    <h3 className="text-xl font-bold mb-2 text-white leading-tight tracking-tight">
                      {notice.title}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed font-medium">
                      {notice.description}
                    </p>
                  </div>

                  {/* Bottom Section - Card Number Style Layout */}
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-end justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="font-semibold text-[13px] tracking-tight text-white/60 uppercase">{noticeFormattedDate}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NoticeBoard;
