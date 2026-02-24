import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context-core";
import { cspService, type CspCycle, type CspItem, CSPStatus, type CreateCspItemDto, type UpdateCspItemDto } from "@/api/cspService";
import { Button } from "@/ui/Button";
import { RefreshCw, PlusCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import CSPItemModal from "./CSPItemModal";
import { format } from "date-fns";

interface CSPViewProps {
    selectedId: string | null;
    engagementId: string;
    companyId: string;
}

export default function CSPView({ engagementId, companyId }: CSPViewProps) {
    const { user } = useAuth();
    const [cycles, setCycles] = useState<CspCycle[]>([]);
    const [items, setItems] = useState<CspItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [creatingCycle, setCreatingCycle] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CspItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isOrgAdmin = user?.role === 'ORG_ADMIN';

    const fetchCycles = async () => {
        if (!engagementId) return;
        setLoading(true);
        try {
            const data = await cspService.getAll(engagementId);
            setCycles(data);
            if (data.length > 0) {
                await fetchItems(data[0].id);
            }
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch CSP cycles:", err);
            setError("Failed to load CSP cycles");
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async (cycleId: string) => {
        setLoadingItems(true);
        try {
            const itemsData = await cspService.getAllItems(cycleId);
            setItems(itemsData);
        } catch (err: any) {
            console.error("Failed to fetch CSP items:", err);
        } finally {
            setLoadingItems(false);
        }
    };

    useEffect(() => {
        fetchCycles();
    }, [engagementId]);

    const handleCreateCycle = async () => {
        if (!engagementId || !companyId || !isOrgAdmin) return;
        setCreatingCycle(true);
        try {
            await cspService.create({
                engagementId,
                companyId,
                periodStart: new Date().toISOString(),
                status: CSPStatus.ACTIVE,
            });
            await fetchCycles();
        } catch (err: any) {
            console.error("Failed to create CSP cycle:", err);
            alert(err.message || "Failed to create CSP cycle");
        } finally {
            setCreatingCycle(false);
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: CspItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Are you sure you want to delete this KYC Item?")) return;
        
        const cycleId = cycles[0]?.id;
        if (!cycleId) return;

        try {
            await cspService.deleteItem(cycleId, itemId);
            await fetchItems(cycleId);
        } catch (err: any) {
            console.error("Failed to delete item:", err);
            alert("Failed to delete item");
        }
    };

    const handleSaveItem = async (data: CreateCspItemDto | UpdateCspItemDto) => {
        const cycleId = cycles[0]?.id;
        if (!cycleId) return;

        setIsSaving(true);
        try {
            if (selectedItem) {
                await cspService.updateItem(cycleId, selectedItem.id, data as UpdateCspItemDto);
            } else {
                await cspService.createItem(cycleId, data as CreateCspItemDto);
            }
            setIsModalOpen(false);
            await fetchItems(cycleId);
        } catch (err: any) {
            console.error("Failed to save item:", err);
            alert(err.message || "Failed to save item");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-gray-500 font-medium">Loading CSP details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-bold">{error}</p>
                <Button onClick={fetchCycles} variant="outline" className="rounded-xl">
                    Try Again
                </Button>
            </div>
        );
    }

    if (cycles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-8 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                <div className="p-6 bg-primary/5 rounded-[32px] text-primary">
                    <PlusCircle size={48} />
                </div>
                <div className="text-center max-w-md space-y-3">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">No CSP Cycle Started</h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        There is currently no active CSP cycle for this engagement. 
                        {isOrgAdmin 
                            ? "Click the button below to initiate the corporate services cycle." 
                            : "Please contact your organization administrator to start the cycle."}
                    </p>
                </div>
                {isOrgAdmin ? (
                    <Button 
                        size="lg" 
                        onClick={handleCreateCycle} 
                        disabled={creatingCycle}
                        className="rounded-2xl h-14 px-10 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {creatingCycle ? (
                            <>
                                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                Starting Cycle...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Create CSP Cycle
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold text-sm border border-amber-100">
                        <AlertCircle size={18} />
                        Administrator Access Required
                    </div>
                )}
            </div>
        );
    }

    const activeCycle = cycles[0];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">KYC Items</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage KYC and compliance tracking items for this cycle ({activeCycle.id.substring(0, 8).toUpperCase()})</p>
                </div>
                {isOrgAdmin && (
                    <Button onClick={handleOpenCreateModal} className="rounded-xl shadow-sm text-sm font-semibold h-10 px-5 gap-2">
                        <PlusCircle size={16} />
                        Create KYC Item
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loadingItems ? (
                    <div className="flex justify-center items-center p-12">
                        <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <PlusCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No KYC Items Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            You haven't added any KYC items to this active CSP cycle yet. Get started by creating your first item.
                        </p>
                        {isOrgAdmin && (
                            <Button onClick={handleOpenCreateModal} variant="outline" className="rounded-xl font-medium">
                                Create KYC Item
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Title / Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Ref Number</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{item.title || "Untitled"}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.type.replace(/_/g, " ")}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                ${item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                  item.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                  item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                  item.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                                  item.status === 'FILED' ? 'bg-blue-100 text-blue-800' :
                                                  'bg-indigo-100 text-indigo-800'}`}>
                                                {item.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {item.dueDate ? format(new Date(item.dueDate), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {item.referenceNo || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isOrgAdmin ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenEditModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                        title="Edit Item"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">View only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CSPItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                initialData={selectedItem}
                isLoading={isSaving}
            />
        </div>
    );
}
