import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Clock, Trash2, Loader2, Eye } from "lucide-react";
import { useWorkbooks, useUploadWorkbook, useDeleteWorkbook } from "../../hooks/useWorkbooks";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../../../config/base";
import { endPoints } from "../../../../../../config/endPoint";
import AlertMessage from "../../../../../../pages/common/AlertMessage";

interface UploadWorkbookCardProps {
    engagementId?: string;
    classification?: string; // Classification string (label)
    classificationId?: string; // Classification ID (UUID) for evidence creation
}

interface LibraryFolderResponse {
    data: {
        folder: {
            id: string;
        };
    };
}

export default function UploadWorkbookCard({ engagementId, classification, classificationId }: UploadWorkbookCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
    
    const { workbooks, isLoading: isLoadingWorkbooks, refetch } = useWorkbooks(engagementId, classification || undefined);
    const uploadWorkbook = useUploadWorkbook();
    const deleteWorkbook = useDeleteWorkbook();

    // Get workbook folder ID for file uploads
    const { 
        data: workbookFolderData, 
        isLoading: isLoadingWorkbookFolder 
    } = useQuery({
        queryKey: ['engagement-workbook-folder', engagementId],
        queryFn: async () => {
            if (!engagementId) return null;
            try {
                const response = await apiGet<LibraryFolderResponse>(endPoints.ENGAGEMENTS.WORKBOOK_FOLDER(engagementId));
                const folderContent = response.data || response;
                return folderContent;
            } catch (error: any) {
                console.error('Error fetching workbook folder:', error);
                throw error;
            }
        },
        enabled: !!engagementId,
        retry: 2,
        retryDelay: 1000,
    });

    const workbookFolderId = workbookFolderData?.folder?.id || (workbookFolderData as any)?.id;

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!engagementId) {
            setAlert({ type: 'danger', message: 'Engagement ID is required' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }

        if (!workbookFolderId) {
            setAlert({ type: 'danger', message: 'Workbook folder not available. Please refresh the page.' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }

        try {
            setUploading(true);
            setAlert(null);

            await uploadWorkbook.mutateAsync({
                file,
                engagementId,
                classification: classification || null,
                folderId: workbookFolderId,
                category: 'workbook',
            });

            setAlert({ type: 'success', message: 'Workbook uploaded successfully' });
            setTimeout(() => setAlert(null), 3000);
            refetch();
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Error uploading workbook:', error);
            setAlert({ 
                type: 'danger', 
                message: error?.message || 'Failed to upload workbook' 
            });
            setTimeout(() => setAlert(null), 3000);
        } finally {
            setUploading(false);
        }
    };

    const handleUploadClick = () => {
        if (!engagementId || !workbookFolderId || uploading) return;
        fileInputRef.current?.click();
    };

    const handleViewFile = (workbook: any) => {
        const params = new URLSearchParams();
        if (engagementId) params.set('engagementId', engagementId);
        if (classification) params.set('classification', classification);
        if (classificationId) params.set('classificationId', classificationId);
        const url = `/workbook-viewer/${workbook.id}?${params.toString()}`;
        window.open(url, '_blank');
    };

    const handleDelete = async (workbookId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this workbook?')) return;

        try {
            await deleteWorkbook.mutateAsync(workbookId);
            setAlert({ type: 'success', message: 'Workbook deleted successfully' });
            setTimeout(() => setAlert(null), 3000);
            refetch();
        } catch (error: any) {
            console.error('Error deleting workbook:', error);
            setAlert({ 
                type: 'danger', 
                message: error?.message || 'Failed to delete workbook' 
            });
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };


    return (
        <div className="space-y-6">
            {alert && (
                <AlertMessage
                    message={alert.message}
                    variant={alert.type}
                    duration={3000}
                />
            )}

            {/* Upload Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UploadCloud size={20} className="text-gray-900" />
                        Upload Workbook
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Add a new Excel file to start mapping.</p>
                </div>

                <div
                    onClick={handleUploadClick}
                    className={`border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors ${
                        uploading || !engagementId || isLoadingWorkbookFolder || !workbookFolderId
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        disabled={uploading || !engagementId || isLoadingWorkbookFolder || !workbookFolderId}
                    />
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        {uploading || isLoadingWorkbookFolder ? (
                            <Loader2 size={32} className="text-gray-400 animate-spin" />
                        ) : (
                            <UploadCloud size={32} className="text-gray-400" />
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                        {uploading 
                            ? 'Uploading...' 
                            : isLoadingWorkbookFolder
                                ? 'Setting up folder...'
                                : 'Drag & drop an .xlsx file here, or'}
                    </p>
                    {!uploading && !isLoadingWorkbookFolder && (
                        <button className="text-sm font-semibold text-gray-900 hover:underline">
                            Browse Files
                        </button>
                    )}
                    {!engagementId && (
                        <p className="text-xs text-red-500 mt-2">Engagement ID is required</p>
                    )}
                    {!workbookFolderId && !isLoadingWorkbookFolder && engagementId && (
                        <p className="text-xs text-yellow-500 mt-2">Workbook folder not available</p>
                    )}
                </div>
            </div>

            {/* Recent Workbooks Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Workbooks</h3>
                {isLoadingWorkbooks ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <p className="ml-2 text-sm text-gray-500">Loading workbooks...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workbooks.map((workbook) => (
                            <div
                                key={workbook.id}
                                onClick={() => handleViewFile(workbook)}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-pointer hover:bg-blue-50/30"
                            >
                                <div className="p-3 bg-white border border-gray-200 rounded-lg text-green-600">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{workbook.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Uploaded {formatDate(workbook.createdAt)}
                                    </p>
                                </div>

                                {/* Meta & Actions */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                        <Clock size={12} />
                                        <span>{formatDate(workbook.updatedAt)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewFile(workbook);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                                            title="View File"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(workbook.id, e)}
                                            disabled={deleteWorkbook.isPending}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deleteWorkbook.isPending ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {workbooks.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No workbooks uploaded yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
