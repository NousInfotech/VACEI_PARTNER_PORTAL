import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../config/base';
import { endPoints } from '../config/endPoint';
import { useAuth } from '../context/auth-context-core';
import { AVAILABLE_SERVICES } from '../lib/types';

export interface OrganizationAnalytics {
  companies: number;
  engagements: number;
  checklists: number;
}

interface ApiResponse {
  success?: boolean;
  data?: OrganizationAnalytics;
}

const STANDARD_SERVICE_IDS = new Set(AVAILABLE_SERVICES.filter(s => s.id !== 'CUSTOM').map(s => s.id));

/**
 * Fetches organization analytics (companies, engagements, pending checklists) for the current org user.
 * Uses GET /engagements/analytics/organization?organizationId=xxx&serviceCategory=xxx&customServiceCycleId=xxx.
 * When selectedService changes (e.g. from TopHeader dropdown), analytics are refetched for that service.
 */
export function useOrganizationAnalytics() {
  const { organizationMember, selectedService } = useAuth();
  const organizationId = organizationMember?.organizationId ?? null;

  const query = useQuery({
    queryKey: ['organization-analytics', organizationId, selectedService ?? null],
    enabled: !!organizationId,
    queryFn: async (): Promise<OrganizationAnalytics> => {
      const params: Record<string, string> = { organizationId: organizationId! };
      if (selectedService) {
        if (STANDARD_SERVICE_IDS.has(selectedService)) {
          params.serviceCategory = selectedService;
        } else {
          params.serviceCategory = 'CUSTOM';
          params.customServiceCycleId = selectedService;
        }
      }
      const res = await apiGet<ApiResponse>(endPoints.ENGAGEMENTS.ANALYTICS_ORGANIZATION, params);
      const data = (res as ApiResponse)?.data;
      if (data == null) {
        return { companies: 0, engagements: 0, checklists: 0 };
      }
      return {
        companies: data.companies ?? 0,
        engagements: data.engagements ?? 0,
        checklists: data.checklists ?? 0,
      };
    },
  });

  return {
    data: query.data ?? { companies: 0, engagements: 0, checklists: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
