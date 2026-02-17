import { Bell, AlertCircle, Info, CheckCircle, AlertTriangle, Megaphone, Clock, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/Button';
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import type { Notice as ApiNotice } from '../../../types/notice';

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
const Spinner = ({ className }: { className?: string }) => (
  <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4", className)} />
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
  const configs: Record<string, { icon: LucideIcon, badgeColor: string, label: string }> = {
    emergency: {
      icon: AlertCircle,
      badgeColor: "bg-red-500",
      label: "Emergency",
    },
    warning: {
      icon: AlertTriangle,
      badgeColor: "bg-orange-500",
      label: "Warning",
    },
    update: {
      icon: Info,
      badgeColor: "bg-blue-500",
      label: "Update",
    },
    announcement: {
      icon: Megaphone,
      badgeColor: "bg-purple-500",
      label: "Announcement",
    },
    reminder: {
      icon: Clock,
      badgeColor: "bg-yellow-500",
      label: "Reminder",
    },
    info: {
      icon: Info,
      badgeColor: "bg-gray-500",
      label: "Info",
    },
    success: {
      icon: CheckCircle,
      badgeColor: "bg-green-500",
      label: "Success",
    }
  };
  return configs[type] || configs.info;
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


  if (loading || error || filteredNotices.length === 0) {
    return (
      <div className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100 flex items-center justify-center min-h-[200px]">
        {loading ? <Spinner className="h-8 w-8 text-primary" /> : 
         error ? <p className="text-red-500">{error}</p> : 
         <p className="text-gray-400 font-medium">No notices for today.</p>}
      </div>
    );
  }

  const notice = filteredNotices[currentIndex];
  const config = getNoticeTypeConfig(notice.type);
  const Icon = config.icon;

  return (
    <div className="space-y-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Notice Board</h2>
          <Badge variant="secondary" className="rounded-full">
            {filteredNotices.length}
          </Badge>
        </div>
        {filteredNotices.length > 1 && (
          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + filteredNotices.length) % filteredNotices.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-gray-400">
              {currentIndex + 1} / {filteredNotices.length}
            </span>
            <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % filteredNotices.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative bg-[#0f1729] rounded-3xl p-8 text-white overflow-hidden shadow-2xl min-h-[240px] flex flex-col justify-between border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full -ml-24 -mb-24 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2 rounded-xl border border-white/10", config.badgeColor)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <Badge className={cn("text-white border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1", config.badgeColor)}>
              {config.label}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">{notice.title}</h3>
          <p className="text-white/70 text-sm leading-relaxed font-medium line-clamp-3">
            {notice.description}
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between pt-6 border-t border-white/10 mt-6">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Posted On</p>
            <div className="flex items-center gap-2 text-white/80 font-semibold text-sm">
              <Clock className="h-3.5 w-3.5 opacity-40" />
              {notice.createdAt.toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-1.5">
            {notice.roles.map(role => (
              <Badge key={role} className="bg-white/5 text-white/60 border-white/10 text-[9px] font-bold px-2 py-0.5">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
