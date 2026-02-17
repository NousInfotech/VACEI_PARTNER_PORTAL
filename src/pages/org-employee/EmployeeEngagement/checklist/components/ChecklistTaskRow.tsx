import { CheckCircle2, Circle, Clock, MinusCircle, Calendar, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { ChecklistStatus, type ChecklistItem } from '../types';

interface ChecklistTaskRowProps {
    task: ChecklistItem;
    onStatusChange: (status: ChecklistStatus) => void;
    onUpdate: (updates: Partial<ChecklistItem>) => void;
    onEdit: () => void;
    onDelete: () => void;
    isDisabled?: boolean;
}

export default function ChecklistTaskRow({ task, onStatusChange, onUpdate, onEdit, onDelete, isDisabled = false }: ChecklistTaskRowProps) {
    const getStatusIcon = (status: ChecklistStatus) => {
        switch (status) {
            case ChecklistStatus.COMPLETED: return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case ChecklistStatus.IN_PROGRESS: return <Clock className="w-5 h-5 text-blue-600" />;
            case ChecklistStatus.IGNORED: return <MinusCircle className="w-5 h-5 text-gray-400" />;
            default: return <Circle className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStatusColor = (status: ChecklistStatus) => {
        switch (status) {
            case ChecklistStatus.COMPLETED: return 'bg-green-50 border-green-200';
            case ChecklistStatus.IN_PROGRESS: return 'bg-blue-50 border-blue-200';
            case ChecklistStatus.IGNORED: return 'bg-gray-50 border-gray-200 opacity-60';
            default: return 'bg-white border-gray-100 hover:border-gray-300';
        }
    };

    return (
        <div className={cn(
            "border rounded-lg p-3 transition-all",
            getStatusColor(task.status)
        )}>
            <div className="flex items-start gap-3">
                {/* Status Toggle (Clickable Icon) */}
                <button
                    onClick={() => {
                        const nextStatus: Record<ChecklistStatus, ChecklistStatus> = {
                            [ChecklistStatus.TO_DO]: ChecklistStatus.IN_PROGRESS,
                            [ChecklistStatus.IN_PROGRESS]: ChecklistStatus.COMPLETED,
                            [ChecklistStatus.COMPLETED]: ChecklistStatus.IGNORED,
                            [ChecklistStatus.IGNORED]: ChecklistStatus.TO_DO
                        };
                        onStatusChange(nextStatus[task.status]);
                    }}
                    className="mt-0.5 shrink-0 focus:outline-none"
                >
                    {getStatusIcon(task.status)}
                </button>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <span className={cn(
                            "text-sm font-medium text-gray-900",
                            task.status === ChecklistStatus.COMPLETED && "line-through text-gray-500",
                            task.status === ChecklistStatus.IGNORED && "text-gray-400"
                        )}>
                            {task.title}
                        </span>

                        {/* Status Dropdown */}
                        <div className="flex items-center gap-2">
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button 
                                    disabled={isDisabled}
                                    onClick={onEdit}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                                    title="Edit Task"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    disabled={isDisabled}
                                    onClick={onDelete}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                    title="Delete Task"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    disabled={isDisabled}
                                    value={task.status}
                                    onChange={(e) => onStatusChange(e.target.value as ChecklistStatus)}
                                    className={cn(
                                        "appearance-none pl-3 pr-2 py-1.5 rounded-md text-[10px] uppercase font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm",
                                        task.status === ChecklistStatus.TO_DO && "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                                        task.status === ChecklistStatus.IN_PROGRESS && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                        task.status === ChecklistStatus.COMPLETED && "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
                                        task.status === ChecklistStatus.IGNORED && "bg-gray-50 text-gray-400 border-gray-200 opacity-70",
                                        isDisabled && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <option value={ChecklistStatus.TO_DO}>To Do</option>
                                    <option value={ChecklistStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={ChecklistStatus.COMPLETED}>Done</option>
                                    <option value={ChecklistStatus.IGNORED}>N/A</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Deadline Control */}
                    {task.status !== ChecklistStatus.IGNORED && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                             <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1">
                                <Calendar size={12} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                                    onChange={(e) => onUpdate({ deadline: e.target.value })}
                                    className="text-xs border-none p-0 focus:ring-0 text-gray-600"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
