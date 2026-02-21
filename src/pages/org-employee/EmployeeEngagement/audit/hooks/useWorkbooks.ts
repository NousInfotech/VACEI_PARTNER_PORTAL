import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostFormData, apiDelete } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import { useAuth } from "../../../../../context/auth-context-core";

export interface Workbook {
  id: string;
  name: string;
  engagementId: string;
  classification?: string | null;
  cloudFileId: string;
  webUrl?: string | null;
  uploadedBy: string;
  category?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  engagement?: {
    id: string;
    name: string;
  };
}

interface WorkbookListResponse {
  data: Workbook[];
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateWorkbookRequest {
  engagementId: string;
  classification?: string | null;
  cloudFileId: string;
  name: string;
  webUrl?: string | null;
  uploadedBy: string;
  category?: string | null;
}

/**
 * Hook to fetch workbooks for an engagement and optional classification
 */
export const useWorkbooks = (engagementId?: string, classification?: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workbooks', engagementId, classification],
    queryFn: async () => {
      if (!engagementId) return { data: [], total: 0, page: 1, limit: 10 };
      
      const params: Record<string, string> = { engagementId };
      if (classification) {
        // Note: Backend may not support classification filter directly in getAll
        // We may need to filter on frontend or add backend support
      }
      
      const response = await apiGet<WorkbookListResponse>(endPoints.AUDIT.GET_WORKBOOKS, params);
      
      // Backend returns { data: Workbook[], message: string, meta: {...} }
      const workbooks = Array.isArray(response.data) ? response.data : [];
      
      // Filter by classification on frontend if provided
      let filteredWorkbooks = workbooks;
      if (classification) {
        filteredWorkbooks = workbooks.filter((wb: Workbook) => wb.classification === classification);
      }
      
      return {
        data: filteredWorkbooks,
        total: response.meta?.total ?? filteredWorkbooks.length,
        page: response.meta?.page ?? 1,
        limit: response.meta?.limit ?? 100,
      };
    },
    enabled: !!engagementId,
  });

  return {
    workbooks: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to create a workbook
 */
export const useCreateWorkbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWorkbookRequest) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const workbookData: CreateWorkbookRequest = {
        ...data,
        uploadedBy: user.id,
      };
      
      const response = await apiPost<{ data: Workbook }>(endPoints.AUDIT.CREATE_WORKBOOK, workbookData);
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      // Invalidate workbooks query
      queryClient.invalidateQueries({ queryKey: ['workbooks', variables.engagementId, variables.classification] });
      queryClient.invalidateQueries({ queryKey: ['workbooks', variables.engagementId] });
    },
  });
};

/**
 * Hook to delete a workbook
 */
export const useDeleteWorkbook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workbookId: string) => {
      await apiDelete(endPoints.AUDIT.DELETE_WORKBOOK(workbookId));
      return workbookId;
    },
    onSuccess: () => {
      // Invalidate all workbook queries
      queryClient.invalidateQueries({ queryKey: ['workbooks'] });
    },
  });
};

/**
 * Hook to upload a workbook file and create workbook record
 * This handles file upload to library first, then creates workbook record
 */
export const useUploadWorkbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createWorkbook = useCreateWorkbook();

  return useMutation({
    mutationFn: async ({
      file,
      engagementId,
      classification,
      folderId,
      category,
    }: {
      file: File;
      engagementId: string;
      classification?: string | null;
      folderId: string;
      category?: string | null;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Step 1: Upload file to library
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);

      const uploadResponse = await apiPostFormData<{ data: { id: string; file_name: string; url: string } }>(
        endPoints.LIBRARY.FILE_UPLOAD,
        formData
      );

      const uploadedFile = uploadResponse.data || uploadResponse;
      if (!uploadedFile?.id) {
        throw new Error('Failed to upload file');
      }

      // Step 2: Create workbook record
      const workbookData: CreateWorkbookRequest = {
        engagementId,
        classification: classification || null,
        cloudFileId: uploadedFile.id, // Use the file ID from library
        name: file.name,
        webUrl: uploadedFile.url || null,
        uploadedBy: user.id,
        category: category || null,
      };

      const workbook = await createWorkbook.mutateAsync(workbookData);
      return workbook;
    },
    onSuccess: (_, variables) => {
      // Invalidate workbooks query
      queryClient.invalidateQueries({ queryKey: ['workbooks', variables.engagementId, variables.classification] });
      queryClient.invalidateQueries({ queryKey: ['workbooks', variables.engagementId] });
    },
  });
};

