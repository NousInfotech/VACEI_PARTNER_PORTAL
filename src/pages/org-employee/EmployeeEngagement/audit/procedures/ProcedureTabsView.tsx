/**
 * Full fieldwork procedures view: Questions, Answers, Procedures (Recommendations + Reviews).
 * Ported from REFERENCE-PORTAL ProcedureTabsView to match exactly.
 */
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/Textarea";
import { Label } from "@/ui/label";
import { Checkbox } from "@/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/Dialog";
import {
  Plus,
  RefreshCw,
  Save,
  Loader2,
  Edit2,
  Trash2,
  X,
  FileText,
  Edit,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { getDecodedUserId } from "@/utils/authUtils";
import { formatClassificationForDisplay } from "./steps/procedureClassificationMapping";
import {
  FieldAnswerDisplay,
  FieldAnswerEditor,
  answerToEditString,
} from "./procedureViewHelpers";

function normalize(items?: any[]) {
  if (!Array.isArray(items)) return [];
  return items.map((q, i) => {
    const __uid =
      q.__uid ||
      q.id ||
      q._id ||
      `q_${Math.random().toString(36).slice(2, 10)}_${i}`;
    const id = q.id ?? __uid;
    const key = q.key || q.aiKey || `q${i + 1}`;
    return { ...q, __uid, id, key };
  });
}

function mergeAiAnswers(questions: any[], aiAnswers: any[]) {
  const map = new Map<string, string>();
  (aiAnswers || []).forEach((a: any) => {
    const k = String(a?.key || "").trim().toLowerCase();
    if (k) map.set(k, a?.answer || "");
  });
  return questions.map((q, i) => {
    const k = String(q.key || `q${i + 1}`).trim().toLowerCase();
    const answer = map.has(k) ? map.get(k) || "" : q.answer || "";
    return { ...q, answer };
  });
}

export interface ProcedureTabsViewProps {
  engagement: any;
  stepData: any;
  mode: "manual" | "ai" | "hybrid";
  /** When set (e.g. from Sections → Classification), only show questions matching this classification */
  currentClassification?: string | null;
  /** When stepData has no auditCycleId (e.g. from view tab), pass from parent so classification-answers can use AI */
  auditCycleId?: string | null;
  onComplete?: (data: any) => void;
  onBack?: () => void;
  updateProcedureParams?: (
    updates: Record<string, string | null>,
    replace?: boolean
  ) => void;
  onProcedureUpdate?: (data: any) => void;
  /** When in classification context, parent can trigger generate via this ref */
  generateQuestionsRef?: React.MutableRefObject<{ generate: () => Promise<void> } | null>;
  /** Called when generate starts/finishes so parent can show header button loading state */
  onGeneratingChange?: (generating: boolean) => void;
}

export const ProcedureTabsView: React.FC<ProcedureTabsViewProps> = ({
  engagement,
  stepData,
  mode,
  currentClassification,
  auditCycleId: auditCycleIdProp,
  onComplete,
  onBack: _onBack,
  updateProcedureParams,
  onProcedureUpdate,
  generateQuestionsRef,
  onGeneratingChange,
}) => {
  const { toast } = useToast();
  const engagementId = engagement?.id ?? engagement?._id;
  const currentUserId = getDecodedUserId() ?? "";

  const [activeTab, setActiveTab] = useState<
    "questions" | "answers" | "procedures"
  >("questions");
  const [proceduresViewMode, setProceduresViewMode] = useState<
    "procedures" | "reviews"
  >("procedures");
  const [questionFilter, setQuestionFilter] = useState<"all" | "unanswered">(
    "all"
  );

  const [questions, setQuestions] = useState<any[]>(
    normalize(stepData?.questions || [])
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [generatingAnswers, setGeneratingAnswers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerValue, setEditAnswerValue] = useState("");

  const [recommendations, setRecommendations] = useState<any[]>(
    Array.isArray(stepData?.recommendations) ? stepData.recommendations : []
  );
  const [generatingProcedures, setGeneratingProcedures] = useState(false);
  const [editingRecommendationId, setEditingRecommendationId] = useState<
    string | null
  >(null);
  const [editRecommendationText, setEditRecommendationText] = useState("");

  const [reviewStatus, setReviewStatus] = useState<string>(
    stepData?.reviewStatus || "in-progress"
  );
  const [reviewComments, setReviewComments] = useState<string>(
    stepData?.reviewComments || ""
  );
  const [isSavingReview, setIsSavingReview] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [_userNamesMap, _setUserNamesMap] = useState<Record<string, string>>({});
  const [editingReview, setEditingReview] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editReviewStatus, setEditReviewStatus] = useState("");
  const [editReviewComments, setEditReviewComments] = useState("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!engagementId) return;
    setIsLoadingReviews(true);
    try {
      const data = await apiGet<{ workflows?: any[] }>(
        endPoints.REVIEW.WORKFLOWS_BY_ENGAGEMENT(engagementId)
      ).catch(() => ({ workflows: [] }));
      const raw = (data as any)?.data ?? data;
      const list = Array.isArray(raw?.workflows) ? raw.workflows : [];
      const filtered = list.filter((w: any) => w.itemType === "procedure");
      setReviews(filtered);
    } catch {
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (engagementId && activeTab === "procedures" && proceduresViewMode === "reviews") {
      fetchReviews();
    }
  }, [engagementId, activeTab, proceduresViewMode]);

  useEffect(() => {
    if (stepData?.reviewStatus) setReviewStatus(stepData.reviewStatus);
    if (stepData?.reviewComments !== undefined)
      setReviewComments(stepData.reviewComments || "");
  }, [stepData]);

  // Sync questions and recommendations from stepData when it changes (e.g. after save, when switching to View tab).
  useEffect(() => {
    if (Array.isArray(stepData?.questions) && stepData.questions.length > 0) {
      setQuestions(normalize(stepData.questions));
    }
    if (Array.isArray(stepData?.recommendations)) {
      setRecommendations(stepData.recommendations);
    }
  }, [stepData?.questions, stepData?.recommendations]);

  const normalizeClassification = (c: string) =>
    (c || "").trim().replace(/\s*>\s*/g, " > ").trim();
  const matchesClassification = (
    itemClassification: string | undefined | null,
    filterClassification: string
  ): boolean => {
    if (!itemClassification || !filterClassification) return false;
    const normalizedFilter = normalizeClassification(filterClassification);
    const normalizedItem = normalizeClassification(itemClassification);
    if (normalizedItem === normalizedFilter) return true;
    if (normalizedItem.startsWith(normalizedFilter + " > ")) return true;
    if (normalizedFilter.startsWith(normalizedItem + " > ")) return true;
    return false;
  };

  const questionsForDisplay = useMemo(() => {
    if (currentClassification && currentClassification.trim() !== "") {
      return questions.filter((q: any) => {
        if (!q.classification) return true;
        return matchesClassification(q.classification, currentClassification);
      });
    }
    return questions;
  }, [questions, currentClassification]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === "unanswered") {
      return questionsForDisplay.filter((q: any) => !q.answer || q.answer.trim() === "");
    }
    return questionsForDisplay;
  }, [questionsForDisplay, questionFilter]);

  /** True when at least one question has actual content (not placeholder from minimal procedure). */
  const hasGeneratedQuestions = useMemo(
    () =>
      questionsForDisplay.some(
        (q: any) => ((q.question ?? q.label ?? "").toString().trim() !== "")
      ),
    [questionsForDisplay]
  );

  const questionsWithAnswers = useMemo(
    () => questionsForDisplay.filter((q: any) => q.answer && q.answer.trim() !== ""),
    [questionsForDisplay]
  );
  const unansweredQuestions = useMemo(
    () => questionsForDisplay.filter((q: any) => !q.answer || q.answer.trim() === ""),
    [questionsForDisplay]
  );

  const handleAddQuestion = () => {
    const newQuestion = {
      __uid: `new-${Date.now()}`,
      id: `new-${Date.now()}`,
      key: `q${questions.length + 1}`,
      question: "New question",
      answer: "",
      classification: stepData?.selectedClassifications?.[0] || "General",
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestionId(newQuestion.__uid);
    setEditQuestionText(newQuestion.question);
    setEditAnswerText("");
  };

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.__uid);
    setEditQuestionText(q.question || "");
    setEditAnswerText(q.answer || "");
  };

  const handleSaveQuestion = () => {
    if (!editingQuestionId) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.__uid === editingQuestionId
          ? { ...q, question: editQuestionText, answer: editAnswerText }
          : q
      )
    );
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditAnswerText("");
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditAnswerText("");
  };

  const handleDeleteQuestion = (questionUid: string) => {
    setQuestions((prev) => prev.filter((q) => q.__uid !== questionUid));
    toast({ title: "Question deleted", description: "The question has been removed." });
  };

  const handleGenerateQuestions = async () => {
    const auditCycleId = stepData?.auditCycleId;
    if (!auditCycleId) {
      toast({
        title: "Cannot generate questions",
        description: "Audit cycle is not loaded. Please go back and open this procedure again.",
        variant: "destructive",
      });
      return;
    }
    onGeneratingChange?.(true);
    setGeneratingQuestions(true);
    try {
      const res = await apiPost<any>(endPoints.PROCEDURES.GENERATE, {
        auditCycleId,
        type: "FIELDWORK",
        materialityValue: stepData?.materiality ?? 0,
        ...(currentClassification && String(currentClassification).trim() !== ""
          ? { categoryTitle: String(currentClassification).trim() }
          : {}),
      }).catch((err: any) => {
        toast({
          title: "Generation failed",
          description: err?.response?.data?.message ?? err?.message ?? "Could not generate questions.",
          variant: "destructive",
        });
        return null;
      });
      if (res == null) {
        return;
      }
      // API body: { success: true, data: { procedure, category, fields, questions }, message }
      const raw = (res as any)?.data ?? res;
      const dataObj = raw?.data ?? raw;
      const generatedQuestions =
        dataObj?.questions ??
        raw?.questions ??
        (Array.isArray(dataObj?.fields)
          ? (dataObj.fields as any[]).map((f: any) => ({
              key: f.key ?? f.id,
              question: f.label ?? f.question ?? "",
              answer: (f as any)?.answer ?? "",
              type: f.type,
              options: f.options,
            }))
          : []);
      const normalized = normalize(generatedQuestions);
      setQuestions(normalized);
      if (Array.isArray(dataObj?.recommendations ?? raw?.recommendations))
        setRecommendations(dataObj?.recommendations ?? raw?.recommendations);
      const procedure = dataObj?.procedure ?? raw?.procedure;
      const category = dataObj?.category ?? raw?.category;
      const procedureId = procedure?.id ?? procedure?._id ?? stepData?.id ?? stepData?._id;
      if (procedureId && onProcedureUpdate) {
        onProcedureUpdate({
          id: procedureId,
          _id: procedureId,
          procedure,
          category,
          questions: normalized,
          fields: dataObj?.fields ?? raw?.fields,
        });
      }
      toast({
        title: "Questions Generated",
        description: dataObj?.fallback ?? raw?.fallback
          ? "Template questions loaded (AI temporarily unavailable)."
          : normalized.length > 0
            ? `Generated ${normalized.length} questions.`
            : "Generation completed; no questions were returned.",
      });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || "Could not generate questions.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
      onGeneratingChange?.(false);
    }
  };

  useEffect(() => {
    if (generateQuestionsRef) {
      generateQuestionsRef.current = { generate: handleGenerateQuestions };
      return () => {
        generateQuestionsRef.current = null;
      };
    }
  });

  const handleGenerateAnswers = async () => {
    setGeneratingAnswers(true);
    try {
      const questionsWithoutAnswers = questions
        .filter((q: any) => !q.answer || q.answer.trim() === "")
        .map(({ answer, __uid, ...rest }: any) => rest);
      if (questionsWithoutAnswers.length === 0) {
        toast({ title: "Info", description: "All questions already have answers." });
        setGeneratingAnswers(false);
        return;
      }
      const procedureId = stepData?.id ?? stepData?._id ?? undefined;
      const auditCycleId = stepData?.auditCycleId ?? auditCycleIdProp ?? undefined;
      const data = await apiPost<any>(endPoints.PROCEDURES.CLASSIFICATION_ANSWERS, {
        engagementId,
        ...(procedureId && { procedureId }),
        ...(auditCycleId && { auditCycleId }),
        questions: questionsWithoutAnswers,
      }).catch(() => null);
      const dataObj = (data as any)?.data ?? (data as any);
      const aiAnswers = dataObj?.aiAnswers ?? (data as any)?.aiAnswers;
      const questionsFromApi = dataObj?.questions ?? (data as any)?.questions;
      let updated = questions;
      if (Array.isArray(aiAnswers)) {
        updated = mergeAiAnswers(questions, aiAnswers);
      } else if (Array.isArray(questionsFromApi)) {
        updated = normalize(questionsFromApi);
      }
      setQuestions(updated);
      if (dataObj?.recommendations ?? (data as any)?.recommendations) {
        const recs = Array.isArray(dataObj?.recommendations ?? (data as any)?.recommendations)
          ? (dataObj?.recommendations ?? (data as any)?.recommendations)
          : [];
        setRecommendations(recs);
      }
      toast({
        title: "Answers Generated",
        description:
          dataObj?.fallback ?? (data as any)?.fallback
            ? "Template answers loaded (AI temporarily unavailable)."
            : "Answers have been generated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || "Could not generate answers.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAnswers(false);
    }
  };

  const handleSaveAnswers = async () => {
    const auditCycleIdForSave = stepData?.auditCycleId ?? auditCycleIdProp;
    if (!auditCycleIdForSave) {
      toast({
        title: "Cannot save",
        description: "Audit cycle is not loaded. Please wait or refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...stepData,
        questions: questions.map(({ __uid, ...rest }: any) => rest),
        recommendations,
        status: "draft",
        procedureType: "procedures",
        mode,
      };
      const body = { ...payload, auditCycleId: auditCycleIdForSave };
      const res = await apiPost<any>(endPoints.PROCEDURES.FIELDWORK_SAVE, body);
      const data = (res as any)?.data ?? res;
      onProcedureUpdate?.({
        ...payload,
        auditCycleId: auditCycleIdForSave,
        _id: (res as any)?._id ?? data?._id ?? (res as any)?.procedure?.id ?? data?.id,
      });
      toast({
        title: "Answers Saved",
        description: "Your answers have been saved successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: (e as Error)?.message || "Could not save answers.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const safeTitle = engagement?.title || "Engagement";
      const yEnd = engagement?.yearEndDate ? new Date(engagement.yearEndDate) : null;
      const yearEndStr = yEnd
        ? `${yEnd.getFullYear()}-${String(yEnd.getMonth() + 1).padStart(2, "0")}-${String(yEnd.getDate()).padStart(2, "0")}`
        : "N/A";
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount ?? 0);

      const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.setFont("helvetica", "normal");
        const footerY = pageHeight - 8;
        doc.text(
          "Confidential — For audit purposes only. Unauthorized sharing is prohibited.",
          margin,
          footerY
        );
        doc.text(`Page ${pageCount}`, pageWidth - margin, footerY, { align: "right" });
      };

      doc.setFillColor(245, 246, 248);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.setFontSize(18);
      doc.text("Audit Procedures Report", margin, 40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Engagement: ${safeTitle}`, margin, 55);
      doc.text(`Mode: ${(stepData?.mode || "").toUpperCase() || "N/A"}`, margin, 63);
      doc.text(`Materiality: ${formatCurrency(stepData?.materiality || 0)}`, margin, 71);
      doc.text(`Year End: ${yearEndStr}`, margin, 79);
      if (currentClassification) {
        doc.text(`Classification: ${currentClassification}`, margin, 87);
      }
      doc.setDrawColor(200);
      doc.line(margin, 96, pageWidth - margin, 96);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Summary", margin, 110);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const validCount = filteredQuestions.filter((q: any) => q.isValid !== false).length;
      doc.text(`Total Procedures: ${filteredQuestions?.length || 0}`, margin, 120);
      doc.text(`Valid Items: ${validCount}`, margin, 128);
      addFooter();
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        `Procedures — ${currentClassification ? currentClassification : "All"}`,
        margin,
        20
      );
      const body = filteredQuestions.map((q: any, idx: number) => [
        String(idx + 1),
        q.question || "",
        q.answer ? String(q.answer) : "",
      ]);
      (autoTable as any)(doc, {
        startY: 26,
        head: [["#", "Question", "Answer"]],
        body,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2, valign: "top" },
        headStyles: { fillColor: [240, 240, 240], textColor: 20, halign: "left" },
        margin: { left: margin, right: margin },
        didDrawPage: addFooter,
      });
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        `Audit Recommendations${currentClassification ? ` — ${formatClassificationForDisplay(currentClassification)}` : ""}`,
        margin,
        20
      );
      const strip = (s: string) =>
        String(s)
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/__(.*?)__/g, "$1")
          .replace(/_(.*?)_/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/\s+/g, " ")
          .trim();
      const recommendationsText =
        recommendations.length > 0
          ? recommendations
              .map((item: any) => `${item.checked ? "[x]" : "[ ]"} ${item.text || ""}`)
              .join("\n")
          : "No recommendations provided.";
      const lines = recommendationsText.split(/\r?\n/);
      let y = 30;
      const write = (text: string, bold = false, size = 11) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        const wrapped = doc.splitTextToSize(text, pageWidth - 2 * margin);
        if (y + wrapped.length * 6 > pageHeight - margin) {
          addFooter();
          doc.addPage();
          y = 20;
        }
        doc.text(wrapped, margin, y);
        y += wrapped.length * 6;
      };
      for (const raw of lines) {
        const line = String(raw).trim();
        if (!line) {
          y += 6;
          continue;
        }
        if (line.startsWith("### ")) {
          write(strip(line.replace(/^###\s*/, "")), true, 13);
          y += 2;
          continue;
        }
        if (line.startsWith("#### ")) {
          write(strip(line.replace(/^####\s*/, "")), true, 12);
          y += 2;
          continue;
        }
        if (line.startsWith("- ")) {
          const indentX = margin + 6;
          const avail = pageWidth - indentX - margin;
          const wrapped = doc.splitTextToSize(strip(line.slice(2)), avail);
          if (y + wrapped.length * 6 > pageHeight - margin) {
            addFooter();
            doc.addPage();
            y = 20;
          }
          doc.text("•", margin, y);
          wrapped.forEach((w: string, i: number) => doc.text(w, indentX, y + i * 6));
          y += wrapped.length * 6;
          continue;
        }
        write(strip(line));
      }
      addFooter();
      const date = new Date();
      const fname = `Audit_Procedures_${safeTitle
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60)}_${date.toISOString().slice(0, 10)}.pdf`;
      doc.save(fname);
      toast({ title: "Exported", description: `${fname} has been downloaded.` });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Export failed",
        description: err?.message || "Could not export the PDF.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProcedures = async () => {
    setGeneratingProcedures(true);
    setActiveTab("procedures");
    try {
      if (unansweredQuestions.length > 0) await handleGenerateAnswers();
      const procedureId = stepData?._id || stepData?.id;
      let fallbackProcedures = false;
      if (procedureId) {
        const res = await apiPost<any>(
          endPoints.PROCEDURES.GENERATE_RECOMMENDATIONS(procedureId)
        ).catch(() => null);
        const raw = (res as any)?.data ?? res;
        const dataObj = raw?.data ?? raw;
        const recs = Array.isArray(dataObj?.recommendations ?? raw?.recommendations)
          ? (dataObj?.recommendations ?? raw?.recommendations)
          : [];
        setRecommendations(recs);
        fallbackProcedures = Boolean(dataObj?.fallback ?? raw?.fallback);
      }
      toast({
        title: "Procedures Generated",
        description: fallbackProcedures
          ? "Template procedures loaded (AI temporarily unavailable)."
          : "Recommendations have been generated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: (e as Error)?.message || "Could not generate procedures.",
        variant: "destructive",
      });
    } finally {
      setGeneratingProcedures(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...stepData,
        questions: questions.map(({ __uid, ...rest }: any) => rest),
        recommendations,
        status: "completed",
        procedureType: "procedures",
        mode,
      };
      // Fieldwork is stored per audit cycle; always use fieldwork save endpoint and require auditCycleId
      const auditCycleIdForSave = stepData?.auditCycleId ?? auditCycleIdProp;
      if (!auditCycleIdForSave) {
        toast({
          title: "Cannot save",
          description: "Audit cycle is not loaded. Please wait or refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      const body = { ...payload, auditCycleId: auditCycleIdForSave };
      const saved = await apiPost<any>(endPoints.PROCEDURES.FIELDWORK_SAVE, body);
      const savedData = (saved as any)?.data ?? saved;
      const procedureId = (saved as any)?._id ?? savedData?._id ?? savedData?.id ?? (saved as any)?.procedure?.id;
      const completePayload = {
        ...payload,
        ...(savedData && typeof savedData === "object"
          ? {
              questions: savedData.questions ?? payload.questions,
              recommendations: savedData.recommendations ?? payload.recommendations,
              ...savedData,
            }
          : {}),
        _id: procedureId ?? savedData?.id,
        auditCycleId: payload.auditCycleId ?? savedData?.auditCycleId ?? auditCycleIdForSave,
      };
      onProcedureUpdate?.(completePayload);
      // Notify parent first so state/ref are set before URL change; then switch to View (keeps View tab active)
      onComplete?.(completePayload);
      updateProcedureParams?.(
        { procedureTab: "view", procedureType: "fieldwork", mode: null, step: null },
        false
      );
      toast({
        title: "Procedures Saved",
        description: "Your audit procedures have been saved successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: (e as Error)?.message || "Could not save procedures.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecommendation = (rec: any, idx: number) => {
    const recId = rec.id || rec.__uid || `rec-${idx}`;
    setEditingRecommendationId(recId);
    setEditRecommendationText(
      typeof rec === "string" ? rec : rec.text || rec.content || ""
    );
  };

  const handleSaveRecommendation = () => {
    if (!editingRecommendationId) return;
    setRecommendations((prev) =>
      prev.map((rec, idx) => {
        const recId = rec.id || rec.__uid || `rec-${idx}`;
        if (recId === editingRecommendationId) {
          return typeof rec === "string"
            ? editRecommendationText
            : { ...rec, text: editRecommendationText };
        }
        return rec;
      })
    );
    setEditingRecommendationId(null);
    setEditRecommendationText("");
    toast({ title: "Recommendation Updated", description: "Your recommendation has been updated." });
  };

  const handleCancelEditRecommendation = () => {
    setEditingRecommendationId(null);
    setEditRecommendationText("");
  };

  const handleDeleteRecommendation = (rec: any, idx: number) => {
    const recId = rec.id || rec.__uid || `rec-${idx}`;
    setRecommendations((prev) =>
      prev.filter((r, i) => (r.id || r.__uid || `rec-${i}`) !== recId)
    );
    toast({ title: "Recommendation deleted", description: "The recommendation has been removed." });
  };

  const handleAddRecommendation = () => {
    const newRec = { id: `rec-${Date.now()}`, text: "New recommendation", checked: false };
    setRecommendations([...recommendations, newRec]);
    setEditingRecommendationId(newRec.id);
    setEditRecommendationText(newRec.text);
  };

  const handleCheckboxToggle = (itemId: string) => {
    setRecommendations((prev) =>
      prev.map((item: any, i: number) => {
        const rId = item.id || item.__uid || `rec-${i}`;
        return rId === itemId ? { ...item, checked: !item.checked } : item;
      })
    );
  };

  const handleSaveReview = async () => {
    setIsSavingReview(true);
    try {
      const payload = {
        ...stepData,
        questions: questions.map(({ __uid, ...rest }: any) => rest),
        recommendations,
        reviewStatus,
        reviewComments,
        status: "completed",
        procedureType: "procedures",
        mode,
      };
      await apiPost(endPoints.PROCEDURES.SAVE, payload);
      onProcedureUpdate?.(payload);
      await fetchReviews();
      toast({ title: "Review Saved", description: "Your review has been saved successfully." });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: (e as Error)?.message || "Could not save review.",
        variant: "destructive",
      });
    } finally {
      setIsSavingReview(false);
    }
  };

  const isReviewOwner = (review: any) => {
    if (!currentUserId) return false;
    return (
      review.reviewedBy === currentUserId ||
      review.approvedBy === currentUserId ||
      review.signedOffBy === currentUserId ||
      review.reopenedBy === currentUserId ||
      review.assignedReviewer === currentUserId
    );
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setEditReviewStatus(review.status || "");
    setEditReviewComments(review.reviewComments || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    setIsUpdatingReview(true);
    try {
      const { apiPut } = await import("@/config/base");
      await apiPut(endPoints.REVIEW.UPDATE_WORKFLOW(editingReview._id), {
        status: editReviewStatus,
        reviewComments: editReviewComments,
      }).catch(() => {
        throw new Error("Failed to update review");
      });
      await fetchReviews();
      setIsEditDialogOpen(false);
      setEditingReview(null);
      toast({ title: "Review Updated", description: "Your review has been updated successfully." });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: (e as Error)?.message || "Could not update review.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone."))
      return;
    setIsDeletingReview(reviewId);
    try {
      const { apiDelete } = await import("@/config/base");
      await apiDelete(endPoints.REVIEW.DELETE_WORKFLOW(reviewId));
      await fetchReviews();
      toast({ title: "Review Deleted", description: "Your review has been deleted successfully." });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: (e as Error)?.message || "Could not delete review.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingReview(null);
    }
  };

  const reviewStatusOptions = [
    "in-progress",
    "ready-for-review",
    "under-review",
    "approved",
    "rejected",
    "signed-off",
    "re-opened",
  ];

  const inClassificationContext = !!currentClassification?.trim();

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className={inClassificationContext ? "w-full" : "flex-1 flex flex-col"}
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-md">
          <TabsTrigger value="questions" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Questions</TabsTrigger>
          <TabsTrigger value="answers" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Answers</TabsTrigger>
          <TabsTrigger value="procedures" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Procedures</TabsTrigger>
        </TabsList>

        <TabsContent
          value="questions"
          className={inClassificationContext ? "space-y-3 mt-4" : "flex-1 flex flex-col mt-4"}
        >
          <div className="flex items-center justify-between mb-4">
            {inClassificationContext ? (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                <div className="flex gap-2">
                  {hasGeneratedQuestions ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateQuestions}
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Regenerate Questions
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGenerateQuestions}
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Generate Questions
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAnswers}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant={questionFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuestionFilter("all")}
                  >
                    All Questions
                  </Button>
                  <Button
                    variant={questionFilter === "unanswered" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuestionFilter("unanswered")}
                  >
                    Unanswered Questions
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateQuestions}
                    disabled={generatingQuestions}
                  >
                    {generatingQuestions ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {hasGeneratedQuestions ? "Regenerate Questions" : "Generate Questions"}
                  </Button>
                </div>
              </>
            )}
          </div>
          <ScrollArea className={inClassificationContext ? "h-[500px]" : "flex-1"}>
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {inClassificationContext
                    ? 'No questions available. Click "Generate Questions" or "Add Question" to create one.'
                    : questionFilter === "unanswered"
                      ? "All questions have been answered."
                      : "No questions available. Click 'Generate Questions' or 'Add Question' to create one."}
                </div>
              ) : (
                filteredQuestions.map((q: any, idx: number) => (
                  <Card key={q.id || q.__uid || idx} className={inClassificationContext ? undefined : "border border-gray-200"}>
                    <CardContent className="pt-6">
                      {editingQuestionId === q.__uid ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{idx + 1}.</div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveQuestion}>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={editQuestionText}
                            onChange={(e) => setEditQuestionText(e.target.value)}
                            placeholder="Question"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div className="font-medium mb-1">
                              {idx + 1}. {q.question || "—"}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q)}>
                                {inClassificationContext ? (
                                  <Edit className="h-4 w-4" />
                                ) : (
                                  <Edit2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuestion(q.__uid)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {q.framework && (
                            <Badge className={inClassificationContext ? "mr-2 mt-2" : "mr-2"} variant="default">
                              {q.framework}
                            </Badge>
                          )}
                          {q.reference && (
                            <Badge className={inClassificationContext ? "mt-2" : undefined} variant="default">
                              {q.reference}
                            </Badge>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="answers"
          className={inClassificationContext ? "space-y-3 mt-4" : "flex-1 flex flex-col mt-4"}
        >
          <div className="flex items-center justify-between mb-4">
            {inClassificationContext ? (
              <>
                <div className="flex gap-2">
                  {filteredQuestions.length > 0 ? (
                    questionsWithAnswers.length > 0 ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerateAnswers}
                        disabled={generatingAnswers}
                      >
                        {generatingAnswers ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Regenerate Answers
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerateAnswers}
                        disabled={generatingAnswers}
                      >
                        {generatingAnswers ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Generate Answers
                      </Button>
                    )
                  ) : (
                    <div className="text-muted-foreground text-sm">No questions added yet.</div>
                  )}
                </div>
                {filteredQuestions.length > 0 && (
                  <Button variant="default" size="sm" onClick={handleSaveAnswers} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Answers
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  {questionsWithAnswers.length} answered • {unansweredQuestions.length} unanswered
                </div>
                <div className="flex items-center gap-2">
                  {unansweredQuestions.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleGenerateAnswers}
                      disabled={generatingAnswers}
                    >
                      {generatingAnswers ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Generate Answers
                    </Button>
                  )}
                  {questionsWithAnswers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAnswers}
                      disabled={generatingAnswers}
                    >
                      {generatingAnswers ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Regenerate Answers
                    </Button>
                  )}
                  {(questionsWithAnswers.length > 0 || unansweredQuestions.length > 0) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveAnswers}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Answers
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
          <ScrollArea className={inClassificationContext ? "h-[500px]" : "flex-1"}>
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions available. Go to Questions tab to add questions.
                </div>
              ) : inClassificationContext ? (
                questionsWithAnswers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No answers available. Go to Questions tab to add questions.
                  </div>
                ) : (
                  questionsWithAnswers.map((q: any, idx: number) => {
                    const fieldLike = {
                      __uid: q.__uid,
                      key: q.key,
                      label: q.question,
                      answer: q.answer,
                      type: q.type,
                      options: q.options,
                    };
                    return (
                      <Card key={q.id || q.__uid || idx}>
                        <CardContent className="pt-6">
                          <div className="font-medium mb-2">
                            {idx + 1}. {q.question || "—"}
                          </div>
                          {editingAnswerId === q.__uid ? (
                            <FieldAnswerEditor
                              field={fieldLike}
                              value={editAnswerValue}
                              onChange={setEditAnswerValue}
                              onSave={(savedValue) => {
                                setQuestions((prev) =>
                                  prev.map((question) =>
                                    question.__uid === q.__uid
                                      ? { ...question, answer: savedValue }
                                      : question
                                  )
                                );
                                setEditingAnswerId(null);
                                setEditAnswerValue("");
                              }}
                              onCancel={() => {
                                setEditingAnswerId(null);
                                setEditAnswerValue("");
                              }}
                            />
                          ) : (
                            <>
                              <div className="text-sm text-muted-foreground mb-3">
                                <FieldAnswerDisplay field={fieldLike} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAnswerId(q.__uid);
                                    setEditAnswerValue(answerToEditString(fieldLike));
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit Answer
                                </Button>
                                {q.framework && <Badge variant="default">{q.framework}</Badge>}
                                {q.reference && <Badge variant="default">{q.reference}</Badge>}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )
              ) : (
                <>
                  {questionsWithAnswers.map((q: any, idx: number) => {
                    const fieldLike = {
                      __uid: q.__uid,
                      key: q.key,
                      label: q.question,
                      answer: q.answer,
                      type: q.type,
                      options: q.options,
                    };
                    return (
                      <Card key={q.__uid || idx} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="font-medium mb-2">
                            {idx + 1}. {q.question || "—"}
                          </div>
                          {editingAnswerId === q.__uid ? (
                            <FieldAnswerEditor
                              field={fieldLike}
                              value={editAnswerValue}
                              onChange={setEditAnswerValue}
                              onSave={(savedValue) => {
                                setQuestions((prev) =>
                                  prev.map((question) =>
                                    question.__uid === q.__uid
                                      ? { ...question, answer: savedValue }
                                      : question
                                  )
                                );
                                setEditingAnswerId(null);
                                setEditAnswerValue("");
                              }}
                              onCancel={() => {
                                setEditingAnswerId(null);
                                setEditAnswerValue("");
                              }}
                            />
                          ) : (
                            <>
                              <div className="text-sm text-muted-foreground mb-3">
                                <FieldAnswerDisplay field={fieldLike} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAnswerId(q.__uid);
                                    setEditAnswerValue(answerToEditString(fieldLike));
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit Answer
                                </Button>
                                {q.framework && <Badge variant="default">{q.framework}</Badge>}
                                {q.reference && <Badge variant="default">{q.reference}</Badge>}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {unansweredQuestions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-4">Unanswered Questions</h4>
                      {unansweredQuestions.map((q: any, idx: number) => (
                        <Card key={q.__uid || idx} className="mb-4 border border-gray-200">
                          <CardContent className="pt-6">
                            <div className="font-medium mb-2">
                              {questionsWithAnswers.length + idx + 1}. {q.question || "—"}
                            </div>
                            <div className="text-sm text-muted-foreground italic mb-3">
                              No answer.
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="procedures"
          className={inClassificationContext ? "space-y-3 mt-4" : "flex-1 flex flex-col mt-4"}
        >
          {proceduresViewMode === "reviews" ? (
            <div
              className={inClassificationContext ? "space-y-3 overflow-x-hidden flex flex-col" : "flex-1 flex flex-col overflow-x-hidden"}
              style={inClassificationContext ? { height: "calc(100vh - 300px)", minHeight: "500px", width: "100%", maxWidth: "100%" } : undefined}
            >
              <div className={`flex flex-col gap-2 mb-4 w-full ${inClassificationContext ? "shrink-0" : ""}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProceduresViewMode("procedures")}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Back to Procedures
                </Button>
                <div className="flex items-center justify-between w-full">
                  <h4 className="text-lg font-semibold">Overall Review</h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-[180px] border rounded-md px-3 py-2 text-sm"
                    >
                      {reviewStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace(/-/g, " ")}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveReview}
                      disabled={isSavingReview}
                    >
                      {isSavingReview ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Review
                    </Button>
                  </div>
                </div>
              </div>
              <div className={`mb-4 w-full ${inClassificationContext ? "shrink-0" : ""}`} style={inClassificationContext ? { width: "100%", maxWidth: "100%", boxSizing: "border-box" } as React.CSSProperties : undefined}>
                <Label htmlFor="review-comments" className="shrink-0">
                  Overall Review Comments
                </Label>
                <Textarea
                  id="review-comments"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Add your review comments here..."
                  className={inClassificationContext ? "min-h-[100px] max-h-[200px] mt-2 w-full resize-none border border-input focus:border-input focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none" : "min-h-[100px] max-h-[200px] mt-2 w-full resize-none"}
                  style={inClassificationContext ? { width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" } as React.CSSProperties : undefined}
                />
              </div>
              <ScrollArea className={inClassificationContext ? "h-[500px] border rounded-md p-4" : "flex-1"}>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-md font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Reviews ({reviews.length} reviews)
                        </h5>
                        <Button variant="outline" size="sm" onClick={fetchReviews} disabled={isLoadingReviews}>
                          {isLoadingReviews ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Refresh
                        </Button>
                      </div>
                      {isLoadingReviews ? (
                        <Card className={inClassificationContext ? undefined : "border border-gray-200"}>
                          <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              Loading reviews...
                            </div>
                          </CardContent>
                        </Card>
                      ) : reviews.length === 0 ? (
                        <Card className={inClassificationContext ? undefined : "border border-gray-200"}>
                          <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground py-8">
                              No reviews found for this engagement.
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        reviews.map((review: any, idx: number) => {
                          const statusColors: Record<string, string> = inClassificationContext
                            ? {
                                "in-progress": "bg-gray-100 text-gray-800",
                                "ready-for-review": "bg-blue-100 text-blue-800",
                                "under-review": "bg-yellow-100 text-yellow-800",
                                approved: "bg-green-100 text-green-800",
                                rejected: "bg-red-100 text-red-800",
                                "signed-off": "bg-purple-100 text-purple-800",
                                "re-opened": "bg-orange-100 text-orange-800",
                              }
                            : {
                                "in-progress": "bg-muted text-muted-foreground",
                                "ready-for-review": "bg-blue-100 text-blue-800",
                                "under-review": "bg-yellow-100 text-yellow-800",
                                approved: "bg-green-100 text-green-800",
                                rejected: "bg-red-100 text-red-800",
                                "signed-off": "bg-purple-100 text-purple-800",
                                "re-opened": "bg-orange-100 text-orange-800",
                              };
                          const isOwner = isReviewOwner(review);
                          return (
                            <Card key={review._id || idx} className={inClassificationContext ? "mb-4" : "mb-4 border border-gray-200"}>
                              <CardContent className="pt-6 pb-6">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          className={
                                            statusColors[review.status] ||
                                            (inClassificationContext ? "bg-gray-100 text-gray-800" : "bg-muted text-muted-foreground")
                                          }
                                        >
                                          {review.status || "N/A"}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{review.itemType || "N/A"}</span>
                                      </div>
                                      {review.reviewComments && (
                                        <div className="text-sm text-muted-foreground mb-2">{review.reviewComments}</div>
                                      )}
                                    </div>
                                    {isOwner && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditReview(review)}
                                          disabled={isDeletingReview === review._id}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteReview(review._id)}
                                          disabled={isDeletingReview === review._id}
                                        >
                                          {isDeletingReview === review._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className={inClassificationContext ? "h-4 w-4 text-destructive" : "h-4 w-4 text-red-600"} />
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Audit Recommendations</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProceduresViewMode("reviews")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Reviews
                  </Button>
                  {inClassificationContext ? (
                    filteredQuestions.length > 0 && questionsWithAnswers.length > 0 ? (
                      recommendations.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateProcedures}
                          disabled={generatingProcedures || questionsWithAnswers.length === 0}
                        >
                          {generatingProcedures ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Regenerate Procedures
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleGenerateProcedures}
                          disabled={generatingProcedures || questionsWithAnswers.length === 0}
                        >
                          {generatingProcedures ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          Generate Procedures
                        </Button>
                      )
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        {filteredQuestions.length === 0 ? "Generate questions first." : "Generate answers first."}
                      </div>
                    )
                  ) : questionsWithAnswers.length > 0 ? (
                    recommendations.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateProcedures}
                        disabled={generatingProcedures || questionsWithAnswers.length === 0}
                      >
                        {generatingProcedures ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Regenerate Procedures
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerateProcedures}
                        disabled={generatingProcedures || questionsWithAnswers.length === 0}
                      >
                        {generatingProcedures ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Generate Procedures
                      </Button>
                    )
                  ) : (
                    <div className="text-muted-foreground text-sm">Generate answers first.</div>
                  )}
                  <Button variant="outline" size="sm" onClick={handleAddRecommendation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Procedures
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleComplete}
                    disabled={
                      inClassificationContext
                        ? isSaving || filteredQuestions.length === 0 || questionsWithAnswers.length === 0
                        : isSaving || questionsWithAnswers.length === 0
                    }
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {inClassificationContext ? "Save Procedures" : "Save & Complete"}
                  </Button>
                </div>
              </div>
              <ScrollArea className={inClassificationContext ? "h-[500px]" : "flex-1"}>
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {inClassificationContext
                        ? 'No recommendations generated yet. Click "Add Recommendation" to create one.'
                        : questionsWithAnswers.length > 0
                          ? "No recommendations generated yet. Click 'Generate Procedures' to create recommendations."
                          : "Generate questions and answers first, then generate procedures."}
                    </div>
                  ) : (
                    recommendations.map((rec: any, idx: number) => {
                      const recId = rec.id || rec.__uid || `rec-${idx}`;
                      const recText =
                        typeof rec === "string" ? rec : rec.text || rec.content || "—";
                      const isEditing = editingRecommendationId === recId;
                      return (
                        <Card key={recId} className={inClassificationContext ? undefined : "border border-gray-200"}>
                          <CardContent className="pt-6">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="font-medium">{idx + 1}.</div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveRecommendation}>
                                      <Save className="h-4 w-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEditRecommendation}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                                <Textarea
                                  value={editRecommendationText}
                                  onChange={(e) => setEditRecommendationText(e.target.value)}
                                  placeholder="Recommendation"
                                  className="min-h-[100px]"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  {inClassificationContext ? (
                                    <>
                                      <div className="flex items-start space-x-3 flex-1">
                                        <Checkbox
                                          checked={rec.checked || false}
                                          onCheckedChange={() => handleCheckboxToggle(recId)}
                                          className="mt-1"
                                        />
                                        <span
                                          className={
                                            rec.checked
                                              ? "line-through text-muted-foreground flex-1"
                                              : "font-medium mb-2 text-black flex-1"
                                          }
                                        >
                                          {recText}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditRecommendation(rec, idx)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteRecommendation(rec, idx)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-medium mb-2 text-black">{idx + 1}. {recText}</div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditRecommendation(rec, idx)}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteRecommendation(rec, idx)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {!inClassificationContext && rec.checked !== undefined && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={rec.checked ? "default" : "secondary"}>
                                      {rec.checked ? "Completed" : "Pending"}
                                    </Badge>
                                  </div>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-review-status">Status</Label>
              <select
                id="edit-review-status"
                value={editReviewStatus}
                onChange={(e) => setEditReviewStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1 text-sm"
              >
                {reviewStatusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-review-comments">Review Comments</Label>
              <Textarea
                id="edit-review-comments"
                value={editReviewComments}
                onChange={(e) => setEditReviewComments(e.target.value)}
                placeholder="Enter review comments..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateReview} disabled={isUpdatingReview}>
              {isUpdatingReview ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
