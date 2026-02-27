import React from "react";
import { FileText, Plus, Edit2, Trash2, Loader2, CheckSquare, FileEdit, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { todoService } from "@/api/todoService";
import { useParams } from "react-router-dom";
import { Button } from "../../../../../ui/Button";
import { cn } from "../../../../../lib/utils";
import type { DocumentRequestItem } from "../types";
import { useDocumentRequests } from "../DocumentRequestsContext";
import { ActionConfirmModal } from "../../components/ActionConfirmModal";

interface DocumentRequestGroupProps {
  req: DocumentRequestItem;
  children: React.ReactNode;
}

export const DocumentRequestGroup = ({ req, children }: DocumentRequestGroupProps) => {
  const { id: engagementId } = useParams();
  const [locallyAssignedFileIds, setLocallyAssignedFileIds] = React.useState<string[]>([]);

  const { 
    setAddingToContainerId, 
    setIsAddModalOpen, 
    setEditingGroup,
    deleteContainerMutation,
    setIsTodoModalOpen,
    setTodoInitialData,
    setTodoSourceId,
    setTodoMode,
    attachFilesMutation,
    updateStatusMutation
  } = useDocumentRequests();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  const { data: todos } = useQuery({
    queryKey: ['engagement-todos', engagementId],
    enabled: !!engagementId,
    queryFn: () => todoService.list(engagementId!),
  });

  const linkedTodo = todos?.find(t => t.moduleId === req.id && (t.type === 'DOCUMENT_REQUEST' || t.type === 'CUSTOM'));

  const isDeleting = deleteContainerMutation.isPending && deleteContainerMutation.variables?.id === req.id;

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const onConfirmDelete = (reason?: string) => {
    deleteContainerMutation.mutate({ id: req.id, reason: reason || "No reason provided" });
    setIsDeleteModalOpen(false);
  };

  // Calculate Progress
  const allDocs = req.requestedDocuments.flatMap(doc => doc.count === 'MULTIPLE' ? (doc.children || []) : [doc]);
  const totalCount = allDocs.length;
  const completedCount = allDocs.filter(d => ['UPLOADED', 'ACCEPTED'].includes(d.status)).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 bg-gray-50/50 border-b border-gray-100 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mt-1">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-gray-900">{req.title}</h4>
                <select 
                  className={cn(
                    "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border transition-colors outline-none cursor-pointer",
                    req.status === 'DRAFT' ? "bg-gray-100 text-gray-700 border-gray-200" :
                    req.status === 'ACTIVE' ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-green-50 text-green-700 border-green-100"
                  )}
                  value={req.status}
                  onChange={(e) => updateStatusMutation.mutate({ requestId: req.id, status: e.target.value })}
                  disabled={updateStatusMutation.isPending}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {progressPercent}% Complete
                </span>
              </div>
              <p className="text-sm text-gray-600">{req.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 text-gray-400 hover:text-primary hover:border-primary/30" 
              onClick={() => { setEditingGroup(req); setIsAddModalOpen(true); }}
              title="Edit Group"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {progressPercent < 100 && (
              linkedTodo ? (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 text-blue-500 border-blue-200 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                  onClick={() => {
                    setTodoInitialData(linkedTodo);
                    setTodoSourceId(req.id);
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
                  className="h-10 w-10 text-amber-500 border-amber-200 hover:bg-primary/5 hover:text-primary transition-all duration-200" 
                  onClick={() => {
                    setTodoInitialData({
                      title: `Follow up: ${req.title}`,
                      description: req.description || '',
                    });
                    setTodoSourceId(req.id);
                    setTodoMode("from-doc-req");
                    setIsTodoModalOpen(true);
                  }}
                  title="Create Todo"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              )
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 text-gray-400 hover:text-red-600 hover:border-red-200" 
              onClick={handleDelete}
              title="Delete Entire Group"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { setAddingToContainerId(req.id); setIsAddModalOpen(true); }} 
              className="h-10 border-blue-200 text-blue-700 hover:bg-primary/5 hover:text-primary transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Document
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Progress Status</span>
            <span>{completedCount} of {totalCount} requirements met</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Unassigned Files Section */}
      {req.unassignedFiles && req.unassignedFiles.filter(f => !locallyAssignedFileIds.includes(f.id)).length > 0 && (
        <div className="mx-5 my-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-md text-amber-700">
              <Plus className="h-4 w-4" />
            </div>
            <h5 className="text-sm font-bold text-amber-900">Unassigned Files ({req.unassignedFiles.length})</h5>
          </div>
          <p className="text-xs text-amber-700 mb-4 italic">
            These files were bulk uploaded by the client. Please assign them to the correct requirements below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {req.unassignedFiles.filter(f => !locallyAssignedFileIds.includes(f.id)).map((file) => (

              <div key={file.id} className="flex items-center justify-between p-2.5 bg-white border border-amber-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate" title={file.file_name}>
                    {file.file_name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 border-blue-200 text-blue-700 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                    onClick={() => {
                      if (file.url) {
                        window.open(file.url, "_blank");
                      }
                    }} 
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 border-green-200 text-green-700 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                    onClick={() => {
                      if (file.url) {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.file_name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }} 
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <select 
                    className="text-[10px] font-bold h-7 border-gray-200 rounded-md bg-gray-50 hover:bg-white transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary/20"
                    onChange={(e) => {
                      if (e.target.value) {
                        setLocallyAssignedFileIds(prev => [...prev, file.id]);
                        attachFilesMutation.mutate({
                          documentRequestId: req.id,
                          requestedDocumentId: e.target.value,
                          fileId: file.id
                        }, {
                          onError: () => {
                            setLocallyAssignedFileIds(prev => prev.filter(id => id !== file.id));
                            alert("Failed to assign document. Please try again.");
                          }
                        });
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>Assign to...</option>
                    {req.requestedDocuments.flatMap(doc => 
                      doc.count === 'MULTIPLE' ? (doc.children || []) : [doc]
                    )
                    .filter(d => d.status === 'PENDING')
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.documentName}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5">
        <ul className="space-y-4">
          {children}
        </ul>
      </div>

      <ActionConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Entire Group"
        message={
          <>
            Are you sure you want to permanently delete the entire group <span className="text-slate-900 font-bold">"{req.title}"</span>? 
            This action cannot be undone and will remove all associated document requests.
          </>
        }
        confirmLabel="Delete Everything"
        variant="danger"
        showReasonField={true}
        loading={isDeleting}
      />
    </div>
  );
};
