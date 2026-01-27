import { useState } from "react";
import { Plus, Trash2, X, Save } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import AddEntryDialog from "./AddEntryDialog";
import { financialMockData } from "../extended-tb/data";

export interface AdjustmentData {
    id?: number | string;
    adjustmentNo: string;
    description: string;
    status: 'POSTED' | 'DRAFT';
    entries: AdjustmentEntry[];
}

export interface AdjustmentEntry {
    id: number;
    accountId: number;
    code: string;
    accountName: string;
    type: 'Debit' | 'Credit';
    amount: number;
    details: string;
}

interface AdjustmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AdjustmentData) => void;
    initialData?: AdjustmentData;
    entityName?: string;
}

export default function AdjustmentDialog({ isOpen, onClose, onSave, initialData, entityName = "Adjustment" }: AdjustmentDialogProps) {
    const [adjustmentNo, setAdjustmentNo] = useState(initialData?.adjustmentNo || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [entries, setEntries] = useState<AdjustmentEntry[]>(initialData?.entries || []);
    const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);

    const handleAddEntry = (account: typeof financialMockData[0]) => {
        const newEntry: AdjustmentEntry = {
            id: Date.now(),
            accountId: account.id,
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
        onSave({
            id: initialData?.id,
            adjustmentNo,
            description,
            status,
            entries
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditMode = !!initialData;
    const lowerEntityName = entityName.toLowerCase();

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEditMode ? `Edit ${entityName}` : `Create ${entityName}`}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditMode
                                    ? `Modify the ${lowerEntityName} details and entries.`
                                    : `Create a new ${lowerEntityName} entry. Balance must be zero (DR = CR) before posting.`}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{entityName} No.</label>
                                <input
                                    type="text"
                                    value={adjustmentNo}
                                    onChange={(e) => setAdjustmentNo(e.target.value)}
                                    placeholder="e.g. AA2"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={`${entityName} description`}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Entries Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Entries</h3>
                            <p className="text-sm text-gray-500 mb-3">Choose an account to add to the {lowerEntityName}</p>
                            <Button
                                onClick={() => setIsAddEntryOpen(true)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Plus size={16} />
                                Add Entry
                            </Button>

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
                                                    <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50/30">{entry.code}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50/30">{entry.accountName}</td>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={entry.type}
                                                            onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        >
                                                            <option value="Debit">Debit</option>
                                                            <option value="Credit">Credit</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={entry.amount || ''}
                                                            onChange={(e) => updateEntry(entry.id, 'amount', Number(e.target.value))}
                                                            placeholder="0.00"
                                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-right focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={entry.details}
                                                            onChange={(e) => updateEntry(entry.id, 'details', e.target.value)}
                                                            placeholder="Optional details"
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
                        <Button variant="outline" onClick={onClose} className="bg-white">
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSave('DRAFT')}
                            className="bg-white gap-2"
                        >
                            <Save size={16} />
                            Save as Draft
                        </Button>
                        <Button
                            onClick={() => handleSave('POSTED')}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            {isEditMode ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            </div>

            <AddEntryDialog
                isOpen={isAddEntryOpen}
                onClose={() => setIsAddEntryOpen(false)}
                onAdd={handleAddEntry}
            />
        </>
    );
}
