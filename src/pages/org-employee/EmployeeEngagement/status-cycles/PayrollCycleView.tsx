import { useState } from 'react';
import { User, AlertTriangle, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { cn } from '../../../../lib/utils';
import { payrollEmployeeService } from '../../../../api/payrollEmployeeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '../../../../ui/Skeleton';
import PayrollEmployeeModal from './components/PayrollEmployeeModal';
import ChangeStatusDialog from './components/ChangeStatusDialog';
import { apiGet } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';

export default function PayrollCycleView() {
    const { id: engagementId } = useParams();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

    const { data: cycles } = useQuery({
        queryKey: ['payroll-cycles', engagementId],
        queryFn: async () => {
            const m = await import('../../../../api/payrollService');
            return m.payrollService.getAll(engagementId!);
        },
        enabled: !!engagementId
    });

    const { data: engagementResponse } = useQuery({
        queryKey: ['engagement-view', engagementId],
        queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)),
        enabled: !!engagementId
    });

    const engagement = engagementResponse?.data || engagementResponse;
    const companyId = engagement?.companyId || engagement?.company?.id;

    const currentCycle = cycles?.[0];

    const { data: employees, isLoading } = useQuery({
        queryKey: ['payroll-employees', currentCycle?.id],
        queryFn: () => payrollEmployeeService.getAll(currentCycle!.id),
        enabled: !!currentCycle?.id
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => payrollEmployeeService.delete(currentCycle!.id, id),
        onSuccess: () => {
            toast.success('Employee removed from payroll');
            queryClient.invalidateQueries({ queryKey: ['payroll-employees', currentCycle?.id] });
        },
        onError: () => toast.error('Failed to remove employee')
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            payrollEmployeeService.update(currentCycle!.id, id, { status, metadata: { statusChangeReason: reason } }),
        onSuccess: () => {
            toast.success('Employee status updated');
            queryClient.invalidateQueries({ queryKey: ['payroll-employees', currentCycle?.id] });
        },
        onError: () => toast.error('Failed to update employee status')
    });

    if (!currentCycle) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="p-6 bg-blue-50 text-blue-500 rounded-full mb-6">
                    <User size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Active Payroll Cycle</h3>
                <p className="text-gray-500 mt-2">Create a new payroll cycle from the Overview dashboard to begin.</p>
            </div>
        );
    }

    const filteredEmployees = employees?.filter((emp: any) => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search employees..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                    className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus size={18} />
                    Add Employee
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Employee Breakdown</h3>
                        {/* <p className="text-sm text-gray-500">Status per employee for {currentCycle.periodStart || 'current period'}</p> */}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Gross Salary</th>
                                <th className="px-6 py-4 text-right">Deductions</th>
                                <th className="px-6 py-4 text-right">Allowances</th>
                                <th className="px-6 py-4 text-right">Bonuses</th>
                                <th className="px-6 py-4 text-right">Net Pay</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-4">
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEmployees?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                                        No employees found for this cycle.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees?.map((emp: any) => (
                                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                                                    <div className="text-[11px] text-gray-500">{emp.employeeCode || emp.id.split('-')[0]}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <EmployeeStatusBadge status={emp.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-500">
                                            €{(emp.grossSalary || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-red-500">
                                            €{(emp.deductions || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-green-500">
                                            €{(emp.allowances || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-500">
                                            €{(emp.bonuses || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                            €{(emp.netSalary || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                                    title="Edit"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" 
                                                    title="Change Status"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setIsStatusDialogOpen(true);
                                                    }}
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                                                    title="Remove"
                                                    onClick={() => {
                                                        if(confirm('Are you sure you want to remove this employee?')) {
                                                            deleteMutation.mutate(emp.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {currentCycle && companyId && (
                <PayrollEmployeeModal
                    open={isAddModalOpen || isEditModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddModalOpen(false);
                            setIsEditModalOpen(false);
                            setSelectedEmployee(null);
                        }
                    }}
                    payrollCycleId={currentCycle.id}
                    companyId={companyId}
                    employee={isEditModalOpen ? selectedEmployee : undefined}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['payroll-employees', currentCycle.id] })}
                />
            )}

            {selectedEmployee && (
                <ChangeStatusDialog
                    open={isStatusDialogOpen}
                    onOpenChange={setIsStatusDialogOpen}
                    currentStatus={selectedEmployee.status}
                    onStatusChange={(newStatus, reason) => updateStatusMutation.mutate({ id: selectedEmployee.id, status: newStatus, reason })}
                    statusOptions={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'ON_LEAVE', label: 'On Leave' },
                        { value: 'TERMINATED', label: 'Terminated' }
                    ]}
                    title={`Update Status for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                />
            )}
        </div>
    );
}

function EmployeeStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-700",
        ON_LEAVE: "bg-orange-100 text-orange-700",
        TERMINATED: "bg-red-100 text-red-700",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5", styles[status] || "bg-gray-100 text-gray-600")}>
            {status === 'ON_LEAVE' && <AlertTriangle size={10} />}
            {status?.replace(/_/g, " ")}
        </span>
    );
}
