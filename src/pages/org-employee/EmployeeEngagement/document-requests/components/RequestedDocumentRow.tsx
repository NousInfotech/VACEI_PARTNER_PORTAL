import { useState } from "react";
import { format } from "date-fns";
import { 
  Upload, Loader2, Eye, Download, Edit2, Trash2, FileEdit, FileUp, RotateCcw, Plus, CheckSquare 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { todoService } from "@/api/todoService";
import { Button } from "../../../../../ui/Button";
import { cn } from "../../../../../lib/utils";
import type { RequestedDocumentItem } from "../types";
import { useDocumentRequests } from "../DocumentRequestsContext";
import { ActionConfirmModal } from "../../components/ActionConfirmModal";

interface RequestedDocumentRowProps {
  doc: RequestedDocumentItem;
  requestId: string;
}

export const RequestedDocumentRow = ({ 
  doc, 
  requestId
}: RequestedDocumentRowProps) => {
  const { 
    handleFileUpload, 
    setEditingDoc, 
    setIsAddModalOpen, 
    setAddingToContainerId,
    setFormData,
    uploadMutation,
    clearMutation,
    hardDeleteMutation,
    setIsTodoModalOpen,
    setTodoInitialData,
    setTodoSourceId,
    setTodoMode
  } = useDocumentRequests();
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'clear' | 'delete';
    title: string;
    message: React.ReactNode;
    confirmLabel: string;
    variant: 'danger' | 'warning';
  }>({
    isOpen: false,
    type: 'clear',
    title: '',
    message: '',
    confirmLabel: '',
    variant: 'primary' as any
  });
  
  
  // Re-evaluating engagementId source
  const { engagementId } = useDocumentRequests();
  
  const { data: todosList } = useQuery({
    queryKey: ['engagement-todos', engagementId],
    enabled: !!engagementId,
    queryFn: () => todoService.list(engagementId!),
  });

  const linkedTodo = todosList?.find(t => t.moduleId === doc.id && (t.type === 'REQUESTED_DOCUMENT' || t.type === 'CUSTOM'));

  const isMultiple = doc.count === 'MULTIPLE';
  const isTemplate = doc.type === 'TEMPLATE';
  const isUploading = uploadMutation.isPending && uploadMutation.variables?.docId === doc.id;
  const isClearing = clearMutation.isPending && clearMutation.variables?.docId === doc.id;
  const isDeleting = hardDeleteMutation.isPending && hardDeleteMutation.variables?.docId === doc.id;

  const handleClear = () => {
    setConfirmModal({
      isOpen: true,
      type: 'clear',
      title: 'Clear Uploaded Document',
      message: (
        <>
          Are you sure you want to clear the uploaded file for <span className="text-slate-900 font-bold">"{doc.documentName}"</span>? 
          This will move the requirement back to pending status.
        </>
      ),
      confirmLabel: 'Clear Document',
      variant: 'warning'
    });
  };

  const handleHardDelete = () => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: 'Permanently Delete',
      message: (
        <>
          Are you sure you want to permanently delete <span className="text-slate-900 font-bold">"{doc.documentName}"</span>? 
          This action cannot be undone and will remove all history for this requirement.
        </>
      ),
      confirmLabel: 'Delete Permanently',
      variant: 'danger'
    });
  };

  const onConfirmAction = (reason?: string) => {
    if (confirmModal.type === 'clear') {
      clearMutation.mutate({ documentRequestId: doc.documentRequestId, docId: doc.id, reason: reason || "No reason provided" });
    } else {
      hardDeleteMutation.mutate({ documentRequestId: doc.documentRequestId, docId: doc.id, reason: reason || "No reason provided" });
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const isCompleted = (function check(d: RequestedDocumentItem): boolean {
    if (d.count === 'SINGLE') return !!d.file;
    return !!d.children && d.children.length > 0 && d.children.every(check);
  })(doc);

  return (
    <li className={cn("p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4", doc.parentId && "ml-8 border-l-4 border-l-blue-100")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            {isTemplate ? <FileEdit className="h-5 w-5 text-gray-600" /> : <FileUp className="h-5 w-5 text-gray-600" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{doc.documentName}</p>
              {doc.isMandatory && <span className="bg-red-50 text-red-700 border border-red-100 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">Mandatory</span>}
              <span className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">{isTemplate ? "Template" : "Direct"}</span>
            </div>
            {doc.description && <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", 
                doc.status === 'ACCEPTED' ? "bg-green-50 text-green-700 border-green-100" :
                doc.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100" :
                doc.status === 'UPLOADED' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"
              )}>
                {doc.status}
              </span>
              {doc.file && <span className="text-[10px] text-gray-400">Uploaded: {format(new Date(doc.createdAt), "MMM dd, yyyy")}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isCompleted && (
            linkedTodo ? (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 text-blue-500 border-blue-200 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                onClick={() => {
                  setTodoInitialData(linkedTodo);
                  setTodoSourceId(doc.id);
                  setTodoMode("edit");
                  setIsTodoModalOpen(true);
                }}
                title="Edit Todo"
              >
                <FileEdit className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 text-amber-500 border-amber-200 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                onClick={() => {
                  setTodoInitialData({
                    title: `Upload: ${doc.documentName}`,
                    description: doc.description || '',
                  });
                  setTodoSourceId(doc.id);
                  setTodoMode("from-req-doc");
                  setIsTodoModalOpen(true);
                }}
                title="Create Todo"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            )
          )}
          {!isMultiple && !doc.file && (
            <div className="relative">
              <input 
                id={`file-input-${doc.id}`}
                name={`file-input-${doc.id}`}
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={(e) => {
                  handleFileUpload(doc.documentRequestId, doc.id, e.target.files);
                  e.target.value = '';
                }} 
              />
              <Button variant="outline" size="sm" className="h-9 border-blue-200 text-blue-700 hover:bg-primary/5 hover:text-primary transition-all duration-200">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          )}
          
          {doc.file && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-blue-200 text-blue-700 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                onClick={() => {
                  if (doc.file?.url) {
                    window.open(doc.file.url, "_blank");
                  }
                }} 
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-green-200 text-green-700 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                onClick={() => {
                  if (doc.file?.url) {
                    const link = document.createElement('a');
                    link.href = doc.file.url;
                    link.download = doc.file.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }} 
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleClear} title="Clear Upload">
                {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              </Button>
            </>
          )}

          {(doc.template?.url || doc.templateFile?.url) && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 border-amber-200 text-amber-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
              onClick={() => {
                const url = doc.template?.url || doc.templateFile?.url;
                if (url) {
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = doc.templateFile?.file_name || "template";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }} 
              title="Download Template"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {!doc.parentId ? (
            <>
              {isMultiple && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 border-blue-200 text-blue-700 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                  onClick={() => { 
                    setAddingToContainerId(requestId); 
                    setFormData((prev: any) => ({ ...prev, parentId: doc.id })); 
                    setIsAddModalOpen(true); 
                  }} 
                  title="Add Item to Group"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary hover:border-primary/30" onClick={() => { setEditingDoc(doc); setIsAddModalOpen(true); }} title="Edit"><Edit2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-600 hover:border-red-200" onClick={handleHardDelete} title="Delete group">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-600 hover:border-red-200" onClick={handleHardDelete} title="Permanent delete">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {isMultiple && doc.children && doc.children.length > 0 && (
        <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Requirement Items</span>
          </div>
          <ul className="space-y-3">
            {doc.children.map((child) => (
              <RequestedDocumentRow 
                key={child.id} 
                doc={child} 
                requestId={requestId} 
              />
            ))}
          </ul>
        </div>
      )}

      <ActionConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={onConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        showReasonField={true}
        loading={isClearing || isDeleting}
      />
    </li>
  );
};
