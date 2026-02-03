import { cn } from '../../../../../lib/utils';

interface ChecklistProgressBarProps {
    total: number;
    completed: number;
    className?: string;
    showText?: boolean;
}

export default function ChecklistProgressBar({ total, completed, className, showText = true }: ChecklistProgressBarProps) {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className={cn("space-y-1.5", className)}>
            {showText && (
                <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Progress</span>
                    <span>{percentage}% ({completed}/{total})</span>
                </div>
            )}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
