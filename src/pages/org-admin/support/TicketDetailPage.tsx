import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Button } from "../../../ui/Button";
import { PageHeader } from "../../common/PageHeader";
import { ShadowCard } from "../../../ui/ShadowCard";
import { apiGet, apiPost } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
import { type ApiResponse } from "../../../lib/types";

interface TicketUpdateItem {
  id: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

interface TicketDetail {
  id: string;
  status: string;
  category: string;
  createdAt: string;
  supportRequest?: { id: string; subject: string; status: string } | null;
  updates?: TicketUpdateItem[];
}

function StatusBadge({ status }: { status: string }) {
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

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setError("Missing ticket ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet<ApiResponse<TicketDetail>>(endPoints.SUPPORT.TICKET_BY_ID(ticketId))
      .then((res) => setTicket(res?.data ?? null))
      .catch(() => setError("Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !description.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    apiPost<ApiResponse<unknown>>(endPoints.SUPPORT.TICKET_UPDATES(ticketId), {
      title: title.trim() || undefined,
      description: description.trim(),
    })
      .then(() => {
        setTitle("");
        setDescription("");
        return apiGet<ApiResponse<TicketDetail>>(endPoints.SUPPORT.TICKET_BY_ID(ticketId));
      })
      .then((res) => setTicket(res?.data ?? null))
      .catch((err) => setSubmitError(err?.response?.data?.message ?? "Failed to add update"))
      .finally(() => setSubmitting(false));
  };

  if (!ticketId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket" description="Invalid ticket." icon={MessageSquare} />
        <p className="text-gray-500">Missing ticket ID.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to tickets
        </Button>
      </div>
    );
  }

  if (loading || !ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket" description={error ?? "Loading..."} icon={MessageSquare} />
        {error && !loading && (
          <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
    );
  }

  const updates = ticket.updates ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket"
        description={ticket.supportRequest?.subject ?? "Support ticket"}
        icon={MessageSquare}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard/support/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to tickets
          </Button>
        }
      />

      <ShadowCard className="p-6 border border-gray-100 shadow-sm rounded-3xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Subject</p>
            <p className="font-medium text-gray-900">{ticket.supportRequest?.subject ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</p>
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-700 mb-3">Updates</h3>
        {updates.length === 0 ? (
          <p className="text-gray-500 py-4">No updates yet. Add one below.</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {updates.map((u) => (
              <li key={u.id} className="border-l-2 border-primary/30 pl-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">
                    {u.createdBy ? [u.createdBy.firstName, u.createdBy.lastName].filter(Boolean).join(" ") : "Support"}
                  </span>
                  <span>{new Date(u.createdAt).toLocaleString()}</span>
                </div>
                {u.title && <p className="font-medium text-gray-900">{u.title}</p>}
                {u.description && <p className="text-gray-700 whitespace-pre-wrap">{u.description}</p>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">Add update</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title (optional)</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Brief title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
              placeholder="Your message..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={submitting || !description.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Add update
          </Button>
        </form>
      </ShadowCard>
    </div>
  );
}
