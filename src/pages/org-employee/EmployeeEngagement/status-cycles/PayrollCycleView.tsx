import { useState } from 'react';
import { CheckCircle2, Building2, User, AlertTriangle, Download, PenLine } from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { PayrollCycleStatus, EmployeePayrollStatus } from './types';
import { MOCK_PAYROLL_CYCLES, MOCK_EMPLOYEES_PAYROLL } from './data';
import { cn } from '../../../../lib/utils';
import ChangeStatusDialog from './components/ChangeStatusDialog';

const ORG_STATUS_STEPS = [
    { id: PayrollCycleStatus.DRAFT, label: 'Draft' },
    { id: PayrollCycleStatus.DATA_COLLECTION, label: 'Data Collection' },
    { id: PayrollCycleStatus.CALCULATION_IN_PROGRESS, label: 'Calculating' },
    { id: PayrollCycleStatus.REVIEW_IN_PROGRESS, label: 'Review' },
    { id: PayrollCycleStatus.APPROVED, label: 'Approved' },
    { id: PayrollCycleStatus.PROCESSING_PAYMENTS, label: 'Processing' },
    { id: PayrollCycleStatus.PAID, label: 'Paid' },
    { id: PayrollCycleStatus.STATUTORY_FILING, label: 'Filing' },
    { id: PayrollCycleStatus.COMPLETED, label: 'Completed' },
];

export default function PayrollCycleView() {
    const [currentCycle, setCurrentCycle] = useState(MOCK_PAYROLL_CYCLES[0]);
    const employees = MOCK_EMPLOYEES_PAYROLL;
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

    const currentStepIndex = ORG_STATUS_STEPS.findIndex(s => s.id === currentCycle.status);

    return (
        <div className="space-y-8">
            {/* Organization Cycle Status */}
            <ShadowCard className="p-6">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Payroll Run: {currentCycle.period}</h3>
                            <p className="text-sm text-gray-500">{currentCycle.employeeCount} Employees • Total: €{currentCycle.totalSalaries.toLocaleString()}</p>
                        </div>
                    </div>
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                        currentCycle.status === PayrollCycleStatus.COMPLETED ? "bg-green-100 text-green-700" :
                            currentCycle.status === PayrollCycleStatus.CLARIFICATION_NEEDED ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                    )}>
                        {currentCycle.status.replace(/_/g, " ")}
                    </span>
                </div>

                {/* Timeline */}
                <div className="relative mb-12 px-4">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (ORG_STATUS_STEPS.length - 1)) * 100}%` }}
                    />

                    <div className="relative flex justify-between w-full">
                        {ORG_STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default relative">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full flex items-center justify-center border-2 z-10 transition-all bg-white",
                                        isCompleted ? "bg-blue-500 border-blue-500" : "border-gray-200",
                                        isCurrent && "ring-4 ring-blue-50 scale-125"
                                    )} />
                                    <div className="absolute -bottom-8 flex flex-col items-center w-20 text-center">
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap",
                                            isCompleted ? "text-blue-600" : "text-gray-400"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <Button variant="outline" className="gap-2">
                        <Download size={16} />
                        Download Summary
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setIsStatusDialogOpen(true)}
                    >
                        <PenLine size={16} />
                        Update Status
                    </Button>
                    {currentCycle.status === PayrollCycleStatus.REVIEW_IN_PROGRESS && (
                        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                            <CheckCircle2 size={16} />
                            Approve Payroll
                        </Button>
                    )}
                </div>
            </ShadowCard>

            {/* Individual Employee Statuses */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Employee Breakdown</h3>
                        <p className="text-sm text-gray-500">Status per employee for {currentCycle.period}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">5 Calculated</span>
                        <span className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded">1 On Hold</span>
                    </div>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4 text-right">Basic Salary</th>
                            <th className="px-6 py-4 text-right">Net Pay</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <User size={14} />
                                    </div>
                                    {emp.employeeName}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{emp.employeeId}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-600">€{emp.basicSalary.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">€{emp.netPay.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <EmployeeStatusBadge status={emp.status} />
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs italic">{emp.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ChangeStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                currentStatus={currentCycle.status}
                onStatusChange={(newStatus) => setCurrentCycle({ ...currentCycle, status: newStatus as PayrollCycleStatus })}
                statusOptions={Object.values(PayrollCycleStatus).map(s => ({ value: s, label: s.replace(/_/g, " ") }))}
                title="Update Payroll Status"
            />
        </div>
    );
}

function EmployeeStatusBadge({ status }: { status: EmployeePayrollStatus }) {
    const styles = {
        [EmployeePayrollStatus.PENDING_DATA]: "bg-gray-100 text-gray-600",
        [EmployeePayrollStatus.CALCULATED]: "bg-blue-100 text-blue-700",
        [EmployeePayrollStatus.ON_HOLD]: "bg-orange-100 text-orange-700",
        [EmployeePayrollStatus.APPROVED]: "bg-green-100 text-green-700",
        [EmployeePayrollStatus.PAID]: "bg-green-100 text-green-700 ring-1 ring-green-600/20",
        [EmployeePayrollStatus.FAILED]: "bg-red-100 text-red-700",
        [EmployeePayrollStatus.ADJUSTED]: "bg-purple-100 text-purple-700",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5", styles[status])}>
            {status === EmployeePayrollStatus.ON_HOLD && <AlertTriangle size={10} />}
            {status.replace(/_/g, " ")}
        </span>
    );
}
