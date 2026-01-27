import {
    Trash2,
    Eye
} from "lucide-react";

import ClassificationBuilder from "./ClassificationBuilder";
import type { ExtendedTBRow } from "./data";

interface ExtendedTBTableProps {
    data: ExtendedTBRow[];
    onUpdateRow: (id: number, field: string, value: string | number) => void;
    onDeleteRow: (id: number) => void;
    isSectionsView?: boolean;
}

export default function ExtendedTBTable({ data, onUpdateRow, onDeleteRow, isSectionsView = false }: ExtendedTBTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <style>
                {`
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { 
                        -webkit-appearance: none; 
                        margin: 0; 
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}
            </style>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="py-4 px-4 font-semibold text-gray-600 w-16 text-center">Code</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 min-w-[200px] text-center">Account Name</th>


                            <th className="py-4 px-4 font-semibold text-gray-600 text-center whitespace-nowrap">Current Year</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-center whitespace-nowrap">Re-Classification</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-center whitespace-nowrap">Adjustments</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-center whitespace-nowrap">Final Balance</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-center whitespace-nowrap">Prior Year</th>
                            {!isSectionsView && <th className="py-4 px-4 font-semibold text-gray-600 min-w-[300px] text-center">Classification</th>}
                            <th className="py-4 px-4 font-semibold text-gray-600 w-24 text-center">
                                {isSectionsView ? "Linked files" : "Actions"}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-3 px-4 font-medium text-center align-top">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 text-gray-500 font-medium">{row.code}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={row.code}
                                            onChange={(e) => onUpdateRow(row.id, 'code', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 font-medium text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900 text-center align-top">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 text-gray-900 font-medium">{row.accountName}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={row.accountName}
                                            onChange={(e) => onUpdateRow(row.id, 'accountName', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>


                                <td className="py-3 px-4 text-center font-medium text-gray-700 align-top">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 font-medium text-gray-700">{formatCurrency(row.currentYear)}</div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.currentYear}
                                            onChange={(e) => onUpdateRow(row.id, 'currentYear', Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-500 align-top pt-5">{row.reClassification !== 0 ? formatCurrency(row.reClassification) : '-'}</td>
                                <td className="py-3 px-4 text-center text-gray-500 align-top pt-5">{row.adjustments !== 0 ? formatCurrency(row.adjustments) : '-'}</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-900 align-top pt-5">{formatCurrency(row.finalBalance)}</td>
                                <td className="py-3 px-4 text-center text-gray-500 align-top">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 text-gray-500">{formatCurrency(row.priorYear)}</div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.priorYear}
                                            onChange={(e) => onUpdateRow(row.id, 'priorYear', Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>
                                {!isSectionsView && (
                                    <td className="py-3 px-4 align-top">
                                        <ClassificationBuilder
                                            value={row.classification}
                                            onChange={(val) => onUpdateRow(row.id, 'classification', val)}
                                        />
                                    </td>
                                )}
                                <td className="py-3 px-4 text-center align-top pt-4">
                                    {isSectionsView ? (
                                        <div className="flex justify-center">
                                            <div className={`
                                                flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors
                                                ${row.linkedFiles && row.linkedFiles.length > 0
                                                    ? "bg-blue-50 border-blue-100 text-blue-600"
                                                    : "bg-gray-50 border-gray-200 text-gray-500"}
                                            `}>
                                                <Eye size={14} />
                                                <span>{row.linkedFiles?.length || 0} files</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="p-2 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-600 transition-colors opacity-100"
                                            title="Delete"
                                            onClick={() => onDeleteRow(row.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {/* Summary Row */}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                            <td colSpan={2} className="py-4 px-4 text-center text-gray-900 uppercase text-xs tracking-wider">Total</td>
                            <td className="py-4 px-4 text-center text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.currentYear, 0))}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.reClassification, 0))}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.adjustments, 0))}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.finalBalance, 0))}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.priorYear, 0))}
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
