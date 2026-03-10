import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Send } from "lucide-react";
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
  tickets?: { id: string; status: string }[];
}

function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    active: "bg-blue-100 text-blue-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-emerald-100 text-emerald-800",
    closed: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function TicketManagementPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet<ApiResponse<SupportRequestItem[]>>(endPoints.SUPPORT.GET_ALL, { limit: 50 })
      .then((res) => setRequests(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setError("Failed to load support requests"))
      .finally(() => setLoading(false));
  }, []);

  const ticketStatus = (r: SupportRequestItem) => {
    const t = r.tickets?.[0];
    return t ? t.status : "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="View and track your organization's support requests."
        icon={ListChecks}
        actions={
          <Button variant="header" onClick={() => navigate("/dashboard/support")}>
            <Send className="h-4 w-4 mr-2" />
            New support request
          </Button>
        }
      />

      <ShadowCard className="p-6 border border-gray-100 shadow-sm rounded-3xl bg-white">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <p className="py-6 text-center text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium">No support requests yet</p>
            <p className="text-sm mt-1">Submit a request from the support page.</p>
            <Button
              className="mt-4 bg-primary text-white"
              onClick={() => navigate("/dashboard/support")}
            >
              Go to Support
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Subject</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Description</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Request status</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Ticket status</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Submitted</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-4 font-medium text-gray-900">{r.subject}</td>
                    <td className="py-4 text-sm text-gray-600 max-w-xs">
                      <span className="line-clamp-2">{r.description || "—"}</span>
                    </td>
                    <td className="py-4 capitalize">
                      <RequestStatusBadge status={r.status.toLowerCase()} />
                    </td>
                    <td className="py-4 capitalize">
                      <TicketStatusBadge status={ticketStatus(r).toLowerCase()} />
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/support/tickets/request/${r.id}`)}
                      >
                        View
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
