import {
    type VATCycle,
    VATCycleStatus,
    type PayrollCycle,
    PayrollCycleStatus,
    type EmployeePayroll,
    EmployeePayrollStatus
} from "./types";

export const MOCK_VAT_CYCLES: VATCycle[] = [
    {
        id: '2024-Q3',
        periodStart: '2024-07-01',
        periodEnd: '2024-09-30',
        filingDeadline: '2024-10-31',
        paymentDeadline: '2024-11-28',
        status: VATCycleStatus.REVIEW_IN_PROGRESS,
        totalLiability: 12500,
    },
    {
        id: '2024-Q2',
        periodStart: '2024-04-01',
        periodEnd: '2024-06-30',
        filingDeadline: '2024-07-31',
        paymentDeadline: '2024-08-28',
        status: VATCycleStatus.COMPLETED,
        totalLiability: 10200,
        paymentReference: 'TRX-998877'
    }
];

export const MOCK_PAYROLL_CYCLES: PayrollCycle[] = [
    {
        id: '2024-10',
        period: 'October 2024',
        status: PayrollCycleStatus.CALCULATION_IN_PROGRESS,
        totalSalaries: 45000,
        employeeCount: 12,
        paymentDateline: '2024-10-30',
    },
    {
        id: '2024-09',
        period: 'September 2024',
        status: PayrollCycleStatus.COMPLETED,
        totalSalaries: 44500,
        employeeCount: 12,
        paymentDateline: '2024-09-30',
    }
];

export const MOCK_EMPLOYEES_PAYROLL: EmployeePayroll[] = [
    { id: 'emp-001', employeeName: 'John Doe', employeeId: 'E001', basicSalary: 5000, netPay: 4800, status: EmployeePayrollStatus.CALCULATED },
    { id: 'emp-002', employeeName: 'Jane Smith', employeeId: 'E002', basicSalary: 6000, netPay: 5800, status: EmployeePayrollStatus.CALCULATED },
    { id: 'emp-003', employeeName: 'Bob Johnson', employeeId: 'E003', basicSalary: 4500, netPay: 4200, status: EmployeePayrollStatus.PENDING_DATA, notes: 'Missing attendance' },
    { id: 'emp-004', employeeName: 'Alice Brown', employeeId: 'E004', basicSalary: 5500, netPay: 5300, status: EmployeePayrollStatus.CALCULATED },
    { id: 'emp-005', employeeName: 'Charlie Davis', employeeId: 'E005', basicSalary: 7000, netPay: 6800, status: EmployeePayrollStatus.ON_HOLD, notes: 'Dispute on overtime' },
];
