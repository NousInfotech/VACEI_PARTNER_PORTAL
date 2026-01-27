import { Eye, Pencil } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

export interface TableRow {
    code: string;
    accountName: string;
    currentYear: number;
    reClassification: number;
    adjustments: number;
    finalBalance: number;
    priorYear: number;
    linkedFiles: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

interface ClassificationTableProps {
    title?: string;
    rows: TableRow[];
}

export default function ClassificationTable({ title = "Intangible assets - Cost", rows }: ClassificationTableProps) {
    // Calculate totals
    const totals = rows.reduce((acc, row) => ({
        currentYear: acc.currentYear + row.currentYear,
        reClassification: acc.reClassification + row.reClassification,
        adjustments: acc.adjustments + row.adjustments,
        finalBalance: acc.finalBalance + row.finalBalance,
        priorYear: acc.priorYear + row.priorYear,
    }), { currentYear: 0, reClassification: 0, adjustments: 0, finalBalance: 0, priorYear: 0 });

    return (
        <div className="space-y-4">
            {/* Section Badge */}
            <div className="inline-block px-3 py-1 bg-[#0F172A] text-white text-xs font-bold rounded-full">
                {title}
            </div>

            {/* Table Container */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Yellow Header */}
                <div className="bg-[rgb(255,247,237)] px-4 py-3 flex justify-between items-center border-b border-gray-200">
                    <span className="text-[#9A3412] font-bold text-sm">Already Grouped (Grouping 4)</span>
                    <Button variant="outline" className="h-7 text-xs gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Pencil size={12} />
                        Change Grouping
                    </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[60px_1fr_120px_140px_120px_120px_120px_120px] bg-white text-xs font-bold text-gray-900 border-b-2 border-gray-100">
                    <div className="px-4 py-3">Code</div>
                    <div className="px-4 py-3">Account Name</div>
                    <div className="px-4 py-3 text-right">Current Year</div>
                    <div className="px-4 py-3 text-right">Re-Classification</div>
                    <div className="px-4 py-3 text-right">Adjustments</div>
                    <div className="px-4 py-3 text-right">Final Balance</div>
                    <div className="px-4 py-3 text-right">Prior Year</div>
                    <div className="px-4 py-3 text-center">Linked Files</div>
                </div>

                {/* Table Rows */}
                {rows.map((row) => (
                    <div key={row.code} className="grid grid-cols-[60px_1fr_120px_140px_120px_120px_120px_120px] bg-white text-sm text-gray-600 border-b border-gray-50 hover:bg-gray-50">
                        <div className="px-4 py-4">{row.code}</div>
                        <div className="px-4 py-4">{row.accountName}</div>
                        <div className="px-4 py-4 text-right font-medium text-gray-900">{formatNumber(row.currentYear)}</div>
                        <div className="px-4 py-4 text-right">{row.reClassification}</div>
                        <div className="px-4 py-4 text-right">{row.adjustments}</div>
                        <div className="px-4 py-4 text-right font-bold text-gray-900">{formatNumber(row.finalBalance)}</div>
                        <div className="px-4 py-4 text-right text-gray-500">{formatNumber(row.priorYear)}</div>
                        <div className="px-4 py-4 flex justify-center">
                            <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <Eye size={12} />
                                {row.linkedFiles} file
                            </button>
                        </div>
                    </div>
                ))}

                {/* Totals Row */}
                <div className="grid grid-cols-[60px_1fr_120px_140px_120px_120px_120px_120px] bg-white text-sm font-bold text-gray-900">
                    <div className="px-4 py-4">TOTALS</div>
                    <div className="px-4 py-4"></div>
                    <div className="px-4 py-4 text-right">{formatNumber(totals.currentYear)}</div>
                    <div className="px-4 py-4 text-right">{totals.reClassification}</div>
                    <div className="px-4 py-4 text-right">{totals.adjustments}</div>
                    <div className="px-4 py-4 text-right">{formatNumber(totals.finalBalance)}</div>
                    <div className="px-4 py-4 text-right">{formatNumber(totals.priorYear)}</div>
                    <div className="px-4 py-4"></div>
                </div>
            </div>
        </div>
    );
}
