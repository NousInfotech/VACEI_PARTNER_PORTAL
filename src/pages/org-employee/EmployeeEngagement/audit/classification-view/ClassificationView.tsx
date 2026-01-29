import { useState, useMemo } from "react";
import ClassificationHeader from "./components/ClassificationHeader";
import type { TabItem } from "./components/ClassificationTabs";
import ClassificationTabs from "./components/ClassificationTabs";
import ClassificationSummary from "./components/ClassificationSummary";
import ClassificationTable, { type TableRow } from "./components/ClassificationTable";
import ClassificationEvidence from "./components/ClassificationEvidence";
import ClassificationProcedures from "./components/ClassificationProcedures";
import ClassificationWorkbook from "./components/ClassificationWorkbook";

interface ClassificationViewProps {
    title: string;
    subtitle?: string;
}

interface ClassificationData {
    rows: TableRow[];
    summary?: {
        currentYear: number;
        priorYear: number;
        adjustments: number;
        finalBalance: number;
    };
}

export interface WorkbookFile {
    id: string;
    name: string;
    user: string;
    size: string;
    date: string;
}

const DATA: Record<string, ClassificationData> = {
    "Intangible Assets": {
        rows: [
            {
                code: "1",
                accountName: "Cash and cash equivalents",
                currentYear: 265769,
                reClassification: 0,
                adjustments: 0,
                finalBalance: 265769,
                priorYear: 217685,
                linkedFiles: 1
            }
        ]
    },
    "Share Capital": {
        rows: [
            {
                code: "2",
                accountName: "Accruals",
                currentYear: 5285,
                reClassification: 0,
                adjustments: 0,
                finalBalance: 5285,
                priorYear: 4285,
                linkedFiles: 0
            }
        ],
        summary: {
            currentYear: -5285,
            priorYear: -4285,
            adjustments: 0,
            finalBalance: -5285
        }
    }
};

export default function ClassificationView({ title }: ClassificationViewProps) {
    const [activeTab, setActiveTab] = useState('Lead Sheet');

    // File State Management
    const [files, setFiles] = useState<WorkbookFile[]>([
        { id: '1', name: "Unique Ltd.xlsx", user: "Uploaded by User", size: "2.4 MB", date: "2 min ago" },
        { id: '2', name: "Financial_Report_2024.xlsx", user: "Uploaded by Admin", size: "1.8 MB", date: "1 hour ago" }
    ]);

    const data = useMemo(() => DATA[title] || { rows: [] }, [title]);

    const summary = useMemo(() => {
        if (data.summary) return data.summary;
        return data.rows.reduce((acc, row) => ({
            currentYear: acc.currentYear + row.currentYear,
            priorYear: acc.priorYear + row.priorYear,
            adjustments: acc.adjustments + row.adjustments,
            finalBalance: acc.finalBalance + row.finalBalance,
        }), { currentYear: 0, priorYear: 0, adjustments: 0, finalBalance: 0 });
    }, [data]);

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


    return (
        <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto">
            <ClassificationHeader title={title} accountCount={data.rows.length} />
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
                        rows={data.rows}
                    />
                </>
            )}

            {activeTab === 'Evidence' && (
                <ClassificationEvidence />
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
                />
            )}
        </div>
    );
}
