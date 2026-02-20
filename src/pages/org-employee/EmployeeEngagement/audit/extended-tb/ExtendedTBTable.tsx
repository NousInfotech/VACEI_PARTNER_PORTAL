import { useRef, useEffect } from "react";
import {
    Trash2,
    Eye,
    Info
} from "lucide-react";

import ClassificationBuilder from "./ClassificationBuilder";
import type { ExtendedTBRow } from "./data";

interface ExtendedTBTableProps {
    data: ExtendedTBRow[];
    onUpdateRow: (id: number, field: string, value: string | number | null) => void;
    onUpdateGroups?: (id: number, groups: { group1: string | null; group2: string | null; group3: string | null; group4: string | null }) => void;
    onDeleteRow: (id: number) => void;
    onShowAdjustmentDetails?: (row: ExtendedTBRow) => void;
    onShowReclassificationDetails?: (row: ExtendedTBRow) => void;
    isSectionsView?: boolean;
}


function ResizableTextarea({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
            }}
            rows={1}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none shadow-sm overflow-hidden min-h-[50px] leading-relaxed block"
            placeholder={placeholder}
        />
    );
}

export default function ExtendedTBTable({ data, onUpdateRow, onUpdateGroups, onDeleteRow, onShowAdjustmentDetails, onShowReclassificationDetails, isSectionsView = false }: ExtendedTBTableProps) {
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
                    /* Ensure table borders collapse */
                    .custom-table {
                        border-collapse: collapse;
                    }
                    .custom-table th, .custom-table td {
                        border: 1px solid #e5e7eb; /* gray-200 */
                    }
                `}
            </style>
            <div className="overflow-x-auto">
                <table className="w-full text-sm custom-table">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="py-4 px-4 font-semibold text-gray-600 w-16 text-center">Code</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 min-w-[200px] text-left">Account Name</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Current Year</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Re-Classification</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Adjustments</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Final Balance</th>
                            <th className="py-4 px-4 font-semibold text-gray-600 text-right whitespace-nowrap">Prior Year</th>
                            {!isSectionsView && <th className="py-4 px-4 font-semibold text-gray-600 min-w-[280px] text-left">Classification Groups</th>}
                            <th className="py-4 px-4 font-semibold text-gray-600 w-24 text-center">
                                {isSectionsView ? "Linked files" : "Actions"}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-3 px-4 font-medium text-center align-middle">
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
                                <td className="py-3 px-4 font-medium text-gray-900 text-left align-middle">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 text-gray-900 font-medium wrap-break-word max-w-[300px] bg-white border border-gray-200 rounded-xl leading-relaxed shadow-sm">
                                            {row.accountName}
                                        </div>
                                    ) : (
                                        <ResizableTextarea
                                            value={row.accountName}
                                            onChange={(val) => onUpdateRow(row.id, 'accountName', val)}
                                            placeholder="Enter account name..."
                                        />
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-gray-700 align-middle">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 font-medium text-gray-700">{formatCurrency(row.currentYear)}</div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.currentYear}
                                            onChange={(e) => onUpdateRow(row.id, 'currentYear', Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-right font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500 align-middle">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-medium tabular-nums">
                                            {row.reClassification !== 0 ? formatCurrency(row.reClassification) : '-'}
                                        </span>
                                        {row.reClassification !== 0 && row.reClassification != null && onShowReclassificationDetails && (
                                            <button
                                                onClick={() => onShowReclassificationDetails(row)}
                                                className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="View reclassification details"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500 align-middle">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-medium tabular-nums">
                                            {row.adjustments !== 0 ? formatCurrency(row.adjustments) : '-'}
                                        </span>
                                        {row.adjustments !== 0 && row.adjustments != null && onShowAdjustmentDetails && (
                                            <button
                                                onClick={() => onShowAdjustmentDetails(row)}
                                                className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                title="View adjustment details"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-gray-900 align-middle">{formatCurrency(row.finalBalance)}</td>
                                <td className="py-3 px-4 text-right text-gray-500 align-middle">
                                    {isSectionsView ? (
                                        <div className="px-3 py-2 text-gray-500">{formatCurrency(row.priorYear)}</div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.priorYear}
                                            onChange={(e) => onUpdateRow(row.id, 'priorYear', Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-right text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    )}
                                </td>
                                {!isSectionsView && (
                                    <td className="py-3 px-4 align-middle">
                                        <ClassificationBuilder
                                            value={row.classification}
                                            onChange={(val) => onUpdateRow(row.id, 'classification', val)}
                                            group1={row.group1}
                                            group2={row.group2}
                                            group3={row.group3}
                                            group4={row.group4}
                                            onGroupsChange={(groups) => {
                                                if (onUpdateGroups) {
                                                    onUpdateGroups(row.id, groups);
                                                } else {
                                                    // Fallback to individual updates if onUpdateGroups not provided
                                                    onUpdateRow(row.id, 'group1', groups.group1 ?? null);
                                                    onUpdateRow(row.id, 'group2', groups.group2 ?? null);
                                                    onUpdateRow(row.id, 'group3', groups.group3 ?? null);
                                                    onUpdateRow(row.id, 'group4', groups.group4 ?? null);
                                                }
                                            }}
                                        />
                                    </td>
                                )}
                                <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                    {isSectionsView ? (
                                        <div className="flex justify-center">
                                            <div className={`
                                                flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors whitespace-nowrap
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
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan={2} className="py-4 px-4 text-center text-gray-900 uppercase text-xs tracking-wider">Total</td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.currentYear, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.reClassification, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.adjustments, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.finalBalance, 0))}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-900">
                                {formatCurrency(data.reduce((acc, row) => acc + row.priorYear, 0))}
                            </td>
                            {!isSectionsView && <td></td>}
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
