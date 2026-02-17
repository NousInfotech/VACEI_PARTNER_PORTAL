import { apiGet, apiPost, apiPatch, apiDelete } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import type { 
    ChecklistItem, 
    CreateChecklistDto, 
    UpdateChecklistDto, 
    PatchChecklistStatusDto 
} from './types';

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export const checklistService = {
    list: async (engagementId: string): Promise<ChecklistItem[]> => {
        const res = await apiGet<ApiResponse<ChecklistItem[]>>(
            endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)
        );
        return res?.data ?? [];
    },

    create: async (engagementId: string, data: CreateChecklistDto): Promise<ChecklistItem> => {
        const res = await apiPost<ApiResponse<ChecklistItem>>(
            endPoints.ENGAGEMENTS.CHECKLISTS(engagementId),
            data
        );
        return res.data;
    },

    update: async (engagementId: string, checklistId: string, data: UpdateChecklistDto): Promise<ChecklistItem> => {
        const res = await apiPatch<ApiResponse<ChecklistItem>>(
            `${endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)}/${checklistId}`,
            data
        );
        return res.data;
    },

    patchStatus: async (engagementId: string, checklistId: string, data: PatchChecklistStatusDto): Promise<ChecklistItem> => {
        const res = await apiPatch<ApiResponse<ChecklistItem>>(
            `${endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)}/${checklistId}/status`,
            data
        );
        return res.data;
    },

    delete: async (engagementId: string, checklistId: string): Promise<void> => {
        await apiDelete(
            `${endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)}/${checklistId}`
        );
    }
};
