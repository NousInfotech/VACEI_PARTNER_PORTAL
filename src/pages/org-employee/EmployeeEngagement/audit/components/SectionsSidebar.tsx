import {
    FileText,
    Sliders,
    ArrowRightLeft,
    TrendingUp,
    Scale,
    Download
} from 'lucide-react';

const SECTIONS = [
    { id: 'extended-tb', label: 'Extended Trial Balance', icon: FileText },
    { id: 'adjustments', label: 'Adjustments', icon: Sliders },
    { id: 'reclassifications', label: 'Reclassifications', icon: ArrowRightLeft },
    { id: 'income-statement', label: 'Income Statement', icon: TrendingUp },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    { id: 'exports', label: 'Exports', icon: Download },
];

interface SectionsSidebarProps {
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
}

export default function SectionsSidebar({ activeSection, onSectionChange }: SectionsSidebarProps) {
    const activeColor = 'rgb(253, 230, 138)';

    return (
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 leading-tight">Sections</h3>
                <p className="text-xs text-gray-500 mt-1">Quick views and classifications</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => onSectionChange(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border group`}
                            style={{
                                borderColor: isActive ? activeColor : 'transparent',
                                color: isActive ? 'black' : '#4B5563',
                                backgroundColor: isActive ? activeColor : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = activeColor;
                                    e.currentTarget.style.color = 'black';
                                    e.currentTarget.style.borderColor = activeColor;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#4B5563';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <Icon size={18} />
                            {section.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
