import React, { useState, useEffect, useRef } from "react";
import { Eye, Download, Upload, Trash2, Edit2, Check, X, Loader2, FileEdit, FileUp } from "lucide-react";
import { downloadFile } from "../../../../../utils/downloadUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';
import type { DocumentRequestDocumentMultiple } from "./types";
import { Badge } from "@/ui/badge";
import { Button } from "../../../../../ui/Button";
import { apiPostFormData, apiDelete, apiPatch } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import { ConfirmModal } from "../../../../messages/components/ConfirmModal";


interface DocumentRequestMultipleProps {
  requestId: string;
  multipleDocuments: DocumentRequestDocumentMultiple[];
  isDisabled?: boolean;
}

const DocumentRequestDouble: React.FC<DocumentRequestMultipleProps> = ({
  requestId,
  multipleDocuments,
}) => {
  const queryClient = useQueryClient();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
      toast.success('Document deleted.');
    },
    onError: (error: any) => {
      toast.error('Failed to delete', { description: error?.response?.data?.message || error?.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ docId, name }: { docId: string; name: string }) => 
      apiPatch(endPoints.DOCUMENT_REQUESTS.UPDATE(requestId, docId), { documentName: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      toast.success('Name updated.');
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

  if (!multipleDocuments || multipleDocuments.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      {multipleDocuments.map((group) => {
        const groupId = group._id;
        const groupType = typeof group.type === "string" ? group.type : (group.type as { type?: string })?.type ?? "direct";
        const isTemplate = groupType.toLowerCase() === "template";
        const isEditingGroup = editingDocId === groupId;

        return (
          <div key={groupId} className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {isTemplate ? (
                  <FileEdit className="h-5 w-5 text-gray-600 mt-1" />
                ) : (
                  <FileUp className="h-5 w-5 text-gray-600 mt-1" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isEditingGroup ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm font-bold text-gray-900 border-b border-primary outline-none bg-transparent py-0.5 flex-1"
                          autoFocus
                        />
                        <button 
                          onClick={() => updateMutation.mutate({ docId: groupId, name: editName })} 
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
                      <div className="flex items-center gap-2 group/title">
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <button 
                          onClick={() => { setEditingDocId(groupId); setEditName(group.name); }} 
                          disabled={isAnyActionLoading}
                          className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 text-gray-400 hover:text-primary disabled:opacity-0"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <Badge variant="outline" className="text-gray-600 p-2 rounded-[10px] border-gray-300 bg-gray-50 capitalize text-[10px]">
                      {isTemplate ? "Template" : "Direct"}
                    </Badge>
                  </div>
                  {group.instruction && (
                    <p className="text-xs text-gray-600">{group.instruction}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isTemplate && (group as any).template?.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload((group as any).template.url, `template_${group.name}`)}
                    disabled={isAnyActionLoading}
                    className="border-amber-300 text-amber-700 hover:bg-amber-700/20 hover:text-amber-700 h-10 w-10 p-0"
                    title="Download Group Template"
                  >
                    <Download size={20} />
                  </Button>
                )}
                

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmConfig({
                    isOpen: true,
                    title: "Delete Group",
                    message: `Are you sure you want to delete the entire document group "${group.name}"? This action cannot be undone.`,
                    onConfirm: () => {
                      deleteMutation.mutate(groupId!);
                      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    },
                    variant: 'danger'
                  })}
                  disabled={isAnyActionLoading}
                  className="h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-50"
                  title="Delete Group"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>

            {group.multiple && group.multiple.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {group.multiple.map((item, index) => {
                  const itemId = item._id || `${groupId}-${index}`;
                  const isEditingItem = editingDocId === itemId;

                  return (
                    <div key={itemId} className="flex items-center justify-between gap-3 border border-gray-400 p-3 rounded-md">
                      <div className="flex-1">
                        {isEditingItem ? (
                          <div className="flex items-center gap-2">
                            <input 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="text-sm font-bold text-gray-700 border-b border-primary outline-none bg-transparent py-0.5 flex-1"
                              autoFocus
                            />
                            <button 
                              onClick={() => updateMutation.mutate({ docId: itemId, name: editName })} 
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
                          <div className="flex items-center gap-2 group/item">
                            <p className="text-md font-medium text-gray-900">{item.label}</p>
                            <button 
                              onClick={() => { setEditingDocId(itemId); setEditName(item.label); }} 
                              disabled={isAnyActionLoading}
                              className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 text-gray-400 hover:text-primary disabled:opacity-0"
                              title="Edit Label"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Badge variant="outline" className={item.status?.toLowerCase() === 'rejected' ? "text-rose-600 border-rose-300 bg-rose-50 text-[10px] p-2 rounded-[10px]" : item.status?.toLowerCase() === 'accepted' || item.status?.toLowerCase() === 'verified' ? "text-green-700 border-green-300 bg-green-50 text-[10px] p-2 rounded-[10px]" : "text-gray-600 border-gray-300 text-[10px] p-2 rounded-[10px]"}>
                            {item.status?.toLowerCase() === 'verified' ? 'Approved' : item.status?.toLowerCase() === 'accepted' ? 'Accepted' : item.status?.toLowerCase() === 'rejected' ? 'Rejected' : item.url ? 'Submitted' : 'Pending'}
                          </Badge>
                        </div>
                        {item.status?.toLowerCase() === 'rejected' && item.rejectionReason && (
                          <div className="mt-2 text-[10px] bg-rose-50 text-rose-700 p-2 rounded-lg border border-rose-100 flex items-start gap-2">
                             <span className="font-bold shrink-0">Reason:</span>
                             <span>{item.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isTemplate && item.template?.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(item.template!.url!, `template_${item.label}`)}
                            disabled={isAnyActionLoading}
                            className="border-amber-300 text-amber-700 hover:bg-amber-700/20 hover:text-amber-700 h-10 w-10 p-0"
                            title="Download Template"
                          >
                            <Download size={20} />
                          </Button>
                        )}

                        {!item.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.onchange = (e) => onFileChange(e as any, itemId);
                              input.click();
                            }}
                            disabled={isAnyActionLoading || uploadingDocId === itemId}
                            className="border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700 h-10 px-4"
                            title="Upload Document"
                          >
                            {uploadingDocId === itemId ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <>
                                <Upload size={20} className="mr-1.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                              </>
                            )}
                          </Button>
                        )}

                        {item.url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(item.url!, "_blank")}
                              disabled={isAnyActionLoading}
                              className="border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700 h-10 w-10 p-0"
                              title="View Submitted"
                            >
                              <Eye size={20} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(item.url!, item.label || 'document')}
                              disabled={isAnyActionLoading}
                              className="border-green-300 hover:bg-green-50 hover:text-green-800 text-green-700 h-10 w-10 p-0"
                              title="Download Submitted"
                            >
                              <Download size={20} />
                            </Button>

                            {item.status?.toLowerCase() !== 'verified' && item.status?.toLowerCase() !== 'accepted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ docId: itemId, status: 'ACCEPTED' })}
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

                            {item.status?.toLowerCase() !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectionReason("");
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: "Reject Document",
                                    message: `Please provide a reason for rejecting "${item.label}":`,
                                    onConfirm: () => {
                                      if (!rejectionReasonRef.current.trim()) {
                                        toast.error("Please enter a rejection reason");
                                        return;
                                      }
                                      updateStatusMutation.mutate({ docId: itemId, status: 'REJECTED', reason: rejectionReasonRef.current });
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
                                message: `Are you sure you want to clear the submission for "${item.label}"? This action cannot be undone.`,
                                onConfirm: () => {
                                  clearMutation.mutate(itemId);
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
                            title: "Delete Label",
                            message: `Are you sure you want to delete the document label "${item.label}"? This action cannot be undone.`,
                            onConfirm: () => {
                              deleteMutation.mutate(itemId);
                              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                            },
                            variant: 'danger'
                          })}
                          disabled={isAnyActionLoading}
                          className="h-10 w-10 p-0 rounded-xl text-red-500 hover:bg-red-50 ml-1"
                          title="Delete Label"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}


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
    </div>
  );
};

export default DocumentRequestDouble;
