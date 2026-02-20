import { FileText, Image, Eye, Trash2, Link, UploadCloud, History, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../../../../../ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostFormData, apiDelete } from "../../../../../../config/base";
import { endPoints } from "../../../../../../config/endPoint";
import AlertMessage from "../../../../../../pages/common/AlertMessage";

interface EvidenceFile {
    id: string;
    name: string;
    type: 'PDF' | 'TXT' | 'JPG' | string;
    size: string;
    linkedFiles: number;
    fileId: string;
    url?: string;
}

interface WorkbookFile {
    id: string;
    name: string;
    version: string;
    authorId: string;
}

interface ClassificationEvidenceProps {
    classificationId?: string | null;
    engagementId?: string;
    trialBalanceId?: string;
    isLoadingClassification?: boolean;
}

interface EvidenceResponse {
    id: string;
    fileId: string;
    classificationId: string | null;
    file: {
        id: string;
        file_name: string;
        file_type: string;
        url?: string;
    };
}

interface FolderView {
    id: string;
    name: string;
    parentId: string | null;
    tags: string[];
    updatedAt: Date;
    deletedAt: Date | null;
    isDeleted: boolean;
}

interface FolderContentResponse {
    folder: FolderView;
    folders: FolderView[];
    files: any[];
}

interface LibraryFolderResponse {
    data: FolderContentResponse;
}

