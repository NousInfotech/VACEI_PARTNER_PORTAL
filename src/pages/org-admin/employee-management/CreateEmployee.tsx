import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import axiosInstance from "@/config/axiosConfig";
import { endPoints } from "@/config/endPoint";
import { AVAILABLE_SERVICES } from "@/lib/types";

interface CreateEmployeeProps {
    onSuccess: (data: unknown) => void;
    onCancel: () => void;
}

export default function CreateEmployee({ onSuccess, onCancel }: CreateEmployeeProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        orgRole: "EMPLOYEE",
        allowedServices: [] as string[]
    });

    const { data: customServices = [], isLoading: isServicesLoading } = useQuery({
        queryKey: ['activeCustomServices'],
        queryFn: async () => {
            const response = await axiosInstance.get(endPoints.CUSTOM_SERVICE.GET_ACTIVE);
            if (response.data.success) {
                return response.data.data.map((s: { id: string; title: string }) => ({
                    id: s.id,
                    label: s.title
                }));
            }
            return [];
        }
    });

    const allAvailableServices = [...AVAILABLE_SERVICES, ...customServices];

    const toggleService = (serviceId: string) => {
        if (formData.allowedServices.includes(serviceId)) {
            setFormData({
                ...formData,
                allowedServices: formData.allowedServices.filter(id => id !== serviceId)
            });
        } else {
            setFormData({
                ...formData,
                allowedServices: [...formData.allowedServices, serviceId]
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const standardServiceIds = AVAILABLE_SERVICES.map(s => s.id);
            const standardSelected = formData.allowedServices.filter(id => standardServiceIds.includes(id));
            const customSelected = formData.allowedServices.filter(id => !standardServiceIds.includes(id));

            const submissionData = {
                ...formData,
                allowedServices: standardSelected,
                allowedCustomServiceCycleIds: customSelected
            };

            console.log("Creating employee...", submissionData);
            const response = await axiosInstance.post(endPoints.ORGANIZATION.CREATE_MEMBER, submissionData);

            if (response.data.success) {
                onSuccess(response.data.data);
            }
        } catch (error) {
            console.error("Failed to create employee", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input
                        required
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        required
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input
                        required
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                    required
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                    value={formData.orgRole}
                    onChange={e => setFormData({ ...formData, orgRole: e.target.value })}
                >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ORG_ADMIN">Org Admin</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Allowed Services</label>
                <div className="grid grid-cols-2 gap-2">
                    {isServicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-2 py-1">
                                <Skeleton className="w-4 h-4 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                            </div>
                        ))
                    ) : (
                        allAvailableServices.map(service => (
                            <label key={service.id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    checked={formData.allowedServices.includes(service.id)}
                                    onChange={() => toggleService(service.id)}
                                />
                                <span>{service.label}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Employee"}
                </Button>
            </div>
        </form>
    );
}
