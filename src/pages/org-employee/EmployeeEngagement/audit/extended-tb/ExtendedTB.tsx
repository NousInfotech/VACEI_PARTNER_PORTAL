import { useState } from "react";
import {
    Plus,
    ClipboardCheck,
    CheckCircle,
    History,
    RefreshCw,
    FileSpreadsheet
} from "lucide-react";
import { Button } from "../../../../../ui/Button";
import ExtendedTBTable from "./ExtendedTBTable";
import { financialMockData } from "./data";
import type { ExtendedTBRow } from "./data";

export default function ExtendedTB({ isSectionsView = false }: { isSectionsView?: boolean }) {
    const [data, setData] = useState<ExtendedTBRow[]>(financialMockData);

    const handleAddRow = () => {
        const newRow: ExtendedTBRow = {
            id: Math.max(...data.map(d => d.id), 0) + 1,
            code: "",
            accountName: "",
            currentYear: 0,
            reClassification: 0,
            adjustments: 0,
            finalBalance: 0,
            priorYear: 0,
            classification: "",
            actions: [],
            linkedFiles: []
        };
        setData([...data, newRow]);
    };

    const handleUpdateRow = (id: number, field: string, value: string | number) => {
        setData(data.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleDeleteRow = (id: number) => {
        setData(data.filter(row => row.id !== id));
    };

    const totals = data.reduce((acc, row) => ({
        currentYear: acc.currentYear + row.currentYear,
        priorYear: acc.priorYear + row.priorYear,
        adjustments: acc.adjustments + row.adjustments,
        finalBalance: acc.finalBalance + row.finalBalance
    }), { currentYear: 0, priorYear: 0, adjustments: 0, finalBalance: 0 });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Extended Trial Balance</h2>
                    <p className="text-sm text-gray-500">Manage your financial data and adjustments</p>
                </div>
                {isSectionsView ? (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                            <ClipboardCheck size={16} />
                            Review
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                            <CheckCircle size={16} />
                            Sign off
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                            <History size={16} />
                            Review history
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                            <RefreshCw size={16} />
                            Reload data
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                            <FileSpreadsheet size={16} />
                            Save as spreadsheet
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button size="sm" className="gap-2" onClick={handleAddRow}>
                            <Plus size={16} />
                            Add Row
                        </Button>
                    </div>
                )}
            </div>

            {isSectionsView && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Current Year</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.currentYear)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Prior Year</p>
                        <p className="text-2xl font-bold text-gray-500">{formatCurrency(totals.priorYear)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Adjustments</p>
                        <p className="text-2xl font-bold text-gray-500">{formatCurrency(totals.adjustments)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Final Balance</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.finalBalance)}</p>
                    </div>
                </div>
            )}

            <ExtendedTBTable
                data={data}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                isSectionsView={isSectionsView}
            />
        </div>
    );
}
