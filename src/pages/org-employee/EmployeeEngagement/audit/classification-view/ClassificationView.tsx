import { useState, useMemo } from "react";
import ClassificationHeader from "./components/ClassificationHeader";
import type { TabItem } from "./components/ClassificationTabs";
import ClassificationTabs from "./components/ClassificationTabs";
import ClassificationSummary from "./components/ClassificationSummary";
import ClassificationTable, { type TableRow } from "./components/ClassificationTable";
import ClassificationEvidence from "./components/ClassificationEvidence";
import ClassificationProcedures from "./components/ClassificationProcedures";
import ClassificationWorkbook from "./components/ClassificationWorkbook";
import { useETBData } from "../hooks/useETBData";
import { useClassification } from "../hooks/useClassification";
import { extractClassificationGroups, getRowsForClassification } from "../utils/classificationUtils";
import { Loader2 } from "lucide-react";

interface ClassificationViewProps {
    classificationId?: string;
    engagementId?: string;
    title?: string;
    subtitle?: string;
}

export interface WorkbookFile {
    id: string;
    name: string;
    user: string;
    size: string;
    date: string;
}

export default function ClassificationView({ classificationId, engagementId, title: propTitle }: ClassificationViewProps) {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const [activeTab, setActiveTab] = useState('Lead Sheet');

    // File State Management - must be before conditional returns
    const [files, setFiles] = useState<WorkbookFile[]>([
        { id: '1', name: "Unique Ltd.xlsx", user: "Uploaded by User", size: "2.4 MB", date: "2 min ago" },
        { id: '2', name: "Financial_Report_2024.xlsx", user: "Uploaded by Admin", size: "1.8 MB", date: "1 hour ago" }
    ]);

    // Fetch ETB data
    const { data: etbData, isLoading, trialBalanceId } = useETBData(engagementId);

    // Extract classification group and rows
    const classificationGroup = useMemo(() => {
        if (!etbData?.etbRows || !classificationId) return null;
        const groups = extractClassificationGroups(etbData.etbRows);
        return groups.find(g => `classification-${g.id}` === classificationId);
    }, [etbData?.etbRows, classificationId]);

    // Get or create classification record from database
    const { classificationId: dbClassificationId, isLoading: isLoadingClassification } = useClassification(
        classificationGroup ?? null,
        trialBalanceId
    );

    // Get rows for this classification
    const classificationRows = useMemo(() => {
        if (!etbData?.etbRows || !classificationGroup) return [];
        return getRowsForClassification(etbData.etbRows, classificationGroup);
    }, [etbData?.etbRows, classificationGroup]);

    // Convert to TableRow format
    const tableRows: TableRow[] = useMemo(() => {
        return classificationRows.map(row => ({
            code: row.code,
            accountName: row.accountName,
            currentYear: row.currentYear,
            reClassification: row.reClassification,
            adjustments: row.adjustments,
            finalBalance: row.finalBalance,
            priorYear: row.priorYear,
            linkedFiles: row.linkedFiles?.length || 0
        }));
    }, [classificationRows]);

    // Calculate summary from classification group totals
    const summary = useMemo(() => {
        if (classificationGroup?.totals) {
            return {
                currentYear: classificationGroup.totals.currentYear,
                priorYear: classificationGroup.totals.priorYear,
                adjustments: classificationGroup.totals.adjustments,
                finalBalance: classificationGroup.totals.finalBalance,
            };
        }
        // Fallback: calculate from rows
        return tableRows.reduce((acc, row) => ({
            currentYear: acc.currentYear + row.currentYear,
            priorYear: acc.priorYear + row.priorYear,
            adjustments: acc.adjustments + row.adjustments,
            finalBalance: acc.finalBalance + row.finalBalance,
        }), { currentYear: 0, priorYear: 0, adjustments: 0, finalBalance: 0 });
    }, [classificationGroup, tableRows]);

    // Determine title
    const title = propTitle || classificationGroup?.label || 'Classification';

    // Dynamic Tabs Logic
    const tabs: TabItem[] = [
        { id: 'Lead Sheet', label: 'Lead Sheet' },
        { id: 'Evidence', label: 'Evidence' },
        { id: 'Procedures', label: 'Procedures' },
        { id: 'WorkBook', label: 'WorkBook' },
    ];

    const handleFileClick = (file: WorkbookFile) => {
        window.open(`/workbook-viewer?filename=${encodeURIComponent(file.name)}`, '_blank');
    };

    const handleUpload = (newFile: WorkbookFile) => {
        setFiles([newFile, ...files]);
    };

    const handleDeleteFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    // NOW conditional returns are safe
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500">Loading classification data...</p>
                </div>
            </div>
        );
    }

    if (!classificationGroup && classificationId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Classification not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto">
            <ClassificationHeader title={title} accountCount={tableRows.length} />
            <ClassificationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
            />

            {activeTab === 'Lead Sheet' && (
                <>
                    <ClassificationSummary
                        currentYear={summary.currentYear}
                        priorYear={summary.priorYear}
                        adjustments={summary.adjustments}
                        finalBalance={summary.finalBalance}
                    />
                    <ClassificationTable
                        title={`${title} - Cost`}
                        rows={tableRows}
                    />
                </>
            )}

            {activeTab === 'Evidence' && (
                <ClassificationEvidence 
                    classificationId={dbClassificationId}
                    engagementId={engagementId}
                    trialBalanceId={trialBalanceId}
                    isLoadingClassification={isLoadingClassification}
                />
            )}

            {activeTab === 'Procedures' && (
                <ClassificationProcedures title={title} />
            )}

            {/* Workbook Tab */}
            {activeTab === 'WorkBook' && (
                <ClassificationWorkbook
                    title={title}
                    files={files}
                    onUpload={handleUpload}
                    onFileClick={handleFileClick}
                    onDeleteFile={handleDeleteFile}
                    classificationRows={tableRows}
                />
            )}
        </div>
    );
}
