import { useState, useMemo } from "react";
import ClassificationHeader from "./components/ClassificationHeader";
import ClassificationTabs from "./components/ClassificationTabs";
import ClassificationSummary from "./components/ClassificationSummary";
import ClassificationTable, { type TableRow } from "./components/ClassificationTable";
import ClassificationEvidence from "./components/ClassificationEvidence";
import ClassificationProcedures from "./components/ClassificationProcedures";

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

    return (
        <div className="p-8 h-full flex flex-col space-y-8 overflow-y-auto">
            <ClassificationHeader title={title} accountCount={data.rows.length} />
            <ClassificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

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

            {/* Placeholders for other tabs */}
            {activeTab === 'WorkBook' && (
                <div className="flex-1 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-12 text-center">
                    <p className="text-gray-500">{activeTab} content coming soon...</p>
                </div>
            )}
        </div>
    );
}
