import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Download, 
  Plus, 
  AlertCircle,
  X,
  File as FileIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import { Button } from "../../../../ui/Button";
import { Skeleton } from "../../../../ui/Skeleton";
import { filingService, FilingStatus } from "../../../../api/filingService";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "../../../../ui/Dialog";
import { Input } from "../../../../ui/input";

interface FilingsViewProps {
  engagementId: string;
}

export default function FilingsView({ engagementId }: FilingsViewProps) {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: filings = [], isLoading } = useQuery({
    queryKey: ["filings", engagementId],
    queryFn: () => filingService.getByEngagementId(engagementId),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) => 
      filingService.upload(engagementId, name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Filing uploaded successfully");
      setIsUploadModalOpen(false);
      resetUpload();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload filing");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ filingId, status }: { filingId: string; status: FilingStatus }) =>
      filingService.updateStatus(engagementId, filingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (filingId: string) => filingService.delete(engagementId, filingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filings", engagementId] });
      toast.success("Filing deleted");
    },
  });

  const resetUpload = () => {
    setFileName("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fileName) setFileName(file.name.split('.')[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !fileName) {
      toast.error("Please provide both a name and a file");
      return;
    }
    uploadMutation.mutate({ name: fileName, file: selectedFile });
  };

  const getStatusConfig = (status: FilingStatus) => {
    switch (status) {
      case FilingStatus.FILED:
        return { 
          label: "Filed", 
          icon: <CheckCircle2 size={14} />, 
          className: "bg-emerald-50 text-emerald-600 border-emerald-100" 
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
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Filings & Submissions</h2>
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

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogContent className="max-w-md rounded-[32px] p-8 border-none overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900">Upload Filing</DialogTitle>
                <p className="text-gray-500 font-medium">Add a new document to this engagement</p>
              </DialogHeader>
              
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filing Name</label>
                  <Input 
                    placeholder="e.g. VAT Return Q1 2024" 
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="rounded-2xl border-gray-100 h-12 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">File Attachment</label>
                  {!selectedFile ? (
                    <div 
                      className="border-2 border-dashed border-gray-100 rounded-[24px] p-10 flex flex-col items-center justify-center gap-3 bg-gray-50/30 hover:bg-gray-50 hover:border-primary/20 transition-all cursor-pointer group"
                      onClick={() => document.getElementById('filing-upload')?.click()}
                    >
                      <div className="p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">Click to select a file</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">PDF, Excel, or Word documents</p>
                      </div>
                      <input 
                        type="file" 
                        id="filing-upload" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="p-3 rounded-xl bg-white text-primary shadow-sm">
                        <FileIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={resetUpload} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !selectedFile || !fileName}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Complete Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
          filings.map((filing) => {
            const statusCfg = getStatusConfig(filing.status);
            return (
              <div 
                key={filing.id} 
                className="group bg-white rounded-[32px] border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:border-primary/10"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <FileIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 tracking-tight">{filing.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Updated {new Date(filing.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {filing.file?.file_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Badge */}
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                    statusCfg.className
                  )}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </div>

                  {/* Actions */}
                  <div className="h-8 w-[1px] bg-gray-100 hidden md:block mx-2" />
                  
                  <div className="flex items-center gap-2">
                    {filing.status === FilingStatus.DRAFT && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => updateStatusMutation.mutate({ filingId: filing.id, status: FilingStatus.FILED })}
                      >
                        Submit Filing
                      </Button>
                    )}
                    
                    {filing.file?.url && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-10 w-10 rounded-xl hover:bg-primary/10 text-gray-400 hover:text-primary transition-all duration-200 font-bold"
                        onClick={() => {
                          if (filing.file?.url) {
                            const link = document.createElement('a');
                            link.href = filing.file.url;
                            link.download = filing.file.file_name || filing.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        title="Download"
                      >
                        <Download size={18} />
                      </Button>
                    )}

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this filing?")) {
                          deleteMutation.mutate(filing.id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
