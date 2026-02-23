import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Check, CheckSquare, Square, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import axiosInstance from "@/config/axiosConfig";
import { endPoints } from "@/config/endPoint";
import { AVAILABLE_SERVICES } from "@/lib/types";
import PageHeader from "../../common/PageHeader";

interface CreateEmployeeProps {
    onSuccess: (data: unknown) => void;
    onCancel: () => void;
}

export default function CreateEmployee({ onSuccess, onCancel }: CreateEmployeeProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const toggleSelectAll = () => {
        if (formData.allowedServices.length === allAvailableServices.length) {
            setFormData({ ...formData, allowedServices: [] });
        } else {
            setFormData({ ...formData, allowedServices: allAvailableServices.map(s => s.id) });
        }
    };

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
                phone: formData.phone.trim() || null,
                allowedServices: standardSelected,
                allowedCustomServiceCycleIds: customSelected
            };

            console.log("Creating employee...", submissionData);
            const response = await axiosInstance.post(endPoints.ORGANIZATION.CREATE_MEMBER, submissionData);

            if (response.data.success) {
                onSuccess(response.data.data);
            } else {
                setError(response.data.message || "Failed to create employee");
            }
        } catch (err: any) {
            console.error("Failed to create employee", err);
            setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="space-y-8 animate-in fade-in duration-500 mx-auto">
        <PageHeader 
            title="Add New Employee" 
            subtitle="Onboard a new team member and assign their service permissions"
            actions={
                <Button variant="header" onClick={onCancel} className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                    <ArrowLeft size={16} />
                    Back to List
                </Button>
            }
        />
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
                    {error}
                </div>
            )}
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
                    <label className="text-sm font-medium text-gray-700">Phone (Optional)</label>
                    <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                    <input
                        required
                        type={showPassword ? "text" : "password"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none pr-10"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
{/* 
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
            </div> */}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Allowed Services</label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleSelectAll}
                        className="text-xs font-semibold text-primary hover:bg-primary/5 flex items-center gap-1.5"
                    >
                        {formData.allowedServices.length === allAvailableServices.length ? (
                            <>
                                <Square size={14} />
                                Deselect All
                            </>
                        ) : (
                            <>
                                <CheckSquare size={14} />
                                Select All
                            </>
                        )}
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                    {isServicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-2 py-1">
                                <Skeleton className="w-4 h-4 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                            </div>
                        ))
                    ) : (
                        allAvailableServices.map(service => (
                            <label 
                                key={service.id} 
                                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                    formData.allowedServices.includes(service.id) 
                                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                                    : 'bg-white border-transparent hover:border-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                    formData.allowedServices.includes(service.id) 
                                    ? 'bg-primary border-primary text-white' 
                                    : 'bg-white border-gray-300'
                                }`}>
                                    {formData.allowedServices.includes(service.id) && <Check size={12} strokeWidth={4} />}
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.allowedServices.includes(service.id)}
                                        onChange={() => toggleService(service.id)}
                                    />
                                </div>
                                <span className={`text-sm font-medium ${
                                    formData.allowedServices.includes(service.id) ? 'text-primary' : 'text-gray-700'
                                }`}>
                                    {service.label}
                                </span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="px-6">Cancel</Button>
                <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                    {loading ? "Creating..." : "Create Employee"}
                </Button>
            </div>
        </form>
    </div>
    );
}
