import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Check, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import AddEntryDialog from "./AddEntryDialog";
import type { ExtendedTBRow } from "../extended-tb/data";
import type { AdjustmentData, AdjustmentEntry } from "./AdjustmentDialog";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";

interface AdjustmentInlineFormProps {
    onSave: (data: AdjustmentData) => void;
    onCancel: () => void;
    initialData?: AdjustmentData;
    entityName?: string;
    accounts?: ExtendedTBRow[];
    trialBalanceId?: string;
    auditCycleId?: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    /** When true, disables save/cancel and shows loading state on buttons */
    isSaving?: boolean;
}

export default function AdjustmentInlineForm({
    onSave,
    onCancel,
    initialData,
    entityName = "Adjustment",
    accounts = [],
    trialBalanceId,
    auditCycleId,
    isExpanded,
    onToggleExpand,
    isSaving = false,
}: AdjustmentInlineFormProps) {
    const [adjustmentNo, setAdjustmentNo] = useState(initialData?.adjustmentNo || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [entries, setEntries] = useState<AdjustmentEntry[]>(initialData?.entries || []);
    const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);

    // Sync form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData && isExpanded) {
            setAdjustmentNo(initialData.adjustmentNo || "");
            setDescription(initialData.description || "");
            // Ensure entries have proper IDs if they don't
            const entriesWithIds = (initialData.entries || []).map((entry, index) => ({
                ...entry,
                id: entry.id || index + 1,
            }));
            setEntries(entriesWithIds);
        } else if (!initialData && isExpanded) {
            // Reset for new entry only when form is expanded
            // Don't reset adjustmentNo here - let auto-generation handle it
            setDescription("");
            setEntries([]);
        }
    }, [initialData, isExpanded]);

    const prefix = entityName === "Reclassification" ? "RC" : "AA";

    // Fetch existing audit entries to generate next number
    const { data: existingEntries } = useQuery({
        queryKey: ['audit-entries', trialBalanceId],
        queryFn: async () => {
            if (!trialBalanceId || !auditCycleId) return { data: [] };
            const url = endPoints.AUDIT.CREATE_AUDIT_ENTRY(auditCycleId, trialBalanceId);
            try {
                const response = await apiGet<{ data: any[] }>(url);
                return response;
            } catch (error) {
                return { data: [] };
            }
        },
        enabled: !!trialBalanceId && !!auditCycleId && isExpanded && !initialData,
    });

    // Auto-generate adjustment number when form expands for new entry
    useEffect(() => {
        if (!initialData && isExpanded && existingEntries) {
            const entries = existingEntries?.data || [];
            const typeFilter = entityName === "Reclassification" ? "RECLASSIFICATION" : "ADJUSTMENT";
            const filteredEntries = entries.filter((e: any) => e.type === typeFilter);
            
            const numbers = filteredEntries
                .map((e: any) => {
                    const match = e.code?.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter((n: number) => n > 0);
            
            const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
            setAdjustmentNo(`${prefix}${nextNumber}`);
        } else if (!initialData && isExpanded && !existingEntries) {
            // If query hasn't loaded yet, set default first number
            setAdjustmentNo(`${prefix}1`);
        }
    }, [existingEntries, initialData, isExpanded, prefix, entityName]);

    // Calculate totals
    const totals = useMemo(() => {
        const debits = entries
            .filter(e => e.type === 'Debit')
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const credits = entries
            .filter(e => e.type === 'Credit')
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const balance = Math.abs(debits - credits);
        const isBalanced = balance < 0.01;
        return { debits, credits, balance, isBalanced };
    }, [entries]);

    const handleAddEntry = (account: ExtendedTBRow) => {
        const newEntry: AdjustmentEntry = {
            id: Date.now(),
            accountId: account.accountId || String(account.id),
            code: account.code,
            accountName: account.accountName,
            type: 'Debit',
            amount: 0,
            details: ""
        };
        setEntries([...entries, newEntry]);
    };

    const updateEntry = (id: number, field: keyof AdjustmentEntry, value: string | number) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const removeEntry = (id: number) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const handleSave = (status: 'POSTED' | 'DRAFT') => {
        if (status === 'POSTED' && !totals.isBalanced) {
            return;
        }
        onSave({
            id: initialData?.id,
            adjustmentNo,
            description,
            status,
            entries
        });
        // Don't reset here - let parent handle it after successful save
    };

    useEffect(() => {
        if (!isExpanded && !initialData) {
            // Only reset if not editing
            setEntries([]);
            setDescription("");
        }
    }, [isExpanded, initialData]);

    const isEditMode = !!initialData;
    const lowerEntityName = entityName.toLowerCase();
    const postButtonText = isEditMode ? `Update ${entityName}` : `Post ${entityName}`;

    if (!isExpanded) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <button
                    onClick={onToggleExpand}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {isEditMode ? `Edit ${entityName}` : `New ${entityName}`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEditMode
                                ? `Modify the ${lowerEntityName} details and entries.`
                                : `Create a new ${lowerEntityName} entry. Balance must be zero (DR = CR) before posting.`}
                        </p>
                    </div>
                    <ChevronDown size={20} className="text-gray-400" />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm" data-adjustment-form>
                {isSaving && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-[2px]" aria-hidden="true">
                        <div className="flex flex-col items-center gap-3">
                            <span className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
                            <span className="text-sm font-medium text-gray-700">
                                {isEditMode ? "Updating..." : "Saving..."}
                            </span>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? `Edit ${entityName}` : `New ${entityName}`}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {isEditMode
                                ? `Modify the ${lowerEntityName} details and entries.`
                                : `Create a new ${lowerEntityName} entry. Balance must be zero (DR = CR) before posting.`}
                        </p>
                    </div>
                    <button onClick={onToggleExpand} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronUp size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{entityName} No.</label>
                            <input
                                type="text"
                                value={adjustmentNo}
                                onChange={(e) => setAdjustmentNo(e.target.value)}
                                placeholder="e.g. AA2"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of adjustment"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Entries Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Entries</h3>
                            <Button
                                onClick={() => setIsAddEntryOpen(true)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={isSaving}
                            >
                                <Plus size={16} />
                                Add Entry
                            </Button>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-24">Code</th>
                                        <th className="px-4 py-3 text-left">Account Name</th>
                                        <th className="px-4 py-3 text-left w-32">Type</th>
                                        <th className="px-4 py-3 text-left w-40">Amount</th>
                                        <th className="px-4 py-3 text-left w-64">Details</th>
                                        <th className="px-4 py-3 text-center w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-gray-400 bg-white">
                                                No entries added yet. Click "+ Add Entry" to start.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.id} className="bg-white hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50">{entry.code}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50">{entry.accountName}</td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={entry.type}
                                                        onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    >
                                                        <option value="Debit">DR</option>
                                                        <option value="Credit">CR</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={entry.amount || ''}
                                                        onChange={(e) => updateEntry(entry.id, 'amount', Number(e.target.value))}
                                                        placeholder="0"
                                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={entry.details}
                                                        onChange={(e) => updateEntry(entry.id, 'details', e.target.value)}
                                                        placeholder="Optional details..."
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => removeEntry(entry.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals and Balance */}
                        {entries.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-gray-700">TOTALS</span>
                                        <span className="text-sm text-gray-600">
                                            DR: {new Intl.NumberFormat('en-US').format(totals.debits)} | CR: {new Intl.NumberFormat('en-US').format(totals.credits)}
                                        </span>
                                    </div>
                                    {!totals.isBalanced && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                                            X Balance: {new Intl.NumberFormat('en-US').format(totals.balance)}
                                        </span>
                                    )}
                                </div>
                                {!totals.isBalanced && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <AlertTriangle className="text-yellow-600 shrink-0" size={18} />
                                        <span className="text-sm text-yellow-800">
                                            {entityName} must be balanced before posting (DR = CR)
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="bg-white border-gray-300"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSave('DRAFT')}
                        className="bg-white border-gray-300 gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save as Draft
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => handleSave('POSTED')}
                        disabled={!totals.isBalanced || isSaving}
                        className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed gap-2 min-w-[140px]"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isEditMode ? "Updating..." : "Posting..."}
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                {postButtonText}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <AddEntryDialog
                isOpen={isAddEntryOpen}
                onClose={() => setIsAddEntryOpen(false)}
                onAdd={handleAddEntry}
                accounts={accounts}
            />
        </>
    );
}

