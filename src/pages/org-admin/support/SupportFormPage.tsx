import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, ArrowLeft, Send, Upload, X } from "lucide-react";
import { Button } from "../../../ui/Button";
import { PageHeader } from "../../common/PageHeader";
import { ShadowCard } from "../../../ui/ShadowCard";
import AlertMessage from "../../common/AlertMessage";
import { useAuth } from "../../../context/auth-context-core";
import { apiPostFormData } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";

const SUBJECT_OPTIONS = [
  { id: "bookkeeping", label: "Bookkeeping" },
  { id: "vat", label: "VAT" },
  { id: "tax", label: "Tax" },
  { id: "incorporation", label: "Incorporation" },
  { id: "audit", label: "Audit" },
  { id: "payroll", label: "Payroll" },
  { id: "cfo", label: "CFO Services" },
  { id: "csp-mbr", label: "CSP / MBR" },
  { id: "other", label: "Other" },
];

export default function SupportFormPage() {
  const navigate = useNavigate();
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [alert, setAlert] = useState<{ message: string; variant: "success" | "danger" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subject === "other" ? customSubject : subject;
    if (!subj?.trim()) {
      setAlert({ message: "Please select or enter a subject", variant: "danger" });
      return;
    }
    if (!orgId) {
      setAlert({ message: "Organization context is missing", variant: "danger" });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const formData = new FormData();
      formData.append("subject", subj.trim());
      formData.append("description", description.trim());
      formData.append("organizationId", orgId);
      attachments.forEach((f) => formData.append("files", f));
      const res = await apiPostFormData<{ data?: unknown }>(
        endPoints.SUPPORT.CREATE,
        formData
      );
      if (res?.data !== undefined) {
        setAlert({ message: "Support request submitted successfully", variant: "success" });
        setSubject("");
        setCustomSubject("");
        setDescription("");
        setAttachments([]);
        setTimeout(() => navigate("/dashboard/support/tickets"), 1500);
      }
    } catch (err: any) {
      setAlert({
        message: err?.response?.data?.message ?? err?.message ?? "Failed to submit support request",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Submit a support request for your organization."
        icon={HelpCircle}
        actions={
          <Button variant="header" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        }
      />
      {alert && (
        <AlertMessage message={alert.message} variant={alert.variant} onClose={() => setAlert(null)} />
      )}
      <ShadowCard className="p-8 border border-gray-100 shadow-sm rounded-3xl bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Subject</label>
            <select
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select subject</option>
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            {subject === "other" && (
              <input
                type="text"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 mt-2"
                placeholder="Please specify"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Description</label>
            <textarea
              className="w-full min-h-[140px] px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50"
              placeholder="Describe your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Proofs / attachments (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add files
            </Button>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{f.name}</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-red-600 hover:underline">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl">
              {loading ? "Submitting..." : <><Send className="h-4 w-4 mr-2 inline" />Submit</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/support/tickets")} className="border-gray-300 text-gray-700">
              View my requests
            </Button>
          </div>
        </form>
      </ShadowCard>
    </div>
  );
}
