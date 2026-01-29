import { useState, useMemo } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ClassificationSelectionStepProps {
    onProceed: () => void;
    onBack?: () => void;
}

interface AccountRow {
    id: string;
    valid: boolean;
    code: string;
    accountName: string;
    finalBalance: number;
    classification: string;
}

const MOCK_DATA: AccountRow[] = [
    { id: '1', valid: true, code: '1', accountName: 'Cash and cash equivalents', finalBalance: 265769, classification: 'Intangible assets - Cost' },
    { id: '2', valid: true, code: '2', accountName: 'Accruals', finalBalance: -5285, classification: 'Equity' },
    { id: '3', valid: true, code: '3', accountName: 'FSS & NI DUE', finalBalance: -14740, classification: 'Unclassified' },
    { id: '4', valid: true, code: '4', accountName: "Shareholders' Loan", finalBalance: -453816, classification: 'Unclassified' },
    { id: '5', valid: true, code: '5', accountName: 'Other payables', finalBalance: -8671, classification: 'Unclassified' },
    { id: '6', valid: true, code: '6', accountName: 'Opening Balance Equity', finalBalance: 216983, classification: 'Unclassified' },
    { id: '7', valid: true, code: '7', accountName: 'Share capital', finalBalance: -240, classification: 'Unclassified' },
    { id: '8', valid: true, code: '8', accountName: 'Sales', finalBalance: -60000, classification: 'Unclassified' },
    { id: '9', valid: true, code: '9', accountName: 'Administrative Expenses:Professional Fees', finalBalance: 0, classification: 'Unclassified' },
    { id: '10', valid: true, code: '10', accountName: 'Administrative Expenses:Tax Return Fee', finalBalance: 385, classification: 'Unclassified' },
    { id: '11', valid: true, code: '8', accountName: 'Administrative Expenses:Annual Return Fee', finalBalance: 100, classification: 'Unclassified' },
    { id: '12', valid: true, code: '12', accountName: 'Audit Fees', finalBalance: 1100, classification: 'Unclassified' },
    { id: '13', valid: true, code: '13', accountName: 'Wage expenses:6000 Gross Salary', finalBalance: 64962, classification: 'Unclassified' },
    { id: '14', valid: true, code: '14', accountName: 'Other Income:Other Income (not taxable)', finalBalance: -4917, classification: 'Unclassified' },
];

export default function ClassificationSelectionStep({ onProceed, onBack }: ClassificationSelectionStepProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(MOCK_DATA.filter(r => r.valid).map(r => r.id)));

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === MOCK_DATA.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(MOCK_DATA.map(r => r.id)));
        }
    };

    const activeClassifications = useMemo(() => {
        const classes = new Set(MOCK_DATA.filter(r => selectedIds.has(r.id)).map(r => r.classification));
        return Array.from(classes).filter(c => c !== 'Unclassified');
    }, [selectedIds]);




    return (
        <div className="space-y-8">
            {/* Table Section */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Extended Trial Balance</h2>
                        <p className="text-gray-500 text-sm mt-1">Accounts with final balance ≥ €898 are pre-selected. You can adjust selections manually.</p>
                    </div>
                    <button
                        onClick={toggleAll}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Select All
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-16">Valid</th>
                                <th className="px-6 py-4 w-20">Code</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4 text-right">Final Balance</th>
                                <th className="px-6 py-4">Classification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_DATA.map((row) => {
                                const isSelected = selectedIds.has(row.id);
                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleSelection(row.id)}
                                    >
                                        <td className="px-6 py-4">
                                            {isSelected ? (
                                                <CheckCircle className="fill-gray-900 text-white" size={20} />
                                            ) : (
                                                <Circle className="text-gray-400" size={20} />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{row.code}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.accountName}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            €{row.finalBalance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${row.classification === 'Unclassified'
                                                ? 'bg-transparent border-transparent text-gray-500'
                                                : 'bg-gray-50 border-gray-200 text-gray-700'
                                                }`}>
                                                {row.classification}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Selected Classifications Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Selected Classifications</h4>
                <p className="text-sm text-gray-500 mb-6">These classifications will be used for procedure generation. You can deselect any you don't want to include.</p>

                <div className="flex flex-wrap gap-3">
                    {activeClassifications.map(cls => (
                        <div key={cls} className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            <CheckCircle size={14} className="fill-white text-gray-900" />
                            {cls}
                        </div>
                    ))}
                    {activeClassifications.length === 0 && (
                        <div className="text-sm text-gray-500 italic">No specific classifications selected.</div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                {onBack && (
                    <Button variant="outline" onClick={onBack} className="px-6">
                        Back
                    </Button>
                )}
                <Button onClick={onProceed} className="bg-gray-600 hover:bg-gray-700 text-white px-6">
                    Proceed to Procedures →
                </Button>
            </div>
        </div>
    );
}