export default function ClassificationEvidence({ classificationId, engagementId, isLoadingClassification = false }: ClassificationEvidenceProps) {
    const queryClient = useQueryClient();
    const evidenceInputRef = useRef<HTMLInputElement>(null);
    const workbookInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

    // Get evidence folder ID for file uploads
    // The backend will auto-create the folder if it doesn't exist
    const { 
        data: evidenceFolderData, 
        isLoading: isLoadingEvidenceFolder, 
        error: evidenceFolderError,
        refetch: refetchEvidenceFolder 
    } = useQuery({
        queryKey: ['engagement-evidence-folder', engagementId],
        queryFn: async () => {
            if (!engagementId) return null;
            try {
                const response = await apiGet<LibraryFolderResponse>(endPoints.ENGAGEMENTS.EVIDENCE_FOLDER(engagementId));
                // Response structure: { data: { folder: { id, name, ... }, folders: [], files: [] } }
                const folderContent = response.data || response;
                return folderContent;
            } catch (error: any) {
                // If folder doesn't exist, backend will auto-create it on retry
                // But if there's a real error, we should handle it
                console.error('Error fetching evidence folder:', error);
                throw error;
            }
        },
        enabled: !!engagementId,
        retry: 2, // Retry twice in case folder needs to be created
        retryDelay: 1000, // Wait 1 second between retries
    });

    // Extract folder ID from the response structure
    const evidenceFolderId = evidenceFolderData?.folder?.id || (evidenceFolderData as any)?.id;

    // Fetch evidence files
    const { data: evidenceData, isLoading: isLoadingEvidence } = useQuery({
        queryKey: ['evidence', classificationId],
        queryFn: async () => {
            if (!classificationId) return { data: [] };
            const response = await apiGet<{ data: EvidenceResponse[] }>(
                endPoints.AUDIT.GET_EVIDENCES,
                { classificationId }
            );
            return response;
        },
        enabled: !!classificationId,
    });

    const evidenceFiles: EvidenceFile[] = (evidenceData?.data || []).map((ev: EvidenceResponse) => {
        const fileName = ev.file.file_name || '';
        const fileType = ev.file.file_type || '';
        const extension = fileName.split('.').pop()?.toUpperCase() || '';
        
        // Determine type
        let type: 'PDF' | 'TXT' | 'JPG' | string = extension;
        if (fileType.includes('pdf')) type = 'PDF';
        else if (fileType.includes('text') || extension === 'TXT') type = 'TXT';
        else if (fileType.includes('image') || ['JPG', 'JPEG', 'PNG'].includes(extension)) type = 'JPG';

        // Format size (we don't have file_size in the response, so we'll show a placeholder)
        const size = 'N/A';

        return {
            id: ev.id,
            name: fileName,
            type,
            size,
            linkedFiles: 0, // TODO: Get linked files count if available
            fileId: ev.fileId,
            url: ev.file.url,
        };
    });

    // Upload file and create evidence mutation
    const uploadEvidenceMutation = useMutation({
        mutationFn: async (file: File) => {
            if (!evidenceFolderId) {
                if (isLoadingEvidenceFolder) {
                    throw new Error('Evidence folder is being set up. Please try again in a moment.');
                }
                if (evidenceFolderError) {
                    throw new Error(`Failed to access evidence folder: ${evidenceFolderError.message || 'Unknown error'}`);
                }
                throw new Error('Evidence folder not found. Please refresh the page and try again.');
            }
            if (!classificationId) {
                throw new Error('Classification ID is required');
            }

            // Step 1: Upload file to evidence folder
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', evidenceFolderId);

            const uploadResponse = await apiPostFormData<{ data: { id: string; file_name: string; url: string } }>(
                endPoints.LIBRARY.FILE_UPLOAD,
                formData
            );

            const uploadedFile = uploadResponse.data || uploadResponse;
            const fileId = uploadedFile.id;

            // Step 2: Create evidence record
            const evidenceResponse = await apiPost<{ data: EvidenceResponse }>(
                endPoints.AUDIT.CREATE_EVIDENCE,
                {
                    fileId,
                    classificationId,
                }
            );

            return evidenceResponse.data || evidenceResponse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', classificationId] });
            setAlert({ type: 'success', message: 'Evidence file uploaded successfully' });
            setTimeout(() => setAlert(null), 3000);
        },
        onError: (error: any) => {
            setAlert({ type: 'danger', message: error?.message || 'Failed to upload evidence file' });
            setTimeout(() => setAlert(null), 5000);
        },
    });

    // Delete evidence mutation
    const deleteEvidenceMutation = useMutation({
        mutationFn: async (evidenceId: string) => {
            await apiDelete(endPoints.AUDIT.DELETE_EVIDENCE(evidenceId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evidence', classificationId] });
            setAlert({ type: 'success', message: 'Evidence file deleted successfully' });
            setTimeout(() => setAlert(null), 3000);
        },
        onError: (error: any) => {
            setAlert({ type: 'danger', message: error?.message || 'Failed to delete evidence file' });
            setTimeout(() => setAlert(null), 5000);
        },
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            // Upload files one by one
            for (let i = 0; i < files.length; i++) {
                await uploadEvidenceMutation.mutateAsync(files[i]);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            setUploading(false);
            // Reset input
            if (evidenceInputRef.current) {
                evidenceInputRef.current.value = '';
            }
        }
    };

    const handleDeleteEvidence = (evidenceId: string) => {
        if (window.confirm('Are you sure you want to delete this evidence file?')) {
            deleteEvidenceMutation.mutate(evidenceId);
        }
    };

    const handleViewFile = (url?: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            setAlert({ type: 'danger', message: 'File URL is not available. Please try refreshing the page.' });
            setTimeout(() => setAlert(null), 5000);
        }
    };

    const workbooks: WorkbookFile[] = [
        { id: '1', name: 'Unique Ltd.xlsx', version: 'v1', authorId: '00ec57eb-ceb7-485d-8449-e0b9574e01e7' },
        { id: '2', name: 'Book2.xlsx', version: 'v1', authorId: '00ec57eb-ceb7-485d-8449-e0b9574e01e7' },
    ];

    return (
        <div className="space-y-8">
            {alert && (
                <AlertMessage
                    variant={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* EVIDENCE SECTION */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Evidence</h2>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Upload Evidence Files</h3>
                            <p className="text-xs text-gray-500 mt-1">Upload supporting documents, images, and other evidence files</p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        className={`border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors ${
                            uploading || !classificationId || isLoadingClassification || isLoadingEvidenceFolder || !evidenceFolderId
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !uploading && classificationId && !isLoadingClassification && !isLoadingEvidenceFolder && evidenceFolderId && evidenceInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={evidenceInputRef}
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg,.txt"
                            onChange={handleFileUpload}
                            disabled={uploading || !classificationId || isLoadingClassification || isLoadingEvidenceFolder || !evidenceFolderId}
                        />
                        <div className="bg-blue-50 p-3 rounded-full mb-3">
                            {uploading || isLoadingClassification || isLoadingEvidenceFolder ? (
                                <Loader2 className="text-blue-500 animate-spin" size={24} />
                            ) : (
                                <UploadCloud className="text-blue-500" size={24} />
                            )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {uploading 
                                ? 'Uploading...' 
                                : isLoadingClassification 
                                    ? 'Setting up classification...' 
                                    : isLoadingEvidenceFolder
                                        ? 'Setting up evidence folder...'
                                        : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG, TXT up to 10MB</p>
                        {!classificationId && !isLoadingClassification && (
                            <p className="text-xs text-red-500 mt-2">Classification ID is required</p>
                        )}
                        {isLoadingClassification && (
                            <p className="text-xs text-blue-500 mt-2">Creating classification...</p>
                        )}
                        {isLoadingEvidenceFolder && (
                            <p className="text-xs text-blue-500 mt-2">Setting up evidence folder...</p>
                        )}
                        {!evidenceFolderId && !isLoadingEvidenceFolder && classificationId && (
                            <div className="flex flex-col items-center gap-2 mt-2">
                                <p className="text-xs text-yellow-500">Evidence folder not available.</p>
                                <button
                                    onClick={() => refetchEvidenceFolder()}
                                    disabled={isLoadingEvidenceFolder}
                                    className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1 disabled:opacity-50"
                                >
                                    <RefreshCw size={12} className={isLoadingEvidenceFolder ? 'animate-spin' : ''} />
                                    Retry
                                </button>
                            </div>
                        )}
                        {evidenceFolderError && !isLoadingEvidenceFolder && (
                            <p className="text-xs text-red-500 mt-2">
                                Error: {evidenceFolderError instanceof Error ? evidenceFolderError.message : 'Failed to load evidence folder'}
                            </p>
                        )}
                    </div>

                    {/* Evidence Files List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">EVIDENCE FILES</h4>
                        {isLoadingEvidence ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-600">Loading evidence files...</span>
                            </div>
                        ) : evidenceFiles.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No evidence files uploaded yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {evidenceFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${
                                                file.type === 'PDF' ? 'bg-red-100 text-red-600' :
                                                file.type === 'TXT' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {file.type === 'PDF' ? <FileText size={20} /> : file.type === 'TXT' ? <FileText size={20} /> : <Image size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        file.type === 'PDF' ? 'bg-red-100 text-red-700' :
                                                        file.type === 'TXT' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {file.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">{file.size}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-gray-600 hover:text-blue-600"
                                                onClick={() => handleViewFile(file.url)}
                                                title="View file"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteEvidence(file.id)}
                                                title="Delete evidence"
                                                disabled={deleteEvidenceMutation.isPending}
                                            >
                                                {deleteEvidenceMutation.isPending ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* WORKBOOKS SECTION */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Linked Workbooks</h2>
                    <Button variant="outline" className="gap-2 text-xs">
                        <History size={14} />
                        View All Workbook History
                    </Button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900">Audit Work Book</h3>
                        <div
                            className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer mb-8"
                            onClick={() => workbookInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                className="hidden"
                                ref={workbookInputRef}
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => console.log(e.target.files)}
                            />
                            <div className="bg-green-50 p-3 rounded-full mb-3">
                                <FileSpreadsheet className="text-green-600" size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Click to upload workbook</p>
                            <p className="text-xs text-gray-500 mt-1">Add a new Excel file to start mapping</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">RECENT WORKBOOKS</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workbooks.map((wb) => (
                                <div key={wb.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded text-green-700">
                                                <FileSpreadsheet size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{wb.name}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 break-all">
                                                    {wb.version} by {wb.authorId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-200">
                                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Link size={12} />
                                            Link to File
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs gap-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 size={12} />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
