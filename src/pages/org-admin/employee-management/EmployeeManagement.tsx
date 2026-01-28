import { useState, useEffect } from "react";
import { Plus, Search, Mail, User } from "lucide-react";
import { Button } from "@/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/Dialog";
import CreateEmployee from "./CreateEmployee";
import AssignServices from "./AssignServices";
import axiosInstance from "@/config/axiosConfig";
import { endPoints } from "@/config/endPoint";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    services: string[];
}

interface OrganizationMemberResponse {
    id: string;
    role: string;
    allowedServices: string[];
    user: {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isAssignServicesOpen, setIsAssignServicesOpen] = useState(false);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(endPoints.ORGANIZATION.GET_MEMBERS, {
                params: {
                    page: 1,
                    limit: 10,
                    order: 'desc'
                }
            });

            if (response.data.success) {
                const mappedEmployees: Employee[] = response.data.data.map((item: OrganizationMemberResponse) => ({
                    id: item.id,
                    firstName: item.user.firstName,
                    lastName: item.user.lastName,
                    email: item.user.email,
                    role: item.role,
                    services: item.allowedServices || []
                }));
                setEmployees(mappedEmployees);
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreateSuccess = () => {
        fetchEmployees();
        setIsCreateOpen(false);
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
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
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
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading employees...</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Assigned Services</th>
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
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                <User size={12} />
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {emp.services && emp.services.length > 0 ? (
                                                    emp.services.map((service, i) => (
                                                        <span key={i} className="px-2 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 bg-white">
                                                            {service}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No services assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAssignServices(emp)}
                                                className="text-primary hover:text-primary/80 hover:bg-primary/5"
                                            >
                                                Assign Services
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                    </DialogHeader>
                    <CreateEmployee onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Assign Services Dialog */}
            <Dialog open={isAssignServicesOpen} onOpenChange={setIsAssignServicesOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Services</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <AssignServices
                            employee={selectedEmployee}
                            onSuccess={() => {
                                setIsAssignServicesOpen(false);
                                fetchEmployees();
                            }}
                            onCancel={() => setIsAssignServicesOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
