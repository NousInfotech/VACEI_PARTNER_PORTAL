import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const VATStatus = {
  ACTIVE: 'ACTIVE',
  RETURN_PENDING: 'RETURN_PENDING',
  FILED: 'FILED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export type VATStatus = (typeof VATStatus)[keyof typeof VATStatus];

export interface VATCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: VATStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const vatService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: VATCycle[] }>(`${endPoints.VAT.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),
  
  create: (data: any) =>
    apiPost<{ data: VATCycle }>(endPoints.VAT.CREATE, data).then((res) => res.data),
  
  updateStatus: (id: string, status: VATStatus, reason?: string) =>
    apiPatch<{ data: VATCycle }>(endPoints.VAT.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: VATCycle }>(endPoints.VAT.UPDATE(id), data).then((res) => res.data),
  
  deleteCycle: (id: string) =>
    apiDelete<{ data: any }>(endPoints.VAT.DELETE(id)).then((res) => res.data),
};
