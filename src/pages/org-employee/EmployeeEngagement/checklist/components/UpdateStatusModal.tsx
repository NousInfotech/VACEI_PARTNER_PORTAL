import { useState } from 'react';
import { X, CheckCircle2, Clock, MinusCircle, Circle } from 'lucide-react';
import { ChecklistStatus, type ChecklistItem } from '../types';
import { cn } from '../../../../../lib/utils';

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (status: ChecklistStatus, reason?: string) => void;
    item: ChecklistItem;
}

export default function UpdateStatusModal({
    isOpen,
    onClose,
    onSubmit,
    item
}: UpdateStatusModalProps) {
    const [status, setStatus] = useState<ChecklistStatus>(item.status);
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const statuses = [
        { value: ChecklistStatus.TO_DO, label: 'To Do', icon: Circle, color: 'text-gray-400', bg: 'bg-gray-50' },
        { value: ChecklistStatus.IN_PROGRESS, label: 'In Progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { value: ChecklistStatus.COMPLETED, label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { value: ChecklistStatus.IGNORED, label: 'Not Applicable', icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-100' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(status, reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Update Status</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        {statuses.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setStatus(s.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                    status === s.value 
                                        ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                                        : "border-gray-100 bg-white hover:border-gray-200"
                                )}
                            >
                                <s.icon size={24} className={cn(status === s.value ? "text-indigo-600" : s.color)} />
                                <span className={cn(
                                    "text-xs font-bold",
                                    status === s.value ? "text-indigo-900" : "text-gray-600"
                                )}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason / Note (Optional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[100px] text-sm"
                            placeholder="Why are you changing the status?"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
