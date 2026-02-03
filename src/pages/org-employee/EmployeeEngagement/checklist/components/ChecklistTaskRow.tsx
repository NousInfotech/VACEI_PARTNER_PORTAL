import { useState } from 'react';
import { CheckCircle2, Circle, Clock, MinusCircle, MessageSquare, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { type ChecklistTask, type ChecklistTaskStatus } from '../types';

interface ChecklistTaskRowProps {
    task: ChecklistTask;
    onStatusChange: (status: ChecklistTaskStatus) => void;
    onUpdate: (updates: Partial<ChecklistTask>) => void;
}

export default function ChecklistTaskRow({ task, onStatusChange, onUpdate }: ChecklistTaskRowProps) {
    const [isNotesOpen, setIsNotesOpen] = useState(!!task.notes);

    const getStatusIcon = (status: ChecklistTaskStatus) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
            case 'not_applicable': return <MinusCircle className="w-5 h-5 text-gray-400" />;
            default: return <Circle className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStatusColor = (status: ChecklistTaskStatus) => {
        switch (status) {
            case 'completed': return 'bg-green-50 border-green-200';
            case 'in_progress': return 'bg-blue-50 border-blue-200';
            case 'not_applicable': return 'bg-gray-50 border-gray-200 opacity-60';
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
                        const nextStatus: Record<ChecklistTaskStatus, ChecklistTaskStatus> = {
                            'not_started': 'in_progress',
                            'in_progress': 'completed',
                            'completed': 'not_applicable',
                            'not_applicable': 'not_started'
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
                            task.status === 'completed' && "line-through text-gray-500",
                            task.status === 'not_applicable' && "text-gray-400"
                        )}>
                            {task.title}
                        </span>

                        {/* Status Dropdown (Button Style) */}
                        <div className="relative shrink-0">
                            <select
                                value={task.status}
                                onChange={(e) => onStatusChange(e.target.value as ChecklistTaskStatus)}
                                className={cn(
                                    "appearance-none pl-3 pr-7 py-1.5 rounded-md text-[10px] uppercase font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm",
                                    task.status === 'not_started' && "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
                                    task.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
                                    task.status === 'completed' && "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300",
                                    task.status === 'not_applicable' && "bg-gray-50 text-gray-400 border-gray-200 opacity-70"
                                )}
                            >
                                <option value="not_started">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Done</option>
                                <option value="not_applicable">N/A</option>
                            </select>
                            <ChevronDown
                                size={12}
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
                                    task.status === 'in_progress' ? "text-blue-500" :
                                        task.status === 'completed' ? "text-green-500" : "text-gray-400"
                                )}
                            />
                        </div>
                    </div>

                    {/* Controls based on task type */}
                    {task.status !== 'not_applicable' && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                            {task.type === 'date' && (
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1">
                                    <Calendar size={12} className="text-gray-400" />
                                    <input
                                        type="date"
                                        value={task.dueDate || ''}
                                        onChange={(e) => onUpdate({ dueDate: e.target.value })}
                                        className="text-xs border-none p-0 focus:ring-0 text-gray-600"
                                    />
                                </div>
                            )}

                            {task.type === 'text' && (
                                <input
                                    type="text"
                                    placeholder="Enter details..."
                                    className="text-xs border border-gray-200 rounded px-2 py-1 w-full max-w-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={task.notes || ''} // Using notes field for text input for simplicity
                                    onChange={(e) => onUpdate({ notes: e.target.value })}
                                />
                            )}

                            {task.type === 'select' && task.selectOptions && (
                                <select
                                    className="text-xs border border-gray-200 rounded px-2 py-1 max-w-xs focus:ring-1 focus:ring-indigo-500"
                                    onChange={(e) => onUpdate({ notes: e.target.value })} // Storing selection in notes for now
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select option...</option>
                                    {task.selectOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}

                            {/* Notes Toggle */}
                            <button
                                onClick={() => setIsNotesOpen(!isNotesOpen)}
                                className={cn(
                                    "flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
                                    isNotesOpen ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                <MessageSquare size={12} />
                                {task.notes && task.type !== 'text' ? 'Edit Note' : 'Add Note'}
                            </button>
                        </div>
                    )}

                    {/* Notes Area */}
                    {isNotesOpen && task.type !== 'text' && (
                        <textarea
                            placeholder="Add notes or comments..."
                            className="w-full text-xs border border-gray-200 rounded p-2 focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                            value={task.notes || ''}
                            onChange={(e) => onUpdate({ notes: e.target.value })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
