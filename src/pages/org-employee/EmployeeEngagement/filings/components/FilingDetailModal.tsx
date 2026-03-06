import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  File as FileIcon, 
  Download, 
  ExternalLink,
  MessageSquare,
  User,
  Lock,
  Globe,
  Send,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "../../../../../ui/Dialog";
import { Input } from "../../../../../ui/input";
import { Badge } from "../../../../../ui/badge";
import { cn } from "../../../../../lib/utils";
import { filingService, FilingStatus, type FilingItem } from "../../../../../api/filingService";

interface FilingDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filing: FilingItem;
  engagementId: string;
}

export default function FilingDetailModal({ 
  isOpen, 
  onOpenChange, 
  filing,
  engagementId
}: FilingDetailModalProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const isLocked = filing.status === FilingStatus.FILED;

  // Comments Query
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["filing-comments", engagementId, filing.id],
    queryFn: () => filingService.getComments(engagementId, filing.id),
    enabled: isOpen,
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ comment }: { comment: string }) => 
      filingService.addComment(engagementId, filing.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filing-comments", engagementId, filing.id] });
      setNewComment("");
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    }
  });

  // Add Files Mutation (if we want to allow adding files from here too)
  const addFilesMutation = useMutation({
    mutationFn: (files: File[]) => filingService.addFiles(engagementId, filing.id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Files added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add files");
    }
  });

  const handleSendComment = () => {
    if (!newComment.trim() || isLocked) return;
    addCommentMutation.mutate({ comment: newComment });
  };

  const renderComment = (comment: any, isReply = false) => {
    return (
      <div key={comment.id} className={cn("flex gap-3 group", isReply ? "ml-8 mt-3 relative" : "mt-6 first:mt-0")}>
        {isReply && (
          <div className="absolute left-[-22px] top-4 w-5 h-5 border-l-2 border-b-2 border-gray-100 rounded-bl-xl opacity-50" />
        )}
        <div className="h-8 w-8 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-primary shadow-sm shrink-0 z-10">
          <User size={16} />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-900">
                {comment.user?.firstName} {comment.user?.lastName}
              </p>
              {comment.user?.role !== 'CLIENT' ? (
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] h-4 font-black uppercase tracking-tighter px-1.5 py-0">
                  <Lock size={8} className="mr-0.5" /> Internal
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] h-4 font-black uppercase tracking-tighter px-1.5 py-0">
                  <Globe size={8} className="mr-0.5" /> Client Visible
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-medium text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-2xl rounded-tl-none border shadow-sm",
            comment.user?.role !== 'CLIENT' ? "bg-amber-50/20 border-amber-100/50" : "bg-white border-gray-100"
          )}>
            <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{comment.comment}</p>
          </div>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 pt-1">
              {comment.replies.map((reply: any) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFilesMutation.mutate(files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 border-none rounded-[40px] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="p-8 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileIcon size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                  {filing.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {/* <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Last Updated {new Date(filing.updatedAt).toLocaleDateString()}
                  </span> */}
                  {isLocked && (
                    <Badge variant="outline" className="text-red-500 border-red-100 bg-red-50 text-[8px] font-black uppercase tracking-tighter">
                      <Lock size={8} className="mr-1" /> Locked / Filed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Files (40%) */}
          <div className="w-[40%] border-r border-gray-100 flex flex-col bg-gray-50/30">
            <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documents ({filing.files.length})</h4>
              {!isLocked && (
                <>
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
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {filing.files.map((fileView) => (
                <div 
                  key={fileView.id} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 transition-all group/file shadow-sm"
                >
                  <div className="p-3 rounded-xl bg-gray-50 text-gray-400 group-hover/file:bg-primary/5 group-hover/file:text-primary transition-colors">
                    <FileIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{fileView.file.file_name}</p>
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
              ))}
            </div>
          </div>

          {/* Right Side: Comments (60%) */}
          <div className="w-[60%] flex flex-col bg-white">
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
                (comments || []).map((comment: any) => renderComment(comment))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-8 border-t border-gray-100 bg-white shrink-0 space-y-4">

              <div className="relative group">
                <Input 
                  placeholder={isLocked ? "Discussion is locked for filed filings" : "Type your message..."} 
                  value={newComment}
                  disabled={isLocked}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
