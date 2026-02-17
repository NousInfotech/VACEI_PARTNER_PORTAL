import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import axiosInstance from "@/config/axiosConfig";
import { endPoints } from "@/config/endPoint";
import { AVAILABLE_SERVICES } from "@/lib/types";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    services: string[];
}

interface AssignServicesProps {
    employee: Employee;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AssignServices({ employee, onSuccess, onCancel }: AssignServicesProps) {
    const [selectedServices, setSelectedServices] = useState<string[]>(employee.services || []);
    const [loading, setLoading] = useState(false);

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
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(selectedServices.filter(id => id !== serviceId));
        } else {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const standardServiceIds = AVAILABLE_SERVICES.map(s => s.id);
            const standardSelected = selectedServices.filter(id => standardServiceIds.includes(id));
            const customSelected = selectedServices.filter(id => !standardServiceIds.includes(id));

            console.log(`Assigning services for ${employee.id}:`, { standardSelected, customSelected });
            
            await Promise.all([
                axiosInstance.patch(
                    `${endPoints.ORGANIZATION.ASSIGN_SERVICES}/${employee.id}/services`,
                    { allowedServices: standardSelected }
                ),
                axiosInstance.patch(
                    `${endPoints.ORGANIZATION.ASSIGN_CUSTOM_SERVICES}/${employee.id}/custom-services`,
                    { allowedCustomServiceCycleIds: customSelected }
                )
            ]);

            onSuccess();
        } catch (error) {
            console.error("Failed to assign services", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <p className="text-sm text-gray-500 mb-4">
                    Select the services that <strong>{employee.firstName} {employee.lastName}</strong> should have access to.
                </p>

                <div className="space-y-3">
                    {isServicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center p-3 border border-gray-100 rounded-lg animate-pulse">
                                <Skeleton className="w-4 h-4 rounded" />
                                <Skeleton className="ml-3 h-4 w-32 rounded" />
                            </div>
                        ))
                    ) : (
                        allAvailableServices.map(service => (
                            <label
                                key={service.id}
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedServices.includes(service.id)
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    checked={selectedServices.includes(service.id)}
                                    onChange={() => toggleService(service.id)}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900">{service.label}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
