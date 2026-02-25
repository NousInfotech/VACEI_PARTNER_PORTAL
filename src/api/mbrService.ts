import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const MBRStatus = {
  ACTIVE: 'ACTIVE',
  ANNUAL_RETURN_PENDING: 'ANNUAL_RETURN_PENDING',
  FILED: 'FILED',
  OVERDUE: 'OVERDUE',
  STRUCK_OFF: 'STRUCK_OFF',
  CLOSED: 'CLOSED',
} as const;

export type MBRStatus = (typeof MBRStatus)[keyof typeof MBRStatus];

export interface MBRCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: MBRStatus;
  createdAt: string;
  updatedAt: string;
}

export const mbrService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: MBRCycle[] }>(`${endPoints.MBR.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),
  
  create: (data: any) =>
    apiPost<{ data: MBRCycle }>(endPoints.MBR.CREATE, data).then((res) => res.data),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: any }>(endPoints.MBR.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: any }>(endPoints.MBR.UPDATE(id), data).then((res) => res.data),
  
  deleteCycle: (id: string) =>
    apiDelete<{ data: any }>(endPoints.MBR.DELETE(id)).then((res) => res.data),
};
