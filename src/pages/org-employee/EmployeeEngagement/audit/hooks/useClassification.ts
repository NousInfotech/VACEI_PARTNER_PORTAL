import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import type { ClassificationGroup } from "../utils/classificationUtils";
import { useEffect, useState } from "react";

interface ClassificationResponse {
  id: string;
  trialBalanceId: string;
  group1: string;
  group2: string;
  group3: string;
  tags: string[];
}

/**
 * Hook to find or create a Classification record from a ClassificationGroup
 * Returns the classificationId that can be used for evidence, procedures, etc.
 */
export const useClassification = (
  classificationGroup: ClassificationGroup | null,
  trialBalanceId: string | undefined
) => {
  const queryClient = useQueryClient();
  const [createdClassificationId, setCreatedClassificationId] = useState<string | null>(null);
  const [hasAttemptedCreate, setHasAttemptedCreate] = useState<string | null>(null); // Store the key that was attempted

  // Create a unique key for this classification attempt
  const classificationKey = trialBalanceId && classificationGroup 
    ? `${trialBalanceId}-${classificationGroup.group1}-${classificationGroup.group2}-${classificationGroup.group3}`
    : null;

  // Query to find existing classification - fetch with high limit to get all
  const { data: existingClassification, isLoading: isLoadingFind, refetch: refetchClassification } = useQuery({
    queryKey: ['classification-by-groups', trialBalanceId, classificationGroup?.group1, classificationGroup?.group2, classificationGroup?.group3],
    queryFn: async () => {
      if (!trialBalanceId || !classificationGroup) return null;

      try {
        // Fetch classifications - use a reasonable limit to avoid backend errors
        // If needed, we can implement pagination later
        const response = await apiGet<{ data: ClassificationResponse[] }>(
          endPoints.AUDIT.GET_CLASSIFICATIONS,
          { trialBalanceId, limit: 100 }
        );

        const data = (response as any)?.data ?? response;
        const classifications = Array.isArray(data) ? data : (data?.data ? data.data : []);
        const found = Array.isArray(classifications) 
          ? classifications.find(
              (c: ClassificationResponse) =>
                c.trialBalanceId === trialBalanceId &&
                c.group1 === classificationGroup.group1 &&
                c.group2 === classificationGroup.group2 &&
                c.group3 === classificationGroup.group3
            )
          : null;

        return found || null;
      } catch (error) {
        // If GET fails, return null so we can still try to create
        console.warn('Failed to fetch classifications, will attempt to create if needed:', error);
        return null;
      }
    },
    enabled: !!trialBalanceId && !!classificationGroup,
    retry: 1, // Limit retries to prevent infinite loops
  });

  // Mutation to create classification if not found
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!trialBalanceId || !classificationGroup) {
        throw new Error('Trial balance ID and classification group are required');
      }

      const response = await apiPost<{ data: ClassificationResponse }>(
        endPoints.AUDIT.CREATE_CLASSIFICATION,
        {
          trialBalanceId,
          group1: classificationGroup.group1,
          group2: classificationGroup.group2,
          group3: classificationGroup.group3,
          tags: [],
        }
      );

      const created = response.data || response;
      setCreatedClassificationId(created.id);
      if (classificationKey) {
        setHasAttemptedCreate(classificationKey);
      }
      return created;
    },
    onSuccess: () => {
      // Invalidate and refetch to get the newly created classification
      queryClient.invalidateQueries({ queryKey: ['classification-by-groups'] });
      refetchClassification();
    },
    onError: (error: any) => {
      // Only mark as attempted if it's a permission error (403) or validation error (400)
      // For other errors (network, etc.), allow retry
      if (classificationKey && (error?.response?.status === 403 || error?.response?.status === 400)) {
        setHasAttemptedCreate(classificationKey);
      }
    },
  });

  // Reset hasAttemptedCreate when classification key changes
  useEffect(() => {
    if (classificationKey && hasAttemptedCreate !== classificationKey) {
      // Reset if the key changed
      if (hasAttemptedCreate !== null) {
        setHasAttemptedCreate(null);
        setCreatedClassificationId(null);
      }
    }
  }, [classificationKey, hasAttemptedCreate]);

  // Auto-create if not found and we have the required data
  // Only attempt once per classification key to prevent infinite loops
  useEffect(() => {
    const shouldAttemptCreate = 
      !isLoadingFind && 
      !existingClassification && 
      !createMutation.isPending &&
      !createdClassificationId &&
      hasAttemptedCreate !== classificationKey &&
      !!trialBalanceId && 
      !!classificationGroup &&
      classificationGroup.group1 &&
      classificationGroup.group2 &&
      classificationGroup.group3;

    if (shouldAttemptCreate) {
      createMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingFind, existingClassification?.id, createMutation.isPending, createdClassificationId, hasAttemptedCreate, classificationKey, trialBalanceId, classificationGroup?.group1, classificationGroup?.group2, classificationGroup?.group3]);

  // Determine the classificationId - prioritize created, then existing
  const classificationId = createdClassificationId || existingClassification?.id || null;

  return {
    classificationId,
    isLoading: isLoadingFind || createMutation.isPending,
    createClassification: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

