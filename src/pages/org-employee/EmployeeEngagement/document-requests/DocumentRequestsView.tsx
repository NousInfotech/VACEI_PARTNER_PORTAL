import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, FileCheck, AlertCircle } from "lucide-react";
import { ShadowCard } from "../../../../ui/ShadowCard";
import { Skeleton } from "../../../../ui/Skeleton";
import { useAuth } from "../../../../context/auth-context-core";
import { apiGet } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";
import { cn } from "../../../../lib/utils";

interface DocumentRequestsViewProps {
  engagementId?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface RequestedDocumentItem {
  id: string;
  documentName: string;
  isMandatory: boolean;
  status: string;
  createdAt: string;
  files?: { id: string; file_name: string; url: string }[];
}

interface DocumentRequestItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  deadline?: string | null;
  createdAt: string;
  requestedDocuments?: RequestedDocumentItem[];
}

export default function DocumentRequestsView({ engagementId }: DocumentRequestsViewProps) {
  const { selectedService } = useAuth();
  const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document-requests", engagementId],
    enabled: !!engagementId,
    queryFn: async () => {
      const res = await apiGet<ApiResponse<DocumentRequestItem | null>>(
        endPoints.DOCUMENT_REQUESTS,
        { engagementId } as Record<string, unknown>
      );
      return res?.data ?? null;
    },
  });

  const docRequest = data ?? null;
  const requestedDocs = docRequest?.requestedDocuments ?? [];
  const hasRequest = !!docRequest;

  const statusStyle = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "RECEIVED") return "bg-green-100 text-green-700";
    if (s === "IN_PROGRESS" || s === "PENDING") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ShadowCard className="p-0 overflow-hidden border border-gray-100 bg-white">
        <div className="p-6 md:p-8 border-b border-gray-50 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight font-secondary">
                {serviceName} Document Requests
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Request and track documents for this engagement.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-6">
          {!engagementId ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-600">
                Open an engagement from the Engagements list to see document requests.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : isError || !hasRequest ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-10 text-center">
              <FileText className="mx-auto h-14 w-14 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-600">No document request for this engagement.</p>
              <p className="mt-1 text-xs text-gray-500">When a request is created, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Main request card */}
              <div
                className={cn(
                  "rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300",
                  "hover:border-primary/20 hover:shadow-md"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{docRequest.title}</h3>
                    {docRequest.description && (
                      <p className="mt-1 text-sm text-gray-500">{docRequest.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
                      <span className={cn("px-2.5 py-1 rounded-lg", statusStyle(docRequest.status))}>
                        {docRequest.status}
                      </span>
                      {docRequest.deadline && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Due {new Date(docRequest.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requested documents list */}
                {requestedDocs.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Requested documents</h4>
                    <ul className="space-y-3">
                      {requestedDocs.map((doc) => (
                        <li
                          key={doc.id}
                          className={cn(
                            "flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4",
                            "bg-gray-50/50 hover:bg-gray-50 transition-colors"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                              <FileCheck className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{doc.documentName}</p>
                              {doc.isMandatory && (
                                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">
                                  Required
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc.files && doc.files.length > 0 && (
                              <span className="text-[11px] text-gray-500">
                                {doc.files.length} file{doc.files.length !== 1 ? "s" : ""}
                              </span>
                            )}
                            <span className={cn("px-2 py-1 rounded-lg text-xs font-semibold", statusStyle(doc.status))}>
                              {doc.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {requestedDocs.length === 0 && hasRequest && (
                  <p className="mt-4 text-sm text-gray-500">No individual documents listed for this request.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ShadowCard>
    </div>
  );
}
