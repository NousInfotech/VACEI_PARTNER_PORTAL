import { useState } from 'react';
import ExtendedTB from './extended-tb/ExtendedTB';
import SectionsSidebar from './components/SectionsSidebar';
import Adjustments from './adjustments/Adjustments';
import Reclassifications from './reclassifications/Reclassifications';
import IncomeStatement from './income-statement/IncomeStatement';
import BalanceSheet from './balance-sheet/BalanceSheet';
import Exports from './exports/Exports';
import ClassificationView from './classification-view/ClassificationView';
import GenerateProcedures from './classification-view/components/GenerateProcedures';
import ViewProcedures from './classification-view/components/ViewProcedures';

const SECTIONS = [
    { id: 'extended-tb', label: 'Extended Trial Balance' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'reclassifications', label: 'Reclassifications' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'exports', label: 'Exports' },
    { id: 'generate-procedures', label: 'Generate Procedures' },
    { id: 'view-procedures', label: 'View Procedures' },
];

export default function Sections() {
    const [activeSection, setActiveSection] = useState('generate-procedures');

    const renderContent = () => {
        switch (activeSection) {
            case 'extended-tb':
                return <ExtendedTB isSectionsView={true} />;
            case 'adjustments':
                return <Adjustments />;
            case 'reclassifications':
                return <Reclassifications />;
            case 'income-statement':
                return <IncomeStatement />;
            case 'balance-sheet':
                return <BalanceSheet />;
            case 'exports':
                return <Exports />;

            // Planning Procedures
            case 'generate-procedures':
                return (
                    <div className="p-8">
                        <GenerateProcedures onProceed={() => setActiveSection('view-procedures')} />
                    </div>
                );
            case 'view-procedures':
                return (
                    <div className="p-8">
                        <ViewProcedures title="Audit Procedures" />
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
        <div className="flex bg-white rounded-2xl overflow-hidden min-h-[600px] h-[calc(100vh-140px)]">
            <SectionsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0 bg-white">
                <div className="h-full overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
