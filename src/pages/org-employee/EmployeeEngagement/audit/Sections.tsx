import { useState } from 'react';
import { Menu } from 'lucide-react';
import ExtendedTB from './extended-tb/ExtendedTB';
import SectionsSidebar from './components/SectionsSidebar';
import Adjustments from './adjustments/Adjustments';
import Reclassifications from './reclassifications/Reclassifications';
import IncomeStatement from './income-statement/IncomeStatement';
import BalanceSheet from './balance-sheet/BalanceSheet';
import Exports from './exports/Exports';
import ClassificationView from './classification-view/ClassificationView';
import PlanningProcedures from './classification-view/components/PlanningProcedures';
import CompletionProcedures from './classification-view/components/CompletionProcedures';

const SECTIONS = [
    { id: 'extended-tb', label: 'Extended Trial Balance' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'reclassifications', label: 'Reclassifications' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'exports', label: 'Exports' },
    { id: 'planning-procedures', label: 'Planning Procedures' },
    { id: 'completion-procedures', label: 'Completion Procedures' },
];

interface SectionsProps {
    engagementId?: string;
}

export default function Sections({ engagementId }: SectionsProps) {
    const [activeSection, setActiveSection] = useState('planning-procedures');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const renderContent = () => {
        switch (activeSection) {
            case 'extended-tb':
                return <ExtendedTB isSectionsView={true} engagementId={engagementId} />;
            case 'adjustments':
                return <Adjustments engagementId={engagementId} />;
            case 'reclassifications':
                return <Reclassifications engagementId={engagementId} />;
            case 'income-statement':
                return <IncomeStatement engagementId={engagementId} />;
            case 'balance-sheet':
                return <BalanceSheet engagementId={engagementId} />;
            case 'exports':
                return <Exports />;

            // Planning Procedures
            case 'planning-procedures':
                return (
                    <div className="p-8">
                        <PlanningProcedures title="Planning Procedures" />
                    </div>
                );

            // Completion Procedures
            case 'completion-procedures':
                return (
                    <div className="p-8">
                        <CompletionProcedures title="Completion Procedures" />
                    </div>
                );

            // Dynamic Classification Pages
            case 'intangible-assets':
                return <ClassificationView title="Intangible Assets" subtitle="Analysis of intangible assets, amortization, and impairment." />;
            case 'share-capital':
                return <ClassificationView title="Share Capital" subtitle="Analysis of equity structure, shares issued, and capital reserves." />;

            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {SECTIONS.find(s => s.id === activeSection)?.label} Content Placeholder
                    </div>
                );
        }
    };

    return (
        <div className="flex bg-white rounded-2xl overflow-hidden min-h-[600px] h-[calc(100vh-140px)] relative">
            <div className={`${isSidebarOpen ? 'w-72 border-r' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-50/50 border-gray-100 flex flex-col shrink-0`}>
                <SectionsSidebar
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 bg-white relative flex flex-col">
                {!isSidebarOpen && (
                    <div className="absolute top-4 left-4 z-20">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                )}
                <div className={`h-full overflow-y-auto ${!isSidebarOpen ? 'pt-16' : ''}`}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
