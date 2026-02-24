import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const PayrollStatus = {
  DRAFT: 'DRAFT',
  PROCESSED: 'PROCESSED',
  SUBMITTED: 'SUBMITTED',
  PAID: 'PAID',
} as const;

export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus];

export interface PayrollCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export const payrollService = {
  getAll: (engagementId: string) =>
    apiGet<{ data: PayrollCycle[] }>(`${endPoints.PAYROLL.GET_ALL}?engagementId=${engagementId}`).then((res) => res.data),
  
  create: (data: any) =>
    apiPost<{ data: PayrollCycle }>(endPoints.PAYROLL.CREATE, data).then((res) => res.data),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    apiPatch<{ data: any }>(endPoints.PAYROLL.UPDATE_STATUS(id), { status, reason }).then((res) => res.data),

  update: (id: string, data: any) =>
    apiPut<{ data: any }>(endPoints.PAYROLL.UPDATE(id), data).then((res) => res.data),
  
  deleteCycle: (id: string) =>
    apiDelete<{ data: any }>(endPoints.PAYROLL.DELETE(id)).then((res) => res.data),
};
