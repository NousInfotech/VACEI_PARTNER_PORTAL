import { type ChecklistSection, type ChecklistTask, type ChecklistTaskStatus } from '../types';
import ChecklistTaskRow from './ChecklistTaskRow';

interface ChecklistSectionProps {
    section: ChecklistSection;
    onTaskUpdate: (taskId: string, updates: Partial<ChecklistTask>) => void;
    onTaskStatusChange: (taskId: string, status: ChecklistTaskStatus) => void;
}

export default function ChecklistSectionComponent({ section, onTaskUpdate, onTaskStatusChange }: ChecklistSectionProps) {
    if (section.tasks.length === 0) return null;

    return (
        <div className="space-y-3 mb-6 last:mb-0">
            <h4 className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                {section.title}
            </h4>
            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                {section.tasks.map(task => (
                    <ChecklistTaskRow
                        key={task.id}
                        task={task}
                        onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                        onStatusChange={(status) => onTaskStatusChange(task.id, status)}
                    />
                ))}
            </div>
        </div>
    );
}
