import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { ShadowCard } from "../../../ui/ShadowCard";
import { Button } from "../../../ui/Button";
import { Skeleton } from "../../../ui/Skeleton";
import { useAuth } from "../../../context/auth-context-core";
import { apiGet } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";

interface OrgEngagement {
  id: string;
  companyName: string;
  name: string | null;
  serviceType: string;
}

interface OrgEngagementResponse {
  data: OrgEngagement[];
  total: number;
  page: number;
  limit: number;
}

export default function Engagement() {
  const { selectedService, organizationMember } = useAuth();
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["employee-engagements", organizationMember?.organizationId],
    enabled: !!hasToken && !!organizationMember?.organizationId,
    queryFn: async () => {
      if (!organizationMember?.organizationId) return [];
      const response = await apiGet<OrgEngagementResponse>(endPoints.ENGAGEMENTS.GET_ALL, {
        organizationId: organizationMember.organizationId,
        page: 1,
        limit: 100,
      });
      return response.data ?? [];
    },
  });

  const engagements = (data ?? []) as OrgEngagement[];
  const filteredEngagements = engagements.filter((engagement) => {
    if (!selectedService) return true;
    return engagement.serviceType === selectedService;
  });

  const handleViewDetails = (engagement: OrgEngagement) => {
    window.open(
      `/engagement-view/${engagement.id}?service=${encodeURIComponent(engagement.serviceType)}`,
      "_blank"
    );
  };

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <ShadowCard key={i} className="p-6 border border-gray-100 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </ShadowCard>
          ))
        ) : (
          filteredEngagements.map((engagement) => (
            <ShadowCard key={engagement.id} className="group relative flex flex-col overflow-hidden border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                    {engagement.name ?? engagement.companyName}
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {engagement.serviceType.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                <Button
                  onClick={() => handleViewDetails(engagement)}
                  className="w-full justify-between rounded-xl bg-slate-900 text-sm font-semibold shadow-none hover:bg-slate-800"
                >
                  <span>View details</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </ShadowCard>
          ))
        )}
      </div>
    </div>
  );
}
