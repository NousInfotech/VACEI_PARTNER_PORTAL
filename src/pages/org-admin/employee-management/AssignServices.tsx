import { useState } from "react";
import { Button } from "@/ui/Button";
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
            console.log(`Assigning services for ${employee.id}:`, selectedServices);
            const response = await axiosInstance.patch(
                `${endPoints.ORGANIZATION.ASSIGN_SERVICES}/${employee.id}/services`,
                { allowedServices: selectedServices }
            );

            if (response.data.success) {
                onSuccess();
            }
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
                    {AVAILABLE_SERVICES.map(service => (
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
                    ))}
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
