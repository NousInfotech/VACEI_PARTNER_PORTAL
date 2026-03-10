import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Eye, Trash2, Upload, RefreshCw, ChevronDown, PlusCircle, CheckSquare, Square, Check } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import { apiPatch, apiDelete } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { useIncorpCycle } from './IncorpCycleContext';

interface UnassignedFilesProps {
  requestId: string;
  unassignedFiles: any[];
  documentRequest?: any;
}

const UnassignedFiles: React.FC<UnassignedFilesProps> = ({ requestId, unassignedFiles: files }) => {
  const [selectedMappings, setSelectedMappings] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { refetch, transformedDocs: allCategories } = useIncorpCycle();

  const assignMutation = useMutation({
    mutationFn: async ({ requestedDocId, fileId }: { requestedDocId: string; fileId: string }) => {
      await apiPatch(endPoints.DOCUMENT_REQUESTS.ATTACH_FILES(requestId, requestedDocId), { fileId });
      // Automatically remove from unassigned pool upon successful assignment
      return apiDelete(endPoints.DOCUMENT_REQUESTS.UNASSIGNED_FILE(requestId, fileId));
    },
    onSuccess: async () => {
      // Direct refetch via context ensures immediate UI update
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle'] });
      queryClient.invalidateQueries({ queryKey: ['incorporation-cycle'] });
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
    },
    onError: (error: any) => {
      toast.error('Failed to assign file', { description: error?.response?.data?.message || error?.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ fileId }: { fileId: string }) =>
      apiDelete(endPoints.DOCUMENT_REQUESTS.UNASSIGNED_FILE(requestId, fileId)),
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle'] });
      queryClient.invalidateQueries({ queryKey: ['incorporation-cycle'] });
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      toast.success('Unassigned file removed');
    },
    onError: (error: any) => {
      toast.error('Failed to remove file', { description: error?.response?.data?.message || error?.message });
    }
  });

  const assignSelectedMutation = useMutation({
    mutationFn: async () => {
      const assignments = Array.from(selectedFiles).map(fileId => {
        const reqId = selectedMappings[fileId];
        if (reqId) {
          return assignMutation.mutateAsync({ requestedDocId: reqId, fileId });
        }
        return null;
      }).filter(Boolean);

      if (assignments.length === 0) {
        throw new Error("No mappings selected for the chosen files");
      }

      return Promise.all(assignments);
    },
    onSuccess: () => {
      toast.success('Selected files assigned successfully');
      setSelectedFiles(new Set());
    }
  });

  if (!files || files.length === 0) return null;

  // Find requirements ONLY for this category
  const currentCategory = allCategories.find(cat => cat._id === requestId);
  const allRequirements = currentCategory ? [
    ...(currentCategory.documents || [])
      .filter((d: any) => !d.url && d._id)
      .map((d: any) => ({ id: d._id!, name: d.name })),
    ...(currentCategory.multipleDocuments || []).flatMap((g: any) => 
        (g.multiple || [])
          .filter((item: any) => !item.url && item._id)
          .map((item: any) => ({ id: item._id!, name: `${g.name} - ${item.label}` }))
    )
  ] : [];

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.fileId)));
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    setSelectedFiles(newSet);
  };

  const isAllSelected = files.length > 0 && selectedFiles.size === files.length;

  return (
    <div className="bg-indigo-50/20 border border-indigo-100/40 rounded-2xl p-6 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-indigo-600" />
          <h5 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">
            Pending Matching ({files.length})
          </h5>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <Button
              size="sm"
              className="rounded-lg h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 shadow-sm transition-all"
              onClick={() => assignSelectedMutation.mutate()}
              disabled={assignSelectedMutation.isPending}
            >
              {assignSelectedMutation.isPending ? <RefreshCw size={12} className="animate-spin mr-1.5" /> : <Check size={12} className="mr-1.5" />}
              Assign Selected ({selectedFiles.size})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 px-1">
        <button 
          onClick={toggleSelectAll}
          className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-md transition-colors flex items-center gap-2"
        >
          {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">Select All</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {files.map((file) => (
          <div key={file.fileId} className={`bg-white border rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-all group/file overflow-hidden ${selectedFiles.has(file.fileId) ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-indigo-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleFileSelection(file.fileId)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors shrink-0"
                >
                  {selectedFiles.has(file.fileId) ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <FileText size={18} className="text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Eye size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={() => {
                    if (confirm(`Remove "${file.fileName}"?`)) {
                      deleteMutation.mutate({ fileId: file.fileId });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {selectedFiles.has(file.fileId) && (
              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex-1 min-w-0 relative">
                  <select
                    className="w-full bg-indigo-50/30 border border-indigo-100/50 rounded-lg px-3 py-2 text-[10px] font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer truncate pr-8"
                    value={selectedMappings[file.fileId] || ""}
                    onChange={(e) => setSelectedMappings(prev => ({ ...prev, [file.fileId]: e.target.value }))}
                    disabled={assignMutation.isPending}
                  >
                    <option value="">Map to requirement...</option>
                    {allRequirements.map(req => (
                      <option key={req.id} value={req.id}>{req.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                    <ChevronDown size={12} />
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="rounded-lg h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest px-4 shadow-sm transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  onClick={() => {
                    const reqId = selectedMappings[file.fileId];
                    if (reqId) {
                      assignMutation.mutate({ 
                        requestedDocId: reqId, 
                        fileId: file.fileId 
                      });
                    }
                  }}
                  disabled={!selectedMappings[file.fileId] || assignMutation.isPending}
                >
                  {assignMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <PlusCircle size={12} className="mr-1.5" />}
                  Map File
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnassignedFiles;
