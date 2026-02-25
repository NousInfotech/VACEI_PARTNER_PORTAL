import {
    FileText,
    Sliders,
    ArrowRightLeft,
    TrendingUp,
    Scale,
    Download,
    PanelLeftClose,
    FolderOpen,
} from 'lucide-react';
import { useETBData } from '../hooks/useETBData';
import { extractClassificationGroups, organizeClassificationsByHierarchy } from '../utils/classificationUtils';
import { useMemo } from 'react';
import { ScrollArea } from '@/ui/scroll-area';
import { Button } from '@/ui/Button';

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
                <div key={item.id} className="text-[11px] font-bold text-gray-800 uppercase tracking-wider px-3 flex items-center gap-2 pt-4 pb-2 first:pt-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item.label}
                </div>
            );
        }

        if (item.type === 'sub-header') {
            return (
                <div key={item.id} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 mt-2">
                    {item.label}
                </div>
            );
        }

        const Icon = item.icon;
        const isActive = activeSection === item.id;

        const buttonClasses = [
            'w-full flex items-center gap-3 text-left h-auto p-3 transition-all duration-300 rounded-xl border border-amber-200 shadow-sm hover:shadow-md',
            isActive
                ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02] border-primary'
                : 'bg-white hover:bg-amber-50 text-gray-700 hover:text-primary',
        ].join(' ');

        return (
            <div key={item.id} className="px-2 mb-2">
                <Button
                    variant={isActive ? 'default' : 'outline'}
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={buttonClasses}
                >
                    {Icon && <Icon size={18} className="shrink-0" />}
                    <div className="flex flex-col items-start flex-1 min-w-0">
                        <div className="font-semibold text-xs whitespace-normal break-words">
                            {item.label}
                        </div>
                    </div>
                </Button>
            </div>
        );
    };

    return (
        <div className="w-full h-full border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0 min-h-0">
            <div className="p-4 border-b bg-white/50 backdrop-blur-sm flex justify-between items-start shrink-0">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                        Sections
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                        Quick views and classifications
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <PanelLeftClose size={18} />
                </button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <nav className="p-3 space-y-6">
                    {/* Planning Procedures */}
                    <div className="space-y-4 mb-6">
                        <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wider px-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            PLANNING
                        </div>
                        {PLANNING_SECTIONS.filter((i) => i.type === 'item').map(renderItem)}
                    </div>

                    {/* General Tools */}
                    <div className="space-y-4 mb-6">
                        <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wider px-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            GENERAL
                        </div>
                        {GENERAL_SECTIONS.map(renderItem)}
                    </div>

                    {/* Classifications */}
                    {classificationItems.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {classificationItems.map(renderItem)}
                        </div>
                    )}
                </nav>
            </ScrollArea>
        </div>
    );
}
