import {
    MoreHorizontal
} from "lucide-react";

import { financialMockData } from "./data";

export default function ExtendedTBTable() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="py-4 px-4 font-semibold text-gray-600 w-16">Code</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 min-w-[200px]">Account Name</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 min-w-[250px]">Classification</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 whitespace-nowrap">Level</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Current Year</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Re-Class</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Adjustments</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Final Balance</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Prior Year</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {financialMockData.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-3 px-4 text-gray-500 font-medium">{row.code}</td>
                                <td className="py-3 px-4 font-medium text-gray-900">{row.accountName}</td>
                                <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium max-w-[250px] truncate" title={row.classification}>
                                        {row.classification}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-gray-500">
                                    {row.level ? (
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                            {row.level}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-gray-700">{formatCurrency(row.currentYear)}</td>
                                <td className="py-3 px-4 text-right text-gray-500">{row.reClassification !== 0 ? formatCurrency(row.reClassification) : '-'}</td>
                                <td className="py-3 px-4 text-right text-gray-500">{row.adjustments !== 0 ? formatCurrency(row.adjustments) : '-'}</td>
                                <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(row.finalBalance)}</td>
                                <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(row.priorYear)}</td>
                                <td className="py-3 px-4 text-right">
                                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* Summary Row */}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                            <td colSpan={4} className="py-4 px-4 text-right text-gray-900 uppercase text-xs tracking-wider">Total</td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(financialMockData.reduce((acc, row) => acc + row.currentYear, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(financialMockData.reduce((acc, row) => acc + row.reClassification, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(financialMockData.reduce((acc, row) => acc + row.adjustments, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(financialMockData.reduce((acc, row) => acc + row.finalBalance, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(financialMockData.reduce((acc, row) => acc + row.priorYear, 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
