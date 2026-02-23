import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "../../../../../../ui/Button";
import { useWorkbooks } from "../../hooks/useWorkbooks";

interface LinkedWorkbooksCardProps {
    engagementId?: string;
    classification?: string; // Classification string (label)
    classificationId?: string; // Classification ID (UUID)
}

export default function LinkedWorkbooksCard({ engagementId, classification, classificationId }: LinkedWorkbooksCardProps) {
    const { workbooks, isLoading } = useWorkbooks(engagementId, classification || undefined);

    const handleWorkbookClick = (workbookId: string) => {
        const params = new URLSearchParams();
        if (engagementId) params.set('engagementId', engagementId);
        if (classification) params.set('classification', classification);
        if (classificationId) params.set('classificationId', classificationId);
        const url = `/workbook-viewer/${workbookId}?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Audit Work Book</h3>
                        {workbooks.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">{workbooks.length} workbook{workbooks.length !== 1 ? 's' : ''} linked</p>
                        )}
                    </div>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300">
                    View All Workbook History
                </Button>
            </div>
            
            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading workbooks...</span>
                </div>
            ) : workbooks.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                    No workbooks linked to this classification yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {workbooks.slice(0, 3).map((workbook) => (
                        <div
                            key={workbook.id}
                            onClick={() => handleWorkbookClick(workbook.id)}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-blue-50/30 hover:border-blue-200 transition-all"
                        >
                            <FileSpreadsheet size={16} className="text-blue-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{workbook.name}</p>
                                {workbook.category && (
                                    <p className="text-xs text-gray-500 mt-0.5">{workbook.category}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {workbooks.length > 3 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                            +{workbooks.length - 3} more workbook{workbooks.length - 3 !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
