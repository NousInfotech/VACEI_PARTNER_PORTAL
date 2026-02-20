import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { apiGet } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";

interface Group {
    title: string;
    subGroups: (Group | string)[];
    ruleset?: string[];
}

interface ClassificationBuilderProps {
    value: string; // Legacy: kept for backward compatibility
    onChange: (value: string) => void;
    group1?: string | null;
    group2?: string | null;
    group3?: string | null;
    group4?: string | null;
    onGroupsChange?: (groups: { group1: string | null; group2: string | null; group3: string | null; group4: string | null }) => void;
}

export default function ClassificationBuilder({ 
    onChange, 
    group1: initialGroup1 = null,
    group2: initialGroup2 = null,
    group3: initialGroup3 = null,
    group4: initialGroup4 = null,
    onGroupsChange 
}: ClassificationBuilderProps) {
    const [classificationMap, setClassificationMap] = useState<Group[]>([]);
    const [group1, setGroup1] = useState<string | null>(initialGroup1);
    const [group2, setGroup2] = useState<string | null>(initialGroup2);
    const [group3, setGroup3] = useState<string | null>(initialGroup3);
    const [group4, setGroup4] = useState<string | null>(initialGroup4);
    const [isLoading, setIsLoading] = useState(true);

    // Sync state with props when they change
    useEffect(() => {
        setGroup1(initialGroup1);
        setGroup2(initialGroup2);
        setGroup3(initialGroup3);
        setGroup4(initialGroup4);
    }, [initialGroup1, initialGroup2, initialGroup3, initialGroup4]);

    // Fetch classification map
    useEffect(() => {
        const fetchMap = async () => {
            try {
                const response = await apiGet<{ data: Group[] }>(endPoints.AUDIT.GET_CLASSIFICATION_MAP);
                setClassificationMap(response.data || response);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch classification map:', error);
                setIsLoading(false);
            }
        };
        fetchMap();
    }, []);

    // Get available group2 options based on selected group1
    const getGroup2Options = (): string[] => {
        if (!group1) return [];
        const group1Data = classificationMap.find(g => g.title === group1);
        if (!group1Data) return [];
        return group1Data.subGroups
            .filter((sg): sg is Group => typeof sg === 'object' && 'title' in sg)
            .map(sg => sg.title);
    };

    // Get available group3 options based on selected group1 and group2
    const getGroup3Options = (): string[] => {
        if (!group1 || !group2) return [];
        const group1Data = classificationMap.find(g => g.title === group1);
        if (!group1Data) return [];
        const group2Data = group1Data.subGroups.find(
            (sg): sg is Group => typeof sg === 'object' && 'title' in sg && sg.title === group2
        );
        if (!group2Data) return [];
        return group2Data.subGroups
            .filter((sg): sg is Group => typeof sg === 'object' && 'title' in sg)
            .map(sg => sg.title);
    };

    // Get available group4 options based on selected group1, group2, and group3
    const getGroup4Options = (): string[] => {
        if (!group1 || !group2 || !group3) return [];
        const group1Data = classificationMap.find(g => g.title === group1);
        if (!group1Data) return [];
        const group2Data = group1Data.subGroups.find(
            (sg): sg is Group => typeof sg === 'object' && 'title' in sg && sg.title === group2
        );
        if (!group2Data) return [];
        const group3Data = group2Data.subGroups.find(
            (sg): sg is Group => typeof sg === 'object' && 'title' in sg && sg.title === group3
        );
        if (!group3Data) return [];
        return group3Data.subGroups
            .filter((sg): sg is string => typeof sg === 'string')
            .map(sg => sg);
    };

    const handleGroupChange = (level: 1 | 2 | 3 | 4, newValue: string | null) => {
        const newGroups = { group1, group2, group3, group4 };
        
        if (level === 1) {
            newGroups.group1 = newValue;
            newGroups.group2 = null;
            newGroups.group3 = null;
            newGroups.group4 = null;
            setGroup1(newValue);
            setGroup2(null);
            setGroup3(null);
            setGroup4(null);
        } else if (level === 2) {
            newGroups.group2 = newValue;
            newGroups.group3 = null;
            newGroups.group4 = null;
            setGroup2(newValue);
            setGroup3(null);
            setGroup4(null);
        } else if (level === 3) {
            newGroups.group3 = newValue;
            newGroups.group4 = null;
            setGroup3(newValue);
            setGroup4(null);
        } else if (level === 4) {
            newGroups.group4 = newValue;
            setGroup4(newValue);
        }

        // Update legacy classification string
        const classificationParts = [
            newGroups.group1,
            newGroups.group2,
            newGroups.group3,
            newGroups.group4
        ].filter(Boolean);
        onChange(classificationParts.join(' > ') || '');

        // Call onGroupsChange if provided
        if (onGroupsChange) {
            onGroupsChange(newGroups);
        }
    };

    const handleClearGroup = (level: 1 | 2 | 3 | 4) => {
        handleGroupChange(level, null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-2">
                <span className="text-xs text-gray-400">Loading...</span>
            </div>
        );
    }

    const group1Options = classificationMap.map(g => g.title);
    const group2Options = getGroup2Options();
    const group3Options = getGroup3Options();
    const group4Options = getGroup4Options();

    return (
        <div className="flex flex-col gap-2 p-2 min-w-[200px]">
            {/* Group 1 */}
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">Group 1</span>
                <div className="relative flex-1">
                    <select
                        value={group1 || ''}
                        onChange={(e) => handleGroupChange(1, e.target.value || null)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 pr-6 appearance-none"
                    >
                        <option value="">Select Group 1...</option>
                        {group1Options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {group1 && (
                    <button
                        onClick={() => handleClearGroup(1)}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Group 2 */}
            {group1 && (
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">Group 2</span>
                    <div className="relative flex-1">
                        <select
                            value={group2 || ''}
                            onChange={(e) => handleGroupChange(2, e.target.value || null)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 pr-6 appearance-none"
                            disabled={!group1 || group2Options.length === 0}
                        >
                            <option value="">Select Group 2...</option>
                            {group2Options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {group2 && (
                        <button
                            onClick={() => handleClearGroup(2)}
                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Group 3 */}
            {group1 && group2 && (
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">Group 3</span>
                    <div className="relative flex-1">
                        <select
                            value={group3 || ''}
                            onChange={(e) => handleGroupChange(3, e.target.value || null)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 pr-6 appearance-none"
                            disabled={!group2 || group3Options.length === 0}
                        >
                            <option value="">Select Group 3...</option>
                            {group3Options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {group3 && (
                        <button
                            onClick={() => handleClearGroup(3)}
                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Group 4 */}
            {group1 && group2 && group3 && (
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-400 w-12 shrink-0">Group 4</span>
                    <div className="relative flex-1">
                        {group4Options.length > 0 ? (
                            <select
                                value={group4 || ''}
                                onChange={(e) => handleGroupChange(4, e.target.value || null)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 pr-6 appearance-none"
                            >
                                <option value="">Select Group 4...</option>
                                {group4Options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={group4 || ''}
                                onChange={(e) => handleGroupChange(4, e.target.value || null)}
                                placeholder="Custom tag..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                            />
                        )}
                        {group4Options.length > 0 && (
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        )}
                    </div>
                    {group4 && (
                        <button
                            onClick={() => handleClearGroup(4)}
                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
