import {
    FileText,
    Sliders,
    ArrowRightLeft,
    TrendingUp,
    Scale,
    Download
} from 'lucide-react';

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
];

const CLASSIFICATION_SECTIONS: SidebarItem[] = [
    { id: 'header-classifications', label: 'CLASSIFICATIONS', type: 'header' },

    // Assets Group
    { id: 'header-assets', label: 'ASSETS', type: 'sub-header' },
    { id: 'sub-non-current', label: 'NON-CURRENT', type: 'header' },
    { id: 'intangible-assets', label: 'Intangible assets', type: 'item' },

    // Equity Group
    { id: 'header-liab-equity', label: 'LIABILITIES & EQUITY', type: 'sub-header' },
    { id: 'header-equity', label: 'EQUITY', type: 'header' },
    { id: 'share-capital', label: 'Share capital', type: 'item' },
];

const PLANNING_SECTIONS: SidebarItem[] = [
    { id: 'header-planning', label: 'PLANNING PROCEDURES', type: 'header' },
    { id: 'generate-procedures', label: 'Generate Procedures', icon: Sliders, type: 'item' },
    { id: 'view-procedures', label: 'View Procedures', icon: FileText, type: 'item' },
];

interface SectionsSidebarProps {
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
}

export default function SectionsSidebar({ activeSection, onSectionChange }: SectionsSidebarProps) {
    const activeColor = 'rgb(253, 230, 138)';

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

        // Indent items that are part of classifications (rudimentary check, can be improved)
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
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">
            <div className="p-6 border-b border-gray-100 bg-white">
                <h3 className="font-bold text-gray-900 leading-tight">Sections</h3>
                <p className="text-xs text-gray-500 mt-1">Quick views and classifications</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Planning Procedures */}
                <div className="space-y-1 mb-6">
                    {PLANNING_SECTIONS.map(renderItem)}
                </div>

                {/* General Tools */}
                <div className="space-y-1 mb-6">
                    {GENERAL_SECTIONS.map(renderItem)}
                </div>

                {/* Classifications */}
                <div className="space-y-1">
                    {CLASSIFICATION_SECTIONS.map(renderItem)}
                </div>
            </nav>
        </div>
    );
}
