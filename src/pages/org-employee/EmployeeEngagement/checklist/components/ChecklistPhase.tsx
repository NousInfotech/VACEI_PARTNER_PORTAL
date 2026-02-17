import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { ChecklistStatus, type ChecklistItem } from '../types';
import ChecklistSectionComponent from './ChecklistSection';
import ChecklistProgressBar from './ChecklistProgressBar';

interface ChecklistPhaseProps {
    phase: ChecklistItem;
    isExpanded: boolean;
    onToggle: () => void;
    onTaskUpdate: (taskId: string, updates: Partial<ChecklistItem>) => void;
    onTaskStatusChange: (taskId: string, status: ChecklistStatus) => void;
    onAddSubItem: (parent: ChecklistItem) => void;
    onEditItem: (item: ChecklistItem) => void;
    onDeleteItem: (id: string) => void;
    isDisabled?: boolean;
}

export default function ChecklistPhaseComponent({
    phase,
    isExpanded,
    onToggle,
    onTaskUpdate,
    onTaskStatusChange,
    onAddSubItem,
    onEditItem,
    onDeleteItem,
    isDisabled = false
}: ChecklistPhaseProps) {
    // Calculate progress for this phase - level 3 items belonging to this tree
    const getFlattenedTasks = (item: ChecklistItem): ChecklistItem[] => {
        let tasks: ChecklistItem[] = [];
        if (item.level === 3) tasks.push(item);
        if (item.children) {
            item.children.forEach(child => {
                tasks = [...tasks, ...getFlattenedTasks(child)];
            });
        }
        return tasks;
    };

    const phaseTasks = getFlattenedTasks(phase);
    const totalCount = phaseTasks.length;
    const completedCount = phaseTasks.filter(t => 
        t.status === ChecklistStatus.COMPLETED || t.status === ChecklistStatus.IGNORED
    ).length;

    const isComplete = totalCount > 0 && totalCount === completedCount;

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
            {/* Header / Accordion Trigger */}
            <button
                disabled={isDisabled}
                onClick={onToggle}
                className={cn(
                    "w-full text-left p-4 pr-16 rounded-xl border transition-all duration-300 relative group flex items-start gap-4 disabled:opacity-80 disabled:cursor-not-allowed",
                    isExpanded ? "bg-white border-indigo-200 shadow-lg shadow-indigo-50" : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        isComplete ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                        {isComplete ? <CheckCircle2 size={18} /> :
                            <span className="text-xs font-bold">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                        }
                    </div>
                    <div className="text-left">
                        <h3 className="text-base font-bold text-gray-900">{phase.title}</h3>
                        <p className="text-xs text-gray-500">
                            {completedCount} / {totalCount} Steps Completed
                        </p>
                    </div>
                </div>

                {isExpanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
            </button>

            {/* Expansion Content */}
            {isExpanded && (
                <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                    <ChecklistProgressBar
                        total={totalCount}
                        completed={completedCount}
                        className="mb-6"
                    />

                    <div className="space-y-6">
                        {phase.children?.map(section => (
                            <ChecklistSectionComponent
                                key={section.id}
                                section={section}
                                onTaskUpdate={onTaskUpdate}
                                onTaskStatusChange={onTaskStatusChange}
                                onAddSubItem={onAddSubItem}
                                onEditItem={onEditItem}
                                onDeleteItem={onDeleteItem}
                                isDisabled={isDisabled}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
