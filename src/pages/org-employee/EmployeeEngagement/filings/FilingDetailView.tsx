import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  File as FileIcon, 
  Download, 
  ExternalLink,
  MessageSquare,
  User,
  Send,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  CornerDownRight,
  X,
  Paperclip,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/input";
import { Checkbox } from "../../../../ui/checkbox";
import { cn } from "../../../../lib/utils";
import { filingService, FilingStatus } from "../../../../api/filingService";
import PageHeader from "../../../common/PageHeader";
import { Skeleton } from "../../../../ui/Skeleton";
import { useAuth } from "../../../../context/auth-context-core";
import { ActionConfirmModal } from "../components/ActionConfirmModal";
import { DocumentRequestsProvider, useDocumentRequests } from "../document-requests/DocumentRequestsContext";
import { DocumentRequestGroup } from "../document-requests/components/DocumentRequestGroup";
import { RequestedDocumentRow } from "../document-requests/components/RequestedDocumentRow";
import { DocumentRequestModal } from "../document-requests/components/DocumentRequestModal";
import TodoModal from "../components/TodoModal";
import { apiGet } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";
import type { DocumentRequestItem } from "../document-requests/types";

// Inner component to safely consume DocumentRequestsContext
function FilingDetailContent() {
  const { engagementId, filingId } = useParams<{ engagementId: string; filingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, selectedService } = useAuth();
  const { 
    isTodoModalOpen, setIsTodoModalOpen, 
    todoMode, todoSourceId, todoInitialData 
  } = useDocumentRequests();
  const [newComment, setNewComment] = useState("");
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [selectedDocFileIds, setSelectedDocFileIds] = useState<string[]>([]);

  // Fetch Filing Data
  const { data: filing, isLoading: isLoadingFiling } = useQuery({
    queryKey: ["filing-detail", engagementId, filingId],
    queryFn: () => filingService.getById(engagementId!, filingId!),
    enabled: !!engagementId && !!filingId,
  });

  // Comments Query
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["filing-comments", engagementId, filingId],
    queryFn: () => filingService.getComments(engagementId!, filingId!),
    enabled: !!engagementId && !!filingId,
  });

  // Fetch Document Requests
  const { data: docRequests = [] } = useQuery({
    queryKey: ["document-requests", engagementId],
    queryFn: () => apiGet<{ data: DocumentRequestItem[] }>(endPoints.DOCUMENT_REQUESTS.BASE, { engagementId }).then(res => res.data),
    enabled: !!engagementId,
  });

  // Create Document Request Mutation
  const createDocRequestMutation = useMutation({
    mutationFn: (fileIds: string[]) =>
      filingService.createDocumentRequest(engagementId!, filingId!, fileIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["filing-detail", engagementId, filingId] });
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      setSelectedDocFileIds([]);
      toast.success(data.message || "Document request processed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to process document request");
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: FilingStatus }) =>
      filingService.updateStatus(engagementId!, filingId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filing-detail", engagementId, filingId] });
      toast.success("Status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  });

  // Toggle Sign-off Mutation
  const toggleSignOffMutation = useMutation({
    mutationFn: (signOffStatus: boolean) =>
      filingService.toggleSignOff(engagementId!, filingId!, signOffStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filing-detail", engagementId, filingId] });
      toast.success("Sign-off updated");
      setIsSignOffModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update sign-off");
    }
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ comment, parentId, fileIds }: { comment: string, parentId?: string, fileIds?: string[] }) => 
      filingService.addComment(engagementId!, filingId!, comment, parentId, fileIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filing-comments", engagementId, filingId] });
      setNewComment("");
      setReplyingTo(null);
      setSelectedFileIds([]);
      setIsAttachMenuOpen(false);
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    }
  });

  // Add Files Mutation
  const addFilesMutation = useMutation({
    mutationFn: (files: File[]) => filingService.addFiles(engagementId!, filingId!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filing-detail", engagementId, filingId] });
      toast.success("Files added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add files");
    }
  });

  const isLocked = filing?.status === FilingStatus.FILED;
  const isClientReview = filing?.status === FilingStatus.CLIENT_REVIEW;
  const userSignOff = filing?.signOffs?.find(s => s.userId === user?.id);
  const hasSignedOff = !!userSignOff?.signOffStatus;

  const handleSendComment = () => {
    if (!newComment.trim() || isLocked) return;
    addCommentMutation.mutate({ 
      comment: newComment, 
      parentId: replyingTo?.id, 
      fileIds: selectedFileIds 
    });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFilesMutation.mutate(files);
    }
  };

  const getStatusConfig = (status: FilingStatus) => {
    switch (status) {
      case FilingStatus.FILED:
        return { 
          label: "Filed", 
          icon: <CheckCircle2 size={14} />, 
          className: "bg-emerald-50 text-emerald-600 border-emerald-100 placeholder:text-emerald-400" 
        };
      case FilingStatus.CLIENT_REVIEW:
        return { 
          label: "In Review", 
          icon: <Clock size={14} />, 
          className: "bg-indigo-50 text-indigo-600 border-indigo-100" 
        };
      case FilingStatus.CANCELLED:
        return { 
          label: "Cancelled", 
          icon: <AlertCircle size={14} />, 
          className: "bg-red-50 text-red-600 border-red-100" 
        };
      default:
        return { 
          label: "Draft", 
          icon: <Clock size={14} />, 
          className: "bg-amber-50 text-amber-600 border-amber-100" 
        };
    }
  };

  const getRoleBadge = (role: string | undefined) => {
    const r = (role || "").toUpperCase();
    if (r === "ORG_ADMIN") return { label: "Admin", className: "bg-violet-50 text-violet-600 border-violet-100" };
    if (r === "ORG_EMPLOYEE") return { label: "Employee", className: "bg-amber-50 text-amber-600 border-amber-100" };
    return { label: "Client", className: "bg-blue-50 text-blue-600 border-blue-100" };
  };

  const renderComment = (comment: any, isReply = false, files: any[] = []) => {
    const roleBadge = getRoleBadge(comment.user?.role);
    return (
    <div key={comment.id} className={cn("flex gap-4 group", isReply ? "ml-8 mt-4 relative" : "")}>
      {isReply && (
        <div className="absolute left-[-26px] top-4 w-6 h-6 border-l-2 border-b-2 border-gray-200 rounded-bl-xl opacity-50" />
      )}
      <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm shrink-0 z-10">
        <User size={20} />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-black text-gray-900">
              {comment.user?.firstName} {comment.user?.lastName}
            </p>
            <span className={cn("px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", roleBadge.className)}>
              {roleBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>
            {!isLocked && !isReply && (
              <button 
                onClick={() => setReplyingTo({ id: comment.id, name: `${comment.user?.firstName} ${comment.user?.lastName}` })}
                className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
              >
                <CornerDownRight size={12} /> Reply
              </button>
            )}
          </div>
        </div>
        <div className="p-4 rounded-3xl rounded-tl-none border shadow-sm bg-white border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{comment.comment}</p>
          
          {/* Referenced Files */}
          {comment.referencedFileIds && comment.referencedFileIds.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {comment.referencedFileIds.map((fileId: string) => {
                const fileView = files.find((fv: any) => fv.fileId === fileId);
                if (!fileView) return null;
                return (
                  <div key={fileId} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => window.open(fileView.file.url, "_blank")}>
                    <Paperclip size={12} className="text-primary" />
                    <span className="truncate max-w-[150px]">{fileView.file.file_name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 pt-2">
            {comment.replies.map((reply: any) => renderComment(reply, true, files))}
          </div>
        )}
      </div>
    </div>
  );
  };

  if (isLoadingFiling) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <div className="flex gap-8 h-[600px]">
          <Skeleton className="w-[40%] h-full rounded-[32px]" />
          <Skeleton className="w-[60%] h-full rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!filing) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Filing not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const f = filing!;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <ActionConfirmModal
          isOpen={isSignOffModalOpen}
          onClose={() => setIsSignOffModalOpen(false)}
          onConfirm={() => toggleSignOffMutation.mutate(!hasSignedOff)}
          title={!hasSignedOff ? "Confirm Sign-off" : "Remove Sign-off"}
          message={!hasSignedOff 
            ? "Are you sure you want to sign off on this filing? This indicates you have reviewed and approved the documents." 
            : "Are you sure you want to remove your sign-off from this filing?"}
          confirmLabel={!hasSignedOff ? "Sign Off" : "Remove"}
          variant={!hasSignedOff ? "primary" : "warning"}
          loading={toggleSignOffMutation.isPending}
        />

        <PageHeader 
          title={f.name}
          subtitle={`Last Updated ${new Date(f.updatedAt).toLocaleDateString()}`}
          icon={FileIcon}
          actions={
            <div className="flex items-center gap-3">
              <select
                value={f.status}
                onChange={(e) => updateStatusMutation.mutate({ status: e.target.value as FilingStatus } as { status: FilingStatus })}
                disabled={isLocked || updateStatusMutation.isPending}
                className="h-12 rounded-2xl border-gray-100 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-4 focus:ring-primary/5 disabled:opacity-50 cursor-pointer shadow-sm min-w-[160px]"
              >
                <option value={FilingStatus.DRAFT}>Draft</option>
                <option value={FilingStatus.CLIENT_REVIEW}>Client Review</option>
                <option value={FilingStatus.FILED}>Filed</option>
              </select>

              <Button
                variant={hasSignedOff ? "default" : "outline"}
                className={cn(
                  "h-12 px-6 rounded-2xl gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  hasSignedOff 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20" 
                    : "bg-white text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm"
                )}
                onClick={() => setIsSignOffModalOpen(true)}
                disabled={toggleSignOffMutation.isPending}
              >
                <CheckCircle2 size={16} />
                {hasSignedOff ? "Signed Off" : "Sign Off"}
              </Button>

              <div className="w-px h-8 bg-gray-200 mx-1" />

              <Button 
                variant="header"
                 onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["filing-detail", engagementId, filingId] });
                  queryClient.invalidateQueries({ queryKey: ["filing-comments", engagementId, filingId] });
                }}
                title="Refresh Data"
              > 
                <RefreshCw size={14} className={isLoadingFiling || isLoadingComments ? "animate-spin" : ""} />
                Refresh
              </Button>

              <Button 
                variant="header" 
                onClick={() => navigate(`/engagement-view/${engagementId}?tab=filing`)}
                className="gap-2"
              >
                <ArrowLeft size={14} />
                Back to Filings
              </Button>
            </div>
          }
          badge={
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shrink-0",
                getStatusConfig(f.status).className
              )}>
                {getStatusConfig(f.status).icon}
                {getStatusConfig(f.status).label}
              </div>
              
              {(f.signOffs ?? []).length > 0 && (
                <div className="flex -space-x-2">
                  {(f.signOffs ?? []).map((s) => (
                    <div 
                      key={s.id} 
                      className="h-7 w-7 rounded-full bg-white border-2 border-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm relative group/avatar"
                      title={`${s.user?.firstName} ${s.user?.lastName}`}
                    >
                      <User size={12} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-bold rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {s.user?.firstName} {s.user?.lastName} (Signed Off)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />

        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
          {/* Left Side: Files (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documents ({f.files.length})</h4>
              <div className="flex items-center gap-2">
                {!isLocked && isClientReview && (
                  <>
                    <button 
                      className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-widest transition-colors mr-2"
                      onClick={() => {
                        const allAvailableIds = f.files
                          .filter((ff: any) => !docRequests?.some((dr: any) => dr.requestedDocuments.some((rd: any) => rd.templateFile?.id === ff.file.id)))
                          .map((ff: any) => ff.id);
                        
                        if (selectedDocFileIds.length === allAvailableIds.length) {
                          setSelectedDocFileIds([]);
                        } else {
                          setSelectedDocFileIds(allAvailableIds);
                        }
                      }}
                    >
                      {selectedDocFileIds.length > 0 && selectedDocFileIds.length === f.files.filter((ff: any) => !docRequests?.some((dr: any) => dr.requestedDocuments.some((rd: any) => rd.templateFile?.id === ff.file.id))).length ? "Deselect All" : "Select All"}
                    </button>

                    {selectedDocFileIds.length > 0 && (
                      <Button
                        size="sm"
                        variant={f.documentRequestId ? "outline" : "default"}
                        className="h-8 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => createDocRequestMutation.mutate(selectedDocFileIds)}
                        isLoading={createDocRequestMutation.isPending}
                      >
                        {f.documentRequestId ? <Plus size={14} /> : <FileCheck size={14} />}
                        {f.documentRequestId ? "Add Files" : "Create Request"}
                      </Button>
                    )}

                    <div className="w-px h-6 bg-gray-100 mx-1" />

                    <input 
                      type="file" 
                      id="add-file-detail" 
                      className="hidden" 
                      multiple 
                      onChange={handleFileAdd} 
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 rounded-xl text-primary hover:bg-primary/5 gap-2 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => document.getElementById('add-file-detail')?.click()}
                      disabled={addFilesMutation.isPending}
                    >
                      <Plus size={14} />
                      Add Files
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {f.files.map((fileView: any) => {
                const isSelected = selectedDocFileIds.includes(fileView.id);
                const alreadyInDr = docRequests?.some((dr: any) => dr.requestedDocuments.some((rd: any) => rd.templateFile?.id === fileView.file.id));

                return (
                  <div 
                    key={fileView.id} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all group/file shadow-sm",
                      alreadyInDr ? "bg-emerald-50/20 border-emerald-100 opacity-90" : 
                      isSelected ? "border-primary/40 bg-primary/5" : "border-gray-100 hover:border-primary/20"
                    )}
                  >
                    {!alreadyInDr && !isLocked && isClientReview && (
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedDocFileIds(prev => [...prev, fileView.id]);
                          else setSelectedDocFileIds(prev => prev.filter(id => id !== fileView.id));
                        }}
                        className="rounded-lg h-5 w-5"
                      />
                    )}
                    {alreadyInDr && (
                      <div className="h-5 w-5 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <div className="p-3 rounded-xl bg-gray-50 text-gray-400 group-hover/file:bg-primary/5 group-hover/file:text-primary transition-colors">
                      <FileIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{fileView.file.file_name}</p>
                      {alreadyInDr && (
                         <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Part of Document Request</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-gray-400 hover:text-primary"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = fileView.file.url;
                          link.download = fileView.file.file_name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download"
                      >
                        <Download size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-xl hover:bg-primary/5 text-gray-400 hover:text-primary"
                        onClick={() => window.open(fileView.file.url, "_blank")}
                        title="View"
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Comments (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <MessageSquare size={20} />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discussion Thread</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/20">
              {isLoadingComments ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading conversation...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="h-20 w-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-gray-200 mb-4 shadow-sm">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">No comments yet</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">Share your thoughts or feedback here.</p>
                </div>
              ) : (
                comments.map((comment: any) => renderComment(comment, false, f.files))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-8 border-t border-gray-100 bg-white shrink-0 space-y-4">
              {replyingTo && (
                <div className="flex items-center justify-between bg-primary/5 px-4 py-2 mt-[-16px] mx-[-16px] mb-4 rounded-xl border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="flex items-center gap-2">
                    <CornerDownRight size={14} />
                    Replying to {replyingTo?.name}
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="hover:bg-primary/10 p-1.5 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {selectedFileIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFileIds.map(fileId => {
                    const fileView = filing?.files.find((f: any) => f.fileId === fileId);
                    if (!fileView) return null;
                    return (
                      <div key={fileId} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-600 shadow-sm">
                        <Paperclip size={10} className="text-primary" />
                        <span className="truncate max-w-[150px]">{fileView.file.file_name}</span>
                        <button onClick={() => setSelectedFileIds(prev => prev.filter(id => id !== fileId))} className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLocked && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "px-4 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all gap-2",
                        isAttachMenuOpen ? "bg-gray-200 text-gray-700" : "bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    >
                      <Paperclip size={12} /> Attach Files
                    </Button>

                      {isAttachMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-[300px] bg-white rounded-2xl border border-gray-100 shadow-xl shadow-indigo-500/10 p-3 z-50">
                          <div className="flex items-center justify-between mb-3 px-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select files to attach</p>
                            <button onClick={() => setIsAttachMenuOpen(false)} className="text-gray-400 hover:text-gray-700">
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
                            {f.files.length === 0 ? (
                              <p className="text-xs text-gray-400 px-2 py-2">No files uploaded yet.</p>
                            ) : (
                              f.files.map((fileView: any) => (
                                <label key={fileView.fileId} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                                  <Checkbox 
                                    checked={selectedFileIds.includes(fileView.fileId)}
                                    onCheckedChange={(checked) => {
                                      if (checked) setSelectedFileIds(prev => [...prev, fileView.fileId]);
                                      else setSelectedFileIds(prev => prev.filter(id => id !== fileView.fileId));
                                    }}
                                  />
                                  <FileIcon size={14} className="text-gray-400 shrink-0 group-hover:text-primary transition-colors" />
                                  <span className="text-xs font-medium text-gray-700 truncate">{fileView.file.file_name}</span>
                                </label>
                              ))
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-50 text-right">
                            <Button variant="default" size="sm" onClick={() => setIsAttachMenuOpen(false)}>Done</Button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="relative group">
                <Input 
                  placeholder={isLocked ? "Discussion is locked for filed filings" : "Type your message..."} 
                  value={newComment}
                  disabled={isLocked}
                  onChange={(e: any) => setNewComment(e.target.value)}
                  onKeyDown={(e: any) => e.key === 'Enter' && handleSendComment()}
                  className="h-14 pl-5 pr-14 rounded-[20px] border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 transition-all text-sm font-medium disabled:opacity-50"
                />
                <Button 
                  size="icon" 
                  className="absolute right-2 top-2 h-10 w-10 rounded-[14px] shadow-lg shadow-primary/20 transition-all active:scale-95"
                  disabled={!newComment.trim() || addCommentMutation.isPending || isLocked}
                  onClick={handleSendComment}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>        </div>

        {/* Associated Document Request Section */}
        {f.documentRequestId && (
          <div className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-indigo-500/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900 leading-none">Associated Document Request</h4>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">Requested components for this filing</p>
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const group = docRequests.find((dr: any) => dr.id === f.documentRequestId);
                if (!group) return <Skeleton className="h-32 w-full rounded-2xl" />;
                
                return (
                  <DocumentRequestGroup req={group}>
                    {group.requestedDocuments.map((doc: any) => (
                      <RequestedDocumentRow 
                        key={doc.id} 
                        doc={doc} 
                        requestId={group.id} 
                        requestStatus={group.status}
                        isFilingRequest={group.isFilingRequest}
                      />
                    ))}
                  </DocumentRequestGroup>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {f.documentRequestId && (
        <>
          <DocumentRequestModal />
          <TodoModal 
            isOpen={isTodoModalOpen}
            onClose={() => setIsTodoModalOpen(false)}
            onSuccess={() => {}}
            engagementId={engagementId!}
            mode={todoMode}
            sourceId={todoSourceId}
            initialData={todoInitialData}
            service={selectedService || 'AUDITING'}
          />
        </>
      )}
    </div>
  );
}

export default function FilingDetailView() {
  const { engagementId } = useParams<{ engagementId: string }>();
  return (
    <DocumentRequestsProvider engagementId={engagementId}>
      <FilingDetailContent />
    </DocumentRequestsProvider>
  );
}
