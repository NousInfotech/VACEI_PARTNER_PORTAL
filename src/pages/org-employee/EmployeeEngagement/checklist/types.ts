export type ChecklistTaskType = 'checkbox' | 'date' | 'text' | 'select' | 'info';
export type ChecklistTaskStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable';

export interface ChecklistTask {
    id: string;
    title: string;
    type: ChecklistTaskType;
    status: ChecklistTaskStatus;
    notes?: string;
    dueDate?: string;
    assignedTo?: string;
    selectOptions?: string[];
}

export interface ChecklistSection {
    id: string;
    title: string;
    tasks: ChecklistTask[];
}

export interface ChecklistPhase {
    id: string;
    title: string;
    sections: ChecklistSection[];
}
