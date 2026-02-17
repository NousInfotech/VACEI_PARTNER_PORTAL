export type ChecklistTaskType = 'checkbox' | 'date' | 'text' | 'select' | 'info';

export const ChecklistStatus = {
    TO_DO: 'TO_DO',
    IN_PROGRESS: 'IN_PROGRESS',
    IGNORED: 'IGNORED',
    COMPLETED: 'COMPLETED',
} as const;

export type ChecklistStatus = typeof ChecklistStatus[keyof typeof ChecklistStatus];

export interface ChecklistCreator {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface ChecklistItem {
    id: string;
    engagementId: string;
    title: string;
    status: ChecklistStatus;
    category?: string | null;
    deadline?: string | null;
    level: number;
    parentId?: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    creator?: ChecklistCreator;
    children?: ChecklistItem[];
}

export interface CreateChecklistDto {
    title: string;
    category?: string | null;
    status?: ChecklistStatus;
    deadline?: string | null;
    parentId?: string | null;
}

export interface UpdateChecklistDto {
    title?: string;
    category?: string | null;
    deadline?: string | null;
    parentId?: string | null;
}

export interface PatchChecklistStatusDto {
    status: ChecklistStatus;
    reason?: string;
}
