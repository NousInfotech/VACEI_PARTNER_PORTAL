import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const CSPStatus = {
  ACTIVE: 'ACTIVE',
  COMPLIANT: 'COMPLIANT',
  PENDING_ACTION: 'PENDING_ACTION',
  OVERDUE: 'OVERDUE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;
export type CSPStatus = (typeof CSPStatus)[keyof typeof CSPStatus];

export const CSPItemType = {
  ANNUAL_RETURN: 'ANNUAL_RETURN',
  DIRECTOR_CHANGE: 'DIRECTOR_CHANGE',
  SHARE_TRANSFER: 'SHARE_TRANSFER',
  UBO_UPDATE: 'UBO_UPDATE',
  REGISTERED_OFFICE_CHANGE: 'REGISTERED_OFFICE_CHANGE',
  CAPITAL_CHANGE: 'CAPITAL_CHANGE',
  STRIKE_OFF: 'STRIKE_OFF',
  OTHER: 'OTHER',
} as const;
export type CSPItemType = (typeof CSPItemType)[keyof typeof CSPItemType];

export const CSPItemStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  FILED: 'FILED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  OVERDUE: 'OVERDUE',
  CLOSED: 'CLOSED',
} as const;
export type CSPItemStatus = (typeof CSPItemStatus)[keyof typeof CSPItemStatus];

export interface CspCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string | null;
  status: CSPStatus;
  nextDueDate: string | null;
  notes: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface CspItem {
  id: string;
  cspCycleId: string;
  type: CSPItemType;
  title: string | null;
  dueDate: string | null;
  filedDate: string | null;
  status: CSPItemStatus;
  referenceNo: string | null;
  notes: string | null;
  metadata: any | null;
  createdAt: string;
}

export interface CreateCspCycleDto {
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd?: string | null;
  status?: CSPStatus;
  nextDueDate?: string | null;
  notes?: string | null;
  metadata?: any | null;
}

export interface UpdateCspCycleStatusDto {
  status: CSPStatus;
  reason?: string;
}

export interface CreateCspItemDto {
  type: CSPItemType;
  title?: string | null;
  dueDate?: string | null;
  filedDate?: string | null;
  status?: CSPItemStatus;
  referenceNo?: string | null;
  notes?: string | null;
  metadata?: any | null;
}

export interface UpdateCspItemDto extends Partial<CreateCspItemDto> {}

export const cspService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: CspCycle[] }>(`${endPoints.CSP.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),

  getById: (id: string) =>
    apiGet<{ data: CspCycle }>(endPoints.CSP.BY_ID(id)).then((res) => res.data),

  create: (data: CreateCspCycleDto) =>
    apiPost<{ data: CspCycle }>(endPoints.CSP.CREATE, data).then((res) => res.data),

  updateStatus: (id: string, data: UpdateCspCycleStatusDto) =>
    apiPatch<{ data: CspCycle }>(endPoints.CSP.UPDATE_STATUS(id), data).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: CspCycle }>(endPoints.CSP.UPDATE(id), data).then((res) => res.data),

  getAllItems: (cycleId: string) =>
    apiGet<{ data: CspItem[] }>(`${endPoints.CSP.BY_ID(cycleId)}/items`).then((res) => res.data),

  createItem: (cycleId: string, data: CreateCspItemDto) =>
    apiPost<{ data: CspItem }>(`${endPoints.CSP.BY_ID(cycleId)}/items`, data).then((res) => res.data),

  updateItem: (cycleId: string, itemId: string, data: UpdateCspItemDto) =>
    apiPatch<{ data: CspItem }>(`${endPoints.CSP.BY_ID(cycleId)}/items/${itemId}`, data).then((res) => res.data),

  deleteItem: (cycleId: string, itemId: string) =>
    apiDelete<{ data: any }>(`${endPoints.CSP.BY_ID(cycleId)}/items/${itemId}`).then((res) => res.data),
};
