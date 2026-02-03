import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { type ChecklistPhase, type ChecklistTask, type ChecklistTaskStatus } from '../types';
import ChecklistSectionComponent from './ChecklistSection';
import ChecklistProgressBar from './ChecklistProgressBar';

interface ChecklistPhaseProps {
    phase: ChecklistPhase;
    allTasks: ChecklistTask[]; // Need flattened list to calc progress
    isExpanded: boolean;
    onToggle: () => void;
    onTaskUpdate: (taskId: string, updates: Partial<ChecklistTask>) => void;
    onTaskStatusChange: (taskId: string, status: ChecklistTaskStatus) => void;
}

export default function ChecklistPhaseComponent({
    phase,
    allTasks, // Passed in derived from parent or filtered
    isExpanded,
    onToggle,
    onTaskUpdate,
    onTaskStatusChange
}: ChecklistPhaseProps) {
    // Calculate progress for this phase
    const phaseTasks = allTasks.filter(t =>
        phase.sections.some(s => s.tasks.some(pt => pt.id === t.id))
    );

    // Valid tasks to count (exclude N/A from denominator if desired, but std is completed/total)
    // User requirement: "Tasks marked Completed or Not Applicable count toward progress"
    const totalCount = phaseTasks.length;
    const completedCount = phaseTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length;

    const isComplete = totalCount > 0 && totalCount === completedCount;

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
            {/* Header / Accordion Trigger */}
            <button
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between p-4 transition-colors",
                    isExpanded ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        isComplete ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                        {isComplete ? <CheckCircle2 size={18} /> :
                            <span className="text-xs font-bold">{Math.round((completedCount / totalCount) * 100) || 0}%</span>
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
                        {phase.sections.map(section => (
                            <ChecklistSectionComponent
                                key={section.id}
                                section={section}
                                onTaskUpdate={onTaskUpdate}
                                onTaskStatusChange={onTaskStatusChange}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
