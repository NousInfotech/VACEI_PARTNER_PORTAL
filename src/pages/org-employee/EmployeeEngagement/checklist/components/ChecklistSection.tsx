import { ChecklistStatus, type ChecklistItem } from '../types';
import ChecklistTaskRow from './ChecklistTaskRow';
import { Plus, X, Edit2 } from 'lucide-react';

interface ChecklistSectionProps {
    section: ChecklistItem;
    onTaskUpdate: (taskId: string, updates: Partial<ChecklistItem>) => void;
    onTaskStatusChange: (taskId: string, status: ChecklistStatus) => void;
    onAddSubItem: (parent: ChecklistItem) => void;
    onEditItem: (item: ChecklistItem) => void;
    onDeleteItem: (id: string) => void;
    isDisabled?: boolean;
}

export default function ChecklistSectionComponent({ 
    section, 
    onTaskUpdate, 
    onTaskStatusChange,
    onAddSubItem,
    onEditItem,
    onDeleteItem,
    isDisabled = false
}: ChecklistSectionProps) {
    if (!section.children) return null;

    return (
        <div className="space-y-3 mb-6 last:mb-0 group/section relative">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                    {section.title}
                </h4>
                
                <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <button 
                        disabled={isDisabled}
                        onClick={() => onEditItem(section)}
                        className="p-1 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        title="Edit Section"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button 
                        disabled={isDisabled}
                        onClick={() => onAddSubItem(section)}
                        className="p-1 hover:text-green-600 transition-colors disabled:opacity-50"
                        title="Add Task"
                    >
                        <Plus size={14} />
                    </button>
                    <button 
                        disabled={isDisabled}
                        onClick={() => onDeleteItem(section.id)}
                        className="p-1 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Section"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                {section.children.map(task => (
                    <ChecklistTaskRow
                        key={task.id}
                        task={task}
                        onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                        onStatusChange={(status) => onTaskStatusChange(task.id, status)}
                        onEdit={() => onEditItem(task)}
                        onDelete={() => onDeleteItem(task.id)}
                        isDisabled={isDisabled}
                    />
                ))}
            </div>
            
            {section.children.length === 0 && (
                 <button 
                    disabled={isDisabled}
                    onClick={() => onAddSubItem(section)}
                    className="ml-4 text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1 py-2 disabled:opacity-50"
                 >
                    <Plus size={12} /> Add your first task
                 </button>
            )}
        </div>
    );
}
