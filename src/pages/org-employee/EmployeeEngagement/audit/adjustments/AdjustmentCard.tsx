import {
    History,
    Pencil,
    Trash2,
    Check,
    Paperclip,
    Eye
} from "lucide-react";
import { Button } from "../../../../../ui/Button";
import type { AdjustmentEntry } from "./AdjustmentDialog";

interface AdjustmentCardProps {
    id: string;
    status: 'POSTED' | 'DRAFT';
    description?: string;
    lines: AdjustmentEntry[];
    attachmentCount: number;
    onEdit: () => void;
    onHistory?: () => void;
    onDelete?: () => void;
    onManageEvidence?: () => void;
}

export default function AdjustmentCard({
    id,
    status,
    description = "No description",
    lines,
    attachmentCount,
    onEdit,
    onHistory,
    onDelete,
    onManageEvidence,
}: AdjustmentCardProps) {
    const formatCurrency = (amount: number | null) => {
        if (amount === null) return "-";
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalDebit = lines.reduce((sum, line) => sum + (line.type === 'Debit' ? line.amount : 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.type === 'Credit' ? line.amount : 0), 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                            {id}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${status === 'POSTED'
                            ? 'bg-gray-900 text-white'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {status}
                        </span>
                    </div>

                    <p className="text-gray-500 text-sm">{description}</p>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-16">Code</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Account</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">DR</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">CR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lines.map((line) => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-3 text-gray-900">{line.code}</td>
                                        <td className="px-4 py-3 text-gray-900">{line.accountName}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                            {formatCurrency(line.type === 'Debit' ? line.amount : null)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                            {formatCurrency(line.type === 'Credit' ? line.amount : null)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-gray-50/50 font-bold">
                                    <td className="px-4 py-3 text-gray-900" colSpan={2}>Total</td>
                                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalDebit)}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalCredit)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Paperclip size={16} />
                            <span className="font-medium">Attached Files</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{attachmentCount}</span>
                        </div>
                        {attachmentCount === 0 && (
                            <span className="text-xs text-gray-400">No evidence files linked</span>
                        )}
                        {onManageEvidence && (
                            <button
                                type="button"
                                onClick={onManageEvidence}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                <Eye size={16} />
                                Manage
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions Sidebar */}
                <div className="flex flex-col gap-2 w-48 shrink-0">
                    {onHistory && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onHistory}
                            className="w-full justify-start gap-2 bg-white hover:bg-gray-50 text-gray-600 border-gray-200"
                        >
                            <History size={16} />
                            History
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="w-full justify-start gap-2 bg-white hover:bg-gray-50 text-gray-600 border-gray-200"
                    >
                        <Pencil size={16} />
                        Edit
                    </Button>
                    {onDelete && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={onDelete}
                            className="w-full justify-start gap-2 bg-red-500 hover:bg-red-600 text-white border-transparent"
                        >
                            <Trash2 size={16} />
                            Delete & Reverse
                        </Button>
                    )}
                    {status === 'POSTED' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium mt-1">
                            <Check size={16} />
                            Posted
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
