import {
    FileText,
    Sliders,
    ArrowRightLeft,
    TrendingUp,
    Scale,
    Download,
    PanelLeftClose
} from 'lucide-react';
import { useETBData } from '../hooks/useETBData';
import { extractClassificationGroups, organizeClassificationsByHierarchy } from '../utils/classificationUtils';
import { useMemo } from 'react';

interface SidebarItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    type?: 'item' | 'header' | 'sub-header';
}

const GENERAL_SECTIONS: SidebarItem[] = [
    { id: 'extended-tb', label: 'Extended Trial Balance', icon: FileText, type: 'item' },
    { id: 'adjustments', label: 'Adjustments', icon: Sliders, type: 'item' },
    { id: 'reclassifications', label: 'Reclassifications', icon: ArrowRightLeft, type: 'item' },
    { id: 'income-statement', label: 'Income Statement', icon: TrendingUp, type: 'item' },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale, type: 'item' },
    { id: 'exports', label: 'Exports', icon: Download, type: 'item' },
    { id: 'completion-procedures', label: 'Completion Procedures', icon: FileText, type: 'item' },
];

const PLANNING_SECTIONS: SidebarItem[] = [
    { id: 'header-planning', label: 'PLANNING', type: 'header' },
    { id: 'planning-procedures', label: 'Planning Procedures', icon: Sliders, type: 'item' },
];

interface SectionsSidebarProps {
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
    onToggle: () => void;
    engagementId?: string;
}

export default function SectionsSidebar({ activeSection, onSectionChange, onToggle, engagementId }: SectionsSidebarProps) {
    const activeColor = 'rgb(253, 230, 138)';
    
    // Fetch ETB data to extract classifications
    const { data: etbData, isLoading } = useETBData(engagementId);
    
    // Extract and organize classification groups
    const classificationItems = useMemo(() => {
        if (!engagementId) return [];
        if (isLoading) return [];
        if (!etbData?.etbRows || etbData.etbRows.length === 0) {
            return [];
        }
        
        try {
            const groups = extractClassificationGroups(etbData.etbRows);
            
            if (groups.length === 0) {
                return [];
            }
            
            const organized = organizeClassificationsByHierarchy(groups);
            
            const items: SidebarItem[] = [
                { id: 'header-classifications', label: 'CLASSIFICATIONS', type: 'header' }
            ];
            
            // Iterate through organized structure
            for (const [group1, group2Map] of Object.entries(organized)) {
                // Add group1 as sub-header
                items.push({
                    id: `header-${group1.toLowerCase().replace(/\s+/g, '-')}`,
                    label: group1.toUpperCase(),
                    type: 'sub-header'
                });
                
                // Add group2 as header and group3 items
                for (const [group2, group3Items] of Object.entries(group2Map)) {
                    items.push({
                        id: `header-${group2.toLowerCase().replace(/\s+/g, '-')}`,
                        label: group2.toUpperCase(),
                        type: 'header'
                    });
                    
                    // Add each group3 as an item
                    for (const group of group3Items) {
                        items.push({
                            id: `classification-${group.id}`,
                            label: group.label,
                            type: 'item'
                        });
                    }
                }
            }
            
            return items;
        } catch (error) {
            console.error('[SectionsSidebar] Error extracting classifications', error);
            return [];
        }
    }, [etbData?.etbRows, engagementId, isLoading]);

    const renderItem = (item: SidebarItem) => {
        if (item.type === 'header') {
            return (
                <div key={item.id} className="pk-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider px-4">
                    {item.label}
                </div>
            );
        }

        if (item.type === 'sub-header') {
            return (
                <div key={item.id} className="pk-4 pt-4 pb-2 text-sm font-bold text-gray-800 uppercase px-4 mt-2">
                    {item.label}
                </div>
            );
        }

        const Icon = item.icon;
        const isActive = activeSection === item.id;

        const isClassificationItem = !item.icon;

        return (
            <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border group ${isClassificationItem ? 'bg-white border-gray-200 shadow-sm' : 'border-transparent' // Card style for classification items
                    }`}
                style={{
                    borderColor: isActive ? activeColor : (isClassificationItem ? '#E5E7EB' : 'transparent'),
                    color: isActive ? 'black' : '#4B5563',
                    backgroundColor: isActive ? activeColor : (isClassificationItem ? 'white' : 'transparent'),
                }}
            >
                {Icon && <Icon size={18} />}
                {item.label}
            </button>
        );
    };

    return (
        <div className="w-full h-full border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">
            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">Sections</h3>
                    <p className="text-xs text-gray-500 mt-1">Quick views and classifications</p>
                </div>
                <button
                    onClick={onToggle}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <PanelLeftClose size={18} />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Planning Procedures */}
                <div className="space-y-1">
                    {PLANNING_SECTIONS.map(renderItem)}
                </div>

                {/* General Tools */}
                <div className="space-y-1">
                    {GENERAL_SECTIONS.map(renderItem)}
                </div>

                {/* Classifications */}
                <div className="space-y-1">
                    {classificationItems.map(renderItem)}
                </div>
            </nav>
        </div>
    );
}
