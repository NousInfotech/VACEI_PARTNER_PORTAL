import React from "react";
import { FileText, Plus, Edit2, Trash2, Loader2, CheckSquare, FileEdit, Eye, Download, CheckCircle2 } from "lucide-react";
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
  const [selectedUnassignedFileIds, setSelectedUnassignedFileIds] = React.useState<string[]>([]);
  const [selectedMappings, setSelectedMappings] = React.useState<Record<string, string>>({});

  const unassignedFiles = (req.unassignedFiles || []).filter(f => !locallyAssignedFileIds.includes(f.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUnassignedFileIds(unassignedFiles.map(f => f.id));
    } else {
      setSelectedUnassignedFileIds([]);
    }
  };

  const handleBulkAssign = () => {
    if (selectedUnassignedFileIds.length === 0) return;

    const filesWithMappings = selectedUnassignedFileIds.filter(id => selectedMappings[id]);
    if (filesWithMappings.length === 0) return;

    setLocallyAssignedFileIds(prev => [...prev, ...filesWithMappings]);
    
    filesWithMappings.forEach(fileId => {
      attachFilesMutation.mutate({
        documentRequestId: req.id,
        requestedDocumentId: selectedMappings[fileId],
        fileId: fileId
      });
    });

    setSelectedUnassignedFileIds(prev => prev.filter(id => !filesWithMappings.includes(id)));
    // Clear mappings for those files
    setSelectedMappings(prev => {
      const next = { ...prev };
      filesWithMappings.forEach(id => delete next[id]);
      return next;
    });
  };
  
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mt-1">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-lg font-bold text-gray-900">{req.title}</h4>
                <select 
                  className={cn(
                    "rounded-full px-1 py-0.5 text-[10px] font-bold uppercase border transition-colors outline-none cursor-pointer",
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
              <p className="text-xs text-gray-600">{req.description}</p>
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
            {progressPercent < 100 && req.status !== 'DRAFT' && (
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
      {unassignedFiles.length > 0 && (
        <div className="mx-5 my-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shadow-sm">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-base font-bold text-amber-900">Unassigned Files ({unassignedFiles.length})</h5>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Bulk Uploaded by Client</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                <input 
                  type="checkbox" 
                  id={`select-all-${req.id}`}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  checked={selectedUnassignedFileIds.length === unassignedFiles.length && unassignedFiles.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label htmlFor={`select-all-${req.id}`} className="text-xs font-bold text-gray-600 cursor-pointer select-none">
                  Select All
                </label>
              </div>

              <div className="h-4 w-px bg-amber-200 hidden md:block" />

              <Button 
                size="sm"
                disabled={selectedUnassignedFileIds.length === 0 || !selectedUnassignedFileIds.some(id => selectedMappings[id]) || attachFilesMutation.isPending}
                onClick={handleBulkAssign}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {attachFilesMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
                Assign Selected {selectedUnassignedFileIds.filter(id => selectedMappings[id]).length > 0 && `(${selectedUnassignedFileIds.filter(id => selectedMappings[id]).length})`}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-white/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {unassignedFiles.map((file) => {
                const isSelected = selectedUnassignedFileIds.includes(file.id);
                return (
                  <div 
                    key={file.id} 
                    className={cn(
                      "group flex flex-col p-4 rounded-2xl border transition-all duration-300",
                      isSelected 
                        ? "bg-amber-50/80 border-amber-200 shadow-sm" 
                        : "bg-white border-gray-100 hover:border-amber-100 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedUnassignedFileIds(prev => 
                              prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                            );
                          }}
                        />
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-gray-700 block truncate" title={file.file_name}>
                            {file.file_name}
                          </span>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Ready to Assign</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                          onClick={() => file.url && window.open(file.url, "_blank")} 
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
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
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-amber-100 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                        <select 
                          className="flex-1 text-[11px] font-bold h-9 border-amber-200 rounded-xl bg-white hover:bg-amber-50 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 shadow-sm px-3"
                          value={selectedMappings[file.id] || ""}
                          onChange={(e) => setSelectedMappings(prev => ({ ...prev, [file.id]: e.target.value }))}
                        >
                          <option value="">Select Requirement...</option>
                          {req.requestedDocuments.flatMap(doc => 
                            doc.count === 'MULTIPLE' ? (doc.children || []) : [doc]
                          )
                          .filter(d => d.status === 'PENDING')
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.documentName}</option>
                          ))}
                        </select>

                        <Button 
                          size="sm"
                          disabled={!selectedMappings[file.id] || attachFilesMutation.isPending}
                          onClick={() => {
                            const targetId = selectedMappings[file.id];
                            if (!targetId) return;
                            setLocallyAssignedFileIds(prev => [...prev, file.id]);
                            attachFilesMutation.mutate({
                              documentRequestId: req.id,
                              requestedDocumentId: targetId,
                              fileId: file.id
                            }, {
                              onError: () => {
                                setLocallyAssignedFileIds(prev => prev.filter(id => id !== file.id));
                              }
                            });
                          }}
                          className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                        >
                          Assign
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
