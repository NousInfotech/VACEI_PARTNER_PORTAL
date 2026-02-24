import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const TAXStatus = {
  DRAFT: 'DRAFT',
  RETURN_PENDING: 'RETURN_PENDING',
  FILED: 'FILED',
  PAID: 'PAID',
  UNDER_REVIEW: 'UNDER_REVIEW',
  OVERDUE: 'OVERDUE',
  CLOSED: 'CLOSED',
} as const;

export type TAXStatus = (typeof TAXStatus)[keyof typeof TAXStatus];

export interface TAXCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: TAXStatus;
  createdAt: string;
  updatedAt: string;
}

export const taxService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: TAXCycle[] }>(`${endPoints.TAX.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),
  
  create: (data: any) =>
    apiPost<{ data: TAXCycle }>(endPoints.TAX.CREATE, data).then((res) => res.data),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: any }>(endPoints.TAX.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: any }>(endPoints.TAX.UPDATE(id), data).then((res) => res.data),
  
  deleteCycle: (id: string) =>
    apiDelete<{ data: any }>(endPoints.TAX.DELETE(id)).then((res) => res.data),
};
