import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Skeleton } from "../../../ui/Skeleton";
import { CheckSquare } from "lucide-react";
import { cn } from "../../../lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  status: string;
  category?: string | null;
  deadline?: string | null;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface EngagementTodoViewProps {
  engagementId: string | undefined;
}

export default function EngagementTodoView({ engagementId }: EngagementTodoViewProps) {
  const { data: checklists, isLoading } = useQuery({
    queryKey: ["engagement-checklists", engagementId],
    enabled: !!engagementId,
    queryFn: async () => {
      if (!engagementId) return [];
      const res = await apiGet<ApiResponse<ChecklistItem[]>>(
        endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)
      );
      return (res?.data ?? []) as ChecklistItem[];
    },
  });

  if (!engagementId) {
    return (
      <ShadowCard className="p-10 text-center text-gray-500">
        Open an engagement to view checklists.
      </ShadowCard>
    );
  }

  if (isLoading) {
    return (
      <ShadowCard className="p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </ShadowCard>
    );
  }

  const list: ChecklistItem[] = checklists ?? [];
  if (list.length === 0) {
    return (
      <ShadowCard className="p-10 flex flex-col items-center justify-center text-center">
        <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Todo / Checklists</h2>
        <p className="text-gray-500 mt-2">No checklist items for this engagement yet.</p>
      </ShadowCard>
    );
  }

  return (
    <ShadowCard className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Checklists</h2>
      <ul className="space-y-2">
        {list.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between py-3 px-4 rounded-xl border transition-colors",
              item.status === "DONE"
                ? "bg-green-50 border-green-100"
                : "bg-gray-50/50 border-gray-100 hover:border-primary/20"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-xs font-bold px-2 py-1 rounded uppercase",
                  item.status === "DONE"
                    ? "bg-green-100 text-green-700"
                    : item.status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {item.status?.replace("_", " ") ?? "TO_DO"}
              </span>
              {item.category && (
                <span className="text-xs text-gray-500">{item.category}</span>
              )}
              <span className="text-sm font-medium">{item.title}</span>
            </div>
            {item.deadline && (
              <span className="text-xs text-gray-500">
                {new Date(item.deadline).toLocaleDateString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </ShadowCard>
  );
}
