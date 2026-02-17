import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { 
    type ChecklistItem, 
    type CreateChecklistDto, 
    type UpdateChecklistDto 
} from '../types';

interface CreateEditChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateChecklistDto | UpdateChecklistDto) => void;
    initialData?: ChecklistItem;
    parentItem?: ChecklistItem;
    availableParents?: ChecklistItem[];
    isLoading?: boolean;
}

export default function CreateEditChecklistModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    parentItem,
    availableParents = [],
    isLoading = false
}: CreateEditChecklistModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [deadline, setDeadline] = useState(initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '');
    const [parentId, setParentId] = useState<string | null>(initialData?.parentId || parentItem?.id || null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: CreateChecklistDto | UpdateChecklistDto = {
            title,
            category: category || null,
            deadline: deadline || null,
            parentId: parentId || null,
        };
        
        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                        {initialData ? 'Edit Checklist' : 'Add New Checklist'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <fieldset disabled={isLoading} className="space-y-4 disabled:opacity-70">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title *</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Pre-Audit Phase"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category (Optional)</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Setup, Planning"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline (Optional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {!initialData && availableParents.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parent (Optional)</label>
                                <select
                                    value={parentId || ''}
                                    onChange={(e) => setParentId(e.target.value || null)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                                >
                                    <option value="">No Parent (Root Phase)</option>
                                    {availableParents.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.level === 1 ? 'Phase: ' : 'Section: '}{parent.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </fieldset>

                    <div className="pt-4 flex items-center gap-3">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            {initialData ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
