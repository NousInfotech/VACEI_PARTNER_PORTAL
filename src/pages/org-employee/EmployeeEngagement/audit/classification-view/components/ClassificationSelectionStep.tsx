import { useState, useMemo } from "react";
import { CheckCircle, Circle, CheckCircle2, Euro, Info, Filter, Sparkles } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ClassificationSelectionStepProps {
    onProceed: () => void;
    onBack?: () => void;
    mode?: 'manual' | 'ai' | 'hybrid';
    materialityAmount?: string;
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

export default function ClassificationSelectionStep({ onProceed, onBack, mode = 'manual', materialityAmount = '0' }: ClassificationSelectionStepProps) {
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



    const stats = useMemo(() => {
        const selectedAccounts = MOCK_DATA.filter(r => selectedIds.has(r.id));
        const totalAmount = selectedAccounts.reduce((sum, r) => sum + r.finalBalance, 0);
        const uniqueClasses = new Set(selectedAccounts.map(r => r.classification).filter(c => c !== 'Unclassified')).size;
        return { count: selectedAccounts.length, totalAmount, uniqueClasses };
    }, [selectedIds]);


    return (
        <div className="space-y-6">
            {/* Top Navigation / Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1 border border-gray-200">
                        {mode === 'manual' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                        {mode === 'ai' && <Sparkles size={10} className="text-purple-500" />}
                        {mode} Mode
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900">Select Classifications</h2>
                </div>
                <div className="text-sm text-gray-500 font-medium">Step 1 of 2</div>
            </div>

            <div className="border-t border-gray-200 -mt-2 mb-4" />


            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={20} className="text-gray-900" />
                        <h3 className="font-bold text-lg text-gray-900">Account Selection & Classifications</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Review and adjust the accounts selected based on your materiality threshold of <span className="font-bold text-gray-900">€{materialityAmount}</span>. Then confirm the classifications for procedure generation.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    {/* Selected Accounts */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} className="text-gray-700" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">Selected Accounts</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <Euro size={24} className="text-gray-700" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">Total Amount</div>
                            <div className="text-2xl font-bold text-gray-900">€{stats.totalAmount.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Classifications */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <Info size={24} className="text-gray-700" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">Classifications</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.uniqueClasses}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">Extended Trial Balance</h4>
                        <p className="text-xs text-gray-500 mt-1">Accounts with final balance ≥ €{materialityAmount} are pre-selected. You can adjust selections manually.</p>
                    </div>
                    <button
                        onClick={toggleAll}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        {selectedIds.size === MOCK_DATA.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div className="overflow-x-auto">
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
