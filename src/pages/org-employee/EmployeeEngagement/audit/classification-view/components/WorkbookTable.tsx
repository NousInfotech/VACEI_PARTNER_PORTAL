import { Eye, Pencil } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface WorkbookRow {
    code: string;
    accountName: string;
    currentYear: number;
    reClassification: number;
    adjustments: number;
    finalBalance: number;
    priorYear: number;
    linkedFiles: number;
}

interface WorkbookTableProps {
    title?: string;
    rows: WorkbookRow[];
    showGroupingButton?: boolean;
    showSelection?: boolean;
    isGrouped?: boolean;
}

export default function WorkbookTable({
    title,
    rows,
    showGroupingButton = false,
    showSelection = false,
    isGrouped = false
}: WorkbookTableProps) {
    const formatNumber = (num: number) => num.toLocaleString('en-US');

    const totalCurrentYear = rows.reduce((acc, row) => acc + row.currentYear, 0);
    const totalReClassification = rows.reduce((acc, row) => acc + row.reClassification, 0);
    const totalAdjustments = rows.reduce((acc, row) => acc + row.adjustments, 0);
    const totalFinalBalance = rows.reduce((acc, row) => acc + row.finalBalance, 0);
    const totalPriorYear = rows.reduce((acc, row) => acc + row.priorYear, 0);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Header / Grouping Bar */}
            {(title || showGroupingButton) && (
                <div className={`px-4 py-3 flex justify-between items-center ${isGrouped ? 'bg-[#FFFBEB] border-b border-[#FCD34D]' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <h3 className={`font-semibold text-sm ${isGrouped ? 'text-[#92400E]' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                    {showGroupingButton && (
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-gray-300">
                            <Pencil size={12} className="mr-2" />
                            Change Grouping
                        </Button>
                    )}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#F8FAFC] text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                            {showSelection && <th className="px-4 py-3 w-10"></th>}
                            <th className="px-4 py-3 border-r border-gray-200">Code</th>
                            <th className="px-4 py-3 border-r border-gray-200">Account Name</th>
                            <th className="px-4 py-3 text-right border-r border-gray-200">Current Year</th>
                            <th className="px-4 py-3 text-right border-r border-gray-200">Re-Classification</th>
                            <th className="px-4 py-3 text-right border-r border-gray-200">Adjustments</th>
                            <th className="px-4 py-3 text-right border-r border-gray-200">Final Balance</th>
                            <th className="px-4 py-3 text-right border-r border-gray-200">Prior Year</th>
                            <th className="px-4 py-3 text-center">Linked Files</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                {showSelection && (
                                    <td className="px-4 py-3 text-center">
                                        <div className="w-4 h-4 rounded-full border border-gray-300 mx-auto"></div>
                                    </td>
                                )}
                                <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-900">{row.code}</td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-600">{row.accountName}</td>
                                <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(row.currentYear)}</td>
                                <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(row.reClassification)}</td>
                                <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(row.adjustments)}</td>
                                <td className="px-4 py-3 text-right border-r border-gray-200 font-medium">{formatNumber(row.finalBalance)}</td>
                                <td className="px-4 py-3 text-right border-r border-gray-200 text-gray-500">{formatNumber(row.priorYear)}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center px-2 py-1 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600">
                                        <Eye size={12} className="mr-1.5" />
                                        {row.linkedFiles} {row.linkedFiles === 1 ? 'file' : 'files'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50/50 font-bold border-t border-gray-200">
                        <tr>
                            {showSelection && <td className="px-4 py-3"></td>}
                            <td className="px-4 py-3 border-r border-gray-200" colSpan={2}>TOTALS</td>
                            <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(totalCurrentYear)}</td>
                            <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(totalReClassification)}</td>
                            <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(totalAdjustments)}</td>
                            <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(totalFinalBalance)}</td>
                            <td className="px-4 py-3 text-right border-r border-gray-200">{formatNumber(totalPriorYear)}</td>
                            <td className="px-4 py-3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
