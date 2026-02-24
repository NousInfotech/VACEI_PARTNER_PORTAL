import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const CFOStatus = {
  ACTIVE: 'ACTIVE',
  REPORTING: 'REPORTING',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED',
} as const;

export type CFOStatus = (typeof CFOStatus)[keyof typeof CFOStatus];

export interface CFOCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: CFOStatus;
  createdAt: string;
  updatedAt: string;
}

export const cfoService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: CFOCycle[] }>(`${endPoints.CFO.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),
  
  create: (data: any) =>
    apiPost<{ data: CFOCycle }>(endPoints.CFO.CREATE, data).then((res) => res.data),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: any }>(endPoints.CFO.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: any }>(endPoints.CFO.UPDATE(id), data).then((res) => res.data),
  
  deleteCycle: (id: string) =>
    apiDelete<{ data: any }>(endPoints.CFO.DELETE(id)).then((res) => res.data),
};
