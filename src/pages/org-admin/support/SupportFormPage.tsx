import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HelpCircle, 
  ArrowLeft, 
  Send, 
  Upload, 
  X, 
  Calculator, 
  Percent, 
  FileText, 
  Building, 
  Search, 
  Users, 
  PieChart, 
  Shield, 
  MoreHorizontal,
  FileIcon,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Button } from "../../../ui/Button";
import { PageHeader } from "../../common/PageHeader";
import { ShadowCard } from "../../../ui/ShadowCard";
import AlertMessage from "../../common/AlertMessage";
import { useAuth } from "../../../context/auth-context-core";
import { apiPostFormData } from "../../../config/base";
import { endPoints } from "../../../config/endPoint";
const SUBJECT_OPTIONS = [
  { id: "bookkeeping", label: "Bookkeeping", icon: Calculator },
  { id: "vat", label: "VAT", icon: Percent },
  { id: "tax", label: "Tax", icon: FileText },
  { id: "incorporation", label: "Incorporation", icon: Building },
  { id: "audit", label: "Audit", icon: Search },
  { id: "payroll", label: "Payroll", icon: Users },
  { id: "cfo", label: "CFO Services", icon: PieChart },
  { id: "csp-mbr", label: "CSP / MBR", icon: Shield },
  { id: "other", label: "Other", icon: MoreHorizontal },
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Support Center"
        description="We're here to help. Select a category and describe your requirements."
        icon={HelpCircle}
        actions={
          <div className="flex gap-3">
            <Button 
                variant="header" 
                onClick={() => navigate("/dashboard/support/tickets")}
             >
              <Clock className="h-4 w-4 mr-2" />
              Request History
            </Button>
            <Button variant="header" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      {alert && (
        <AlertMessage message={alert.message} variant={alert.variant} onClose={() => setAlert(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Section */}
        <div className="lg:col-span-2 space-y-8">
          <ShadowCard className="p-0 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles size={16} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">New Request</h2>
                </div>
                <p className="text-sm text-slate-500">Please provide accurate details to help us assist you better.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Subject Selection Dropdown */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Select Category</label>
                    <div className="relative group">
                        <select
                            className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50/30 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer hover:bg-slate-50/80"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        >
                            <option value="" disabled>Choose a service category...</option>
                            {SUBJECT_OPTIONS.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <ChevronDown size={20} />
                        </div>
                    </div>

                    {subject === "other" && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                                type="text"
                                className="w-full h-14 px-6 rounded-2xl border border-slate-200 bg-slate-50/30 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-bold text-slate-700"
                                placeholder="Please specify the subject..."
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Request Details</label>
                    <div className="relative">
                        <textarea
                            className="w-full min-h-[180px] px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/30 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium leading-relaxed resize-none"
                            placeholder="Please describe your query or requirement in detail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <div className="absolute top-4 right-4 text-slate-200">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attachments (Optional)</label>
                        <span className="text-[10px] text-slate-400 font-medium">Images or PDF only</span>
                    </div>

                    <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        
                        {attachments.length === 0 ? (
                            <div 
                                className="flex flex-col items-center justify-center py-6 cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 mb-1">Click to upload files</p>
                                <p className="text-xs text-slate-400">Drag and drop also supported</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {attachments.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                                <FileIcon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{f.name}</span>
                                                <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeAttachment(i)} 
                                            className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-dashed border-slate-200 text-slate-500 hover:text-primary hover:border-primary/50 transition-all font-bold text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-3.5 w-3.5 mr-2" />
                                    ADD MORE FILES
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <Button 
                        type="submit" 
                        disabled={loading} 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] font-bold text-base"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Send className="h-5 w-5" />
                                Send Request
                            </div>
                        )}
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate("/dashboard")} 
                        className="px-8 h-14 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
          </ShadowCard>
        </div>

        {/* Sidebar Help Section */}
        <div className="space-y-6">
            <ShadowCard className="p-8 border-none shadow-xl shadow-slate-200/40 rounded-[32px] bg-slate-900 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                    <HelpCircle size={24} />
                </div>
                <h3 className="text-lg font-bold mb-4">How it works</h3>
                <ul className="space-y-6">
                    <li className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                        <div>
                            <p className="text-sm font-bold mb-1">Select Category</p>
                            <p className="text-xs text-white/50 leading-relaxed">Choose the service area your request belongs to.</p>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                        <div>
                            <p className="text-sm font-bold mb-1">Provide Details</p>
                            <p className="text-xs text-white/50 leading-relaxed">Be specific to ensure our team can assist you efficiently.</p>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                        <div>
                            <p className="text-sm font-bold mb-1">Upload Documents</p>
                            <p className="text-xs text-white/50 leading-relaxed">Attach any relevant proofs or supporting documents.</p>
                        </div>
                    </li>
                </ul>

            </ShadowCard>
        </div>
      </div>
    </div>
  );
}
