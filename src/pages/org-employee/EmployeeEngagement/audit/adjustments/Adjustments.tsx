import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import AdjustmentCard from "./AdjustmentCard";
import AdjustmentInlineForm from "./AdjustmentInlineForm";
import EvidenceFilesDialog from "./EvidenceFilesDialog";
import type { AdjustmentData, AdjustmentEntry } from "./AdjustmentDialog";
import { useETBData } from "../hooks/useETBData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiGet, apiPut, apiDelete } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import AlertMessage from "../../../../common/AlertMessage";

interface AdjustmentsProps {
    engagementId?: string;
}

export default function Adjustments({ engagementId }: AdjustmentsProps) {
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState<AdjustmentData | undefined>(undefined);
    const [evidenceDialogEntry, setEvidenceDialogEntry] = useState<{ id: string; code: string } | null>(null);
    const queryClient = useQueryClient();

    // Fetch ETB data
    const { data: etbData, isLoading: isLoadingETB, trialBalanceId, auditCycleId } = useETBData(engagementId);

    // Fetch audit entries from backend
    const { data: auditEntriesData, isLoading: isLoadingEntries } = useQuery({
        queryKey: ['audit-entries', trialBalanceId, 'ADJUSTMENT'],
        queryFn: async () => {
            if (!trialBalanceId || !auditCycleId) return { data: [] };
            const response = await apiGet<{ data: any[] }>(
                endPoints.AUDIT.GET_AUDIT_ENTRIES(auditCycleId, trialBalanceId)
            );
            // Filter for ADJUSTMENT type
            return {
                data: (response.data || []).filter((entry: any) => entry.type === 'ADJUSTMENT')
            };
        },
        enabled: !!trialBalanceId && !!auditCycleId,
    });

    const auditEntries = auditEntriesData?.data || [];
    const isLoading = isLoadingETB || isLoadingEntries;

    // Create audit entry mutation
    const createAdjustmentMutation = useMutation({
        mutationFn: async (data: AdjustmentData) => {
            if (!trialBalanceId || !auditCycleId) {
                throw new Error("Trial balance ID or audit cycle ID is missing");
            }

            // Validate required fields
            if (!data.adjustmentNo || data.adjustmentNo.trim().length === 0) {
                throw new Error("Adjustment number is required");
            }

            if (!data.entries || data.entries.length === 0) {
                throw new Error("At least one entry is required");
            }

            // Use default description if empty (backend requires non-empty string)
            const description = data.description && data.description.trim().length > 0
                ? data.description.trim()
                : `Adjustment ${data.adjustmentNo}`;

            // Validate that debits equal credits
            const totalDebits = data.entries
                .filter(e => e.type === 'Debit')
                .reduce((sum, e) => sum + (e.amount || 0), 0);
            const totalCredits = data.entries
                .filter(e => e.type === 'Credit')
                .reduce((sum, e) => sum + (e.amount || 0), 0);

            if (data.status === 'POSTED' && Math.abs(totalDebits - totalCredits) > 0.01) {
                throw new Error("Debits and credits must balance before posting");
            }

            // Map entries to lines format - validate each entry
            const lines = data.entries.map((entry, index) => {
                if (!entry.accountId) {
                    throw new Error(`Entry ${index + 1}: Account ID is required`);
                }
                
                // Validate UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const accountIdStr = String(entry.accountId);
                if (!uuidRegex.test(accountIdStr)) {
                    throw new Error(`Entry ${index + 1}: Invalid account ID format`);
                }

                // Use default reason if details is empty (backend requires non-empty string)
                const reason = entry.details && entry.details.trim().length > 0 
                    ? entry.details.trim() 
                    : `Adjustment entry for ${entry.accountName}`;

                if (!entry.amount || entry.amount <= 0) {
                    throw new Error(`Entry ${index + 1}: Amount must be greater than 0`);
                }

                return {
                    trialBalanceAccountId: accountIdStr,
                    type: entry.type === 'Debit' ? 'DEBIT' : 'CREDIT',
                    value: entry.amount,
                    reason: reason,
                };
            });

            const payload = {
                type: 'ADJUSTMENT' as const,
                code: data.adjustmentNo.trim(),
                description: description,
                status: data.status,
                lines,
            };

            return apiPost<any>(
                endPoints.AUDIT.CREATE_AUDIT_ENTRY(auditCycleId, trialBalanceId),
                payload
            );
        },
        onSuccess: () => {
            // Invalidate and refetch data
            queryClient.invalidateQueries({ queryKey: ['trial-balance-with-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['audit-entries', trialBalanceId] });
            setIsFormExpanded(false);
        setEditingAdjustment(undefined);
        },
        onError: (error: any) => {
            console.error("Failed to create adjustment:", error);
        },
    });

    const handleSaveAdjustment = (data: AdjustmentData) => {
        if (editingAdjustment?.id) {
            // Update existing entry
            updateAdjustmentMutation.mutate({ id: editingAdjustment.id, data });
        } else {
            // Create new entry
            createAdjustmentMutation.mutate(data);
        }
    };

    // Update mutation
    const updateAdjustmentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string | number; data: AdjustmentData }) => {
            if (!trialBalanceId || !auditCycleId) {
                throw new Error("Trial balance ID or audit cycle ID is missing");
            }

            const description = data.description && data.description.trim().length > 0
                ? data.description.trim()
                : `Adjustment ${data.adjustmentNo}`;

            // Note: Lines are not included in update payload as backend updateAuditEntrySchema doesn't support updating lines
            // Lines can only be created when creating a new audit entry, not updated

            const payload = {
                code: data.adjustmentNo.trim(),
                description: description,
                status: data.status,
            };

            return apiPut<any>(
                endPoints.AUDIT.UPDATE_AUDIT_ENTRY(auditCycleId, trialBalanceId, String(id)),
                payload
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit-entries', trialBalanceId] });
            queryClient.invalidateQueries({ queryKey: ['trial-balance-with-accounts'] });
            setIsFormExpanded(false);
            setEditingAdjustment(undefined);
        },
    });

    // Delete mutation
    const deleteAdjustmentMutation = useMutation({
        mutationFn: async (entryId: string) => {
            if (!trialBalanceId || !auditCycleId) {
                throw new Error("Trial balance ID or audit cycle ID is missing");
            }
            return apiDelete<any>(
                endPoints.AUDIT.DELETE_AUDIT_ENTRY(auditCycleId, trialBalanceId, entryId)
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit-entries', trialBalanceId] });
            queryClient.invalidateQueries({ queryKey: ['trial-balance-with-accounts'] });
        },
    });

    const handleManageEvidence = (entry: { id: string; code: string }) => {
        setEvidenceDialogEntry(entry);
    };

    // Query for fetching single entry (only when needed)
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const { data: editingEntryData, isLoading: isLoadingEditEntry } = useQuery({
        queryKey: ['audit-entry', editingEntryId, trialBalanceId],
        queryFn: async () => {
            if (!editingEntryId || !trialBalanceId || !auditCycleId) return null;
            const response = await apiGet<{ data: any }>(
                endPoints.AUDIT.GET_AUDIT_ENTRY(auditCycleId, trialBalanceId, editingEntryId)
            );
            return response.data;
        },
        enabled: !!editingEntryId && !!trialBalanceId && !!auditCycleId,
    });

    // Update editingAdjustment when entry data is loaded
    useEffect(() => {
        if (editingEntryData && editingEntryId) {
            const entry = editingEntryData;
            const adjustmentData: AdjustmentData = {
                id: entry.id,
                adjustmentNo: entry.code,
                description: entry.description,
                status: entry.status,
                entries: entry.lines?.map((line: any, index: number) => ({
                    id: index + 1,
                    accountId: line.trialBalanceAccountId,
                    code: line.trialBalanceAccount?.code || '',
                    accountName: line.trialBalanceAccount?.accountName || '',
                    type: line.type === 'DEBIT' ? 'Debit' : 'Credit',
                    amount: Number(line.value),
                    details: line.reason || '',
                })) || [],
            };
            setEditingAdjustment(adjustmentData);
            setIsFormExpanded(true);
            setEditingEntryId(null); // Reset after loading
        }
    }, [editingEntryData, editingEntryId]);

    const handleEdit = (entryId: string) => {
        // Try to use data from the list first (faster - instant render)
        const existingEntry = auditEntries.find((e: any) => e.id === entryId);
        
        if (existingEntry && existingEntry.lines && existingEntry.lines.length > 0) {
            // Use data from list (instant - no API call needed)
            const adjustmentData: AdjustmentData = {
                id: existingEntry.id,
                adjustmentNo: existingEntry.code,
                description: existingEntry.description,
                status: existingEntry.status,
                entries: existingEntry.lines.map((line: any, index: number) => ({
                    id: index + 1,
                    accountId: line.trialBalanceAccountId,
                    code: line.trialBalanceAccount?.code || '',
                    accountName: line.trialBalanceAccount?.accountName || '',
                    type: line.type === 'DEBIT' ? 'Debit' : 'Credit',
                    amount: Number(line.value),
                    details: line.reason || '',
                })),
            };
            setEditingAdjustment(adjustmentData);
            setIsFormExpanded(true);
            
            // Scroll form into view smoothly
            setTimeout(() => {
                const formElement = document.querySelector('[data-adjustment-form]');
                formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            // Fallback: fetch from API if not in list (with loading state)
            setEditingEntryId(entryId);
            setIsFormExpanded(true);
        }
    };

    const handleDelete = (entryId: string) => {
        if (window.confirm("Are you sure you want to delete and reverse this adjustment?")) {
            deleteAdjustmentMutation.mutate(entryId);
        }
    };

    const handleHistory = (entryId: string) => {
        // TODO: Open history modal/dialog
        console.log("History for entry:", entryId);
    };

    const handleCancel = () => {
        setIsFormExpanded(false);
        setEditingAdjustment(undefined);
        createAdjustmentMutation.reset();
        updateAdjustmentMutation.reset();
    };

    const handleToggleForm = () => {
        if (isFormExpanded) {
            handleCancel();
        } else {
        setEditingAdjustment(undefined);
            setIsFormExpanded(true);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {(createAdjustmentMutation.isError || updateAdjustmentMutation.isError || deleteAdjustmentMutation.isError) && (
                <AlertMessage
                    variant="danger"
                    message={
                        createAdjustmentMutation.error instanceof Error 
                            ? createAdjustmentMutation.error.message 
                            : updateAdjustmentMutation.error instanceof Error
                            ? updateAdjustmentMutation.error.message
                            : deleteAdjustmentMutation.error instanceof Error
                            ? deleteAdjustmentMutation.error.message
                            : "Operation failed. Please try again."}
                    onClose={() => {
                        createAdjustmentMutation.reset();
                        updateAdjustmentMutation.reset();
                        deleteAdjustmentMutation.reset();
                    }}
                />
            )}
            {(createAdjustmentMutation.isSuccess || updateAdjustmentMutation.isSuccess || deleteAdjustmentMutation.isSuccess) && (
                <AlertMessage
                    variant="success"
                    message={
                        createAdjustmentMutation.isSuccess
                            ? "Adjustment created successfully!"
                            : updateAdjustmentMutation.isSuccess
                            ? "Adjustment updated successfully!"
                            : "Adjustment deleted successfully!"}
                    onClose={() => {
                        createAdjustmentMutation.reset();
                        updateAdjustmentMutation.reset();
                        deleteAdjustmentMutation.reset();
                    }}
                />
            )}
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Adjustments</h2>
                    <p className="text-gray-500 mt-1">Manage audit adjustments for this engagement</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 text-gray-600">
                        <Download size={18} />
                        Export to Excel
                    </Button>
                </div>
            </div>

            {/* Inline Form */}
            {isLoadingEditEntry && isFormExpanded && editingEntryId ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-600 font-medium">Loading entry details...</p>
                    </div>
                </div>
            ) : (
                <AdjustmentInlineForm
                    onSave={handleSaveAdjustment}
                    onCancel={handleCancel}
                    initialData={editingAdjustment}
                    entityName="Adjustment"
                    accounts={etbData?.etbRows || []}
                    trialBalanceId={trialBalanceId}
                    auditCycleId={auditCycleId}
                    isExpanded={isFormExpanded}
                    onToggleExpand={handleToggleForm}
                />
            )}

            {/* Section Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900">Existing Adjustments</h3>
            </div>

            {/* Adjustments List */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading adjustments...</div>
            ) : auditEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No adjustments found. Create your first adjustment above.</div>
            ) : (
            <div className="space-y-4">
                    {auditEntries.map((entry: any) => {
                        // Map backend entry lines to AdjustmentEntry format
                        const lines: AdjustmentEntry[] = (entry.lines || []).map((line: any, index: number) => ({
                            id: index + 1,
                            accountId: line.trialBalanceAccountId,
                            code: line.trialBalanceAccount?.code || '',
                            accountName: line.trialBalanceAccount?.accountName || '',
                            type: line.type === 'DEBIT' ? 'Debit' : 'Credit',
                            amount: Number(line.value),
                            details: line.reason || '',
                        }));

                        return (
                <AdjustmentCard
                                key={entry.id}
                                id={entry.code}
                                status={entry.status}
                                description={entry.description}
                                lines={lines}
                                attachmentCount={entry.Evidence?.length ?? 0}
                                onEdit={() => handleEdit(entry.id)}
                                onHistory={() => handleHistory(entry.id)}
                                onDelete={() => handleDelete(entry.id)}
                                onManageEvidence={() => handleManageEvidence({ id: entry.id, code: entry.code })}
                />
                        );
                    })}
            </div>
            )}

            <EvidenceFilesDialog
                open={!!evidenceDialogEntry}
                onOpenChange={(open) => !open && setEvidenceDialogEntry(null)}
                auditEntryId={evidenceDialogEntry?.id ?? ''}
                entryCode={evidenceDialogEntry?.code ?? ''}
                engagementId={engagementId}
                entityLabel="Adjustment"
                onEvidenceChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['audit-entries', trialBalanceId] });
                }}
            />
        </div>
    );
}
