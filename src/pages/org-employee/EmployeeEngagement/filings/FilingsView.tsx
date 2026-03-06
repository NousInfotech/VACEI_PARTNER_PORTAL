import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Plus, 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../ui/Button";
import { Skeleton } from "../../../../ui/Skeleton";
import { filingService, FilingStatus, type FilingItem } from "../../../../api/filingService";
import FilingUploadModal from "./components/FilingUploadModal";
import FilingItemRow from "./components/FilingItemRow";
import { useAuth } from "../../../../context/auth-context-core";
import { ActionConfirmModal } from "../components/ActionConfirmModal";

interface FilingsViewProps {
  engagementId: string;
}

export default function FilingsView({ engagementId }: FilingsViewProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [signOffModalState, setSignOffModalState] = useState<{
    isOpen: boolean;
    filingId: string | null;
    isSigningOff: boolean;
  }>({
    isOpen: false,
    filingId: null,
    isSigningOff: false
  });

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ["filings", engagementId],
    queryFn: () => filingService.getByEngagementId(engagementId),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ name, files }: { name: string; files: File[] }) => 
      filingService.upload(engagementId, name, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Filing uploaded successfully");
      setIsUploadModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload filing");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ filingId, status, reason }: { filingId: string; status: FilingStatus; reason?: string }) =>
      filingService.updateStatus(engagementId, filingId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  });

  const toggleSignOffMutation = useMutation({
    mutationFn: ({ filingId, signOffStatus }: { filingId: string; signOffStatus: boolean }) =>
      filingService.toggleSignOff(engagementId, filingId, signOffStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Sign-off updated");
      setSignOffModalState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to toggle sign-off");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (filingId: string) => filingService.delete(engagementId, filingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Filing deleted");
    },
  });

  const handleUpload = async (name: string, files: File[]) => {
    await uploadMutation.mutateAsync({ name, files });
  };

  const handleOpenDetails = (filing: FilingItem) => {
    navigate(`/engagement-view/${engagementId}/filings/${filing.id}`);
  };

  const confirmSignOff = () => {
    if (signOffModalState.filingId) {
      toggleSignOffMutation.mutate({
        filingId: signOffModalState.filingId,
        signOffStatus: signOffModalState.isSigningOff
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-500/5 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Draft & Filings</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Manage official documents and filings</p>
            </div>
          </div>
          
          <Button 
            className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus size={18} />
            <span>Upload New Filing</span>
          </Button>
        </div>
      </div>

      <FilingUploadModal 
        isOpen={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload = {handleUpload}
        isUploading={uploadMutation.isPending}
      />

      <ActionConfirmModal
        isOpen={signOffModalState.isOpen}
        onClose={() => setSignOffModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmSignOff}
        title={signOffModalState.isSigningOff ? "Confirm Sign-off" : "Remove Sign-off"}
        message={signOffModalState.isSigningOff 
          ? "Are you sure you want to sign off on this filing? This indicates you have reviewed and approved the documents." 
          : "Are you sure you want to remove your sign-off from this filing?"}
        confirmLabel={signOffModalState.isSigningOff ? "Sign Off" : "Remove"}
        variant={signOffModalState.isSigningOff ? "primary" : "warning"}
        loading={toggleSignOffMutation.isPending}
      />

      {/* Filings List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
        ) : filings.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-[32px] bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Filings Yet</h3>
            <p className="text-gray-500 max-w-sm mt-2 font-medium">
              Start by uploading your first filing document for this engagement.
            </p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 h-12 px-8"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Your First Filing
            </Button>
          </div>
        ) : (
          filings.map((filing: FilingItem) => (
            <FilingItemRow 
              key={filing.id}
              filing={filing}
              currentUserId={user?.id}
              onUpdateStatus={(id, status) => updateStatusMutation.mutate({ filingId: id, status })}
              onToggleSignOff={(id, currentStatus) => {
                setSignOffModalState({
                  isOpen: true,
                  filingId: id,
                  isSigningOff: !currentStatus
                });
              }}
              onDelete={(id) => {
                if (confirm("Are you sure you want to delete this filing?")) {
                  deleteMutation.mutate(id);
                }
              }}
              onOpenDetails={handleOpenDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}
