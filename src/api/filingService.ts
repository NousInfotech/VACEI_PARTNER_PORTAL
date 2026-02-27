import { apiGet, apiPost, apiPatch, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const FilingStatus = {
    DRAFT: 'DRAFT',
    FILED: 'FILED',
    CANCELLED: 'CANCELLED',
} as const;
export type FilingStatus = (typeof FilingStatus)[keyof typeof FilingStatus];

export interface FilingItem {
    id: string;
    engagementId: string;
    name: string;
    fileId: string;
    folderId: string;
    status: FilingStatus;
    statusHistory: any[];
    createdAt: string;
    updatedAt: string;
    file?: {
        id: string;
        file_name: string;
        file_size: number;
        url: string;
    };
}

export const filingService = {
    getByEngagementId: (engagementId: string) =>
        apiGet<{ data: FilingItem[] }>(endPoints.ENGAGEMENTS.FILINGS(engagementId)).then((res) => res.data),

    getById: (engagementId: string, filingId: string) =>
        apiGet<{ data: FilingItem }>(`${endPoints.ENGAGEMENTS.FILINGS(engagementId)}/${filingId}`).then((res) => res.data),

    upload: (engagementId: string, name: string, file: File) => {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);
        return apiPost<{ data: FilingItem }>(endPoints.ENGAGEMENTS.FILINGS(engagementId), formData).then((res) => res.data);
    },

    updateStatus: (engagementId: string, filingId: string, status: FilingStatus, reason?: string) =>
        apiPatch<{ data: FilingItem }>(endPoints.ENGAGEMENTS.FILING_STATUS(engagementId, filingId), { status, reason }).then((res) => res.data),

    delete: (engagementId: string, filingId: string) =>
        apiDelete<void>(`${endPoints.ENGAGEMENTS.FILINGS(engagementId)}/${filingId}`),
};
