import { FileSpreadsheet } from "lucide-react";
import WorkbookTable from "./WorkbookTable";
import LinkedWorkbooksCard from "./LinkedWorkbooksCard";
import UploadWorkbookCard from "./UploadWorkbookCard";
import type { TableRow } from "./ClassificationTable";

interface ClassificationWorkbookProps {
    title: string;
    engagementId?: string;
    classification?: string; // Classification string (label) like "Intangible Assets", "Share Capital", etc.
    classificationId?: string; // Classification ID (UUID) for evidence creation
    classificationRows?: TableRow[];
}

export default function ClassificationWorkbook({ title, engagementId, classification, classificationId, classificationRows = [] }: ClassificationWorkbookProps) {
    // Use real data if available, otherwise use empty array
    const groupedRows = classificationRows.filter(row => row.linkedFiles > 0);
    const ungroupedRows = classificationRows.filter(row => row.linkedFiles === 0);

    return (
        <div className="flex flex-col h-full space-y-8">
            {/* Top Side: Tables */}
            <div className="space-y-8">
                {title === "Intangible Assets" && (
                    <div>
                        <WorkbookTable
                            title="Already Grouped (Grouping 4)"
                            rows={groupedRows}
                            showGroupingButton={true}
                            isGrouped={true}
                        />
                    </div>
                )}

                {title === "Share Capital" && (
                    <div>
                        <WorkbookTable
                            rows={ungroupedRows}
                            showSelection={true}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Side: Cards */}
            <div className="pb-8 space-y-6">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <FileSpreadsheet size={16} />
                        Linked Workbooks
                    </h2>
                    <LinkedWorkbooksCard 
                        engagementId={engagementId}
                        classification={classification}
                        classificationId={classificationId}
                    />
                </div>

                <UploadWorkbookCard
                    engagementId={engagementId}
                    classification={classification}
                    classificationId={classificationId}
                />
            </div>
        </div>
    );
}
