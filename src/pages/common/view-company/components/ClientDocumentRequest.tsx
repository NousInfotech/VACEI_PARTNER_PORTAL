import React, { useRef, useState } from "react";
import { Eye, Download, FileText, Upload, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../ui/Button";
import { apiPostFormData, apiDelete } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";

interface ClientDocumentRequestProps {
  requestId: string;
  document: {
    _id: string;
    name: string;
    description?: string;
    status: string;
    url?: string;
    uploadedAt?: string;
    uploadedFileName?: string;
    type: string;
    template?: { url: string };
  };
}

const ClientDocumentRequest: React.FC<ClientDocumentRequestProps> = ({ requestId, document: doc }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => {
      const fd = new FormData();
      fd.append("files", file);
      return apiPostFormData(endPoints.REQUESTED_DOCUMENT_UPLOAD(requestId, doc._id), fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      setUploading(false);
    },
    onError: () => setUploading(false),
  });

  const clearMutation = useMutation({
    mutationFn: () => {
        return apiDelete(endPoints.REQUESTED_DOCUMENT_BY_ID(requestId, doc._id) + '/clear');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
    },
  });

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate({ file });
    }
  };

  const isTemplate = doc.type?.toLowerCase() === "template";
  const isVerified = doc.status === 'verified';
  const isSubmitted = !!doc.url;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all duration-300 group">
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-2.5 rounded-lg ${isSubmitted ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 leading-none">{doc.name}</p>
            {isVerified && <CheckCircle2 size={14} className="text-green-500" />}
          </div>
          
          {doc.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{doc.description}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isVerified ? 'bg-green-50 text-green-700 border-green-100' : 
                isSubmitted ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                'bg-gray-50 text-gray-600 border-gray-100'
            }`}>
              {isVerified ? 'Approved' : isSubmitted ? 'Under Review' : 'Pending Upload'}
            </span>
            {isTemplate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-100">
                    Template
                </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />

        {/* Template Download */}
        {isTemplate && doc.template?.url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(doc.template!.url, `template_${doc.name}`)}
            className="h-9 w-9 p-0 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            title="Download Template"
          >
            <Download size={16} />
          </Button>
        )}

        {/* Upload Action */}
        {!isSubmitted && !isVerified && (
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                    <Upload size={16} className="mr-2" />
                    Upload
                </>
            )}
          </Button>
        )}

        {/* View/Download Submitted */}
        {isSubmitted && (
            <>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(doc.url!, "_blank")}
                    className="h-9 w-9 p-0 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                    title="View Document"
                >
                    <Eye size={18} />
                </Button>
                
                {!isVerified && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { if(window.confirm("Remove this file?")) clearMutation.mutate(); }}
                        className="h-9 w-9 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove File"
                    >
                        <Trash2 size={18} />
                    </Button>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default ClientDocumentRequest;
