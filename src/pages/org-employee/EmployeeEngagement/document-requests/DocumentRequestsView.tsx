import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, File as FileIcon, GripVertical } from "lucide-react";
import { Skeleton } from "../../../../ui/Skeleton";
import { Button } from "../../../../ui/Button";
import { useAuth } from "../../../../context/auth-context-core";
import { apiGet } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";

// Context and components
import { DocumentRequestsProvider, useDocumentRequests } from "./DocumentRequestsContext";
import type { DocumentRequestItem, ApiResponse } from "./types";
import { FallbackView } from "./components/FallbackView";
import { RequestedDocumentRow } from "./components/RequestedDocumentRow";
import { DocumentRequestGroup } from "./components/DocumentRequestGroup";
import { DocumentRequestModal } from "./components/DocumentRequestModal";
import TodoModal from "../components/TodoModal";
import { TemplateModal } from "../components/TemplateModal";
import { useQueryClient } from "@tanstack/react-query";
import EngagementTodoView from "../EngagementTodoView";

interface DocumentRequestsViewProps {
  engagementId?: string;
}

const DocumentRequestsContent = () => {
  const { 
    engagementId, 
    setIsAddModalOpen,
    isTodoModalOpen,
    setIsTodoModalOpen,
    todoInitialData,
    todoSourceId,
    todoMode
  } = useDocumentRequests();
  const { selectedService } = useAuth();
  const queryClient = useQueryClient();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // Resizable state
  const [leftWidth, setLeftWidth] = useState(60); // percentage
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newLeftWidth = ((clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limits
    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize);
    window.addEventListener('touchend', stopResizing);
    
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [resize, stopResizing]);

  const { data, isLoading } = useQuery({
    queryKey: ["document-requests", engagementId],
    enabled: !!engagementId,
    queryFn: async () => {
      const res = await apiGet<ApiResponse<DocumentRequestItem | DocumentRequestItem[] | null>>(
        endPoints.DOCUMENT_REQUESTS,
        { engagementId } as Record<string, unknown>
      );
      if (!res?.data) return [];
      const items = Array.isArray(res.data) ? res.data : [res.data];
      return items.filter(i => !!i);
    },
  });

  const docRequests = data ?? [];

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-200px)] min-h-[600px] w-full gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in duration-500">
      {/* Left Panel: Document Requests */}
      <div 
        style={{ width: `${leftWidth}%` }} 
        className="flex flex-col h-full bg-white overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3 h-10">
              <div className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg shrink-0">
                <FileIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">Workspace</h2>
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mt-1">Documentation & Compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateModalOpen(true)} 
                className="px-3 h-9 border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-bold rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Template
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                className="px-3 h-9 text-[11px] font-bold rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Group
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gray-50/10">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : docRequests.length === 0 ? (
            <FallbackView />
          ) : (
            docRequests.map(req => (
              <DocumentRequestGroup 
                key={req.id} 
                req={req} 
              >
                {req.requestedDocuments.map(doc => (
                  <RequestedDocumentRow 
                    key={doc.id} 
                    doc={doc} 
                    requestId={req.id} 
                    requestStatus={req.status}
                  />
                ))}
              </DocumentRequestGroup>
            ))
          )}
        </div>
      </div>

      {/* Resizer */}
      <div 
        onMouseDown={startResizing}
        className="w-1.5 hover:w-2 bg-gray-50 hover:bg-primary/20 transition-all cursor-col-resize flex items-center justify-center group relative z-50 overflow-visible border-x border-gray-100/50"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-gray-200 shadow-xl rounded-full p-1 text-gray-400">
            <GripVertical size={12} />
          </div>
        </div>
      </div>

      {/* Right Panel: Todo List */}
      <div 
        style={{ width: `${100 - leftWidth}%` }} 
        className="flex flex-col h-full bg-white overflow-hidden"
      >
        <div className="h-full overflow-y-auto p-4 bg-gray-50/10 custom-scrollbar">
          <EngagementTodoView 
            engagementId={engagementId} 
            service={selectedService || 'AUDITING'} 
            hideHeader={true}
          />
        </div>
      </div>

      <DocumentRequestModal />
      <TodoModal 
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        onSuccess={() => {}}
        engagementId={engagementId!}
        mode={todoMode}
        sourceId={todoSourceId}
        initialData={todoInitialData}
        service={selectedService || 'AUDITING'}
      />

      <TemplateModal 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] })}
        type="DOC_REQUEST"
        engagementId={engagementId!}
      />
    </div>
  );
};

export default function DocumentRequestsView({ engagementId }: DocumentRequestsViewProps) {
  return (
    <DocumentRequestsProvider engagementId={engagementId}>
      <DocumentRequestsContent />
    </DocumentRequestsProvider>
  );
}
