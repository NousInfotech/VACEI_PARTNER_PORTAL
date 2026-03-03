import { apiGet, apiPost, apiPatch, } from '../config/base';
import { endPoints } from '../config/endPoint';

export const AccountingStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type AccountingStatus = (typeof AccountingStatus)[keyof typeof AccountingStatus];

export interface AccountingCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string | null;
  periodEnd: string | null;
  status: AccountingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountingCycleDto {
  engagementId: string;
  periodStart?: string;
  periodEnd?: string;
}

export const accountingService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: AccountingCycle }>(endPoints.ACCOUNTING.GET_BY_ENGAGEMENT_ID(engagementId)).then((res) => {
        // Wrap in array for generic component consistency
        return res.data ? [res.data] : [];
    }),

  getById: (id: string) =>
    apiGet<{ data: AccountingCycle }>(endPoints.ACCOUNTING.GET_CYCLE(id)).then((res) => res.data),

  create: (data: CreateAccountingCycleDto) =>
    apiPost<{ data: AccountingCycle }>(endPoints.ACCOUNTING.CREATE_CYCLE, data).then((res) => res.data),

  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: AccountingCycle }>(endPoints.ACCOUNTING.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPatch<{ data: AccountingCycle }>(endPoints.ACCOUNTING.UPDATE_CYCLE(id), data).then((res) => res.data),
};
