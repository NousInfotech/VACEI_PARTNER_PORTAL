import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import type { ExtendedTBRow } from "../extended-tb/data";

interface AddEntryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (account: ExtendedTBRow) => void;
    accounts?: ExtendedTBRow[];
}

export default function AddEntryDialog({ isOpen, onClose, onAdd, accounts = [] }: AddEntryDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedId, setSelectedId] = useState<number | string | null>(null);

    const filteredAccounts = useMemo(() => {
        if (accounts.length === 0) return [];
        return accounts.filter(account =>
            account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, accounts]);

    const handleAdd = () => {
        const selectedAccount = accounts.find(a => a.id === selectedId || a.accountId === selectedId);
        if (selectedAccount) {
            onAdd(selectedAccount);
            setSelectedId(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Select Account</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose an account to add to the adjustment</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by code or account name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[80px_1fr_120px] gap-4 px-4 py-2 bg-gray-50/50 rounded-lg border border-gray-100/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div>Code</div>
                        <div>Account Name</div>
                        <div className="text-right">Current Year</div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                        {filteredAccounts.map((account) => {
                            const accountKey = account.accountId || account.id;
                            const isSelected = selectedId === account.id || selectedId === accountKey;
                            return (
                                <div
                                    key={accountKey}
                                    onClick={() => setSelectedId(account.id || accountKey)}
                                    className={`
                                        grid grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-all
                                        ${isSelected
                                            ? "bg-blue-50 border-blue-200 shadow-sm"
                                            : "bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50"}
                                    `}
                                >
                                    <div className={`font-medium ${isSelected ? "text-blue-700" : "text-gray-600"}`}>
                                        {account.code}
                                    </div>
                                    <div className={`font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                                        {account.accountName}
                                    </div>
                                    <div className={`text-right font-medium ${isSelected ? "text-blue-700" : "text-gray-600"}`}>
                                        {new Intl.NumberFormat('en-US').format(account.currentYear || 0)}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAccounts.length === 0 && accounts.length > 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No accounts found matching "{searchQuery}"
                            </div>
                        )}
                        {accounts.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No accounts available. Please upload a trial balance first.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
                    <Button variant="outline" onClick={onClose} className="bg-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedId}
                        className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Entry
                    </Button>
                </div>
            </div>
        </div>
    );
}
