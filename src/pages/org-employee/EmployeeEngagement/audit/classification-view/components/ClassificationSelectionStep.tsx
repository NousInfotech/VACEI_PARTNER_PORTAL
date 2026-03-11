import { useState, useMemo, useEffect } from "react";
import { CheckCircle, Circle, CheckCircle2, Euro, Info, Filter, Sparkles, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../../../ui/Button";
import { useETBData } from "../../hooks/useETBData";

interface ClassificationSelectionStepProps {
    onProceed: () => void;
    onBack?: () => void;
    mode?: 'manual' | 'ai' | 'hybrid';
    materialityAmount?: string;
    stepLabel?: string;
    /** When provided, Extended Trial Balance is loaded for this engagement only. If no trial balance, empty state is shown. */
    engagementId?: string;
}

interface AccountRow {
    id: string;
    valid: boolean;
    code: string;
    accountName: string;
    finalBalance: number;
    classification: string;
}

export default function ClassificationSelectionStep({
    onProceed,
    onBack,
    mode = 'manual',
    materialityAmount = '0',
    stepLabel = 'Step 1 of 2',
    engagementId,
}: ClassificationSelectionStepProps) {
    const { data: etbData, isLoading: loadingETB } = useETBData(engagementId);
    const etbRows = etbData?.etbRows ?? [];

    const accountRows: AccountRow[] = useMemo(() => {
        return etbRows.map((row: any, idx: number) => {
            const classificationParts = [
                row.group1,
                row.group2,
                row.group3,
                row.group4,
            ].filter(Boolean);
            const classification = classificationParts.join(" > ") || "Unclassified";
            return {
                id: row.accountId ?? String(row.id) ?? `row-${idx}`,
                valid: false,
                code: row.code ?? "",
                accountName: row.accountName ?? "",
                finalBalance: Number(row.finalBalance) ?? 0,
                classification: classification.trim() || "Unclassified",
            };
        });
    }, [etbRows]);

    const materialityNum = Number(materialityAmount) || 0;
    const defaultSelectedIds = useMemo(() => {
        return new Set(
            accountRows.filter(
                (r) =>
                    Math.abs(r.finalBalance) >= materialityNum &&
                    Boolean(r.classification?.trim()) &&
                    r.classification.trim() !== "Unclassified"
            ).map((r) => r.id)
        );
    }, [accountRows, materialityNum]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(defaultSelectedIds);

    useEffect(() => {
        setSelectedIds(defaultSelectedIds);
    }, [defaultSelectedIds]);

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            return newSelected;
        });
    };

    const toggleAll = () => {
        if (accountRows.length === 0) return;
        if (selectedIds.size === accountRows.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(accountRows.map((r) => r.id)));
        }
    };

    const activeClassifications = useMemo(() => {
        const classes = new Set(
            accountRows.filter((r) => selectedIds.has(r.id)).map((r) => r.classification)
        );
        return Array.from(classes).filter((c) => c !== "Unclassified");
    }, [selectedIds, accountRows]);

    const stats = useMemo(() => {
        const selectedAccounts = accountRows.filter((r) => selectedIds.has(r.id));
        const totalAmount = selectedAccounts.reduce((sum, r) => sum + r.finalBalance, 0);
        const uniqueClasses = new Set(
            selectedAccounts.map((r) => r.classification).filter((c) => c !== "Unclassified")
        ).size;
        return { count: selectedAccounts.length, totalAmount, uniqueClasses };
    }, [selectedIds, accountRows]);


    if (engagementId && loadingETB) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Loading Extended Trial Balance for this engagement...</p>
                </div>
            </div>
        );
    }

    if (engagementId && !loadingETB && accountRows.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md px-4">
                    <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 mb-2">No Extended Trial Balance for this engagement</p>
                    <p className="text-sm text-gray-500 mb-6">
                        Upload a trial balance for the selected engagement in the Extended TB tab first. Account selection will be available once trial balance data exists.
                    </p>
                    {onBack && (
                        <Button variant="outline" onClick={onBack}>
                            Back
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation / Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors mr-2"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1 border border-gray-200">
                        {mode === 'manual' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                        {mode === 'ai' && <Sparkles size={10} className="text-purple-500" />}
                        {mode} Mode
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900">Select Classifications</h2>
                </div>
                <div className="text-sm text-gray-500 font-medium">{stepLabel}</div>
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
                        {selectedIds.size === accountRows.length ? 'Deselect All' : 'Select All'}
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
                                <th className="px-6 py-4 min-w-[260px] align-top">Classification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {accountRows.map((row) => {
                                const isSelected = selectedIds.has(row.id);
                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleSelection(row.id)}
                                    >
                                        <td className="px-6 py-4 align-middle">
                                            {isSelected ? (
                                                <CheckCircle className="fill-gray-900 text-white shrink-0 rounded-full" size={20} />
                                            ) : (
                                                <Circle className="text-gray-400 shrink-0" size={20} />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 align-middle">{row.code}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 align-middle">{row.accountName}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 align-middle">
                                            €{row.finalBalance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 align-middle min-w-0 max-w-[280px]">
                                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium border break-words whitespace-normal max-w-full ${row.classification === 'Unclassified'
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
