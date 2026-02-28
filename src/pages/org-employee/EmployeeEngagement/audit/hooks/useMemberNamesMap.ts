import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";

interface MemberItem {
  id: string;
  userId?: string;
  user?: { id?: string; firstName?: string; lastName?: string; email?: string | null };
}

function toDisplayName(m: MemberItem): string {
  const u = m.user;
  if (!u) return m.id;
  const first = u.firstName ?? "";
  const last = u.lastName ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || (u.email ?? "") || m.id;
}

/**
 * Returns a map of user/member ID -> display name for the organization.
 * Fetches GET /organization-members once and indexes by both member.id and member.userId
 * so procedure review fields (approvedBy, signedOffBy, etc.) can show names instead of UUIDs.
 */
export function useMemberNamesMap(enabled: boolean = true) {
  const { data: listRes } = useQuery({
    queryKey: ["organization-members-names"],
    queryFn: async () => {
      const res = await apiGet<{ data?: MemberItem[] }>(endPoints.ORGANIZATION.GET_MEMBERS, {
        limit: 200,
      });
      const data = (res as any)?.data ?? res;
      const arr = Array.isArray(data) ? data : (data?.data ? data.data : []);
      return arr as MemberItem[];
    },
    enabled,
  });

  const members = listRes ?? [];
  const map: Record<string, string> = {};
  members.forEach((m) => {
    const name = toDisplayName(m);
    map[m.id] = name;
    if (m.userId) map[m.userId] = name;
    if (m.user?.id) map[m.user.id] = name;
  });

  return map;
}
