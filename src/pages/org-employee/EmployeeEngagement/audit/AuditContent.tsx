import { useState } from 'react';
import { FileSpreadsheet, Layers } from 'lucide-react';
import PillTab from '../../../common/PillTab';
import ExtendedTB from './extended-tb/ExtendedTB';
import Sections from './Sections';

const AUDIT_TABS = [
    { id: 'extended-tb', label: 'Extended TB', icon: FileSpreadsheet },
    { id: 'sections', label: 'Sections', icon: Layers },
];

export default function AuditContent() {
    const [activeTab, setActiveTab] = useState('extended-tb');

    return (
        <div className="space-y-6">
            <div className="w-full overflow-hidden flex items-center">
                <PillTab
                    tabs={AUDIT_TABS}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                {activeTab === 'extended-tb' ? <ExtendedTB /> : <Sections />}
            </div>
        </div>
    );
}
