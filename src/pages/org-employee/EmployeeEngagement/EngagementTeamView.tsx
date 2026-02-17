import { ShadowCard } from "../../../ui/ShadowCard";
import { Users } from "lucide-react";

interface EngagementTeamViewProps {
  orgTeam: unknown;
  engagementId: string | undefined;
}

/** orgTeam from backend is a JSON object; structure may vary (e.g. { memberIds: string[] } or full member objects). */
export default function EngagementTeamView({ orgTeam, engagementId }: EngagementTeamViewProps) {
  if (!engagementId) {
    return (
      <ShadowCard className="p-10 text-center text-gray-500">
        Open an engagement to view the team.
      </ShadowCard>
    );
  }

  const team = orgTeam as Record<string, unknown> | null | undefined;
  const hasTeam = team && typeof team === "object" && Object.keys(team).length > 0;

  if (!hasTeam) {
    return (
      <ShadowCard className="p-10 flex flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Team</h2>
        <p className="text-gray-500 mt-2">No team members assigned to this engagement yet.</p>
      </ShadowCard>
    );
  }

  const entries = Object.entries(team);
  return (
    <ShadowCard className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Assigned Team
      </h2>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 border border-gray-100"
          >
            <span className="text-sm font-medium text-gray-700">{key}</span>
            <span className="text-xs text-gray-500">
              {typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </ShadowCard>
  );
}
