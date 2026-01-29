import { FileSpreadsheet } from "lucide-react";
import WorkbookTable from "./WorkbookTable";
import LinkedWorkbooksCard from "./LinkedWorkbooksCard";
import UploadWorkbookCard from "./UploadWorkbookCard";
import type { WorkbookFile } from "../ClassificationView";

interface ClassificationWorkbookProps {
    title: string;
    files: WorkbookFile[];
    onUpload: (file: WorkbookFile) => void;
    onFileClick: (file: WorkbookFile) => void;
    onDeleteFile: (id: string) => void;
}

export default function ClassificationWorkbook({ title, files, onUpload, onFileClick, onDeleteFile }: ClassificationWorkbookProps) {
    // Mock Data
    const groupedRows = [
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
    ];

    const ungroupedRows = [
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
    ];

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
                    <LinkedWorkbooksCard />
                </div>

                <UploadWorkbookCard
                    files={files}
                    onUpload={onUpload}
                    onFileClick={onFileClick}
                    onDelete={onDeleteFile}
                />
            </div>
        </div>
    );
}
