import { useQuery } from "@tanstack/react-query";
import { Plus, File as FileIcon } from "lucide-react";
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

interface DocumentRequestsViewProps {
  engagementId?: string;
}

const DocumentRequestsContent = () => {
  const { engagementId, setIsAddModalOpen } = useDocumentRequests();
  const { selectedService } = useAuth();
  const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shrink-0">
              <FileIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Document Requests</h2>
              <p className="text-sm text-gray-500 mt-1">Manage {serviceName.toLowerCase()} documentation and compliance.</p>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="px-6 h-11"><Plus className="h-4 w-4 mr-2" /> New Request Group</Button>
        </div>
      </div>

      <div className="space-y-8">
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
                />
              ))}
            </DocumentRequestGroup>
          ))
        )}
      </div>

      <DocumentRequestModal />
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
