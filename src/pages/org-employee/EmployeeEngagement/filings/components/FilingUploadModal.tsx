import React, { useState } from "react";
import { 
  X, 
  File as FileIcon,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "../../../../../ui/Dialog";
import { Input } from "../../../../../ui/input";

interface FilingUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (name: string, files: File[]) => Promise<void>;
  isUploading: boolean;
}

export default function FilingUploadModal({ 
  isOpen, 
  onOpenChange, 
  onUpload, 
  isUploading 
}: FilingUploadModalProps) {
  const [fileName, setFileName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const resetUpload = () => {
    setFileName("");
    setSelectedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      if (!fileName && files.length > 0) {
        setFileName(files[0].name.split('.')[0]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !fileName) {
      toast.error("Please provide both a name and at least one file");
      return;
    }
    try {
      await onUpload(fileName, selectedFiles);
      resetUpload();
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      if (!open) resetUpload();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md rounded-[32px] p-8 border-none overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gray-900">Upload Filing</DialogTitle>
          <p className="text-gray-500 font-medium">Add document(s) to this engagement</p>
        </DialogHeader>
        
        <div className="space-y-6 py-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">File Attachments</label>
            
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="p-3 rounded-xl bg-white text-primary shadow-sm">
                    <FileIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </Button>
                </div>
              ))}

              <div 
                className="border-2 border-dashed border-gray-100 rounded-[24px] p-8 flex flex-col items-center justify-center gap-2 bg-gray-50/30 hover:bg-gray-50 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => document.getElementById('filing-upload-multi')?.click()}
              >
                <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-700">Add {selectedFiles.length > 0 ? "another file" : "files"}</p>
                </div>
                <input 
                  type="file" 
                  id="filing-upload-multi" 
                  className="hidden" 
                  multiple
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button 
            className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0 || !fileName}
          >
            {isUploading ? "Uploading..." : "Complete Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
