import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { X } from "lucide-react";
import { EmployeePayrollStatus } from "../types";
import { payrollEmployeeService } from "../../../../../api/payrollEmployeeService";
import { toast } from "sonner";

interface PayrollEmployeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payrollCycleId: string;
    companyId: string;
    onSuccess: () => void;
    employee?: any; // If provided, we are in Edit mode
}

export default function PayrollEmployeeModal({
    open,
    onOpenChange,
    payrollCycleId,
    companyId,
    onSuccess,
    employee
}: PayrollEmployeeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        employeeCode: string;
        grossSalary: number;
        deductions: number;
        allowances: number;
        bonuses: number;
        netSalary: number;
        status: EmployeePayrollStatus;
    }>({
        firstName: "",
        lastName: "",
        employeeCode: "",
        grossSalary: 0,
        deductions: 0,
        allowances: 0,
        bonuses: 0,
        netSalary: 0,
        status: EmployeePayrollStatus.ACTIVE
    });

    const isEdit = !!employee;

    // Populate form when employee prop changes (Edit mode)
    useEffect(() => {
        if (employee) {
            setFormData({
                firstName: employee.firstName || "",
                lastName: employee.lastName || "",
                employeeCode: employee.employeeCode || "",
                grossSalary: Number(employee.grossSalary) || 0,
                deductions: Number(employee.deductions) || 0,
                allowances: Number(employee.allowances) || 0,
                bonuses: Number(employee.bonuses) || 0,
                netSalary: Number(employee.netSalary) || 0,
                status: employee.status || EmployeePayrollStatus.ACTIVE
            });
        } else {
            // Reset for Add mode
            setFormData({
                firstName: "",
                lastName: "",
                employeeCode: "",
                grossSalary: 0,
                deductions: 0,
                allowances: 0,
                bonuses: 0,
                netSalary: 0,
                status: EmployeePayrollStatus.ACTIVE
            });
        }
    }, [employee, open]);

    // Automatically calculate net salary
    useEffect(() => {
        const net = formData.grossSalary + formData.allowances + formData.bonuses - formData.deductions;
        setFormData(prev => ({ ...prev, netSalary: Math.max(0, net) }));
    }, [formData.grossSalary, formData.allowances, formData.bonuses, formData.deductions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName) {
            toast.error("First and last names are required");
            return;
        }

        setIsLoading(true);
        try {
            if (isEdit) {
                await payrollEmployeeService.update(payrollCycleId, employee.id, {
                    ...formData,
                    companyId
                });
                toast.success("Employee updated successfully");
            } else {
                await payrollEmployeeService.create(payrollCycleId, {
                    ...formData,
                    companyId,
                    payrollCycleId
                });
                toast.success("Employee added to payroll successfully");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to save employee:", error);
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} employee`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNumberChange = (field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, [field]: numValue }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{isEdit ? 'Edit' : 'Add'} Employee in Payroll</DialogTitle>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">First Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as EmployeePayrollStatus })}
                            >
                                <option value={EmployeePayrollStatus.ACTIVE}>Active</option>
                                <option value={EmployeePayrollStatus.ON_LEAVE}>On Leave</option>
                                <option value={EmployeePayrollStatus.TERMINATED}>Terminated</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Employee Code (Optional)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.employeeCode}
                            onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                            placeholder="EMP001"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Gross Salary (€)</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.grossSalary || ""}
                                onChange={e => handleNumberChange("grossSalary", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Deductions (€)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.deductions || ""}
                                onChange={e => handleNumberChange("deductions", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Allowances (€)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.allowances || ""}
                                onChange={e => handleNumberChange("allowances", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bonuses (€)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.bonuses || ""}
                                onChange={e => handleNumberChange("bonuses", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center mt-2">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calculated Net Pay</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">€{formData.netSalary.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Automatic</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {isEdit ? 'Save Changes' : 'Add Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
