import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
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
}

interface TicketItem {
  id: string;
  status: string;
  createdAt: string;
  supportRequest?: { subject: string } | null;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        )}

        <h3 className="text-sm font-bold text-gray-700 mb-3">Tickets</h3>
        {tickets.length === 0 ? (
          <p className="text-gray-500 py-4">No ticket yet. When your request is accepted, a ticket will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Subject</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Ticket status</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Created</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-4 font-medium text-gray-900">{t.supportRequest?.subject ?? "—"}</td>
                    <td className="py-4">
                      <TicketStatusBadge status={t.status} />
                    </td>
                    <td className="py-4 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/support/tickets/${t.id}`)}
                      >
                        View updates
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ShadowCard>
    </div>
  );
}
