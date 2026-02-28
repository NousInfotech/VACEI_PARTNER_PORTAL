/**
 * Planning procedures tabs view: Questions, Answers, Procedures (Recommendations + Reviews).
 * Ported from REFERENCE-PORTAL PlanningProcedureTabsView with VACEI API and UI imports.
 */
import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/Textarea";
import { Label } from "@/ui/label";
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
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/Dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { getDecodedUserId } from "@/utils/authUtils";
import { useMemberNamesMap } from "../hooks/useMemberNamesMap";

// Convert procedures/fields structure to questions-like structure (includes context for Q/A)
function proceduresToQuestions(procedures: any[]): any[] {
  const questions: any[] = [];
  procedures.forEach((proc) => {
    (proc.fields || []).forEach((field: any) => {
      questions.push({
        __uid: field.__uid || field.key || `q_${Math.random().toString(36).slice(2, 10)}`,
        id: field.key || field.__uid,
        key: field.key,
        question: field.label || field.question || "",
        answer: field.answer || "",
        sectionId: proc.sectionId,
        sectionTitle: proc.title,
        type: field.type,
        required: field.required,
        help: field.help,
        context: field.context ?? field.help ?? "",
        answerContext: field.answerContext ?? "",
      });
    });
  });
  return questions;
}

// Convert questions back to procedures/fields structure (persists context)
function questionsToProcedures(questions: any[], originalProcedures: any[]): any[] {
  const sectionMap = new Map<string, any>();

  originalProcedures.forEach((proc) => {
    sectionMap.set(proc.sectionId, {
      ...proc,
      fields: [],
    });
  });

  questions.forEach((q) => {
    const sectionId = q.sectionId;
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        sectionId,
        title: q.sectionTitle || sectionId,
        fields: [],
      });
    }
    const section = sectionMap.get(sectionId);
    section.fields.push({
      __uid: q.__uid,
      key: q.key,
      label: q.question,
      answer: q.answer,
      type: q.type || "text",
      required: q.required,
      help: q.help,
      context: q.context ?? "",
      answerContext: q.answerContext ?? "",
    });
  });

  return Array.from(sectionMap.values());
}

const PLANNING_SECTIONS = [
  { sectionId: "engagement_setup_acceptance_independence", title: "Engagement Setup, Acceptance & Independence" },
  { sectionId: "understanding_entity_environment", title: "Understanding the Entity & Its Environment" },
  { sectionId: "materiality_risk_summary", title: "Materiality & Risk Summary" },
  { sectionId: "risk_response_planning", title: "Risk Register & Audit Response Planning" },
  { sectionId: "fraud_gc_planning", title: "Fraud Risk & Going Concern Planning" },
  { sectionId: "compliance_laws_regulations", title: "Compliance with Laws & Regulations (ISA 250)" },
];

const reviewStatusOptions = [
  "in-progress",
  "ready-for-review",
  "under-review",
  "approved",
  "rejected",
  "signed-off",
  "re-opened",
];

interface PlanningProcedureTabsViewProps {
  engagement: any;
  stepData: any;
  mode: "manual" | "ai" | "hybrid";
  onComplete: (data: any) => void;
  onBack: () => void;
  updateProcedureParams?: (updates: Record<string, string | null>, replace?: boolean) => void;
}

