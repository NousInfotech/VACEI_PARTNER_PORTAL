import { apiGet, apiPost, apiPatch, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';
import { EmployeePayrollStatus } from '../pages/org-employee/EmployeeEngagement/status-cycles/types';

export interface EmployeePayroll {
    id: string;
    payrollCycleId: string;
    companyId: string;
    employeeCode?: string;
    firstName: string;
    lastName: string;
    status: EmployeePayrollStatus;
    grossSalary: number;
    deductions: number;
    netSalary: number;
    allowances?: number;
    bonuses?: number;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export const payrollEmployeeService = {
    getAll: (payrollCycleId: string) =>
        apiGet<{ data: EmployeePayroll[] }>(endPoints.PAYROLL.EMPLOYEES(payrollCycleId)).then((res) => res.data),

    create: (payrollCycleId: string, data: any) =>
        apiPost<{ data: EmployeePayroll }>(endPoints.PAYROLL.EMPLOYEES(payrollCycleId), data).then((res) => res.data),

    update: (payrollCycleId: string, id: string, data: any) =>
        apiPatch<{ data: EmployeePayroll }>(endPoints.PAYROLL.EMPLOYEE_BY_ID(payrollCycleId, id), data).then((res) => res.data),

    delete: (payrollCycleId: string, id: string) =>
        apiDelete<{ data: any }>(endPoints.PAYROLL.EMPLOYEE_BY_ID(payrollCycleId, id)).then((res) => res.data),

    softDelete: (payrollCycleId: string, id: string) =>
        apiPatch<{ data: EmployeePayroll }>(`${endPoints.PAYROLL.EMPLOYEE_BY_ID(payrollCycleId, id)}/soft-delete`, {}).then((res) => res.data),
};
