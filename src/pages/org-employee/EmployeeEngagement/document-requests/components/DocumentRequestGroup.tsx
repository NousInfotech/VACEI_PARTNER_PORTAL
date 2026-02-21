import { FileText, Plus, Edit2, Trash2, Loader2, CheckSquare, FileEdit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { todoService } from "@/api/todoService";
import { useParams } from "react-router-dom";
import { Button } from "../../../../../ui/Button";
import type { DocumentRequestItem } from "../types";
import { useDocumentRequests } from "../DocumentRequestsContext";

interface DocumentRequestGroupProps {
  req: DocumentRequestItem;
  children: React.ReactNode;
}

export const DocumentRequestGroup = ({ req, children }: DocumentRequestGroupProps) => {
  const { id: engagementId } = useParams();
  const { 
    setAddingToContainerId, 
    setIsAddModalOpen, 
    setEditingGroup, 
    deleteContainerMutation,
    setIsTodoModalOpen,
    setTodoInitialData,
    setTodoSourceId,
    setTodoMode
  } = useDocumentRequests();
  
  const { data: todos } = useQuery({
    queryKey: ['engagement-todos', engagementId],
    enabled: !!engagementId,
    queryFn: () => todoService.list(engagementId!),
  });

  const linkedTodo = todos?.find(t => t.moduleId === req.id && (t.type === 'DOCUMENT_REQUEST' || t.type === 'CUSTOM'));

  const isDeleting = deleteContainerMutation.isPending && deleteContainerMutation.variables?.id === req.id;

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the entire group "${req.title}"?`);
    if (!confirmDelete) return;
    const reason = window.prompt("Reason for deletion (mandatory):");
    if (!reason) return;
    deleteContainerMutation.mutate({ id: req.id, reason });
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
                <span className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase">
                  {req.status}
                </span>
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
                  className="h-10 w-10 text-blue-500 border-blue-200 hover:bg-blue-50" 
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
                  className="h-10 w-10 text-amber-500 border-amber-200 hover:bg-amber-50" 
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
              className="h-10 border-blue-200 text-blue-700 hover:bg-blue-50"
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
      <div className="p-5">
        <ul className="space-y-4">
          {children}
        </ul>
      </div>
    </div>
  );
};
