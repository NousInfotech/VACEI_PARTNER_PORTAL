import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Clock, AlertCircle, Plus, Edit2, Trash2, Check, Loader2, Upload, X, File as FileIcon, ChevronDown, ChevronUp, FileUp, Eye } from "lucide-react";
import { Skeleton } from "../../../../ui/Skeleton";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/input";
import { Textarea } from "@/ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../../ui/Dialog";
import { useAuth } from "../../../../context/auth-context-core";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostFormData } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";
import { cn } from "../../../../lib/utils";

interface DocumentRequestsViewProps {
  engagementId?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface RequestedDocumentItem {
  id: string;
  documentRequestId: string;
  documentName: string;
  isMandatory: boolean;
  status: 'PENDING' | 'UPLOADED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  files?: { id: string; file_name: string; url: string }[];
}

interface DocumentRequestItem {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  deadline: string | null;
  createdAt: string;
  requestedDocuments: RequestedDocumentItem[];
}

export default function DocumentRequestsView({ engagementId }: DocumentRequestsViewProps) {
  const { selectedService } = useAuth();
  const queryClient = useQueryClient();
  const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingToContainerId, setAddingToContainerId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<RequestedDocumentItem | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    documentName: "",
    isMandatory: false,
    title: "",
    description: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document-requests", engagementId],
    enabled: !!engagementId,
    queryFn: async () => {
      const res = await apiGet<ApiResponse<DocumentRequestItem | DocumentRequestItem[] | null>>(
        endPoints.DOCUMENT_REQUESTS,
        { engagementId } as Record<string, unknown>
      );
      if (!res?.data) return [];
      const items = Array.isArray(res.data) ? res.data : [res.data];
      return items.filter(i => !!i);
    },
  });

  const docRequests = data ?? [];
  const hasRequests = docRequests.length > 0;

  // Mutations
  const createRequestedDocMutation = useMutation({
    mutationFn: async ({ documentRequestId, payload }: { documentRequestId: string; payload: typeof formData }) => {
      return apiPost(endPoints.REQUESTED_DOCUMENTS(documentRequestId), {
        documentName: payload.documentName,
        isMandatory: payload.isMandatory
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      setIsAddModalOpen(false);
      setAddingToContainerId(null);
      setFormData({ documentName: "", isMandatory: false, title: "", description: "" });
    },
  });

  const updateRequestedDocMutation = useMutation({
    mutationFn: async ({ documentRequestId, id, payload }: { documentRequestId: string; id: string; payload: Partial<typeof formData> }) => {
      return apiPatch(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, id), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      setEditingDoc(null);
    },
  });

  const deleteRequestedDocMutation = useMutation({
    mutationFn: async ({ documentRequestId, id }: { documentRequestId: string; id: string }) => {
      return apiDelete(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      setDeletingDocId(null);
    },
  });

  const createContainerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiPost(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!) + '/document-request', {
        title: data.title || `${serviceName} Document Requests`,
        description: data.description || `Standard documents required for ${serviceName} engagement.`,
        engagementId: engagementId,
        requestedDocuments: [
          {
            documentName: data.documentName,
            isMandatory: data.isMandatory
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      setIsAddModalOpen(false);
      setFormData({ documentName: "", isMandatory: false, title: "", description: "" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, file }: { documentRequestId: string; docId: string; file: File }) => {
      const formData = new FormData();
      formData.append("files", file);
      return apiPostFormData(endPoints.REQUESTED_DOCUMENT_UPLOAD(documentRequestId, docId), formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, status }: { documentRequestId: string; docId: string; status: RequestedDocumentItem['status'] }) => {
      return apiPatch(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, docId) + '/status', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiDelete(endPoints.LIBRARY.FILE_DELETE(fileId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
    },
  });

  const handleFileUpload = (documentRequestId: string, docId: string, files: FileList | null) => {
    if (files && files.length > 0) {
      uploadMutation.mutate({ documentRequestId, docId, file: files[0] });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingToContainerId) {
      createRequestedDocMutation.mutate({ documentRequestId: addingToContainerId, payload: formData });
    } else {
      createContainerMutation.mutate(formData);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      updateRequestedDocMutation.mutate({
        documentRequestId: editingDoc.documentRequestId,
        id: editingDoc.id,
        payload: {
          documentName: formData.documentName,
          isMandatory: formData.isMandatory
        }
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedContainers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "RECEIVED" || s === "ACCEPTED") return "bg-green-100 text-green-700";
    if (s === "IN_PROGRESS" || s === "PENDING" || s === "UPLOADED") return "bg-amber-100 text-amber-700";
    if (s === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/40 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight leading-tight">
                Document Requests
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Manage {serviceName.toLowerCase()} document requests and track progress
              </p>
            </div>
          </div>
          {hasRequests && (
            <Button 
              onClick={() => {
                setFormData({ documentName: "", isMandatory: false, title: "", description: "" });
                setAddingToContainerId(null);
                setIsAddModalOpen(true);
              }}
              className="shrink-0 rounded-xl h-12 px-6 font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Request Group
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {!engagementId ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-600">
              Open an engagement from the Engagements list to see document requests.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : isError || !hasRequests ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-10 text-center">
            <FileText className="mx-auto h-14 w-14 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">No documents requested for this engagement yet.</p>
            <p className="mt-1 text-xs text-gray-500">Click below to create the first request group.</p>
            <Button 
              onClick={() => {
                setFormData({ documentName: "", isMandatory: true, title: `${serviceName} Docs`, description: "" });
                setAddingToContainerId(null);
                setIsAddModalOpen(true);
              }}
              variant="outline"
              className="mt-4 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Request Group
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {docRequests.map((req) => {
              const totalDocs = req.requestedDocuments.length;
              const uploadedDocsCount = req.requestedDocuments.filter(d => ['UPLOADED', 'ACCEPTED', 'REJECTED'].includes(d.status)).length;
              const percentage = totalDocs > 0 ? Math.round((uploadedDocsCount / totalDocs) * 100) : 0;
              const isExpanded = expandedContainers[req.id] !== false; // Default to expanded

              return (
                <div key={req.id} className="bg-white/80 border border-gray-300 rounded-xl shadow-sm hover:bg-white/70 transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl border border-orange-100">
                            {(req.title || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 font-secondary leading-tight">
                              {req.title}
                            </h4>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Document Request Container</p>
                          </div>
                        </div>
                        
                        <div className="mb-5 flex flex-wrap gap-2">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            {uploadedDocsCount}/{totalDocs} DOCUMENTS ({percentage}%)
                          </span>
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", statusStyle(req.status))}>
                            {req.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-full max-w-md h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-base font-bold text-emerald-600">
                            {percentage}%
                          </span>
                        </div>

                        {req.description && (
                          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                            {req.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setFormData({ documentName: "", isMandatory: false, title: "", description: "" });
                              setAddingToContainerId(req.id);
                              setIsAddModalOpen(true);
                            }}
                            size="sm"
                            className="rounded-xl h-10 px-4 font-bold text-xs"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Document
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleExpand(req.id)}
                            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-10 px-4 font-bold text-xs"
                          >
                            {isExpanded ? <ChevronUp size={16} className="mr-2" /> : <ChevronDown size={16} className="mr-2" />}
                            {isExpanded ? 'Hide' : 'Show'}
                          </Button>
                        </div>

                        {req.deadline && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Clock className="h-3.5 w-3.5" />
                            Due {new Date(req.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/50 border-t border-gray-100 p-6 md:p-8 animate-in slide-in-from-top-2 duration-300 space-y-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Requested Documents</h5>
                      </div>

                      <ul className="space-y-3">
                        {req.requestedDocuments.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-gray-200 transition-all hover:border-gray-300 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                  <FileUp className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{doc.documentName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", 
                                      doc.status === 'ACCEPTED' ? "bg-green-50 text-green-700 border-green-100" :
                                      doc.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100" :
                                      "bg-amber-50 text-amber-700 border-amber-100"
                                    )}>
                                      {doc.status}
                                    </span>
                                    {doc.isMandatory && (
                                      <span className="bg-orange-50 text-orange-700 border border-orange-100 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        Mandatory
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {doc.status === 'UPLOADED' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-8 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                                      onClick={() => statusUpdateMutation.mutate({ documentRequestId: req.id, docId: doc.id, status: 'ACCEPTED' })}
                                      disabled={statusUpdateMutation.isPending}
                                      title="Accept Document"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                                      onClick={() => statusUpdateMutation.mutate({ documentRequestId: req.id, docId: doc.id, status: 'REJECTED' })}
                                      disabled={statusUpdateMutation.isPending}
                                      title="Reject Document"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-400 border-gray-200 hover:text-primary hover:bg-gray-50"
                                  onClick={() => {
                                    setEditingDoc(doc);
                                    setFormData({
                                      documentName: doc.documentName,
                                      isMandatory: doc.isMandatory,
                                      title: "",
                                      description: ""
                                    });
                                  }}
                                  title="Edit Request"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-400 border-gray-200 hover:text-red-700 hover:bg-red-50 hover:border-red-100"
                                  onClick={() => setDeletingDocId(doc.id)}
                                  title="Delete Request"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="pl-13 space-y-2 mt-1">
                              {doc.files && doc.files.length > 0 && (
                                <div className="grid grid-cols-1 gap-1.5">
                                  {doc.files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100/80 text-xs text-gray-600 group/file">
                                      <div className="flex items-center gap-2 truncate">
                                        <div className="p-1 bg-white rounded border border-gray-100">
                                          <FileIcon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                                        </div>
                                        <span className="truncate font-medium">{file.file_name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => window.open(file.url, "_blank")}
                                          className="h-7 w-7 border-blue-200 hover:bg-blue-50 text-blue-600 hover:text-blue-800 p-0"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => deleteFileMutation.mutate(file.id)}
                                          className="h-7 w-7 border-yellow-200 hover:bg-yellow-50 text-yellow-600 hover:text-yellow-800 p-0"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="relative group/upload">
                                {(!doc.files || doc.files.length === 0) ? (
                                  <>
                                    <input 
                                      type="file" 
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      disabled={uploadMutation.isPending}
                                      onChange={(e) => handleFileUpload(req.id, doc.id, e.target.files)}
                                    />
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-auto text-[10px] h-7 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold uppercase"
                                      disabled={uploadMutation.isPending}
                                    >
                                      {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}
                                      Upload Document
                                    </Button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    Document Provided
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Document / Container Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addingToContainerId ? "Add Document to Request" : "New Document Request Group"}</DialogTitle>
            <DialogDescription>
              {addingToContainerId ? "Specify a new document name for this group." : "Create a new group of document requests."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            {!addingToContainerId && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Group Title</label>
                  <Input 
                    placeholder="e.g. Legal Documents, Financial Records" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                  <Textarea 
                    placeholder="Provide context for this group of requests..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">First Document Name</label>
              <Input 
                placeholder="e.g. Trade License, ID Card" 
                value={formData.documentName}
                onChange={(e) => setFormData({...formData, documentName: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isMandatory"
                className="h-4 w-4 rounded border-gray-300 text-primary"
                checked={formData.isMandatory}
                onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
              />
              <label htmlFor="isMandatory" className="text-sm font-medium text-gray-700">
                Mark as Mandatory
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestedDocMutation.isPending || createContainerMutation.isPending}>
                {(createRequestedDocMutation.isPending || createContainerMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {addingToContainerId ? "Add Document" : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Modal */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Requested Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Document Name</label>
              <Input 
                value={formData.documentName}
                onChange={(e) => setFormData({...formData, documentName: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="edit-isMandatory"
                className="h-4 w-4 rounded border-gray-300 text-primary"
                checked={formData.isMandatory}
                onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
              />
              <label htmlFor="edit-isMandatory" className="text-sm font-medium text-gray-700">
                Mark as Mandatory
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingDoc(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRequestedDocMutation.isPending}>
                {updateRequestedDocMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingDocId} onOpenChange={() => setDeletingDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDocId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                const doc = docRequests.flatMap(r => r.requestedDocuments).find(d => d.id === deletingDocId);
                if (doc) {
                  deleteRequestedDocMutation.mutate({ documentRequestId: doc.documentRequestId, id: doc.id });
                }
              }}
              disabled={deleteRequestedDocMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
