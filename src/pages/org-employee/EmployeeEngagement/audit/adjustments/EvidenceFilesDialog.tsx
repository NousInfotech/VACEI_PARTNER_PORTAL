import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostFormData, apiDelete } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import { Trash2, ExternalLink, Loader2, FileText } from "lucide-react";

export interface EvidenceItem {
    id: string;
    fileId: string;
    file?: {
        id: string;
        file_name: string;
        file_type?: string;
        url?: string;
    };
}

interface EvidenceFilesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    auditEntryId: string;
    entryCode: string;
    engagementId: string | undefined;
    entityLabel: "Adjustment" | "Reclassification";
    onEvidenceChange?: () => void;
}

interface LibraryFolderResponse {
    data?: { folder?: { id: string }; id?: string };
    folder?: { id: string };
    id?: string;
}

export default function EvidenceFilesDialog({
    open,
    onOpenChange,
    auditEntryId,
    entryCode,
    engagementId,
    entityLabel,
    onEvidenceChange,
}: EvidenceFilesDialogProps) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const evidenceFolderQuery = useQuery({
        queryKey: ["engagement-evidence-folder", engagementId],
        queryFn: async () => {
            if (!engagementId) return null;
            const response = await apiGet<LibraryFolderResponse>(
                endPoints.ENGAGEMENTS.EVIDENCE_FOLDER(engagementId)
            );
            return response;
        },
        enabled: !!engagementId && open,
    });

    const evidenceFolderId =
        evidenceFolderQuery.data?.folder?.id ||
        (evidenceFolderQuery.data as any)?.data?.folder?.id ||
        (evidenceFolderQuery.data as any)?.id;

    const evidencesQuery = useQuery({
        queryKey: ["evidences", "audit-entry", auditEntryId],
        queryFn: async () => {
            const response = await apiGet<{ data: EvidenceItem[] }>(
                endPoints.AUDIT.GET_EVIDENCES,
                { auditEntryId }
            );
            const data = (response as any)?.data ?? response;
            return Array.isArray(data) ? data : [];
        },
        enabled: !!auditEntryId && open,
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            if (!evidenceFolderId || !auditEntryId) {
                throw new Error("Evidence folder or audit entry not available");
            }
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folderId", evidenceFolderId);

            const uploadResponse = await apiPostFormData<{
                data: { id: string; file_name: string; url: string };
            }>(endPoints.LIBRARY.FILE_UPLOAD, formData);

            const uploadedFile = (uploadResponse as any)?.data ?? uploadResponse;
            const fileId = uploadedFile.id;

            await apiPost(endPoints.AUDIT.CREATE_EVIDENCE, {
                fileId,
                auditEntryId,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["evidences", "audit-entry", auditEntryId],
            });
            queryClient.invalidateQueries({ queryKey: ["audit-entries"] });
            onEvidenceChange?.();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (evidenceId: string) => {
            await apiDelete(endPoints.AUDIT.DELETE_EVIDENCE(evidenceId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["evidences", "audit-entry", auditEntryId],
            });
            queryClient.invalidateQueries({ queryKey: ["audit-entries"] });
            onEvidenceChange?.();
        },
    });

    const evidences: EvidenceItem[] = evidencesQuery.data ?? [];
    const isLoading = evidencesQuery.isLoading;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await uploadMutation.mutateAsync(file);
            e.target.value = "";
        } catch (err: any) {
            console.error("Upload failed:", err);
            alert(err?.message ?? "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (evidenceId: string) => {
        if (!window.confirm("Remove this evidence file?")) return;
        deleteMutation.mutate(evidenceId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage attached files</DialogTitle>
                    <DialogDescription>
                        Upload and manage evidence files for {entityLabel} {entryCode}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {engagementId && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Upload evidence file
                            </label>
                            <input
                                type="file"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                onChange={handleFileSelect}
                                disabled={
                                    uploading ||
                                    !evidenceFolderId ||
                                    uploadMutation.isPending
                                }
                            />
                            {(uploading || uploadMutation.isPending) && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Uploading...
                                </p>
                            )}
                            {!evidenceFolderId && evidenceFolderQuery.isSuccess && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Evidence folder not available. Please try again later.
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            Linked files
                        </label>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-gray-500 py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : evidences.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {evidences.map((ev) => {
                                    const name =
                                        ev.file?.file_name ?? ev.id;
                                    const url = ev.file?.url;
                                    return (
                                        <div
                                            key={ev.id}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50/50"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                {url && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                window.open(url, "_blank")
                                                            }
                                                            title="Open in new tab"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemove(ev.id)}
                                                    disabled={deleteMutation.isPending}
                                                    title="Remove file"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 py-4">
                                No evidence files linked
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
