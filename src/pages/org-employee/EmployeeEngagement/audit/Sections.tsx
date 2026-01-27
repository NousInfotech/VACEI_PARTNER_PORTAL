import { useState } from 'react';
import ExtendedTB from './extended-tb/ExtendedTB';
import SectionsSidebar from './components/SectionsSidebar';
import Adjustments from './adjustments/Adjustments';
import Reclassifications from './reclassifications/Reclassifications';
import IncomeStatement from './income-statement/IncomeStatement';
import BalanceSheet from './balance-sheet/BalanceSheet';
import Exports from './exports/Exports';

const SECTIONS = [
    { id: 'extended-tb', label: 'Extended Trial Balance' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'reclassifications', label: 'Reclassifications' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'exports', label: 'Exports' },
];

export default function Sections() {
    const [activeSection, setActiveSection] = useState('extended-tb');

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
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {SECTIONS.find(s => s.id === activeSection)?.label} Content Placeholder
                    </div>
                );
        }
    };

    return (
        <div className="flex bg-white rounded-2xl overflow-hidden min-h-[600px]">
            <SectionsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="h-full overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
