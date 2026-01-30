
export const VATCycleStatus = {
    DRAFT: 'DRAFT',
    DATA_COLLECTING: 'DATA_COLLECTING',
    REVIEW_IN_PROGRESS: 'REVIEW_IN_PROGRESS',
    CLARIFICATION_NEEDED: 'CLARIFICATION_NEEDED',
    READY_TO_FILE: 'READY_TO_FILE',
    FILED: 'FILED',
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    PAID: 'PAID',
    COMPLETED: 'COMPLETED'
} as const;

export type VATCycleStatus = typeof VATCycleStatus[keyof typeof VATCycleStatus];

export const PayrollCycleStatus = {
    DRAFT: 'DRAFT',
    DATA_COLLECTION: 'DATA_COLLECTION',
    CALCULATION_IN_PROGRESS: 'CALCULATION_IN_PROGRESS',
    REVIEW_IN_PROGRESS: 'REVIEW_IN_PROGRESS',
    CLARIFICATION_NEEDED: 'CLARIFICATION_NEEDED',
    APPROVED: 'APPROVED',
    PROCESSING_PAYMENTS: 'PROCESSING_PAYMENTS',
    PAID: 'PAID',
    STATUTORY_FILING: 'STATUTORY_FILING',
    COMPLETED: 'COMPLETED'
} as const;

export type PayrollCycleStatus = typeof PayrollCycleStatus[keyof typeof PayrollCycleStatus];

export const EmployeePayrollStatus = {
    PENDING_DATA: 'PENDING_DATA',
    CALCULATED: 'CALCULATED',
    ON_HOLD: 'ON_HOLD',
    APPROVED: 'APPROVED',
    PAID: 'PAID',
    FAILED: 'FAILED',
    ADJUSTED: 'ADJUSTED'
} as const;

export type EmployeePayrollStatus = typeof EmployeePayrollStatus[keyof typeof EmployeePayrollStatus];

export interface VATCycle {
    id: string;
    periodStart: string;
    periodEnd: string;
    filingDeadline: string;
    paymentDeadline: string;
    status: VATCycleStatus;
    totalLiability?: number;
    paymentReference?: string;
}

export interface PayrollCycle {
    id: string;
    period: string; // e.g. "October 2024"
    status: PayrollCycleStatus;
    totalSalaries: number;
    employeeCount: number;
    paymentDateline: string;
}

export interface EmployeePayroll {
    id: string;
    employeeName: string;
    employeeId: string;
    basicSalary: number;
    netPay: number;
    status: EmployeePayrollStatus;
    notes?: string;
}
