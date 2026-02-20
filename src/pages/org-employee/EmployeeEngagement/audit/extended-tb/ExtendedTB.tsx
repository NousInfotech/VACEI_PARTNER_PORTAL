import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    ClipboardCheck,
    CheckCircle,
    History,
    RefreshCw,
    FileSpreadsheet,
    Upload,
    Calendar,
    CheckCircle2,
    ArrowRight,
    Save,
    Loader2,
    Info,
    X
} from "lucide-react";
import { Button } from "../../../../../ui/Button";
import ExtendedTBTable from "./ExtendedTBTable";
import type { ExtendedTBRow } from "./data";
import { apiGet, apiPostFormData, apiPost, apiPatch } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import AlertMessage from "../../../../common/AlertMessage";
import CreateAuditCycleDialog from "./CreateAuditCycleDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../../../ui/Dialog";

interface ExtendedTBProps {
    isSectionsView?: boolean;
    engagementId?: string;
}

export default function ExtendedTB({ isSectionsView = false, engagementId }: ExtendedTBProps) {
    const [data, setData] = useState<ExtendedTBRow[]>([]);
    const [originalData, setOriginalData] = useState<ExtendedTBRow[]>([]); // Store original data to track changes
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; variant: "success" | "danger" | "warning" | "info" } | null>(null);
    const [showCreateCycleDialog, setShowCreateCycleDialog] = useState(false);
    const queryClient = useQueryClient();

    // State for adjustment/reclassification details
    const [showAdjustmentDetails, setShowAdjustmentDetails] = useState(false);
    const [selectedRowForAdjustments, setSelectedRowForAdjustments] = useState<ExtendedTBRow | null>(null);
    const [adjustmentsForRow, setAdjustmentsForRow] = useState<any[]>([]);
    const [loadingAdjustments, setLoadingAdjustments] = useState(false);

    const [showReclassificationDetails, setShowReclassificationDetails] = useState(false);
    const [selectedRowForReclassifications, setSelectedRowForReclassifications] = useState<ExtendedTBRow | null>(null);
    const [reclassificationsForRow, setReclassificationsForRow] = useState<any[]>([]);
    const [loadingReclassifications, setLoadingReclassifications] = useState(false);

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
            group1: null,
            group2: null,
            group3: null,
            group4: null,
            actions: [],
            linkedFiles: []
        };
        setData([...data, newRow]);
    };

    const handleUpdateRow = (id: number, field: string, value: string | number | null | undefined) => {
        setData(prevData => prevData.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: value };
                // If updating groups, also update the classification string for display
                if (field.startsWith('group')) {
                    const classificationParts = [
                        updatedRow.group1,
                        updatedRow.group2,
                        updatedRow.group3,
                        updatedRow.group4
                    ].filter(Boolean);
                    updatedRow.classification = classificationParts.join(' > ') || '';
                }
                return updatedRow;
            }
            return row;
        }));
    };

    // Handle group updates - update all groups at once to avoid stale state
    const handleUpdateGroups = (id: number, groups: { group1: string | null; group2: string | null; group3: string | null; group4: string | null }) => {
        setData(prevData => prevData.map(row => {
            if (row.id === id) {
                const updatedRow = { 
                    ...row, 
                    group1: groups.group1 ?? null,
                    group2: groups.group2 ?? null,
                    group3: groups.group3 ?? null,
                    group4: groups.group4 ?? null
                };
                // Update classification string for display
                const classificationParts = [
                    updatedRow.group1,
                    updatedRow.group2,
                    updatedRow.group3,
                    updatedRow.group4
                ].filter(Boolean);
                updatedRow.classification = classificationParts.join(' > ') || '';
                return updatedRow;
            }
            return row;
        }));
    };

    const handleDeleteRow = (id: number) => {
        setData(prevData => prevData.filter(row => row.id !== id));
    };

    // Show adjustment details for a specific row
    const showAdjustmentDetailsForRow = async (row: ExtendedTBRow) => {
        setSelectedRowForAdjustments(row);
        setShowAdjustmentDetails(true);
        setLoadingAdjustments(true);
        setAdjustmentsForRow([]);

        try {
            if (!auditCycleId || !trialBalanceId) {
                setAdjustmentsForRow([]);
                return;
            }

            // Fetch all audit entries for this trial balance
            const response = await apiGet<any>(endPoints.AUDIT.GET_AUDIT_ENTRIES(auditCycleId, trialBalanceId));

            if (response?.data) {
                const entries = Array.isArray(response.data) ? response.data : [];
                // Filter to adjustments that affect this specific row
                const rowAccountId = row.accountId;
                const relevantAdjustments = entries.filter((entry: any) => {
                    if (entry.type !== 'ADJUSTMENT') return false;
                    // Check if any line in this entry matches the row's accountId
                    return entry.lines?.some((line: any) => 
                        line.trialBalanceAccountId === rowAccountId
                    );
                });

                setAdjustmentsForRow(relevantAdjustments);
            }
        } catch (error: any) {
            console.error("Error fetching adjustments:", error);
            setAdjustmentsForRow([]);
        } finally {
            setLoadingAdjustments(false);
        }
    };

    // Show reclassification details for a specific row
    const showReclassificationDetailsForRow = async (row: ExtendedTBRow) => {
        setSelectedRowForReclassifications(row);
        setShowReclassificationDetails(true);
        setLoadingReclassifications(true);
        setReclassificationsForRow([]);

        try {
            if (!auditCycleId || !trialBalanceId) {
                setReclassificationsForRow([]);
                return;
            }

            // Fetch all audit entries for this trial balance
            const response = await apiGet<any>(endPoints.AUDIT.GET_AUDIT_ENTRIES(auditCycleId, trialBalanceId));

            if (response?.data) {
                const entries = Array.isArray(response.data) ? response.data : [];
                // Filter to reclassifications that affect this specific row
                const rowAccountId = row.accountId;
                const relevantReclassifications = entries.filter((entry: any) => {
                    if (entry.type !== 'RECLASSIFICATION') return false;
                    // Check if any line in this entry matches the row's accountId
                    return entry.lines?.some((line: any) => 
                        line.trialBalanceAccountId === rowAccountId
                    );
                });

                setReclassificationsForRow(relevantReclassifications);
            }
        } catch (error: any) {
            console.error("Error fetching reclassifications:", error);
            setReclassificationsForRow([]);
        } finally {
            setLoadingReclassifications(false);
        }
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

    // Fetch engagement to get status and companyId
    const { data: engagementData, refetch: refetchEngagement } = useQuery({
        queryKey: ['engagement-audit-cycle', engagementId],
        queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)),
        enabled: !!engagementId,
    });

    // Fetch audit cycles for this engagement (since getById doesn't include auditCycle)
    const { data: auditCyclesData, refetch: refetchAuditCycles } = useQuery({
        queryKey: ['audit-cycles-by-engagement', engagementId],
        queryFn: () => apiGet<any>(endPoints.AUDIT.GET_CYCLES, { engagementId: engagementId! }),
        enabled: !!engagementId,
    });

    const engagement = engagementData?.data || engagementData;
    const companyId = engagement?.companyId || engagement?.company?.id;
    const engagementStatus = engagement?.status;
    const isEngagementAccepted = engagementStatus === 'ACCEPTED' || engagementStatus === 'ACTIVE';
    
    // Get audit cycle from the separate query (backend getById doesn't include auditCycle)
    const auditCycles = auditCyclesData?.data || auditCyclesData || [];
    const auditCycle = Array.isArray(auditCycles) ? auditCycles[0] : null;
    const auditCycleId = auditCycle?.id;

    // Fetch trial balances for the audit cycle
    const { data: trialBalancesData, isLoading: isLoadingTrialBalances } = useQuery({
        queryKey: ['trial-balances', auditCycleId],
        queryFn: () => apiGet<any>(endPoints.AUDIT.GET_TRIAL_BALANCES(auditCycleId!)),
        enabled: !!auditCycleId,
    });

    // Get the latest trial balance (prefer CURRENT role, otherwise get the first one)
    const trialBalances = trialBalancesData?.data || trialBalancesData || [];
    const trialBalanceList = Array.isArray(trialBalances) ? trialBalances : [];
    const currentTrialBalance = trialBalanceList.find((tb: any) => tb.role === 'CURRENT') || trialBalanceList[0];
    const trialBalanceId = currentTrialBalance?.id;

    // Fetch trial balance with accounts
    const { data: trialBalanceWithAccountsData, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['trial-balance-with-accounts', auditCycleId, trialBalanceId],
        queryFn: () => apiGet<any>(endPoints.AUDIT.GET_TRIAL_BALANCE_WITH_ACCOUNTS(auditCycleId!, trialBalanceId!)),
        enabled: !!auditCycleId && !!trialBalanceId,
    });

    const isLoadingTrialBalanceData = isLoadingTrialBalances || isLoadingAccounts;

    // Map backend data to ExtendedTBRow format
    React.useEffect(() => {
        if (trialBalanceWithAccountsData?.data?.accounts) {
            const accounts = trialBalanceWithAccountsData.data.accounts;
            const mappedData: ExtendedTBRow[] = accounts.map((account: any, index: number) => {
                // Convert amounts to numbers (handle Decimal types from Prisma)
                const parseAmount = (value: any): number => {
                    if (value === null || value === undefined || value === '-') return 0;
                    if (typeof value === 'number') return value;
                    const parsed = parseFloat(String(value));
                    return isNaN(parsed) ? 0 : parsed;
                };

                const currentYear = parseAmount(account.currentYear);
                const priorYear = parseAmount(account.priorYear);
                const adjustments = parseAmount(account.adjustmentAmount);
                const reClassification = parseAmount(account.reclassificationAmount);
                const finalBalance = parseAmount(account.finalBalance);

                // Build classification from groups
                const classificationParts = [
                    account.group1,
                    account.group2,
                    account.group3,
                    account.group4
                ].filter(Boolean);
                const classification = classificationParts.join(' > ') || '';

                return {
                    id: index + 1, // Use index as id for now
                    code: account.code || '',
                    accountName: account.accountName || '',
                    currentYear,
                    reClassification,
                    adjustments,
                    finalBalance,
                    priorYear,
                    classification, // Legacy: kept for display
                    group1: (account.group1 && account.group1.trim()) || null,
                    group2: (account.group2 && account.group2.trim()) || null,
                    group3: (account.group3 && account.group3.trim()) || null,
                    group4: (account.group4 && account.group4.trim()) || null,
                    accountId: account.id, // Backend account ID for updates
                    actions: [], // Can be populated from audit entries if needed
                    linkedFiles: [] // Can be populated from evidence if needed
                };
            });
            setData(mappedData);
            // Set originalData to track changes - use deep copy to avoid reference issues
            setOriginalData(JSON.parse(JSON.stringify(mappedData)));
        } else if (!trialBalanceId || (!isLoadingTrialBalanceData && !trialBalanceWithAccountsData)) {
            // If no trial balance exists yet, show empty array
            setData([]);
            setOriginalData([]);
        }
    }, [trialBalanceWithAccountsData, trialBalanceId, isLoadingTrialBalanceData]);

    // Mutation to create audit cycle
    const createAuditCycleMutation = useMutation({
        mutationFn: async (data: { yearEndDate: string }) => {
            if (!engagementId || !companyId) {
                throw new Error("Engagement ID and Company ID are required");
            }
            return apiPost<any>(endPoints.AUDIT.CREATE_CYCLE, {
                engagementId,
                companyId,
                yearEndDate: data.yearEndDate,
            });
        },
        onSuccess: async () => {
            setShowCreateCycleDialog(false);
            
            // Small delay to ensure backend has processed the audit cycle creation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Invalidate queries first
            queryClient.invalidateQueries({ queryKey: ['engagement-audit-cycle', engagementId] });
            queryClient.invalidateQueries({ queryKey: ['engagement-view', engagementId] });
            queryClient.invalidateQueries({ queryKey: ['audit-cycles-by-engagement', engagementId] });
            
            // Explicitly refetch the queries to get updated data
            await queryClient.refetchQueries({ queryKey: ['engagement-audit-cycle', engagementId] });
            await queryClient.refetchQueries({ queryKey: ['engagement-view', engagementId] });
            await queryClient.refetchQueries({ queryKey: ['audit-cycles-by-engagement', engagementId] });
            
            // Also manually refetch
            await refetchEngagement();
            await refetchAuditCycles();
            
            setAlertMessage({
                message: "Audit cycle created successfully! You can now upload trial balance files.",
                variant: "success"
            });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to create audit cycle";
            setAlertMessage({ message: errorMessage, variant: "danger" });
        }
    });

    const handleCreateAuditCycle = async (data: { yearEndDate: string }) => {
        await createAuditCycleMutation.mutateAsync(data);
    };

    // Mutation to accept engagement
    const acceptEngagementMutation = useMutation({
        mutationFn: async () => {
            if (!engagementId) {
                throw new Error("Engagement ID is required");
            }
            return apiPatch<any>(endPoints.ENGAGEMENTS.UPDATE_STATUS(engagementId), {
                status: 'ACCEPTED',
            });
        },
        onSuccess: () => {
            // Invalidate and refetch engagement data
            queryClient.invalidateQueries({ queryKey: ['engagement-audit-cycle', engagementId] });
            queryClient.invalidateQueries({ queryKey: ['engagement-view', engagementId] });
            setAlertMessage({
                message: "Engagement accepted successfully! You can now create an audit cycle.",
                variant: "success"
            });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to accept engagement";
            setAlertMessage({ message: errorMessage, variant: "danger" });
        }
    });

    const handleAcceptEngagement = () => {
        acceptEngagementMutation.mutate();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            setAlertMessage({ 
                message: 'Please upload a valid Excel (.xlsx, .xls) or CSV file', 
                variant: 'warning' 
            });
            return;
        }

        if (!auditCycleId) {
            setAlertMessage({ 
                message: 'Audit cycle not found. Please ensure the engagement has an audit cycle.', 
                variant: 'danger' 
            });
            return;
        }

        setIsUploading(true);
        setAlertMessage(null);
        try {
            // Get the audit cycle's year end date to calculate current year
            const yearEndDate = auditCycle?.yearEndDate ? new Date(auditCycle.yearEndDate) : null;
            const currentYear = yearEndDate ? yearEndDate.getFullYear() : new Date().getFullYear();
            const priorYear = currentYear - 1;

            // Check if a PREVIOUS year trial balance exists for the prior year
            const hasPreviousYearTrialBalance = trialBalanceList.some((tb: any) => {
                if (tb.role === 'PREVIOUS') {
                    // If year field exists, check it matches priorYear
                    if (tb.year !== undefined && tb.year !== null) {
                        return tb.year === priorYear;
                    }
                    // Fallback: if year not available, assume it's for prior year if role is PREVIOUS
                    return true;
                }
                return false;
            });

            let uploadResponse: any;
            let newTrialBalanceId: string | undefined;

            if (!hasPreviousYearTrialBalance) {
                // No PREVIOUS year trial balance exists - upload as both PREVIOUS and CURRENT
                // First, upload as PREVIOUS year
                const previousFormData = new FormData();
                previousFormData.append('file', file);
                previousFormData.append('role', 'PREVIOUS');
                previousFormData.append('year', priorYear.toString());

                setAlertMessage({
                    message: 'Uploading as Previous Year trial balance...',
                    variant: 'info'
                });

                await apiPostFormData<any>(
                    endPoints.AUDIT.UPLOAD_TRIAL_BALANCE(auditCycleId),
                    previousFormData
                );

                // Wait a bit for backend to process
                await new Promise(resolve => setTimeout(resolve, 500));

                // Refresh trial balance list to get the newly created PREVIOUS one
                await queryClient.refetchQueries({ queryKey: ['trial-balances', auditCycleId] });

                // Now upload the same file as CURRENT year
                const currentFormData = new FormData();
                currentFormData.append('file', file);
                currentFormData.append('role', 'CURRENT');
                currentFormData.append('year', currentYear.toString());

                setAlertMessage({
                    message: 'Uploading as Current Year trial balance...',
                    variant: 'info'
                });

                uploadResponse = await apiPostFormData<any>(
                    endPoints.AUDIT.UPLOAD_TRIAL_BALANCE(auditCycleId),
                    currentFormData
                );

                newTrialBalanceId = uploadResponse?.data?.id || uploadResponse?.id;
            } else {
                // PREVIOUS year trial balance exists - upload only as CURRENT
                const formData = new FormData();
                formData.append('file', file);
                formData.append('role', 'CURRENT');
                formData.append('year', currentYear.toString());

                uploadResponse = await apiPostFormData<any>(
                    endPoints.AUDIT.UPLOAD_TRIAL_BALANCE(auditCycleId),
                    formData
                );

                newTrialBalanceId = uploadResponse?.data?.id || uploadResponse?.id;
            }

            // Refresh trial balance data after upload
            await queryClient.invalidateQueries({ queryKey: ['trial-balances', auditCycleId] });
            
            // Wait a bit for backend to process accounts
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Refetch trial balances to get the new one(s)
            await queryClient.refetchQueries({ queryKey: ['trial-balances', auditCycleId] });
            
            // Find the CURRENT year trial balance to display
            const refreshedData = queryClient.getQueryData<any>(['trial-balances', auditCycleId]);
            const refreshedList = refreshedData?.data || refreshedData || [];
            const currentTrialBalance = Array.isArray(refreshedList) 
                ? refreshedList.find((tb: any) => tb.role === 'CURRENT' && tb.year === currentYear)
                : null;
            
            const displayTrialBalanceId = currentTrialBalance?.id || newTrialBalanceId;

            // If we have a trial balance ID, fetch its accounts
            if (displayTrialBalanceId) {
                // Invalidate and refetch with the trial balance ID
                await queryClient.invalidateQueries({ 
                    queryKey: ['trial-balance-with-accounts', auditCycleId, displayTrialBalanceId] 
                });
                // Wait a bit more for accounts to be ready
                await new Promise(resolve => setTimeout(resolve, 500));
                await queryClient.refetchQueries({ 
                    queryKey: ['trial-balance-with-accounts', auditCycleId, displayTrialBalanceId] 
                });
            }

            const successMessage = !hasPreviousYearTrialBalance
                ? 'File uploaded successfully! Created both Previous Year and Current Year trial balances. Displaying Current Year data.'
                : 'File uploaded successfully! The Current Year trial balance has been processed and is now displayed.';

            setAlertMessage({ 
                message: successMessage, 
                variant: 'success' 
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            let errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload file';
            
            // Provide helpful message for the prior year requirement
            if (errorMessage.includes('Prior year trial balance must exist')) {
                errorMessage = 'Please upload the prior year trial balance first, then upload the current year trial balance.';
            }
            
            setAlertMessage({ 
                message: `Upload failed: ${errorMessage}`, 
                variant: 'danger' 
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Check if there are any changes to save (only for rows with accountId that can be saved)
    const hasChanges = React.useMemo(() => {
        // If originalData is empty, no changes can be detected (data hasn't loaded yet)
        if (originalData.length === 0) return false;
        
        // Helper to normalize values for comparison (handle null, undefined, empty string)
        const normalize = (value: string | null | undefined): string | null => {
            if (value === null || value === undefined) return null;
            const trimmed = String(value).trim();
            return trimmed === '' ? null : trimmed;
        };
        
        // Only check rows that have accountId (can be saved)
        const saveableRows = data.filter(row => row.accountId);
        
        // If no saveable rows, no changes
        if (saveableRows.length === 0) return false;
        
        // Check if any saveable row has changes
        return saveableRows.some((row) => {
            // Find the original row by accountId (must match since we filtered by accountId)
            const original = originalData.find(orig => orig.accountId === row.accountId);
            
            // If original row not found, there are changes
            if (!original) return true;
            
            // Compare all fields with normalized values
            return (
                normalize(row.code) !== normalize(original.code) ||
                normalize(row.accountName) !== normalize(original.accountName) ||
                row.currentYear !== original.currentYear ||
                row.priorYear !== original.priorYear ||
                normalize(row.group1) !== normalize(original.group1) ||
                normalize(row.group2) !== normalize(original.group2) ||
                normalize(row.group3) !== normalize(original.group3) ||
                normalize(row.group4) !== normalize(original.group4)
            );
        });
    }, [data, originalData]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            setIsSaving(true);
            if (!trialBalanceId || !auditCycleId) {
                throw new Error("Trial balance ID and Audit cycle ID are required");
            }

            // Prepare accounts to update (only those with accountId from backend)
            // Helper to normalize values for comparison
            const normalize = (value: string | null | undefined): string | null => {
                if (value === null || value === undefined) return null;
                const trimmed = String(value).trim();
                return trimmed === '' ? null : trimmed;
            };
            
            const accountsToUpdate = data
                .filter(row => row.accountId) // Only rows that exist in backend
                .map(row => {
                    const original = originalData.find(orig => orig.accountId === row.accountId);
                    if (!original) return null;

                    // Check if this row has changes (using normalized comparison)
                    const hasRowChanges = (
                        normalize(row.code) !== normalize(original.code) ||
                        normalize(row.accountName) !== normalize(original.accountName) ||
                        row.currentYear !== original.currentYear ||
                        row.priorYear !== original.priorYear ||
                        normalize(row.group1) !== normalize(original.group1) ||
                        normalize(row.group2) !== normalize(original.group2) ||
                        normalize(row.group3) !== normalize(original.group3) ||
                        normalize(row.group4) !== normalize(original.group4)
                    );

                    if (!hasRowChanges) return null;

                    // Build update object with only changed fields
                    const updateObj: {
                        trialBalanceAccountId: string;
                        currentYear?: number;
                        group1?: string | null;
                        group2?: string | null;
                        group3?: string | null;
                        group4?: string | null;
                    } = {
                        trialBalanceAccountId: row.accountId!,
                    };

                    // Include currentYear if it changed
                    if (row.currentYear !== original.currentYear) {
                        updateObj.currentYear = row.currentYear;
                    }

                    // Include groups if they changed (normalize empty strings to null)
                    if (row.group1 !== original.group1) {
                        updateObj.group1 = (row.group1 && row.group1.trim()) || null;
                    }
                    if (row.group2 !== original.group2) {
                        updateObj.group2 = (row.group2 && row.group2.trim()) || null;
                    }
                    if (row.group3 !== original.group3) {
                        updateObj.group3 = (row.group3 && row.group3.trim()) || null;
                    }
                    if (row.group4 !== original.group4) {
                        updateObj.group4 = (row.group4 && row.group4.trim()) || null;
                    }

                    return updateObj;
                })
                .filter(Boolean) as Array<{
                    trialBalanceAccountId: string;
                    currentYear?: number;
                    group1?: string | null;
                    group2?: string | null;
                    group3?: string | null;
                    group4?: string | null;
                }>;

            if (accountsToUpdate.length === 0) {
                throw new Error("No changes to save");
            }

            return apiPatch<any>(
                endPoints.AUDIT.UPDATE_TRIAL_BALANCE_ACCOUNTS(auditCycleId, trialBalanceId),
                { accounts: accountsToUpdate }
            );
        },
        onSuccess: async () => {
            // Update original data to match current data
            setOriginalData(JSON.parse(JSON.stringify(data)));
            
            // Refresh trial balance data
            await queryClient.invalidateQueries({ 
                queryKey: ['trial-balance-with-accounts', auditCycleId, trialBalanceId] 
            });
            await queryClient.refetchQueries({ 
                queryKey: ['trial-balance-with-accounts', auditCycleId, trialBalanceId] 
            });

            setAlertMessage({
                message: "Changes saved successfully!",
                variant: "success"
            });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to save changes";
            setAlertMessage({ 
                message: `Save failed: ${errorMessage}`, 
                variant: "danger" 
            });
        },
        onSettled: () => {
            setIsSaving(false);
        }
    });

    const handleSave = () => {
        saveMutation.mutate();
    };

    // Workflow steps
    const workflowSteps = [
        {
            id: 1,
            label: 'Accept Engagement',
            completed: isEngagementAccepted,
            current: !isEngagementAccepted && engagementStatus !== 'ACTIVE',
        },
        {
            id: 2,
            label: 'Create Audit Cycle',
            completed: !!auditCycleId,
            current: isEngagementAccepted && !auditCycleId,
        },
        {
            id: 3,
            label: 'Upload Trial Balance',
            completed: false, // Could be enhanced to check if file was uploaded
            current: !!auditCycleId && isEngagementAccepted,
        },
    ];

    const getCurrentStep = () => {
        if (!isEngagementAccepted) return 1;
        if (!auditCycleId) return 2;
        return 3;
    };

    return (
        <div className="p-6 space-y-4">
            {alertMessage && (
                <AlertMessage
                    message={alertMessage.message}
                    variant={alertMessage.variant}
                    onClose={() => setAlertMessage(null)}
                />
            )}

            {/* Workflow Progress Indicator */}
            {(!isEngagementAccepted || !auditCycleId) && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            Setup Progress
                        </h3>
                        <span className="text-xs font-medium text-gray-600">
                            Step {getCurrentStep()} of 3
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {workflowSteps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-2 flex-1">
                                    <div className={`
                                        flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                                        ${step.completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : step.current 
                                            ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                                            : 'bg-white border-gray-300 text-gray-400'
                                        }
                                    `}>
                                        {step.completed ? (
                                            <CheckCircle2 size={18} />
                                        ) : (
                                            <span className="text-sm font-bold">{step.id}</span>
                                        )}
                                    </div>
                                    <span className={`
                                        text-xs font-medium transition-colors
                                        ${step.completed 
                                            ? 'text-green-700' 
                                            : step.current 
                                            ? 'text-blue-700 font-bold' 
                                            : 'text-gray-500'
                                        }
                                    `}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < workflowSteps.length - 1 && (
                                    <ArrowRight 
                                        size={16} 
                                        className={`
                                            ${step.completed ? 'text-green-500' : 'text-gray-300'}
                                        `} 
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Extended Trial Balance</h2>
                    <p className="text-sm text-gray-500">
                        {!isEngagementAccepted 
                            ? "Engagement must be ACCEPTED before creating an audit cycle" 
                            : !auditCycleId 
                            ? "Create an audit cycle first to upload trial balance files" 
                            : "Manage your financial data and adjustments"}
                    </p>
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        {!isEngagementAccepted ? (
                            <Button 
                                size="sm" 
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
                                onClick={handleAcceptEngagement}
                                disabled={acceptEngagementMutation.isPending}
                            >
                                <CheckCircle size={16} />
                                {acceptEngagementMutation.isPending ? 'Accepting...' : 'Accept Engagement'}
                            </Button>
                        ) : !auditCycleId ? (
                            <Button 
                                size="sm" 
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
                                onClick={() => setShowCreateCycleDialog(true)}
                                disabled={createAuditCycleMutation.isPending}
                            >
                                <Calendar size={16} />
                                {createAuditCycleMutation.isPending ? 'Creating...' : 'Create Audit Cycle'}
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-2 border-green-500 text-green-700 hover:bg-green-50" 
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                >
                                    <Upload size={16} />
                                    {isUploading ? 'Uploading...' : 'Upload Excel/CSV'}
                                </Button>
                                {trialBalanceId && (
                                    <Button 
                                        size="sm" 
                                        variant="default" 
                                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                        onClick={handleSave}
                                        disabled={isSaving || !hasChanges}
                                        title={!hasChanges ? "No changes to save" : "Save changes"}
                                    >
                                        <Save size={16} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                )}
                            </>
                        )}
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

            {isLoadingTrialBalanceData ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-gray-500">Loading trial balance data...</p>
                    </div>
                </div>
            ) : data.length === 0 && auditCycleId ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trial Balance Data</h3>
                    <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
                        Upload an Excel or CSV file to populate the trial balance table.
                    </p>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2" 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        <Upload size={16} />
                        {isUploading ? 'Uploading...' : 'Upload Excel/CSV'}
                    </Button>
                </div>
            ) : (
                <ExtendedTBTable
                    data={data}
                    onUpdateRow={handleUpdateRow}
                    onUpdateGroups={handleUpdateGroups}
                    onDeleteRow={handleDeleteRow}
                    onShowAdjustmentDetails={showAdjustmentDetailsForRow}
                    onShowReclassificationDetails={showReclassificationDetailsForRow}
                    isSectionsView={isSectionsView}
                />
            )}

            <CreateAuditCycleDialog
                isOpen={showCreateCycleDialog}
                onClose={() => setShowCreateCycleDialog(false)}
                onSubmit={handleCreateAuditCycle}
                engagementId={engagementId}
                companyId={companyId}
                isLoading={createAuditCycleMutation.isPending}
            />

            {/* Adjustment Details Dialog */}
            <Dialog open={showAdjustmentDetails} onOpenChange={setShowAdjustmentDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto relative">
                    <button
                        onClick={() => setShowAdjustmentDetails(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                    <DialogHeader>
                        <DialogTitle>Adjustment Details</DialogTitle>
                        <DialogDescription>
                            Adjustments affecting{" "}
                            <span className="font-semibold">
                                {selectedRowForAdjustments?.code} - {selectedRowForAdjustments?.accountName}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {loadingAdjustments ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">Loading adjustments...</span>
                            </div>
                        ) : adjustmentsForRow.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Info className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No adjustments found for this row</p>
                                <p className="text-xs mt-1">
                                    The adjustment value may have been set directly or come from a different source.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {adjustmentsForRow.map((adj: any) => {
                                    const rowAccountId = selectedRowForAdjustments?.accountId;
                                    
                                    // Calculate net impact on this specific row
                                    const netImpactOnRow = adj.lines
                                        ?.filter((line: any) => line.trialBalanceAccountId === rowAccountId)
                                        .reduce((sum: number, line: any) => {
                                            const value = line.type === 'DEBIT' ? line.value : -line.value;
                                            return sum + value;
                                        }, 0) || 0;

                                    // Calculate totals for the adjustment
                                    const totalDr = adj.lines
                                        ?.filter((line: any) => line.type === 'DEBIT')
                                        .reduce((sum: number, line: any) => sum + (line.value || 0), 0) || 0;
                                    const totalCr = adj.lines
                                        ?.filter((line: any) => line.type === 'CREDIT')
                                        .reduce((sum: number, line: any) => sum + (line.value || 0), 0) || 0;

                                    return (
                                        <div key={adj.id} className="border border-blue-200 rounded-lg p-4">
                                            <div className="space-y-3">
                                                {/* Adjustment Header */}
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                                        {adj.code}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        adj.status === "POSTED" 
                                                            ? "bg-green-100 text-green-700" 
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {adj.status}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {adj.description || "No description"}
                                                    </span>
                                                </div>

                                                {/* Entries Table */}
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left border-r">Code</th>
                                                                <th className="px-3 py-2 text-left border-r">Account</th>
                                                                <th className="px-3 py-2 text-right border-r">Debit</th>
                                                                <th className="px-3 py-2 text-right border-r">Credit</th>
                                                                <th className="px-3 py-2 text-left">Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {adj.lines?.map((line: any, idx: number) => {
                                                                const isClickedRow = line.trialBalanceAccountId === rowAccountId;
                                                                return (
                                                                    <tr
                                                                        key={idx}
                                                                        className={`border-t ${isClickedRow ? "bg-blue-50 font-semibold" : ""}`}
                                                                    >
                                                                        <td className="px-3 py-2 border-r font-mono text-xs">
                                                                            {line.trialBalanceAccount?.code || '-'}
                                                                            {isClickedRow && (
                                                                                <span className="ml-2 px-1 py-0.5 bg-blue-200 rounded text-xs">
                                                                                    This row
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 border-r">{line.trialBalanceAccount?.accountName || '-'}</td>
                                                                        <td className="px-3 py-2 border-r text-right">
                                                                            {line.type === 'DEBIT' ? formatCurrency(line.value) : '-'}
                                                                        </td>
                                                                        <td className="px-3 py-2 border-r text-right">
                                                                            {line.type === 'CREDIT' ? formatCurrency(line.value) : '-'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-gray-600">
                                                                            {line.reason || '-'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Totals Row */}
                                                            <tr className="border-t bg-gray-100 font-semibold">
                                                                <td colSpan={2} className="px-3 py-2 border-r">
                                                                    TOTAL
                                                                </td>
                                                                <td className="px-3 py-2 border-r text-right">
                                                                    {formatCurrency(totalDr)}
                                                                </td>
                                                                <td className="px-3 py-2 border-r text-right">
                                                                    {formatCurrency(totalCr)}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                                        totalDr === totalCr 
                                                                            ? "bg-green-100 text-green-700" 
                                                                            : "bg-red-100 text-red-700"
                                                                    }`}>
                                                                        {totalDr === totalCr ? "Balanced" : "Unbalanced"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Net Impact on THIS account */}
                                                <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                                    <span className="font-medium">Net impact on {selectedRowForAdjustments?.accountName}:</span>
                                                    <span className="font-bold text-lg">
                                                        {formatCurrency(netImpactOnRow)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reclassification Details Dialog */}
            <Dialog open={showReclassificationDetails} onOpenChange={setShowReclassificationDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto relative">
                    <button
                        onClick={() => setShowReclassificationDetails(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                    <DialogHeader>
                        <DialogTitle>Reclassification Details</DialogTitle>
                        <DialogDescription>
                            Reclassifications affecting{" "}
                            <span className="font-semibold">
                                {selectedRowForReclassifications?.code} - {selectedRowForReclassifications?.accountName}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {loadingReclassifications ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">Loading reclassifications...</span>
                            </div>
                        ) : reclassificationsForRow.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Info className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No reclassifications found for this row</p>
                                <p className="text-xs mt-1">
                                    The reclassification value may have been set directly or come from a different source.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reclassificationsForRow.map((rc: any) => {
                                    const rowAccountId = selectedRowForReclassifications?.accountId;
                                    
                                    // Calculate net impact on this specific row
                                    const netImpactOnRow = rc.lines
                                        ?.filter((line: any) => line.trialBalanceAccountId === rowAccountId)
                                        .reduce((sum: number, line: any) => {
                                            const value = line.type === 'DEBIT' ? line.value : -line.value;
                                            return sum + value;
                                        }, 0) || 0;

                                    // Calculate totals for the reclassification
                                    const totalDr = rc.lines
                                        ?.filter((line: any) => line.type === 'DEBIT')
                                        .reduce((sum: number, line: any) => sum + (line.value || 0), 0) || 0;
                                    const totalCr = rc.lines
                                        ?.filter((line: any) => line.type === 'CREDIT')
                                        .reduce((sum: number, line: any) => sum + (line.value || 0), 0) || 0;

                                    return (
                                        <div key={rc.id} className="border border-blue-200 rounded-lg p-4">
                                            <div className="space-y-3">
                                                {/* Reclassification Header */}
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                                        {rc.code}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        rc.status === "POSTED" 
                                                            ? "bg-green-100 text-green-700" 
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {rc.status}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {rc.description || "No description"}
                                                    </span>
                                                </div>

                                                {/* Entries Table */}
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left border-r">Code</th>
                                                                <th className="px-3 py-2 text-left border-r">Account</th>
                                                                <th className="px-3 py-2 text-right border-r">Debit</th>
                                                                <th className="px-3 py-2 text-right border-r">Credit</th>
                                                                <th className="px-3 py-2 text-left">Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rc.lines?.map((line: any, idx: number) => {
                                                                const isClickedRow = line.trialBalanceAccountId === rowAccountId;
                                                                return (
                                                                    <tr
                                                                        key={idx}
                                                                        className={`border-t ${isClickedRow ? "bg-blue-50 font-semibold" : ""}`}
                                                                    >
                                                                        <td className="px-3 py-2 border-r font-mono text-xs">
                                                                            {line.trialBalanceAccount?.code || '-'}
                                                                            {isClickedRow && (
                                                                                <span className="ml-2 px-1 py-0.5 bg-blue-200 rounded text-xs">
                                                                                    This row
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 border-r">{line.trialBalanceAccount?.accountName || '-'}</td>
                                                                        <td className="px-3 py-2 border-r text-right">
                                                                            {line.type === 'DEBIT' ? formatCurrency(line.value) : '-'}
                                                                        </td>
                                                                        <td className="px-3 py-2 border-r text-right">
                                                                            {line.type === 'CREDIT' ? formatCurrency(line.value) : '-'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-gray-600">
                                                                            {line.reason || '-'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Totals Row */}
                                                            <tr className="border-t bg-gray-100 font-semibold">
                                                                <td colSpan={2} className="px-3 py-2 border-r">
                                                                    TOTAL
                                                                </td>
                                                                <td className="px-3 py-2 border-r text-right">
                                                                    {formatCurrency(totalDr)}
                                                                </td>
                                                                <td className="px-3 py-2 border-r text-right">
                                                                    {formatCurrency(totalCr)}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                                        totalDr === totalCr 
                                                                            ? "bg-green-100 text-green-700" 
                                                                            : "bg-red-100 text-red-700"
                                                                    }`}>
                                                                        {totalDr === totalCr ? "Balanced" : "Unbalanced"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Net Impact on THIS account */}
                                                <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                                    <span className="font-medium">Net impact on {selectedRowForReclassifications?.accountName}:</span>
                                                    <span className="font-bold text-lg">
                                                        {formatCurrency(netImpactOnRow)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
