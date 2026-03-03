import { apiGet, apiPost, apiPatch } from '../config/base';
import { endPoints } from '../config/endPoint';

export const AuditStatus = {
  DRAFT: 'DRAFT',
  PLANNING: 'PLANNING',
  FIELDWORK: 'FIELDWORK',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type AuditStatus = (typeof AuditStatus)[keyof typeof AuditStatus];

export interface AuditCycle {
  id: string;
  engagementId: string;
  companyId: string;
  yearEndDate: string;
  status: AuditStatus;
  milestones: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditCycleDto {
  engagementId: string;
  companyId: string;
  yearEndDate: string;
  status?: AuditStatus;
  milestones?: any;
}

export const auditService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: AuditCycle[] }>(`${endPoints.AUDIT.GET_CYCLES}?engagementId=${engagementId}`).then((res) => res.data),

  getById: (id: string) =>
    apiGet<{ data: AuditCycle }>(endPoints.AUDIT.GET_CYCLE(id)).then((res) => res.data),

  create: (data: CreateAuditCycleDto) =>
    apiPost<{ data: AuditCycle }>(endPoints.AUDIT.CREATE_CYCLE, data).then((res) => res.data),

  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: AuditCycle }>(endPoints.AUDIT.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  updateStatusManual: (id: string, status: string) =>
    apiPatch<{ data: AuditCycle }>(endPoints.AUDIT.UPDATE_STATUS(id), { status }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPatch<{ data: AuditCycle }>(endPoints.AUDIT.GET_CYCLE(id), data).then((res) => res.data),
};
