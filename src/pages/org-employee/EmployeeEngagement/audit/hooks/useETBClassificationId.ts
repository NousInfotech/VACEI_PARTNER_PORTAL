import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import { useEffect, useState } from "react";

const ETB_GROUP1 = "Extended Trial Balance";
const ETB_GROUP2 = "ETB";
const ETB_GROUP3 = "All";

interface ClassificationResponse {
  id: string;
  trialBalanceId: string;
  group1: string;
  group2: string;
  group3: string;
  tags: string[];
}

/**
 * Returns the classification ID for the "Extended Trial Balance" section
 * for the given trial balance. Finds existing or creates one with
 * group1="Extended Trial Balance", group2="ETB", group3="All".
 * Used for Review / Sign-off / Review History on the ETB menu item.
 */
export function useETBClassificationId(trialBalanceId: string | undefined) {
  const queryClient = useQueryClient();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createAttempted, setCreateAttempted] = useState(false);

  const { data: listRes, isLoading: isLoadingFind, refetch } = useQuery({
    queryKey: ["etb-classification", trialBalanceId],
    queryFn: async () => {
      if (!trialBalanceId) return null;
      const res = await apiGet<{ data?: ClassificationResponse[] }>(
        endPoints.AUDIT.GET_CLASSIFICATIONS,
        { trialBalanceId, limit: 100 }
      );
      const data = (res as any)?.data ?? res;
      const arr = Array.isArray(data) ? data : (data?.data ? data.data : []);
      const found = arr.find(
        (c: ClassificationResponse) =>
          c.trialBalanceId === trialBalanceId &&
          c.group1 === ETB_GROUP1 &&
          c.group2 === ETB_GROUP2 &&
          c.group3 === ETB_GROUP3
      );
      return found ?? null;
    },
    enabled: !!trialBalanceId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!trialBalanceId) throw new Error("Trial balance ID required");
      const res = await apiPost<{ data?: ClassificationResponse }>(
        endPoints.AUDIT.CREATE_CLASSIFICATION,
        {
          trialBalanceId,
          group1: ETB_GROUP1,
          group2: ETB_GROUP2,
          group3: ETB_GROUP3,
          tags: [],
        }
      );
      const created = (res as any)?.data ?? res;
      setCreatedId(created.id);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etb-classification", trialBalanceId] });
      refetch();
    },
    onSettled: () => setCreateAttempted(true),
  });

  useEffect(() => {
    if (!trialBalanceId) {
      setCreatedId(null);
      setCreateAttempted(false);
    }
  }, [trialBalanceId]);

  useEffect(() => {
    if (
      !isLoadingFind &&
      !listRes &&
      trialBalanceId &&
      !createMutation.isPending &&
      !createdId &&
      !createAttempted
    ) {
      setCreateAttempted(true);
      createMutation.mutate();
    }
  }, [isLoadingFind, listRes, trialBalanceId, createMutation.isPending, createdId, createAttempted]);

  const etbClassificationId = createdId ?? listRes?.id ?? null;
  const isLoading =
    isLoadingFind || createMutation.isPending || (!!trialBalanceId && !listRes && !createdId);

  return { etbClassificationId, isLoading };
}
