import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Send, 
  MessageSquare,
  User,
  Lock,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button";
import { 
  Sheet, 
  SheetContent,
} from "../../../../../ui/sheet";
import { Input } from "../../../../../ui/input";
import { filingService, FilingStatus, type FilingItem } from "../../../../../api/filingService";
import { Badge } from "../../../../../ui/badge";
import { cn } from "../../../../../lib/utils";

interface FilingCommentsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filing: FilingItem;
  engagementId: string;
}

export default function FilingCommentsPanel({ 
  isOpen, 
  onOpenChange, 
  filing,
  engagementId
}: FilingCommentsPanelProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const isLocked = filing.status === FilingStatus.FILED;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["filing-comments", engagementId, filing.id],
    queryFn: () => filingService.getComments(engagementId, filing.id),
    enabled: isOpen,
  });

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

  const handleSend = () => {
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

  return (
    <Sheet>
      <SheetContent open={isOpen} onOpenChange={onOpenChange} className="p-0 border-none">
        <div className="flex flex-col h-full bg-white">
          <div className="p-6 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Comments</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{filing.name}</p>
              </div>
            </div>
            {isLocked && <Badge variant="outline" className="text-red-500 border-red-200">Locked</Badge>}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-xs font-bold uppercase tracking-widest">Loading thread...</p>
              </div>
            ) : (comments || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center text-gray-200 mb-4">
                  <MessageSquare size={32} />
                </div>
                <p className="text-sm font-bold text-gray-900">No comments yet</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Be the first to start the conversation.</p>
              </div>
            ) : (
              (comments || []).map((comment) => renderComment(comment))
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-white shrink-0 space-y-4">

            <div className="relative group">
              <Input 
                placeholder={isLocked ? "Filing is locked" : "Write a comment..."} 
                value={newComment}
                disabled={isLocked}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="h-14 pl-4 pr-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
              />
              <Button 
                size="icon" 
                className="absolute right-2 top-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20"
                disabled={!newComment.trim() || addCommentMutation.isPending || isLocked}
                onClick={handleSend}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
