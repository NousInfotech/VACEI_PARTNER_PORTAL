import { Plus, X } from "lucide-react";

interface ClassificationBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

const LEVEL_1_OPTIONS = ["Assets", "Equity", "Liabilities", "Income", "Expenses"];
const LEVEL_2_OPTIONS = ["Non-current", "Current"];

export default function ClassificationBuilder({ value, onChange }: ClassificationBuilderProps) {
    const levels = value ? value.split(" > ").map(s => s.trim()) : [];

    const updateParent = (newLevels: string[]) => {
        onChange(newLevels.join(" > "));
    };

    const handleLevelChange = (index: number, newValue: string) => {
        const newLevels = [...levels];
        newLevels[index] = newValue;
        updateParent(newLevels);
    };

    const handleAddLevel = () => {
        const newLevels = [...levels, ""];
        updateParent(newLevels);
    };

    const handleDeleteLevel = (index: number) => {
        const newLevels = levels.filter((_, i) => i !== index);
        updateParent(newLevels);
    };

    return (
        <div className="flex flex-col gap-2 p-2">
            {levels.map((level, index) => (
                <div key={index} className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">
                        Level {index + 1}
                    </span>
                    {index === 0 ? (
                        <select
                            value={level}
                            onChange={(e) => handleLevelChange(index, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                        >
                            <option value="">Select...</option>
                            {LEVEL_1_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : index === 1 ? (
                        <select
                            value={level}
                            onChange={(e) => handleLevelChange(index, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                        >
                            <option value="">Select...</option>
                            {LEVEL_2_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                            {!LEVEL_2_OPTIONS.includes(level) && level && (
                                <option value={level}>{level}</option>
                            )}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={level}
                            onChange={(e) => handleLevelChange(index, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                            placeholder="Custom..."
                        />
                    )}

                    <button
                        onClick={() => handleDeleteLevel(index)}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Level"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}

            <button
                onClick={handleAddLevel}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 w-fit"
            >
                <Plus size={14} />
                Add Level
            </button>
        </div>
    );
}
