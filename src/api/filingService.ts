import { apiGet, apiPatch, apiDelete, apiPostFormData, apiPost } from '../config/base';
import { endPoints } from '../config/endPoint';

export const FilingStatus = {
    DRAFT: 'DRAFT',
    CLIENT_REVIEW: 'CLIENT_REVIEW',
    FILED: 'FILED',
    CANCELLED: 'CANCELLED',
} as const;
export type FilingStatus = (typeof FilingStatus)[keyof typeof FilingStatus];

export interface FilingFileView {
    id: string;
    fileId: string;
    file: {
        id: string;
        file_name: string;
        file_size?: number;
        url: string;
    };
}

export interface FilingItem {
    id: string;
    engagementId: string;
    name: string;
    folderId: string;
    status: FilingStatus;
    statusHistory: any[];
    createdAt: string;
    updatedAt: string;
    files: FilingFileView[];
    comments?: FilingCommentItem[];
    signOffs?: FilingSignOffItem[];
    documentRequestId?: string | null;
}

export interface FilingCommentItem {
    id: string;
    engagementFilingId: string;
    userId: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    comment: string;
    parentCommentId: string | null;
    referencedFileIds?: string[];
    createdAt: string;
    updatedAt: string;
    replies?: FilingCommentItem[];
}

export interface FilingSignOffItem {
    id: string;
    engagementFilingId: string;
    userId: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    signOffStatus: boolean;
    createdAt: string;
}

export const filingService = {
    getByEngagementId: (engagementId: string) =>
        apiGet<{ data: FilingItem[] }>(endPoints.ENGAGEMENTS.FILINGS(engagementId)).then((res) => res.data),

    getById: (engagementId: string, filingId: string) =>
        apiGet<{ data: FilingItem }>(`${endPoints.ENGAGEMENTS.FILINGS(engagementId)}/${filingId}`).then((res) => res.data),

    upload: async (engagementId: string, name: string, files: File[]) => {
        const formData = new FormData();
        formData.append('name', name);
        files.forEach((file) => formData.append('files', file));
        const res = await apiPostFormData<{ data: FilingItem }>(endPoints.ENGAGEMENTS.FILINGS(engagementId), formData);
        return res.data;
    },

    addFiles: (engagementId: string, filingId: string, files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return apiPostFormData<{ data: FilingItem }>(endPoints.ENGAGEMENTS.FILING_FILES(engagementId, filingId), formData).then((res) => res.data);
    },

    updateStatus: (engagementId: string, filingId: string, status: FilingStatus, reason?: string) =>
        apiPatch<{ data: FilingItem }>(endPoints.ENGAGEMENTS.FILING_STATUS(engagementId, filingId), { status, reason }).then((res) => res.data),

    delete: (engagementId: string, filingId: string) =>
        apiDelete<void>(`${endPoints.ENGAGEMENTS.FILINGS(engagementId)}/${filingId}`),

    // Comments
    getComments: (engagementId: string, filingId: string) =>
        apiGet<{ data: FilingCommentItem[] }>(endPoints.ENGAGEMENTS.FILING_COMMENTS(engagementId, filingId)).then((res) => res.data),

    addComment: (engagementId: string, filingId: string, comment: string, parentCommentId?: string, referencedFileIds?: string[]) =>
        apiPost<{ data: FilingCommentItem }>(endPoints.ENGAGEMENTS.FILING_COMMENTS(engagementId, filingId), { comment, parentCommentId, referencedFileIds }).then((res) => res.data),

    // Sign-offs
    getSignOffs: (engagementId: string, filingId: string) =>
        apiGet<{ data: FilingSignOffItem[] }>(endPoints.ENGAGEMENTS.FILING_SIGN_OFFS(engagementId, filingId)).then((res) => res.data),

    toggleSignOff: (engagementId: string, filingId: string, signOffStatus: boolean) =>
        apiPost<{ data: FilingSignOffItem }>(endPoints.ENGAGEMENTS.FILING_SIGN_OFFS(engagementId, filingId), { signOffStatus }).then((res) => res.data),

    createDocumentRequest: (engagementId: string, filingId: string, engagementFilingDocuments: string[]) =>
        apiPost<{ data: any }>(`${endPoints.ENGAGEMENTS.FILINGS(engagementId)}/${filingId}/document-request`, { engagementFilingDocuments }).then((res) => res.data),
};
