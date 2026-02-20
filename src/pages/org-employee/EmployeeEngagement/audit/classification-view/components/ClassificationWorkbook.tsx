import { FileSpreadsheet } from "lucide-react";
import WorkbookTable from "./WorkbookTable";
import LinkedWorkbooksCard from "./LinkedWorkbooksCard";
import UploadWorkbookCard from "./UploadWorkbookCard";
import type { WorkbookFile } from "../ClassificationView";
import type { TableRow } from "./ClassificationTable";

interface ClassificationWorkbookProps {
    title: string;
    files: WorkbookFile[];
    onUpload: (file: WorkbookFile) => void;
    onFileClick: (file: WorkbookFile) => void;
    onDeleteFile: (id: string) => void;
    classificationRows?: TableRow[];
}

export default function ClassificationWorkbook({ title, files, onUpload, onFileClick, onDeleteFile, classificationRows = [] }: ClassificationWorkbookProps) {
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
