import React from "react";
import { Button } from "../../../../../ui/Button";
import { Card, CardContent, CardDescription } from "../../../../../ui/card";
import { Badge } from "../../../../../ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../../../../ui/Dialog";
import { Loader2, CheckCircle2, Edit3, Trash2, FileCheck, FileX, ArrowLeft, X } from "lucide-react";
import { format } from "date-fns";

export interface HistoryEntry {
    _id: string;
    action: "created" | "updated" | "posted" | "unposted" | "deleted" | "reversed";
    timestamp: string;
    userId: string;
    userName: string;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    description: string;
}

interface AuditEntryHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    entryCode: string;
    history: HistoryEntry[];
    loading?: boolean;
    onBack?: () => void;
}

const actionIcons: Record<string, React.ReactNode> = {
    created: <FileCheck className="h-5 w-5 text-green-600" />,
    updated: <Edit3 className="h-5 w-5 text-blue-600" />,
    posted: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    unposted: <FileX className="h-5 w-5 text-amber-600" />,
    deleted: <Trash2 className="h-5 w-5 text-red-600" />,
    reversed: <FileX className="h-5 w-5 text-red-600" />,
};

const actionColors: Record<string, string> = {
    created: "bg-green-100 text-green-800 border-green-300",
    updated: "bg-blue-100 text-blue-800 border-blue-300",
    posted: "bg-green-100 text-green-800 border-green-300",
    unposted: "bg-amber-100 text-amber-800 border-amber-300",
    deleted: "bg-red-100 text-red-800 border-red-300",
    reversed: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(dateString: string): string {
    try {
        return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
        return dateString;
    }
}

function renderValue(value: unknown): string {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
}

/** Line item from history previousValues/newValues.lines */
interface HistoryLineRow {
    trialBalanceAccountId?: string;
    code?: string;
    accountName?: string;
    type?: string;
    value?: number;
    reason?: string;
}

function isLinesArray(value: unknown): value is HistoryLineRow[] {
    return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

function renderHistoryLines(lines: HistoryLineRow[]) {
    if (lines.length === 0) return <span className="text-gray-500">No lines</span>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-1.5 font-semibold">Code</th>
                        <th className="text-left py-1.5 font-semibold">Account</th>
                        <th className="text-left py-1.5 font-semibold">Type</th>
                        <th className="text-right py-1.5 font-semibold">Value</th>
                        <th className="text-left py-1.5 font-semibold">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1.5 font-mono">{row.code ?? "—"}</td>
                            <td className="py-1.5 max-w-[120px] truncate" title={row.accountName}>{row.accountName ?? "—"}</td>
                            <td className="py-1.5">{row.type ?? "—"}</td>
                            <td className="py-1.5 text-right font-mono">{row.value != null ? Number(row.value).toLocaleString() : "—"}</td>
                            <td className="py-1.5 max-w-[140px] truncate" title={row.reason}>{row.reason ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const SCALAR_KEYS = ["code", "description", "status", "type"] as const;

function renderValuesSection(
    values: Record<string, unknown>,
    variant: "previous" | "new"
) {
    const scalarEntries = SCALAR_KEYS.filter((k) => values[k] !== undefined).map((k) => [k, values[k]] as const);
    const lines = values.lines;
    const hasLines = isLinesArray(lines);

    const isPrevious = variant === "previous";
    const label = isPrevious ? "Previous" : "New";
    const bgClass = isPrevious ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200";
    const textClass = isPrevious ? "text-red-800" : "text-green-800";
    const entryTextClass = isPrevious ? "text-red-700" : "text-green-700";

    return (
        <div className={`rounded-md border p-3 ${bgClass}`}>
            <div className={`font-semibold mb-2 ${textClass}`}>{label}</div>
            <div className={`space-y-2 text-xs ${entryTextClass}`}>
                {scalarEntries.map(([key, value]) => (
                    <div key={key}>
                        <span className="font-semibold capitalize">{key}: </span>
                        {renderValue(value)}
                    </div>
                ))}
                {hasLines && (
                    <div className="mt-3">
                        <div className="font-semibold mb-1.5">Entries</div>
                        {renderHistoryLines(lines)}
                    </div>
                )}
            </div>
        </div>
    );
}

export function AuditEntryHistoryDialog({
    open,
    onOpenChange,
    title,
    entryCode,
    history,
    loading = false,
    onBack,
}: AuditEntryHistoryDialogProps) {
    const userSummary = React.useMemo(() => {
        const users = history.reduce((acc, entry) => {
            const name = entry.userName || "Unknown User";
            if (!acc[name]) {
                acc[name] = { count: 0, actions: [] as string[] };
            }
            acc[name].count++;
            acc[name].actions.push(entry.action);
            return acc;
        }, {} as Record<string, { count: number; actions: string[] }>);
        return Object.entries(users)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 3);
    }, [history]);

    const handleBack = () => {
        onBack?.();
        onOpenChange(false);
    };

    const handleClose = () => onOpenChange(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button variant="outline" size="sm" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl">
                                    {title}: {entryCode}
                                </DialogTitle>
                                <CardDescription>
                                    Complete audit trail of all changes made to this entry
                                </CardDescription>
                                {userSummary.length > 0 && (
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-xs text-gray-500">Contributors:</span>
                                        {userSummary.map(([userName, data], idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                                {userName} ({data.count})
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Close"
                            className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </DialogHeader>
                {loading ? (
                    <div className="py-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No history available for this entry</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((entry, index) => (
                            <Card key={entry._id || index} className="relative">
                                <CardContent className="pt-6">
                                    {index < history.length - 1 && (
                                        <div className="absolute left-[29px] top-[60px] bottom-[-16px] w-0.5 bg-gray-200" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className="shrink-0 z-10 bg-white">
                                            {actionIcons[entry.action] || actionIcons.updated}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${actionColors[entry.action] || "bg-gray-100 text-gray-800"} font-semibold uppercase text-xs`}
                                                        >
                                                            {entry.action}
                                                        </Badge>
                                                        <span className="text-sm text-gray-400">by</span>
                                                        <span className="font-semibold text-gray-700 text-sm">
                                                            {entry.userName || "Unknown User"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {entry.description}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-400 whitespace-nowrap block">
                                                        {formatDate(entry.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                            {(entry.previousValues || entry.newValues) && (
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    {entry.previousValues && Object.keys(entry.previousValues).length > 0 && (
                                                        renderValuesSection(entry.previousValues as Record<string, unknown>, "previous")
                                                    )}
                                                    {entry.newValues && Object.keys(entry.newValues).length > 0 && (
                                                        renderValuesSection(entry.newValues as Record<string, unknown>, "new")
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