export const PlanningProcedureTabsView: React.FC<PlanningProcedureTabsViewProps> = ({
  engagement,
  stepData,
  mode,
  onComplete,
  onBack,
  updateProcedureParams: _updateProcedureParams,
}) => {
  const { toast } = useToast();
  const engagementId = engagement?.id ?? engagement?._id;
  const currentUserId = getDecodedUserId() ?? "";

  const [activeTab, setActiveTab] = useState<"questions" | "answers" | "procedures" | "review">("questions");
  const [proceduresViewMode, setProceduresViewMode] = useState<"procedures" | "reviews">("procedures");
  const [questionFilter, setQuestionFilter] = useState<"all" | "unanswered">("all");

  const [procedures, setProcedures] = useState<any[]>(() => {
    if (stepData.procedures && stepData.procedures.length > 0) {
      return stepData.procedures;
    }
    return PLANNING_SECTIONS.map((section) => ({
      id: section.sectionId,
      sectionId: section.sectionId,
      title: section.title,
      fields: [],
    }));
  });

  const [questions, setQuestions] = useState<any[]>(() => proceduresToQuestions(procedures));

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [editContextText, setEditContextText] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatingContextQuestionId, setGeneratingContextQuestionId] = useState<string | null>(null);

  const [generatingAnswers, setGeneratingAnswers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerValue, setEditAnswerValue] = useState("");
  const [editAnswerContextValue, setEditAnswerContextValue] = useState("");

  const [recommendations, setRecommendations] = useState<any[]>(() => {
    const recs = Array.isArray(stepData.recommendations) ? stepData.recommendations : [];
    return recs.map((r: any) => (typeof r === "string" ? { id: `rec-${Date.now()}`, text: r, checked: false, context: "" } : { ...r, context: r.context ?? "" }));
  });
  const [generatingProcedures, setGeneratingProcedures] = useState(false);
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);
  const [editRecommendationText, setEditRecommendationText] = useState("");
  const [editRecommendationContext, setEditRecommendationContext] = useState("");
  const [generatingContextRecId, setGeneratingContextRecId] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState<string>(stepData.reviewStatus || "in-progress");
  const [reviewComments, setReviewComments] = useState<string>(stepData.reviewComments || "");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const [_reviewerId, setReviewerId] = useState<string>(stepData.reviewerId || "");
  const [_reviewedAt, setReviewedAt] = useState<string>(
    stepData.reviewedAt ? new Date(stepData.reviewedAt).toISOString().split("T")[0] : ""
  );
  const [_approvedBy, setApprovedBy] = useState<string>(stepData.approvedBy || "");
  const [_approvedAt, setApprovedAt] = useState<string>(
    stepData.approvedAt ? new Date(stepData.approvedAt).toISOString().split("T")[0] : ""
  );
  const [_signedOffBy, setSignedOffBy] = useState<string>(stepData.signedOffBy || "");
  const [_signedOffAt, setSignedOffAt] = useState<string>(
    stepData.signedOffAt ? new Date(stepData.signedOffAt).toISOString().split("T")[0] : ""
  );
  const [signOffComments, setSignOffComments] = useState<string>(stepData.signOffComments || "");
  const [_isSignedOff, setIsSignedOff] = useState<boolean>(stepData.isSignedOff || false);
  const [_isLocked, setIsLocked] = useState<boolean>(stepData.isLocked || false);
  const [_lockedAt, setLockedAt] = useState<string>(
    stepData.lockedAt ? new Date(stepData.lockedAt).toISOString().split("T")[0] : ""
  );
  const [_lockedBy, setLockedBy] = useState<string>(stepData.lockedBy || "");
  const [_reopenedAt, setReopenedAt] = useState<string>(
    stepData.reopenedAt ? new Date(stepData.reopenedAt).toISOString().split("T")[0] : ""
  );
  const [_reopenedBy, setReopenedBy] = useState<string>(stepData.reopenedBy || "");
  const [reopenReason, setReopenReason] = useState<string>(stepData.reopenReason || "");
  const [reviewVersion, setReviewVersion] = useState<number>(stepData.reviewVersion || 1);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editReviewStatus, setEditReviewStatus] = useState<string>("");
  const [editReviewComments, setEditReviewComments] = useState<string>("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [_reviewedItems, _setReviewedItems] = useState<Set<string>>(new Set());
  const [_itemReviewComments, _setItemReviewComments] = useState<Record<string, string>>({});

  const memberNamesMap = useMemberNamesMap(!!engagementId);

  const fetchReviews = async () => {
    if (!engagementId) return;
    setIsLoadingReviews(true);
    try {
      const data = await apiGet<{ workflows?: any[] }>(
        endPoints.REVIEW.WORKFLOWS_BY_ENGAGEMENT(engagementId)
      ).catch(() => ({ workflows: [] }));
      const raw = (data as any)?.data ?? data;
      const list = Array.isArray(raw?.workflows) ? raw.workflows : [];
      const filteredReviews = list.filter((w: any) => w.itemType === "planning-procedure");
      setReviews(filteredReviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (engagementId && activeTab === "procedures" && proceduresViewMode === "reviews") {
      fetchReviews();
    }
  }, [engagementId, activeTab, proceduresViewMode]);

  const isReviewOwner = (review: any) => {
    return review.reviewedBy === currentUserId || review.assignedReviewer === currentUserId;
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
      await apiPut(endPoints.REVIEW.UPDATE_WORKFLOW(editingReview._id), {
        status: editReviewStatus,
        reviewComments: editReviewComments,
        reviewerId: currentUserId,
      });
      toast({ title: "Review Updated", description: "The review has been updated successfully." });
      setIsEditDialogOpen(false);
      await fetchReviews();
    } catch (error: any) {
      console.error("Update review error:", error);
      toast({
        title: "Update failed",
        description: (error as Error)?.message || "Could not update review.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setIsDeletingReview(reviewId);
    try {
      await apiDelete(endPoints.REVIEW.DELETE_WORKFLOW(reviewId));
      toast({ title: "Review Deleted", description: "The review has been deleted." });
      await fetchReviews();
    } catch (error: any) {
      console.error("Delete review error:", error);
      toast({
        title: "Delete failed",
        description: (error as Error)?.message || "Could not delete review.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingReview(null);
    }
  };

  useEffect(() => {
    if (stepData) {
      if (stepData.reviewStatus) setReviewStatus(stepData.reviewStatus);
      if (stepData.reviewComments !== undefined) setReviewComments(stepData.reviewComments || "");
      if (currentUserId) {
        if (!stepData.reviewerId) setReviewerId(currentUserId);
        if (!stepData.approvedBy) setApprovedBy(currentUserId);
        if (!stepData.signedOffBy) setSignedOffBy(currentUserId);
        if (!stepData.lockedBy) setLockedBy(currentUserId);
        if (!stepData.reopenedBy) setReopenedBy(currentUserId);
      }
      if (stepData.reviewerId) setReviewerId(stepData.reviewerId);
      if (stepData.reviewedAt) setReviewedAt(new Date(stepData.reviewedAt).toISOString().split("T")[0]);
      if (stepData.approvedBy) setApprovedBy(stepData.approvedBy);
      if (stepData.approvedAt) setApprovedAt(new Date(stepData.approvedAt).toISOString().split("T")[0]);
      if (stepData.signedOffBy) setSignedOffBy(stepData.signedOffBy);
      if (stepData.signedOffAt) setSignedOffAt(new Date(stepData.signedOffAt).toISOString().split("T")[0]);
      if (stepData.signOffComments !== undefined) setSignOffComments(stepData.signOffComments || "");
      if (stepData.isSignedOff !== undefined) setIsSignedOff(stepData.isSignedOff);
      if (stepData.isLocked !== undefined) setIsLocked(stepData.isLocked);
      if (stepData.lockedAt) setLockedAt(new Date(stepData.lockedAt).toISOString().split("T")[0]);
      if (stepData.lockedBy) setLockedBy(stepData.lockedBy);
      if (stepData.reopenedAt) setReopenedAt(new Date(stepData.reopenedAt).toISOString().split("T")[0]);
      if (stepData.reopenedBy) setReopenedBy(stepData.reopenedBy);
      if (stepData.reopenReason !== undefined) setReopenReason(stepData.reopenReason || "");
      if (stepData.reviewVersion) setReviewVersion(stepData.reviewVersion);
    }
  }, [stepData, currentUserId]);

  useEffect(() => {
    setQuestions(proceduresToQuestions(procedures));
  }, [procedures]);

  const hasAnswer = (answer: any): boolean => {
    if (!answer) return false;
    if (typeof answer === "string") return answer.trim() !== "";
    if (typeof answer === "number") return true;
    return false;
  };

  const questionsWithAnswers = useMemo(() => questions.filter((q: any) => hasAnswer(q.answer)), [questions]);
  const unansweredQuestions = useMemo(() => questions.filter((q: any) => !hasAnswer(q.answer)), [questions]);

  const handleAddQuestion = (sectionId?: string) => {
    const targetSectionId = sectionId ?? procedures[0]?.sectionId ?? PLANNING_SECTIONS[0].sectionId;
    const section = procedures.find((p) => p.sectionId === targetSectionId);
    const sectionTitle = section?.title ?? PLANNING_SECTIONS.find((s) => s.sectionId === targetSectionId)?.title ?? targetSectionId;
    const newQuestion = {
      __uid: `new-${Date.now()}`,
      id: `new-${Date.now()}`,
      key: `q${questions.length + 1}`,
      question: "New question",
      answer: "",
      context: "",
      answerContext: "",
      sectionId: targetSectionId,
      sectionTitle,
      type: "text",
    };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setProcedures(questionsToProcedures(updatedQuestions, procedures));
    setEditingQuestionId(newQuestion.__uid);
    setEditQuestionText(newQuestion.question);
    setEditAnswerText("");
    setEditContextText("");
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestionId(question.__uid);
    setEditQuestionText(question.question || "");
    setEditAnswerText(question.answer || "");
    setEditContextText(question.context ?? question.help ?? "");
  };

  const handleSaveQuestion = () => {
    if (!editingQuestionId) return;
    const updatedQuestions = questions.map((q) =>
      q.__uid === editingQuestionId
        ? { ...q, question: editQuestionText, answer: editAnswerText, context: editContextText, help: editContextText || q.help }
        : q
    );
    setQuestions(updatedQuestions);
    setProcedures(questionsToProcedures(updatedQuestions, procedures));
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditAnswerText("");
    setEditContextText("");
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditQuestionText("");
    setEditAnswerText("");
    setEditContextText("");
  };

  const handleGenerateQuestionContext = async (question: any) => {
    setGeneratingContextQuestionId(question.__uid);
    try {
      if (engagementId) {
        const data = await apiPost<any>(
          endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_ANSWERS(engagementId),
          { sectionId: question.sectionId }
        );
        const raw = (data as any)?.data ?? data;
        const fieldsList = raw?.fields ?? [];
        let generatedContext = "";
        if (Array.isArray(fieldsList)) {
          const field = fieldsList.find((f: any) => (f.key || f._doc?.key) === question.key);
          const content = field?.content ?? field?._doc?.content ?? field?.answer ?? field?._doc?.answer;
          if (typeof content === "string") generatedContext = content;
        }
        if (!generatedContext) generatedContext = `Context for: ${question.question || "this question"}`;
        const updatedQuestions = questions.map((q) =>
          q.__uid === question.__uid ? { ...q, context: generatedContext } : q
        );
        setQuestions(updatedQuestions);
        setProcedures(questionsToProcedures(updatedQuestions, procedures));
        if (editingQuestionId === question.__uid) setEditContextText(generatedContext);
        toast({ title: "Context generated", description: "Context has been generated for this question." });
      }
    } catch {
      const placeholder = `[Context for: ${(question.question || "").slice(0, 50)}...]`;
      const updatedQuestions = questions.map((q) =>
        q.__uid === question.__uid ? { ...q, context: placeholder } : q
      );
      setQuestions(updatedQuestions);
      setProcedures(questionsToProcedures(updatedQuestions, procedures));
      if (editingQuestionId === question.__uid) setEditContextText(placeholder);
      toast({ title: "Context added", description: "You can edit the context manually." });
    } finally {
      setGeneratingContextQuestionId(null);
    }
  };

  const handleDeleteQuestion = (questionUid: string) => {
    const updatedQuestions = questions.filter((q) => q.__uid !== questionUid);
    setQuestions(updatedQuestions);
    setProcedures(questionsToProcedures(updatedQuestions, procedures));
    toast({ title: "Question deleted", description: "The question has been removed." });
  };

  const handleGenerateQuestions = async (sectionId?: string) => {
    if (!engagementId) return;
    setGeneratingQuestions(true);
    try {
      if (sectionId) {
        const data = await apiPost<any>(endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId), {
          sectionId,
        });
        const fields = (data as any)?.fields ?? data?.data?.fields ?? [];
        setProcedures((prev) =>
          prev.map((section) =>
            section.sectionId === sectionId ? { ...section, fields } : section
          )
        );
        toast({ title: "Questions Generated", description: "Questions for section generated successfully." });
      } else {
        for (const section of PLANNING_SECTIONS) {
          const data = await apiPost<any>(
            endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId),
            { sectionId: section.sectionId }
          );
          const fields = (data as any)?.fields ?? data?.data?.fields ?? [];
          setProcedures((prev) =>
            prev.map((sec) =>
              sec.sectionId === section.sectionId ? { ...sec, fields } : sec
            )
          );
        }
        toast({ title: "Questions Generated", description: "Questions for all sections generated successfully." });
      }
    } catch (error: any) {
      const message =
        (error as Error)?.message ||
        (error?.response?.data?.message ?? error?.response?.data?.error) ||
        "Could not generate questions.";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleGenerateAnswers = async () => {
    if (!engagementId) return;
    setGeneratingAnswers(true);
    try {
      const sectionsToProcess = procedures.filter((proc) =>
        proc.fields?.some((f: any) => {
          const answer = f.answer;
          if (!answer) return true;
          if (typeof answer === "string") return answer.trim() === "";
          return false;
        })
      );

      for (const section of sectionsToProcess) {
        const data = await apiPost<any>(
          endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_ANSWERS(engagementId),
          { sectionId: section.sectionId }
        );
        const raw = (data as any)?.data ?? data;
        const answers: Record<string, any> = {};
        const fieldsList = raw?.fields ?? [];
        if (Array.isArray(fieldsList)) {
          fieldsList.forEach((fieldItem: any) => {
            const fieldData = fieldItem._doc ?? fieldItem;
            const key = fieldData.key;
            if (key) {
              answers[key] =
                fieldItem.answer ?? fieldData.answer ?? fieldData.content ?? null;
            }
          });
        }
        setProcedures((prev) =>
          prev.map((sec) =>
            sec.sectionId === section.sectionId
              ? {
                  ...sec,
                  fields: (sec.fields || []).map((f: any) => ({
                    ...f,
                    answer: answers[f.key] !== undefined ? answers[f.key] : f.answer,
                  })),
                }
              : sec
          )
        );
      }
      toast({ title: "Answers Generated", description: "Answers have been generated successfully." });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: (error as Error)?.message || "Could not generate answers.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAnswers(false);
    }
  };

  const handleSaveAnswers = async () => {
    if (!engagementId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      const payload = {
        ...stepData,
        procedures: procedures.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
        })),
        recommendations,
        status: "in-progress",
        procedureType: "planning",
        mode,
      };
      formData.append("data", JSON.stringify(payload));

      const fileMap: Array<{ sectionId: string; fieldKey: string; originalName: string }> = [];
      procedures.forEach((proc) => {
        (proc.fields || []).forEach((field: any) => {
          if (field.type === "file" && field.answer instanceof File) {
            formData.append("files", field.answer, field.answer.name);
            fileMap.push({
              sectionId: proc.sectionId,
              fieldKey: field.key,
              originalName: field.answer.name,
            });
          }
        });
      });
      if (fileMap.length) formData.append("fileMap", JSON.stringify(fileMap));

      await apiPostFormData(endPoints.PLANNING_PROCEDURES.SAVE(engagementId), formData);
      toast({ title: "Answers Saved", description: "Your answers have been saved successfully." });
    } catch (error: any) {
      console.error("Save answers error:", error);
      toast({
        title: "Save failed",
        description: (error as Error)?.message || "Could not save answers.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateProcedures = async () => {
    if (!engagementId) return;
    setGeneratingProcedures(true);
    setActiveTab("procedures");
    try {
      const res = await apiPost<any>(endPoints.PLANNING_PROCEDURES.GENERATE_RECOMMENDATIONS(engagementId), {
        procedures: procedures.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
        })),
        materiality: stepData.materiality || 0,
      });
      const data = (res as any)?.data ?? res;
      let recs: any[] = [];
      if (data.recommendations && Array.isArray(data.recommendations)) {
        recs = data.recommendations.map((r: any) =>
          typeof r === "string" ? { id: `rec-${Date.now()}`, text: r, checked: false, context: "" } : { ...r, context: r.context ?? "" }
        );
      } else if (data.recommendations && typeof data.recommendations === "string") {
        recs = data.recommendations
          .split("\n")
          .filter((l: string) => l.trim())
          .map((text: string, idx: number) => ({
            id: `rec-${Date.now()}-${idx}`,
            text: text.trim(),
            checked: false,
            context: "",
          }));
      }
      setRecommendations(recs);
      toast({ title: "Procedures Generated", description: "Recommendations have been generated successfully." });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: (error as Error)?.message || "Could not generate procedures.",
        variant: "destructive",
      });
    } finally {
      setGeneratingProcedures(false);
    }
  };

  const handleEditRecommendation = (rec: any, idx: number) => {
    const recId = rec.id || rec.__uid || `rec-${idx}`;
    setEditingRecommendationId(recId);
    const recText = typeof rec === "string" ? rec : rec.text || rec.content || "";
    setEditRecommendationText(recText);
    setEditRecommendationContext(typeof rec === "string" ? "" : (rec.context ?? ""));
  };

  const handleSaveRecommendation = () => {
    if (!editingRecommendationId) return;
    setRecommendations((prev) =>
      prev.map((rec, idx) => {
        const recId = rec.id || rec.__uid || `rec-${idx}`;
        if (recId === editingRecommendationId) {
          if (typeof rec === "string") return { id: recId, text: editRecommendationText, checked: false, context: editRecommendationContext };
          return { ...rec, text: editRecommendationText, context: editRecommendationContext };
        }
        return rec;
      })
    );
    setEditingRecommendationId(null);
    setEditRecommendationText("");
    setEditRecommendationContext("");
    toast({ title: "Recommendation Updated", description: "Your recommendation has been updated." });
  };

  const handleCancelEditRecommendation = () => {
    setEditingRecommendationId(null);
    setEditRecommendationText("");
    setEditRecommendationContext("");
  };

  const handleGenerateProcedureContext = (rec: any, idx: number) => {
    const recId = rec.id || rec.__uid || `rec-${idx}`;
    setGeneratingContextRecId(recId);
    const text = typeof rec === "string" ? rec : rec.text || "";
    const placeholder = `[Context for procedure: ${text.slice(0, 40)}...]`;
    setRecommendations((prev) =>
      prev.map((r, i) => {
        const id = r.id || r.__uid || `rec-${i}`;
        if (id === recId) return typeof r === "string" ? { id, text: r, checked: false, context: placeholder } : { ...r, context: placeholder };
        return r;
      })
    );
    setGeneratingContextRecId(null);
    toast({ title: "Context added", description: "You can edit the context manually." });
  };

  const handleDeleteRecommendation = (rec: any, idx: number) => {
    const recId = rec.id || rec.__uid || `rec-${idx}`;
    setRecommendations((prev) =>
      prev.filter((r, i) => {
        const rId = r.id || r.__uid || `rec-${i}`;
        return rId !== recId;
      })
    );
    toast({ title: "Recommendation deleted", description: "The recommendation has been removed." });
  };

  const handleAddRecommendation = () => {
    const newRec = { id: `rec-${Date.now()}`, text: "New recommendation", checked: false, context: "" };
    setRecommendations([...recommendations, newRec]);
    setEditingRecommendationId(newRec.id);
    setEditRecommendationText(newRec.text);
    setEditRecommendationContext("");
  };

  const handleSaveReview = async () => {
    if (!engagementId) return;
    setIsSavingReview(true);
    try {
      const now = new Date();
      const currentVersion = (reviewVersion || 1) + 1;
      let autoFields: any = { reviewVersion: currentVersion };
      if (reviewStatus === "ready-for-review" || reviewStatus === "under-review") {
        autoFields.reviewerId = currentUserId;
        autoFields.reviewedAt = now.toISOString();
      }
      if (reviewStatus === "approved") {
        autoFields.approvedBy = currentUserId;
        autoFields.approvedAt = now.toISOString();
      }
      if (reviewStatus === "signed-off") {
        autoFields.signedOffBy = currentUserId;
        autoFields.signedOffAt = now.toISOString();
        autoFields.isSignedOff = true;
        autoFields.signOffComments = reviewComments || signOffComments || undefined;
      }
      if (reviewStatus === "re-opened") {
        autoFields.reopenedBy = currentUserId;
        autoFields.reopenedAt = now.toISOString();
        autoFields.reopenReason = reviewComments || reopenReason || undefined;
      }

      const formData = new FormData();
      const payload = {
        ...stepData,
        procedures: procedures.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
        })),
        recommendations,
        reviewStatus,
        reviewComments,
        status: "completed",
        procedureType: "planning",
        mode,
        ...autoFields,
      };
      formData.append("data", JSON.stringify(payload));
      await apiPostFormData(endPoints.PLANNING_PROCEDURES.SAVE(engagementId), formData);
      setReviewVersion(currentVersion);
      await fetchReviews();
      toast({ title: "Review Saved", description: "Your review has been saved successfully." });
    } catch (error: any) {
      console.error("Save review error:", error);
      toast({
        title: "Save failed",
        description: (error as Error)?.message || "Could not save review.",
        variant: "destructive",
      });
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleComplete = async () => {
    if (!engagementId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      const payload = {
        ...stepData,
        procedures: procedures.map((sec) => ({
          ...sec,
          fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
        })),
        recommendations,
        status: "completed",
        procedureType: "planning",
        mode,
      };
      formData.append("data", JSON.stringify(payload));
      const savedProcedure = await apiPostFormData<any>(endPoints.PLANNING_PROCEDURES.SAVE(engagementId), formData);
      const savedId = (savedProcedure as any)?._id ?? (savedProcedure as any)?.data?._id;
      toast({ title: "Procedures Saved", description: "Your planning procedures have been saved successfully." });
      onComplete({ ...payload, _id: savedId });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: (error as Error)?.message || "Could not save procedures.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const questionsBySection = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    questions.forEach((q) => {
      const sectionId = q.sectionId || "general";
      if (!grouped[sectionId]) grouped[sectionId] = [];
      grouped[sectionId].push(q);
    });
    return grouped;
  }, [questions]);

  const hasQuestions = questions.length > 0;
  const hasAnswers = questionsWithAnswers.length > 0;

  const statusColors: Record<string, string> = {
    "in-progress": "bg-gray-100 text-gray-800",
    "ready-for-review": "bg-blue-100 text-blue-800",
    "under-review": "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    "signed-off": "bg-purple-100 text-purple-800",
    "re-opened": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2">
        <div className="flex items-center gap-3">
          <h3 className="font-heading text-xl text-gray-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 border border-gray-200 rounded-md bg-gray-50/80 text-gray-600 shrink-0" aria-hidden>
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="border border-gray-200 rounded-md px-2 py-1 bg-gray-50/80">Planning Procedures</span>
        </h3>
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2 bg-transparent rounded-md hover:bg-gray-100 hover:text-foreground transition-colors border-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Back to Procedure Selection
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleComplete} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save & Complete
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-gray-600">
        Step-1: Generate questions for each planning section separately. You can freely edit / add / remove questions here before moving to Step-4.
      </p>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-md">
          <TabsTrigger value="questions" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Questions</TabsTrigger>
          <TabsTrigger value="answers" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Answers</TabsTrigger>
          <TabsTrigger value="procedures" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Procedures</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="flex-1 flex flex-col mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
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
          </div>

          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={PLANNING_SECTIONS.map((s) => s.sectionId)} className="w-full space-y-2">
              {PLANNING_SECTIONS.map((section) => {
                const sectionId = section.sectionId;
                const sectionTitle = section.title;
                const sectionQuestions = questionsBySection[sectionId] || [];
                const filteredSectionQuestions = sectionQuestions.filter((q: any) => {
                  if (questionFilter === "all") return true;
                  return !hasAnswer(q.answer);
                });
                return (
                  <AccordionItem key={sectionId} value={sectionId} className="border border-gray-200 rounded-lg px-4 bg-gray-50/80">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="font-semibold text-left">{sectionTitle}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuestion(sectionId)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateQuestions(sectionId)}
                          disabled={generatingQuestions}
                        >
                          {generatingQuestions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Regenerate Questions
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            const first = filteredSectionQuestions[0];
                            if (first) handleEditQuestion(first);
                          }}
                          disabled={filteredSectionQuestions.length === 0}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      {filteredSectionQuestions.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4">
                          No questions in this section. Add or generate questions.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredSectionQuestions.map((q: any, idx: number) => (
                            <Card key={q.__uid || idx}>
                              <CardContent className="pt-6">
                                {editingQuestionId === q.__uid ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Question</Label>
                                      <Input
                                        value={editQuestionText}
                                        onChange={(e) => setEditQuestionText(e.target.value)}
                                        placeholder="Question"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Context (optional)</Label>
                                      <Textarea
                                        value={editContextText}
                                        onChange={(e) => setEditContextText(e.target.value)}
                                        placeholder="Add or edit context for this question"
                                        className="mt-1 min-h-[60px]"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-1"
                                        disabled={generatingContextQuestionId === q.__uid}
                                        onClick={() => handleGenerateQuestionContext(q)}
                                      >
                                        {generatingContextQuestionId === q.__uid ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                          <RefreshCw className="h-4 w-4 mr-1" />
                                        )}
                                        Generate context
                                      </Button>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Answer (optional)</Label>
                                      <Textarea
                                        value={editAnswerText}
                                        onChange={(e) => setEditAnswerText(e.target.value)}
                                        placeholder="Answer (optional)"
                                        className="mt-1"
                                      />
                                    </div>
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
                                ) : (
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium mb-1">
                                        {idx + 1}. {q.question || "—"}
                                      </div>
                                      {(q.context || q.help) && (
                                        <div className="text-sm text-muted-foreground mt-1">{q.context || q.help}</div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q)} aria-label="Edit question">
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.__uid)} aria-label="Delete question">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="answers" className="flex-1 flex flex-col mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {!hasQuestions ? (
                <div className="text-muted-foreground">No questions added yet.</div>
              ) : hasAnswers ? (
                unansweredQuestions.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGenerateAnswers}
                    disabled={generatingAnswers}
                  >
                    {generatingAnswers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate Answers
                  </Button>
                )
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateAnswers}
                  disabled={generatingAnswers}
                >
                  {generatingAnswers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Generate Answers
                </Button>
              )}
            </div>
            {(hasAnswers || unansweredQuestions.length > 0) && (
              <Button variant="default" size="sm" onClick={handleSaveAnswers} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Answers
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {!hasQuestions ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions available. Go to Questions tab to add questions.
                </div>
              ) : (
                <>
                  {questionsWithAnswers.map((q: any, idx: number) => (
                    <Card key={q.__uid || idx}>
                      <CardContent className="pt-6">
                        <div className="font-medium mb-2">
                          {idx + 1}. {q.question || "—"}
                        </div>
                        {editingAnswerId === q.__uid ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Answer</Label>
                              <Textarea
                                value={editAnswerValue}
                                onChange={(e) => setEditAnswerValue(e.target.value)}
                                placeholder="Answer"
                                className="mt-1 min-h-[100px]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Context (optional)</Label>
                              <Textarea
                                value={editAnswerContextValue}
                                onChange={(e) => setEditAnswerContextValue(e.target.value)}
                                placeholder="Add or edit context for this answer"
                                className="mt-1 min-h-[60px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const updatedQuestions = questions.map((question) =>
                                    question.__uid === q.__uid
                                      ? { ...question, answer: editAnswerValue, answerContext: editAnswerContextValue }
                                      : question
                                  );
                                  setQuestions(updatedQuestions);
                                  setProcedures(questionsToProcedures(updatedQuestions, procedures));
                                  setEditingAnswerId(null);
                                  setEditAnswerValue("");
                                  setEditAnswerContextValue("");
                                }}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAnswerId(null);
                                  setEditAnswerValue("");
                                  setEditAnswerContextValue("");
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-muted-foreground mb-2">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(q.answer || "No answer.")}</ReactMarkdown>
                            </div>
                            {q.answerContext && (
                              <div className="text-xs text-muted-foreground mb-3 pl-2 border-l-2 border-gray-200">
                                <span className="font-medium">Context: </span>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(q.answerContext)}</ReactMarkdown>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAnswerId(q.__uid);
                                setEditAnswerValue(q.answer || "");
                                setEditAnswerContextValue(q.answerContext || "");
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit Answer
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {unansweredQuestions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-4">Unanswered Questions</h4>
                      {unansweredQuestions.map((q: any, idx: number) => (
                        <Card key={q.__uid || idx} className="mb-4">
                          <CardContent className="pt-6">
                            <div className="font-medium mb-2">
                              {questionsWithAnswers.length + idx + 1}. {q.question || "—"}
                            </div>
                            <div className="text-sm text-muted-foreground italic mb-3">No answer.</div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const section = procedures.find((p) => p.sectionId === q.sectionId);
                                  if (!section || !engagementId) return;
                                  const data = await apiPost<any>(
                                    endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_ANSWERS(engagementId),
                                    { sectionId: q.sectionId }
                                  );
                                  const raw = (data as any)?.data ?? data;
                                  const answers: Record<string, any> = {};
                                  (raw?.fields ?? []).forEach((fieldItem: any) => {
                                    const fieldData = fieldItem._doc ?? fieldItem;
                                    const key = fieldData.key;
                                    if (key)
                                      answers[key] = fieldItem.answer ?? fieldData.answer ?? fieldData.content ?? null;
                                  });
                                  const answer = answers[q.key] ?? "";
                                  const updatedQuestions = questions.map((question) =>
                                    question.__uid === q.__uid ? { ...question, answer } : question
                                  );
                                  setQuestions(updatedQuestions);
                                  setProcedures(questionsToProcedures(updatedQuestions, procedures));
                                  toast({ title: "Answer Generated", description: "Answer has been generated for this question." });
                                } catch (error: any) {
                                  toast({
                                    title: "Generation failed",
                                    description: (error as Error)?.message || "Could not generate answer.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={generatingAnswers}
                            >
                              {generatingAnswers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                              Add Answer
                            </Button>
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

        <TabsContent value="procedures" className="space-y-3 mt-4">
          {proceduresViewMode === "reviews" ? (
            <div className="flex-1 flex flex-col overflow-x-hidden" style={{ width: "100%", maxWidth: "100%" }}>
              <div className="flex flex-col gap-2 mb-4 w-full">
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
                      className="w-[180px] border rounded px-3 py-2 bg-background"
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                    >
                      {reviewStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace(/-/g, " ")}
                        </option>
                      ))}
                    </select>
                    <Button variant="default" size="sm" onClick={handleSaveReview} disabled={isSavingReview}>
                      {isSavingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Review
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mb-4 w-full">
                <Label htmlFor="review-comments" className="mb-2 block">
                  Overall Review Comments
                </Label>
                <Textarea
                  id="review-comments"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Add your review comments here..."
                  className="min-h-[100px] w-full"
                />
              </div>

              <ScrollArea className="h-[500px] border border-gray-200 rounded-md p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Reviews ({reviews.length})
                    </h5>
                    <Button variant="outline" size="sm" onClick={fetchReviews} disabled={isLoadingReviews}>
                      {isLoadingReviews ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No reviews yet.</div>
                  ) : (
                    reviews.map((review: any, idx: number) => {
                      const isOwner = isReviewOwner(review);
                      return (
                        <Card key={review._id || idx} className="mb-4">
                          <CardContent className="pt-6 pb-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={statusColors[review.status] || "bg-gray-100 text-gray-800"}>
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
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Reviewer:</span>{" "}
                                  <span className="text-muted-foreground">
                                    {(() => {
                                      let rid = null;
                                      if (review.status === "approved") rid = review.approvedBy || review.reviewedBy || review.assignedReviewer;
                                      else if (review.status === "signed-off")
                                        rid = review.signedOffBy || review.approvedBy || review.reviewedBy || review.assignedReviewer;
                                      else if (review.status === "re-opened") rid = review.reopenedBy || review.reviewedBy || review.assignedReviewer;
                                      else rid = review.reviewedBy || review.assignedReviewer;
                                      return rid ? memberNamesMap[rid] || rid : "Not assigned";
                                    })()}
                                  </span>
                                </div>
                                {review.reviewedAt && (review.status === "ready-for-review" || review.status === "under-review") && (
                                  <div>
                                    <span className="font-medium">Reviewed At:</span>{" "}
                                    <span className="text-muted-foreground">{new Date(review.reviewedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {review.status === "approved" && review.approvedBy && (
                                  <div>
                                    <span className="font-medium">Approved By:</span>{" "}
                                    <span className="text-muted-foreground">{memberNamesMap[review.approvedBy] || review.approvedBy}</span>
                                  </div>
                                )}
                                {review.status === "approved" && review.approvedAt && (
                                  <div>
                                    <span className="font-medium">Approved At:</span>{" "}
                                    <span className="text-muted-foreground">{new Date(review.approvedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {review.status === "signed-off" && review.signedOffBy && (
                                  <div>
                                    <span className="font-medium">Signed Off By:</span>{" "}
                                    <span className="text-muted-foreground">{memberNamesMap[review.signedOffBy] || review.signedOffBy}</span>
                                  </div>
                                )}
                                {review.status === "signed-off" && review.signedOffAt && (
                                  <div>
                                    <span className="font-medium">Signed Off At:</span>{" "}
                                    <span className="text-muted-foreground">{new Date(review.signedOffAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {review.isLocked && (
                                  <div>
                                    <span className="font-medium">Locked:</span>{" "}
                                    <span className="text-muted-foreground">
                                      {review.lockedBy ? `Yes (by ${memberNamesMap[review.lockedBy] || review.lockedBy})` : "Yes"}
                                    </span>
                                  </div>
                                )}
                                {review.status === "re-opened" && review.reopenedBy && (
                                  <div>
                                    <span className="font-medium">Reopened By:</span>{" "}
                                    <span className="text-muted-foreground">{memberNamesMap[review.reopenedBy] || review.reopenedBy}</span>
                                  </div>
                                )}
                                {review.status === "re-opened" && review.reopenedAt && (
                                  <div>
                                    <span className="font-medium">Reopened At:</span>{" "}
                                    <span className="text-muted-foreground">{new Date(review.reopenedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {review.reviewVersion && (
                                  <div>
                                    <span className="font-medium">Version:</span>{" "}
                                    <span className="text-muted-foreground">{review.reviewVersion}</span>
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
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Audit Recommendations</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setProceduresViewMode("reviews")}>
                    <FileText className="h-4 w-4 mr-2" /> Reviews
                  </Button>
                  {hasAnswers ? (
                    recommendations.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateProcedures}
                        disabled={generatingProcedures || !hasAnswers}
                      >
                        {generatingProcedures ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Regenerate Procedures
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleGenerateProcedures}
                        disabled={generatingProcedures || !hasAnswers}
                      >
                        {generatingProcedures ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        Generate Procedures
                      </Button>
                    )
                  ) : (
                    <div className="text-muted-foreground text-sm">Generate answers first.</div>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAnswers}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Procedures
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddRecommendation}>
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      No recommendations generated for this section yet.
                    </div>
                  ) : (
                    recommendations.map((rec, idx) => {
                      const recId = rec.id || rec.__uid || `rec-${idx}`;
                      const isEditing = editingRecommendationId === recId;
                      return (
                        <Card key={recId}>
                          <CardContent className="pt-6">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Procedure</Label>
                                  <Textarea
                                    value={editRecommendationText}
                                    onChange={(e) => setEditRecommendationText(e.target.value)}
                                    className="mt-1 min-h-[80px]"
                                    placeholder="Procedure text"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Context (optional)</Label>
                                  <Textarea
                                    value={editRecommendationContext}
                                    onChange={(e) => setEditRecommendationContext(e.target.value)}
                                    className="mt-1 min-h-[60px]"
                                    placeholder="Add or edit context for this procedure"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-1"
                                    disabled={generatingContextRecId === recId}
                                    onClick={() => handleGenerateProcedureContext(rec, idx)}
                                  >
                                    {generatingContextRecId === recId ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4 mr-1" />
                                    )}
                                    Generate context
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveRecommendation}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEditRecommendation}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{typeof rec === "string" ? rec : rec.text}</p>
                                  {typeof rec !== "string" && rec.context && (
                                    <div className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-gray-200">
                                      <span className="font-medium">Context: </span>
                                      {rec.context}
                                    </div>
                                  )}
                                  <Badge variant={rec.checked ? "default" : "secondary"} className="mt-2">
                                    {rec.checked ? "Completed" : "Pending"}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditRecommendation(rec, idx)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRecommendation(rec, idx)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
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
                className="w-full border rounded px-3 py-2 bg-background mt-1"
                value={editReviewStatus}
                onChange={(e) => setEditReviewStatus(e.target.value)}
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
