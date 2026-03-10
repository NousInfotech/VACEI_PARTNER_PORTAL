import React, { useRef, useState, useEffect } from "react";
import { Eye, Download, FileText, Upload, Trash2, Edit2, Check, X, Loader2, Plus, FileEdit } from "lucide-react";
import { downloadFile } from "../../../../../utils/downloadUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';
import type { DocumentRequestDocumentSingle } from "./types";
import { Button } from "../../../../../ui/Button";
import { Badge } from "@/ui/badge";
import { apiPostFormData, apiDelete, apiPatch } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import AddRequestedDocumentModal from "./AddRequestedDocumentModal";
import { ConfirmModal } from "../../../../messages/components/ConfirmModal";

interface DocumentRequestSingleProps {
  requestId: string;
  documents: DocumentRequestDocumentSingle[];
  isDisabled?: boolean;
}

const DocumentRequestSingle: React.FC<DocumentRequestSingleProps> = ({
  requestId,
  documents,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });




  const uploadMutation = useMutation({
    mutationFn: ({ docId, file }: { docId: string; file: File }) => {
      const fd = new FormData();
      fd.append("files", file);
      return apiPostFormData(endPoints.DOCUMENT_REQUESTS.UPLOAD(requestId, docId), fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success('Document uploaded successfully!');
      setUploadingDocId(null);
    },
    onError: (error: any) => {
      toast.error('Upload failed', { description: error?.response?.data?.message || error?.message });
      setUploadingDocId(null);
    },
  });

  const clearMutation = useMutation({
    mutationFn: (docId: string) => apiPatch(endPoints.DOCUMENT_REQUESTS.CLEAR(requestId, docId), { reason: "Cleared by admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success('Submission cleared.');
    },
    onError: (error: any) => {
      toast.error('Failed to clear submission', { description: error?.response?.data?.message || error?.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => apiDelete(endPoints.DOCUMENT_REQUESTS.DELETE(requestId, docId), { reason: "Removed by admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success('Document request deleted.');
    },
    onError: (error: any) => {
      toast.error('Failed to delete request', { description: error?.response?.data?.message || error?.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ docId, name }: { docId: string; name: string }) => 
      apiPatch(endPoints.DOCUMENT_REQUESTS.UPDATE(requestId, docId), { documentName: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success('Document name updated.');
      setEditingDocId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update name', { description: error?.response?.data?.message || error?.message });
    },
  });

  const isAnyActionLoading = uploadMutation.isPending || clearMutation.isPending || deleteMutation.isPending || updateMutation.isPending;


  const updateStatusMutation = useMutation({
    mutationFn: ({ docId, status, reason }: { docId: string; status: string; reason?: string }) => 
      apiPatch(endPoints.DOCUMENT_REQUESTS.STATUS(docId), { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success(`Document ${variables.status.toLowerCase()} successfully.`);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    },
    onError: (error: any) => {
      toast.error('Failed to update status', { description: error?.response?.data?.message || error?.message });
    },
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const rejectionReasonRef = useRef("");

  useEffect(() => {
    rejectionReasonRef.current = rejectionReason;
  }, [rejectionReason]);

  const handleDownload = (url: string, fileName: string) => {
    downloadFile(url, fileName);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingDocId(docId);
      uploadMutation.mutate({ docId, file });
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-end mb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
            disabled={isAnyActionLoading}
            className="rounded-xl border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-[10px] uppercase font-bold tracking-widest px-4 h-8"
          >
            <Plus className="mr-1.5 w-3 h-3" />
            Add Document
          </Button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" />

        {documents.map((doc, docIndex) => {
          const docId = doc._id!;
          const docType = typeof doc.type === "string" ? doc.type : (doc.type as { type?: string })?.type ?? "direct";
          const isTemplate = docType.toLowerCase() === "template";
          const isEditing = editingDocId === docId;

          return (
            <div key={docId ?? docIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 transition-all duration-300">
              <div className="flex items-center gap-3 flex-1">
                {isTemplate ? (
                  <FileEdit className="h-5 w-5 text-gray-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-600" />
                )}
                <div className="space-y-1 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm font-bold text-gray-900 border-b border-primary outline-none bg-transparent py-0.5 flex-1"
                        autoFocus
                      />
                      <button 
                        onClick={() => updateMutation.mutate({ docId, name: editName })} 
                        disabled={isAnyActionLoading}
                        className="text-green-500 p-1 disabled:opacity-50"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingDocId(null)} 
                        disabled={isAnyActionLoading}
                        className="text-red-500 p-1 disabled:opacity-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <p className="font-medium text-gray-900 leading-none">{doc.name}</p>
                      <button 
                        onClick={() => { setEditingDocId(docId); setEditName(doc.name); }} 
                        disabled={isAnyActionLoading}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-primary disabled:opacity-0"
                        title="Edit Name"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                  
                  {doc.description && (
                    <p className="text-xs text-gray-600">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50 capitalize text-[10px] p-2 rounded-[10px]">
                      {isTemplate ? "Template" : "Direct"}
                    </Badge>
                    <Badge variant="outline" className={doc.status?.toLowerCase() === 'rejected' ? "text-rose-600 border-rose-300 bg-rose-50 text-[10px] p-2 rounded-[10px]" : doc.status?.toLowerCase() === 'accepted' || doc.status?.toLowerCase() === 'verified' ? "text-green-700 border-green-300 bg-green-50 text-[10px] p-2 rounded-[10px]" : "text-gray-600 border-gray-300 text-[10px] p-2 rounded-[10px]"}>
                      {doc.status?.toLowerCase() === 'verified' ? 'Approved' : doc.status?.toLowerCase() === 'accepted' ? 'Accepted' : doc.status?.toLowerCase() === 'rejected' ? 'Rejected' : doc.url ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>
                  {doc.status?.toLowerCase() === 'rejected' && doc.rejectionReason && (
                    <div className="mt-2 text-xs bg-rose-50 text-rose-700 p-2 rounded-lg border border-rose-100 flex items-start gap-2">
                      <span className="font-bold shrink-0">Reason:</span>
                      <span>{doc.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Template download button */}
                {isTemplate && doc.template?.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.template!.url, `template_${doc.name}`)}
                    disabled={isAnyActionLoading}
                    className="border-amber-300 text-amber-700 hover:bg-amber-700/20 hover:text-amber-700 h-10 w-10 p-0"
                    title="Download Template"
                  >
                    <Download size={20} />
                  </Button>
                )}

                {!doc.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.onchange = (e) => onFileChange(e as any, docId);
                      input.click();
                    }}
                    disabled={isAnyActionLoading || uploadingDocId === docId}
                    className="border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700 h-10 px-4"
                    title="Upload Document"
                  >
                    {uploadingDocId === docId ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Upload size={16} className="mr-2" />
                    )}
                    Upload
                  </Button>
                )}

                {doc.url && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.url!, "_blank")}
                      disabled={isAnyActionLoading}
                      className="border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700 h-10 w-10 p-0"
                      title="View Submitted"
                    >
                      <Eye size={20} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc.url!, doc.name)}
                      disabled={isAnyActionLoading}
                      className="border-green-300 hover:bg-green-50 hover:text-green-800 text-green-700 h-10 w-10 p-0"
                      title="Download Submitted"
                    >
                      <Download size={20} />
                    </Button>
                    
                    {doc.status?.toLowerCase() !== 'verified' && doc.status?.toLowerCase() !== 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ docId, status: 'ACCEPTED' })}
                        disabled={isAnyActionLoading || updateStatusMutation.isPending}
                        className="border-green-300 text-green-600 hover:bg-green-50 h-10 w-10 p-0"
                        title="Accept Document"
                      >
                        {updateStatusMutation.isPending ? (
                          <span className="text-[9px] font-bold">...</span>
                        ) : (
                          <Check size={20} />
                        )}
                      </Button>
                    )}

                    {doc.status?.toLowerCase() !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectionReason("");
                          setConfirmConfig({
                            isOpen: true,
                            title: "Reject Document",
                            message: `Please provide a reason for rejecting "${doc.name}":`,
                            onConfirm: () => {
                              if (!rejectionReasonRef.current.trim()) {
                                toast.error("Please enter a rejection reason");
                                return;
                              }
                              updateStatusMutation.mutate({ docId, status: 'REJECTED', reason: rejectionReasonRef.current });
                            },
                            variant: 'danger'
                          });
                        }}
                        disabled={isAnyActionLoading}
                        className="border-rose-300 text-rose-600 hover:bg-rose-50 h-10 w-10 p-0"
                        title="Reject Document"
                      >
                        <X size={20} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmConfig({
                        isOpen: true,
                        title: "Clear Submission",
                        message: `Are you sure you want to clear the submission for "${doc.name}"? This action cannot be undone.`,
                        onConfirm: () => {
                          clearMutation.mutate(docId);
                          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                        },
                        variant: 'primary'
                      })}
                      disabled={isAnyActionLoading}
                      className="border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800 text-yellow-700 h-10 px-3 text-[10px] font-bold uppercase tracking-wider"
                      title="Clear Submission"
                    >
                      Clear
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmConfig({
                    isOpen: true,
                    title: "Delete Request",
                    message: `Are you sure you want to delete the document request for "${doc.name}"? This action cannot be undone.`,
                    onConfirm: () => {
                      deleteMutation.mutate(docId);
                      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    },
                    variant: 'danger'
                  })}
                  disabled={isAnyActionLoading}
                  className="h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-50 ml-1"
                  title="Delete Request"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AddRequestedDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        documentRequestId={requestId}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={
          <div className="space-y-3">
            <p className="text-gray-500">{confirmConfig.message}</p>
            {confirmConfig.title === "Reject Document" && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none bg-gray-50/50"
                autoFocus
              />
            )}
          </div>
        }
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
        confirmLabel="Proceed"
      />
    </>
  );
};


export default DocumentRequestSingle;
