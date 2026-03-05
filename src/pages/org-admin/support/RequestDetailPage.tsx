import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, FileText, ExternalLink } from "lucide-react";
import { Button } from "../../../ui/Button";
import { PageHeader } from "../../common/PageHeader";
import { ShadowCard } from "../../../ui/ShadowCard";
import { apiGet } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import { type ApiResponse } from "../../../lib/types";

interface SupportRequestItem {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  createdAt: string;
  attachments?: { id: string; file_name: string; url?: string }[];
}

interface TicketUpdateItem {
  id: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

interface TicketItem {
  id: string;
  status: string;
  createdAt: string;
  supportRequest?: { subject: string } | null;
  updates?: TicketUpdateItem[];
}

function TicketStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function UpdateItem({ u }: { u: TicketUpdateItem }) {
  return (
    <li className="border-l-2 border-gray-200 pl-4 py-2">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <span className="font-medium text-gray-700">
          {u.createdBy ? [u.createdBy.firstName, u.createdBy.lastName].filter(Boolean).join(" ") : "Support"}
        </span>
        <span>{new Date(u.createdAt).toLocaleString()}</span>
      </div>
      {u.title && <p className="font-medium text-gray-900">{u.title}</p>}
      {u.description && <p className="text-gray-700 whitespace-pre-wrap">{u.description}</p>}
    </li>
  );
}

export default function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SupportRequestItem | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setError("Missing request ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<ApiResponse<SupportRequestItem>>(endPoints.SUPPORT.GET_BY_ID(requestId)),
      apiGet<ApiResponse<TicketItem[]>>(endPoints.SUPPORT.TICKETS, { supportRequestId: requestId, limit: 20 }),
    ])
      .then(([reqRes, ticketsRes]) => {
        setRequest(reqRes?.data ?? null);
        setTickets(Array.isArray(ticketsRes?.data) ? ticketsRes.data : []);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (!requestId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Support request" description="Invalid request." icon={MessageSquare} />
        <p className="text-gray-500">Missing request ID.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
          Back to my requests
        </Button>
      </div>
    );
  }

  if (loading || !request) {
    return (
      <div className="space-y-6">
        <PageHeader title="Support request" description={error ?? "Loading..."} icon={MessageSquare} />
        {loading && <div className="py-12 text-center text-gray-500">Loading...</div>}
        {error && !loading && (
          <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
            Back to my requests
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support request"
        description={request.subject}
        icon={MessageSquare}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to my requests
          </Button>
        }
      />

      <ShadowCard className="p-6 border border-gray-100 shadow-sm rounded-3xl bg-white">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Request details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Subject</p>
            <p className="font-medium text-gray-900">{request.subject}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Request status</p>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                request.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-800" :
                request.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {request.status}
            </span>
          </div>
        </div>
        {request.description && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}
        {(request.attachments?.length ?? 0) > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Attachments
            </p>
            <ul className="flex flex-wrap gap-2">
              {request.attachments!.map((a) => (
                <li key={a.id}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline flex items-center gap-1">
                    {a.file_name}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 mt-8 pt-6 border-t border-gray-100">
          <MessageSquare className="w-4 h-4" />
          Tickets & updates
        </h3>
        {tickets.length === 0 ? (
          <p className="text-gray-500 py-4">No ticket yet. When your request is accepted, a ticket will appear here.</p>
        ) : (
          <div className="space-y-6">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-gray-100 bg-gray-50/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{t.supportRequest?.subject ?? "Ticket"}</span>
                  <TicketStatusBadge status={t.status} />
                </div>
                <p className="text-xs text-gray-500 mb-3">Created {new Date(t.createdAt).toLocaleDateString()}</p>
                {(t.updates?.length ?? 0) === 0 ? (
                  <p className="text-gray-500 text-sm">No updates yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {t.updates!.map((u) => (
                      <UpdateItem key={u.id} u={u} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </ShadowCard>
    </div>
  );
}
