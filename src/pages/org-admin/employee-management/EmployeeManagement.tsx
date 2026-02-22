import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Mail, Edit, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/Dialog";
import AssignServices from "./AssignServices";
import axiosInstance from "@/config/axiosConfig";
import { endPoints } from "@/config/endPoint";
import { AVAILABLE_SERVICES } from "@/lib/types";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    services: string[];
    serviceNames: string[];
    email: string;
    role: string;
}

interface CustomServiceCycle {
    id: string;
    title: string;
}

interface EmployeeResponseItem {
    id: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    role: string;
    allowedServices: string[];
    allowedCustomServiceCycles: CustomServiceCycle[];
}

export default function EmployeeManagement() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isAssignServicesOpen, setIsAssignServicesOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Success Dialog State
    const [successDialog, setSuccessDialog] = useState<{ open: boolean; title: string; message: string }>({
        open: false,
        title: "",
        message: ""
    });

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(endPoints.ORGANIZATION.GET_MEMBERS, {
                params: {
                    page: 1,
                    limit: 10,
                    order: 'desc',
                    search: searchQuery
                }
            });

            if (response.data.success) {
                const mappedEmployees: Employee[] = response.data.data.map((item: EmployeeResponseItem) => {
                    const standardServices = item.allowedServices || [];
                    const customServices = item.allowedCustomServiceCycles || [];

                    const standardLabels = standardServices.map((id: string) =>
                        AVAILABLE_SERVICES.find(s => s.id === id)?.label || id
                    );
                    const customLabels = customServices.map((s: CustomServiceCycle) => s.title || s.id);

                    return {
                        id: item.id,
                        firstName: item.user.firstName,
                        lastName: item.user.lastName,
                        email: item.user.email,
                        role: item.role,
                        services: [...standardServices, ...customServices.map((s: CustomServiceCycle) => s.id)],
                        serviceNames: [...standardLabels, ...customLabels]
                    };
                });
                const employeesOnly = mappedEmployees.filter(emp => emp.role === 'EMPLOYEE');
                setEmployees(employeesOnly);
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchEmployees]);

    const handleAssignServicesSuccess = () => {
        fetchEmployees();
        setIsAssignServicesOpen(false);
        setSuccessDialog({
            open: true,
            title: "Services Updated",
            message: "The services for this employee have been successfully updated."
        });
    };

    const handleAssignServices = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsAssignServicesOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                    <p className="text-gray-500">Manage access and services for your team members.</p>
                </div>
                <Button onClick={() => navigate("/dashboard/employees/create")} className="gap-2">
                    <Plus size={18} />
                    Add Employee
                </Button>
            </div>

            {/* List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">Loading employees...</span>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4 text-center">Assigned Services</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {employees.length > 0 ? (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Mail size={12} />
                                                        {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {emp.serviceNames && emp.serviceNames.length > 0 ? (
                                                    emp.serviceNames.map((name, i) => (
                                                        <span key={i} className="px-2 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 bg-white">
                                                            {name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No services assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAssignServices(emp)}
                                                className="text-primary hover:text-primary/80 hover:bg-primary/5 gap-2"
                                            >
                                                <Edit size={14} />
                                                Assign Services
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Assign Services Dialog */}
            <Dialog open={isAssignServicesOpen} onOpenChange={setIsAssignServicesOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Assign Services</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <AssignServices
                            employee={selectedEmployee}
                            onSuccess={handleAssignServicesSuccess}
                            onCancel={() => setIsAssignServicesOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-md text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <CheckCircle size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900">{successDialog.title}</h3>
                            <p className="text-gray-500">{successDialog.message}</p>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={() => setSuccessDialog(prev => ({ ...prev, open: false }))}
                        >
                            Got it, thanks!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
