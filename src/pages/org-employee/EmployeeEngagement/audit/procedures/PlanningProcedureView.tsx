import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/Textarea";
import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  FileText,
  Edit,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/Dialog";
import { ScrollArea } from "@/ui/scroll-area";
import FloatingNotesButton from "./FloatingNotesButton";
import NotebookInterface from "./NotebookInterface";
import {
  uid,
  withUids,
  normalizeType,
  assignSectionToRecommendations,
  normalizeRecommendations,
  isFieldVisible,
  FieldAnswerDisplay,
  FieldAnswerEditor,
  answerToEditString,
} from "./procedureViewHelpers";
import { getDecodedUserId } from "@/utils/authUtils";
import { useMemberNamesMap } from "../hooks/useMemberNamesMap";
import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";

/** Section menu labels for Planning Procedures — match REFERENCE-PORTAL exactly */
const PLANNING_SECTION_TITLES: Record<string, string> = {
  engagement_setup_acceptance_independence: "Engagement Setup, Acceptance & Independence",
  understanding_entity_environment: "Understanding the Entity & Its Environment",
  materiality_risk_summary: "Materiality & Risk Summary",
  risk_response_planning: "Risk Register & Audit Response Planning",
  fraud_gc_planning: "Fraud Risk & Going Concern Planning",
  compliance_laws_regulations: "Compliance with Laws & Regulations (ISA 250)",
};

/** Default sections so View Procedures always shows section list (match REFERENCE-PORTAL) */
const DEFAULT_PLANNING_SECTIONS = Object.entries(PLANNING_SECTION_TITLES).map(([sectionId, title]) => ({
  id: sectionId,
  sectionId,
  title,
  fields: [],
}));

interface PlanningProcedureViewProps {
  procedure: any;
  engagement?: any;
  onRegenerate?: () => void;
  onProcedureUpdate?: (updatedProcedure: any) => void;
  /** When set, shows a "Complete" button that saves and calls this (wizard flow). */
  onWizardComplete?: (procedure: any) => void;
}

export const PlanningProcedureView: React.FC<PlanningProcedureViewProps> = ({
  procedure: initial,
  engagement,
  onRegenerate: _onRegenerate,
  onProcedureUpdate,
  onWizardComplete,
}) => {
  const engagementId = engagement?.id ?? (engagement as any)?._id;
  const [editMode, setEditMode] = useState(false);
  const [proc, setProc] = useState<any>(() => {
    const initialWithUids = { ...(initial || {}) };
    const procedures = initialWithUids.procedures && initialWithUids.procedures.length > 0
      ? initialWithUids.procedures
      : DEFAULT_PLANNING_SECTIONS;
    initialWithUids.procedures = withUids(procedures);
    return initialWithUids;
  });
  const [pendingQuestions, setPendingQuestions] = useState<Set<string>>(
    new Set()
  );
  const [sectionTabs, setSectionTabs] = useState<Record<string, string>>({});
  const [proceduresViewMode, setProceduresViewMode] = useState<
    Record<string, "procedures" | "reviews">
  >({});
  const [editingQuestionIds, setEditingQuestionIds] = useState<
    Record<string, string>
  >({});
  const [editQuestionTexts, setEditQuestionTexts] = useState<
    Record<string, string>
  >({});
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>(() => {
    const recs = initial?.recommendations || [];
    let normalized: any[] = [];
    if (Array.isArray(recs)) normalized = recs;
    else if (typeof recs === "string") {
      try {
        const parsed = JSON.parse(recs);
        normalized = Array.isArray(parsed) ? parsed : [];
      } catch {
        normalized = [];
      }
    }
    return assignSectionToRecommendations(
      normalized,
      initial?.procedures || []
    );
  });
  const [editingRecommendationId, setEditingRecommendationId] = useState<
    string | null
  >(null);
  const [editRecommendationText, setEditRecommendationText] = useState("");
  const { toast } = useToast();
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(
    new Set()
  );
  const [_generatingQuestions, _setGeneratingQuestions] = useState(false);
  const [_generatingAnswers, _setGeneratingAnswers] = useState(false);
  const [generatingProcedures, setGeneratingProcedures] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>(
    proc?.reviewStatus || "in-progress"
  );
  const [reviewComments, setReviewComments] = useState<string>(
    proc?.reviewComments || ""
  );
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [_isLoadingReviews, setIsLoadingReviews] = useState(false);
  const memberNamesMap = useMemberNamesMap(!!engagementId);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editReviewStatus, setEditReviewStatus] = useState<string>("");
  const [editReviewComments, setEditReviewComments] = useState<string>("");
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      const initialWithUids = { ...(initial || {}) };
      const procedures = initialWithUids.procedures && initialWithUids.procedures.length > 0
        ? initialWithUids.procedures
        : DEFAULT_PLANNING_SECTIONS;
      initialWithUids.procedures = withUids(procedures);
      setProc((prev: any) => {
        const next = { ...initialWithUids };
        if (prev?.procedures && Array.isArray(next.procedures)) {
          next.procedures = next.procedures.map((sec: any) => {
            const prevSec = prev.procedures?.find(
              (p: any) => (p.sectionId || p.id) === (sec.sectionId || sec.id)
            );
            if (!prevSec?.fields?.length) return sec;
            const fieldsWithPreservedAnswers = (sec.fields || []).map((f: any) => {
              const prevF = prevSec.fields?.find((pf: any) => (pf.key || pf.label) === (f.key || f.label));
              const keepAnswer = prevF?.answer !== undefined && prevF?.answer !== null && prevF?.answer !== "";
              return keepAnswer ? { ...f, answer: prevF.answer } : f;
            });
            return { ...sec, fields: fieldsWithPreservedAnswers };
          });
        }
        return next;
      });
    }
  }, [initial]);

  useEffect(() => {
    const id = getDecodedUserId();
    if (id) setCurrentUserId(id);
  }, []);

  useEffect(() => {
    if (initial?.recommendations !== undefined) {
      const recs = initial.recommendations;
      if (Array.isArray(recs) && recs.length > 0) {
        setRecommendations(
          assignSectionToRecommendations(
            recs,
            initial?.procedures || proc?.procedures || []
          )
        );
      }
    }
  }, [initial?._id]);

  const fetchReviews = async () => {
    if (!engagementId) return;
    setIsLoadingReviews(true);
    try {
      const data = await apiGet<any>(
        endPoints.REVIEW.WORKFLOWS_BY_ENGAGEMENT(engagementId)
      );
      const raw =
        (data as any)?.data?.workflows ??
        (data as any)?.workflows ??
        (Array.isArray(data) ? data : []);
      const filteredReviews = raw.filter(
        (w: any) => w.itemType === "planning-procedure"
      );
      setReviews(filteredReviews);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch reviews.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  React.useEffect(() => {
    if (engagementId) {
      const hasReviewTabActive = Object.values(sectionTabs).some(
        (tab) => tab === "review"
      );
      if (hasReviewTabActive) fetchReviews();
    }
  }, [engagementId, sectionTabs]);

  React.useEffect(() => {
    if (engagementId) {
      const hasReviewsMode = Object.values(proceduresViewMode).some(
        (mode) => mode === "reviews"
      );
      if (hasReviewsMode) fetchReviews();
    }
  }, [engagementId, proceduresViewMode]);

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
      await apiPut(endPoints.REVIEW.UPDATE_WORKFLOW(editingReview._id), {
        status: editReviewStatus,
        reviewComments: editReviewComments,
        reviewerId: currentUserId,
      });
      await fetchReviews();
      setIsEditDialogOpen(false);
      setEditingReview(null);
      toast({
        title: "Review Updated",
        description: "Your review has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update review.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    )
      return;
    setIsDeletingReview(reviewId);
    try {
      await apiDelete(endPoints.REVIEW.DELETE_WORKFLOW(reviewId));
      await fetchReviews();
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: (error as Error)?.message || "Could not delete review.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingReview(null);
    }
  };

  const handleSaveRecommendations = async (content: string | any[]) => {
    try {
      let recommendationsToSave: any[];
      if (Array.isArray(content)) {
        recommendationsToSave = content.map((rec: any) => {
          if (typeof rec === "object" && rec !== null) {
            return {
              ...rec,
              section:
                rec.section ||
                rec.sectionId ||
                proc.procedures?.[0]?.sectionId ||
                proc.procedures?.[0]?.id ||
                "general",
            };
          }
          return {
            id: `rec-${Date.now()}-${Math.random()}`,
            text: String(rec).trim(),
            checked: false,
            section:
              proc.procedures?.[0]?.sectionId ||
              proc.procedures?.[0]?.id ||
              "general",
          };
        });
      } else if (typeof content === "string") {
        const defaultSectionId =
          proc.procedures?.[0]?.sectionId ||
          proc.procedures?.[0]?.id ||
          "general";
        recommendationsToSave = content
          .split("\n")
          .filter((line) => line.trim())
          .map((line, index) => ({
            id: `rec-${Date.now()}-${index}`,
            text: line.trim(),
            checked: false,
            section: defaultSectionId,
          }));
      } else {
        recommendationsToSave = [];
      }
      recommendationsToSave = assignSectionToRecommendations(
        recommendationsToSave,
        proc.procedures || []
      );
      setRecommendations(recommendationsToSave);
      const cleanedProcedures = (
        Array.isArray(proc.procedures) ? proc.procedures : []
      ).map((sec: { fields?: any[]; [k: string]: any }) => ({
        ...sec,
        fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
      }));
      const payload = {
        ...proc,
        procedures: cleanedProcedures,
        recommendations: recommendationsToSave,
        status: proc.status || "in-progress",
        procedureType: "planning",
      };
      const form = new FormData();
      form.append("data", JSON.stringify(payload));
      const saved = await apiPostFormData<any>(
        endPoints.PLANNING_PROCEDURES.SAVE(engagementId),
        form
      );
      const savedData = (saved as any)?.data ?? saved;
      const savedWithUids = {
        ...savedData,
        procedures: withUids(savedData?.procedures || []),
      };
      setProc(savedWithUids);
      setRecommendations(
        assignSectionToRecommendations(
          Array.isArray(savedData?.recommendations)
            ? savedData.recommendations
            : [],
          savedData?.procedures || proc?.procedures || []
        )
      );
      toast({
        title: "Notes Saved",
        description:
          "Your audit recommendations have been updated and saved to the database.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message,
        variant: "destructive",
      });
      setRecommendations(
        assignSectionToRecommendations(
          Array.isArray(proc?.recommendations) ? proc.recommendations : [],
          proc?.procedures || []
        )
      );
    }
  };

  const setField = (sIdx: number, fieldUid: string, patch: any) => {
    setProc((prev: any) => {
      const next = { ...prev };
      const sections = [...(next.procedures || [])];
      const sec = { ...sections[sIdx] };
      sec.fields = (sec.fields || []).map((f: any) =>
        f.__uid === fieldUid ? { ...f, ...patch } : f
      );
      sections[sIdx] = sec;
      next.procedures = sections;
      return next;
    });
  };

  const addQuestion = (sIdx: number) => {
    if (!editMode) setEditMode(true);
    const newUid_ = uid();
    setProc((prev: any) => {
      const next = { ...prev };
      const sections = [...(next.procedures || [])];
      const sec = { ...sections[sIdx] };
      const fields = [...(sec.fields || [])];
      const baseKey = "new_question";
      const existing = new Set(fields.map((f) => f.key));
      let k = baseKey,
        i = 1;
      while (existing.has(k)) k = `${baseKey}_${i++}`;
      fields.push({
        __uid: newUid_,
        key: k,
        type: "text",
        label: "New Question",
        required: false,
        help: "",
      });
      sec.fields = fields;
      sections[sIdx] = sec;
      next.procedures = sections;
      return next;
    });
    setPendingQuestions((prev) => new Set(prev).add(newUid_));
  };

  const confirmQuestion = (_sIdx: number, fieldUid: string) => {
    setPendingQuestions((prev) => {
      const next = new Set(prev);
      next.delete(fieldUid);
      return next;
    });
  };

  const cancelQuestion = (sIdx: number, fieldUid: string) => {
    setProc((prev: any) => {
      const next = { ...prev };
      const sections = [...(next.procedures || [])];
      const sec = { ...sections[sIdx] };
      sec.fields = (sec.fields || []).filter((f: any) => f.__uid !== fieldUid);
      sections[sIdx] = sec;
      next.procedures = sections;
      return next;
    });
    setPendingQuestions((prev) => {
      const next = new Set(prev);
      next.delete(fieldUid);
      return next;
    });
  };

  const removeQuestion = (sIdx: number, fieldUid: string) => {
    setProc((prev: any) => {
      const next = { ...prev };
      const sections = [...(next.procedures || [])];
      const sec = { ...sections[sIdx] };
      sec.fields = (sec.fields || []).filter((f: any) => f.__uid !== fieldUid);
      sections[sIdx] = sec;
      next.procedures = sections;
      return next;
    });
  };

  const save = async (asCompleted = false) => {
    try {
      const cleanedProcedures = (
        Array.isArray(proc.procedures) ? proc.procedures : []
      ).map((sec: { fields?: any[]; [k: string]: any }) => ({
        ...sec,
        fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
      }));
      const taggedRecommendations = assignSectionToRecommendations(
        Array.isArray(recommendations) ? recommendations : [],
        cleanedProcedures
      );
      const payload = {
        ...proc,
        procedures: cleanedProcedures,
        recommendations: taggedRecommendations,
        status: asCompleted ? "completed" : proc.status || "in-progress",
        procedureType: "planning",
      };
      const form = new FormData();
      form.append("data", JSON.stringify(payload));
      const saved = await apiPostFormData<any>(
        endPoints.PLANNING_PROCEDURES.SAVE(engagementId),
        form
      );
      const savedData = (saved as any)?.data ?? saved;
      const savedWithUids = {
        ...savedData,
        procedures: withUids(savedData?.procedures || []),
      };
      setProc(savedWithUids);
      setRecommendations(
        assignSectionToRecommendations(
          Array.isArray(savedData?.recommendations)
            ? savedData.recommendations
            : [],
          savedData?.procedures || proc?.procedures || []
        )
      );
      setPendingQuestions(new Set());
      setEditMode(false);
      toast({
        title: "Saved",
        description: asCompleted ? "Marked completed." : "Changes saved.",
      });
      onProcedureUpdate?.(savedData ?? saved);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const makeAnswers = (sec: any) =>
    (sec.fields || []).reduce((acc: any, f: any) => {
      acc[f.key] = f.answer;
      return acc;
    }, {});

  const addSectionAndQuestion = () => {
    if (!editMode) setEditMode(true);
    setProc((prev: any) => {
      const next = { ...prev };
      const sections = [...(next.procedures || [])];
      const timestamp = Date.now();
      sections.push({
        id: `sec-${timestamp}`,
        sectionId: `section-${timestamp}`,
        title: "New Section",
        standards: undefined,
        currency: "EUR",
        fields: [],
        footer: null,
      });
      next.procedures = sections;
      return next;
    });
  };

  const handleGenerateSectionQuestions = async (sectionId: string) => {
    if (!engagementId) {
      toast({
        title: "Cannot generate",
        description: "Engagement is required to generate questions.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingSections((prev) => new Set(prev).add(sectionId));
    try {
      const section = proc.procedures?.find(
        (s: any) => (s.sectionId || s.id) === sectionId
      );
      const validSectionId = section?.sectionId || section?.id || sectionId;
      if (!validSectionId) throw new Error("Invalid section ID");
      const data = await apiPost<any>(
        endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId),
        { sectionId: validSectionId }
      );
      const dataObj = (data as any)?.data ?? data;
      const errorMessage = dataObj?.error;
      if (errorMessage) {
        toast({
          title: "Generation failed",
          description:
            typeof errorMessage === "string" && errorMessage.toLowerCase().includes("quota")
              ? "OpenAI API quota exceeded. Please check your OpenAI account billing and quota limits."
              : String(errorMessage),
          variant: "destructive",
        });
        return;
      }
      const newFields = Array.isArray(dataObj?.fields) ? dataObj.fields : [];
      setProc((prev: any) => {
        const next = { ...prev };
        const sections = [...(next.procedures || [])];
        next.procedures = sections.map((sec: any) => {
          const secId = sec.sectionId || sec.id;
          return secId === sectionId
            ? {
                ...sec,
                fields: newFields.map((f: any) => ({
                  ...f,
                  __uid: f.__uid || uid(),
                })),
              }
            : sec;
        });
        return next;
      });
      toast({
        title: dataObj?.fallback ? "Template questions loaded" : "Questions Generated",
        description: dataObj?.fallback
          ? "AI generation was temporarily unavailable. Template questions are shown—you can edit or add more."
          : "Questions for section generated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: (e as Error)?.message || "Could not generate questions.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const handleGenerateSectionAnswers = async (sectionId: string) => {
    setGeneratingSections((prev) => new Set(prev).add(sectionId));
    try {
      const section = proc.procedures?.find(
        (s: any) => (s.sectionId || s.id) === sectionId
      );
      const validSectionId = section?.sectionId || section?.id || sectionId;
      if (!validSectionId) throw new Error("Invalid section ID");
      const sectionFields = (section?.fields ?? []).map((f: any) => ({
        key: f.key,
        label: f.label ?? f.key,
        answer: f.answer,
      }));
      if (sectionFields.length === 0) {
        toast({
          title: "No questions",
          description: "Add or generate questions for this section first, then generate answers.",
          variant: "destructive",
        });
        return;
      }
      // Send current section questions so backend can generate answers even when not yet saved
      const data = await apiPost<any>(
        endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_ANSWERS(engagementId),
        {
          sectionId: validSectionId,
          title: section?.title,
          fields: sectionFields,
        }
      );
      const dataObj = (data as any)?.data ?? data;
      if (dataObj?.error) {
        toast({
          title: "Generation failed",
          description:
            typeof dataObj.error === "string" && dataObj.error.toLowerCase().includes("quota")
              ? "OpenAI API quota exceeded. Check billing or try again later."
              : String(dataObj.error),
          variant: "destructive",
        });
        return;
      }
      const answers: Record<string, any> = {};
      if (dataObj?.fields && Array.isArray(dataObj.fields)) {
        dataObj.fields.forEach((fieldItem: any) => {
          const fieldData = fieldItem._doc || fieldItem;
          const key = fieldData.key;
          if (key)
            answers[key] =
              fieldItem.answer !== undefined
                ? fieldItem.answer
                : fieldData.answer !== undefined
                ? fieldData.answer
                : fieldData.content ?? null;
        });
      }
      setProc((prev: any) => {
        const next = { ...prev };
        const sections = [...(next.procedures || [])];
        next.procedures = sections.map((sec: any) => {
          const secId = sec.sectionId || sec.id;
          return secId === sectionId
            ? {
                ...sec,
                fields: (sec.fields || []).map((f: any) => ({
                  ...f,
                  answer:
                    answers[f.key] !== undefined ? answers[f.key] : f.answer,
                })),
              }
            : sec;
        });
        return next;
      });
      toast({
        title: dataObj?.fallback ? "Template answers loaded" : "Answers Generated",
        description: dataObj?.fallback
          ? "AI is temporarily unavailable (e.g. quota). Placeholder answers shown — edit as needed."
          : "Answers for section generated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description:
          error?.message || "Could not generate answers.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSections((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const handleSaveAnswers = async () => {
    setIsSaving(true);
    try {
      await save(false);
      toast({
        title: "Answers Saved",
        description: "Your answers have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: (error as Error)?.message || "Could not save answers.",
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
        if (recId === editingRecommendationId)
          return { ...rec, text: editRecommendationText };
        return rec;
      })
    );
    setEditingRecommendationId(null);
    setEditRecommendationText("");
  };

  const handleCancelEditRecommendation = () => {
    setEditingRecommendationId(null);
    setEditRecommendationText("");
  };

  const handleCheckboxToggle = (itemId: string) => {
    setRecommendations((prev) =>
      prev.map((item: any) => {
        const rId = item.id || item.__uid;
        return rId === itemId
          ? { ...item, checked: !(item.checked || false) }
          : item;
      })
    );
  };

  const handleSaveProcedures = async () => {
    setIsSaving(true);
    try {
      await save(false);
      toast({
        title: "Procedures Saved",
        description: "Your checklist has been saved.",
      });
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

  const handleGenerateProcedures = async (sectionId: string) => {
    setGeneratingProcedures(true);
    try {
      const section = proc.procedures?.find((s: any) => {
        const sId = String(s.sectionId || s.id || "").trim();
        return sId === String(sectionId).trim() && sId !== "";
      });
      if (!section) throw new Error("Section not found");
      const actualSectionId = String(
        section.sectionId || section.id || sectionId
      ).trim();
      const data = await apiPost<any>(
        endPoints.PLANNING_PROCEDURES.GENERATE_RECOMMENDATIONS(
          engagementId
        ),
        {
          procedures: [
            {
              ...section,
              fields: (section.fields || []).map(({ __uid, ...rest }: any) => rest),
            },
          ],
          materiality: proc.materiality || 0,
        }
      );
      const dataObj = (data as any)?.data ?? data;
      const newRecs = normalizeRecommendations(
        dataObj?.recommendations,
        actualSectionId
      ).map((rec: any) => ({
        ...rec,
        section: actualSectionId,
        sectionId: actualSectionId,
      }));
      setRecommendations((prev) => {
        const filtered = prev.filter((r: any) => {
          const rSection = String(r.section || r.sectionId || "").trim();
          return rSection !== actualSectionId;
        });
        return [...filtered, ...newRecs];
      });
      toast({
        title: dataObj?.fallback ? "Template procedures loaded" : "Procedures Generated",
        description: dataObj?.fallback
          ? "AI temporarily unavailable. Placeholder procedures shown — edit as needed."
          : `Generated ${newRecs.length} recommendations successfully for this section.`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description:
          (error as Error)?.message || "Could not generate procedures.",
        variant: "destructive",
      });
    } finally {
      setGeneratingProcedures(false);
    }
  };

  const handleExportPlanningPDF = async () => {
    try {
      const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.setFont("helvetica", "normal");
        const footerY = pageHeight - 8;
        doc.text(
          "Confidential — For audit planning purposes only.",
          margin,
          footerY
        );
        doc.text(`Page ${pageCount}`, pageWidth - margin, footerY, {
          align: "right",
        });
      };
      const safeTitle =
        proc?.engagementTitle || engagement?.title || "Engagement";
      doc.setFillColor(245, 246, 248);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.setFontSize(18);
      doc.text("Planning Procedures Report", margin, 40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Engagement: ${safeTitle}`, margin, 55);
      doc.text(
        `Mode: ${String(proc?.mode || "MANUAL").toUpperCase()}`,
        margin,
        63
      );
      doc.text(`Status: ${String(proc?.status || "draft")}`, margin, 71);
      addFooter();
      Array.isArray(proc.procedures) &&
        proc.procedures.forEach((sec: any, index: number) => {
          if (index > 0) doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(
            `Section: ${PLANNING_SECTION_TITLES[sec.sectionId || sec.id] ?? sec.title ?? `Section ${index + 1}`}`,
            margin,
            20
          );
          const body: any[] = [];
          (sec.fields || []).forEach((f: any) => {
            const t = normalizeType(f.type);
            if (f.key === "documentation_reminder") return;
            const label = f.label || f.key;
            let answer = "";
            if (t === "multiselect") {
              answer = (Array.isArray(f.answer) ? f.answer : []).join(", ");
            } else if (t === "table") {
              const cols = Array.isArray(f.columns) ? f.columns : [];
              const rows = Array.isArray(f.answer) ? f.answer : [];
              answer = rows
                .map((row: any) =>
                  cols.map((c: string) => String(row?.[c] ?? "")).join(" | ")
                )
                .join("  /  ");
            } else if (t === "group") {
              const val =
                f.answer && typeof f.answer === "object" ? f.answer : {};
              const keys = Object.keys(val).filter((k) => !!val[k]);
              answer = keys.join(", ");
            } else if (t === "checkbox") {
              answer = f.answer ? "Yes" : "No";
            } else {
              answer = String(f.answer ?? "");
            }
            body.push([label, answer || "—"]);
          });
          if (body.length) {
            (autoTable as any)(doc, {
              startY: 28,
              head: [["Procedure", "Answer / Result"]],
              body,
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 2,
                valign: "top",
              },
              headStyles: {
                fillColor: [240, 240, 240],
                textColor: 20,
                halign: "left",
              },
              margin: { left: margin, right: margin },
              didDrawPage: addFooter,
            });
          } else {
            addFooter();
          }
        });
      const date = new Date();
      const fname = `Planning_Procedures_${safeTitle
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60)}_${date.toISOString().slice(0, 10)}.pdf`;
      doc.save(fname);
      toast({
        title: "Exported",
        description: `${fname} has been downloaded.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Export failed",
        description:
          e?.message || "Could not export planning procedures.",
        variant: "destructive",
      });
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

  const sectionsToRender =
    Array.isArray(proc.procedures) && proc.procedures.length > 0
      ? proc.procedures
      : DEFAULT_PLANNING_SECTIONS;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground font-body mb-4">
        Step-1: Generate questions for each planning section separately. You can
        freely edit / add / remove questions here before moving to Step-4
      </div>

      {sectionsToRender.length > 0 ? (
        <Accordion
          type="multiple"
          className="space-y-4"
          defaultValue={[sectionsToRender[0]?.sectionId || sectionsToRender[0]?.id || "section-0"]}
        >
          {sectionsToRender.map((sec: any, sIdx: number) => {
            const answers = makeAnswers(sec);
            const sectionId = sec.sectionId || sec.id || `section-${sIdx}`;
            const activeSectionTab = sectionTabs[sectionId] || "questions";
            const setActiveSectionTab = (value: string) => {
              setSectionTabs((prev) => ({ ...prev, [sectionId]: value }));
            };

            return (
              <AccordionItem
                key={sec.id || sIdx}
                value={sectionId}
                className="border border-gray-200 rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="text-left">
                    <div className="font-heading text-lg">
                      {PLANNING_SECTION_TITLES[sec.sectionId || sec.id] ?? sec.title ?? sec.sectionId ?? sec.id}
                    </div>
                    {sec.standards?.length ? (
                      <div className="text-xs text-muted-foreground">
                        Standards: {sec.standards.join(", ")}
                      </div>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-4">
                  <Tabs
                    value={activeSectionTab}
                    onValueChange={setActiveSectionTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-md">
                      <TabsTrigger value="questions" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Questions</TabsTrigger>
                      <TabsTrigger value="answers" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Answers</TabsTrigger>
                      <TabsTrigger value="procedures" className="bg-transparent text-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Procedures</TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="space-y-3 mt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion(sIdx)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                          {(sec.fields || []).length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleGenerateSectionQuestions(
                                  sec.sectionId || sec.id
                                )
                              }
                              disabled={generatingSections.has(
                                sec.sectionId || sec.id
                              )}
                            >
                              {generatingSections.has(sec.sectionId || sec.id) ? (
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
                              onClick={() =>
                                handleGenerateSectionQuestions(
                                  sec.sectionId || sec.id
                                )
                              }
                              disabled={generatingSections.has(
                                sec.sectionId || sec.id
                              )}
                            >
                              {generatingSections.has(sec.sectionId || sec.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Generate Questions
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!editMode ? (
                            <Button size="sm" onClick={() => setEditMode(true)}>
                              Edit
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" onClick={() => save(false)}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => save(true)}
                              >
                                Save & Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  pendingQuestions.forEach((uid__) => {
                                    setProc((prev: any) => {
                                      const next = { ...prev };
                                      const sections = [
                                        ...(next.procedures || []),
                                      ];
                                      sections.forEach((sec_: any) => {
                                        sec_.fields = (
                                          sec_.fields || []
                                        ).filter((f: any) => f.__uid !== uid__);
                                      });
                                      next.procedures = sections;
                                      return next;
                                    });
                                  });
                                  setPendingQuestions(new Set());
                                  setEditMode(false);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3 pr-2">
                          {(sec.fields || []).map((f: any, idx: number) => {
                            normalizeType(f.type);
                            if (!isFieldVisible(f, answers)) return null;
                            if (f.key === "documentation_reminder") return null;
                            const isPending = pendingQuestions.has(f.__uid);
                            const questionKey = `${sIdx}-${f.__uid}`;
                            const isEditing =
                              editingQuestionIds[questionKey] === f.__uid;
                            const editText =
                              editQuestionTexts[questionKey] ??
                              (f.label || f.key);

                            return (
                              <Card key={f.__uid}>
                                <CardContent className="pt-6">
                                  {isEditing || isPending ? (
                                    <div className="space-y-3">
                                      <Input
                                        value={editText}
                                        onChange={(e) =>
                                          setEditQuestionTexts((prev) => ({
                                            ...prev,
                                            [questionKey]: e.target.value,
                                          }))
                                        }
                                        placeholder="Question"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setField(sIdx, f.__uid, {
                                              label: editText,
                                            });
                                            if (isPending)
                                              confirmQuestion(sIdx, f.__uid);
                                            setEditingQuestionIds((prev) => {
                                              const next = { ...prev };
                                              delete next[questionKey];
                                              return next;
                                            });
                                            setEditQuestionTexts((prev) => {
                                              const next = { ...prev };
                                              delete next[questionKey];
                                              return next;
                                            });
                                          }}
                                        >
                                          <Save className="h-4 w-4 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (isPending)
                                              cancelQuestion(sIdx, f.__uid);
                                            setEditingQuestionIds((prev) => {
                                              const next = { ...prev };
                                              delete next[questionKey];
                                              return next;
                                            });
                                            setEditQuestionTexts((prev) => {
                                              const next = { ...prev };
                                              delete next[questionKey];
                                              return next;
                                            });
                                          }}
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-start">
                                        <div className="font-medium mb-1">
                                          {idx + 1}. {f.label || f.key}
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingQuestionIds((prev) => ({
                                                ...prev,
                                                [questionKey]: f.__uid,
                                              }));
                                              setEditQuestionTexts((prev) => ({
                                                ...prev,
                                                [questionKey]:
                                                  f.label || f.key,
                                              }));
                                            }}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeQuestion(sIdx, f.__uid)
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      {f.help && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {f.help}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                          {(!sec.fields || sec.fields.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground space-y-2">
                              <p>No questions available. Click &quot;Add Question&quot; to add manually, or use <strong>Generate Questions</strong> above to generate from AI.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="answers" className="space-y-3 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          {(sec.fields || []).length > 0 ? (
                            (sec.fields || []).some((f: any) => f.answer) ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleGenerateSectionAnswers(
                                    sec.sectionId || sec.id
                                  )
                                }
                                disabled={generatingSections.has(
                                  sec.sectionId || sec.id
                                )}
                              >
                                {generatingSections.has(
                                  sec.sectionId || sec.id
                                ) ? (
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
                                onClick={() =>
                                  handleGenerateSectionAnswers(
                                    sec.sectionId || sec.id
                                  )
                                }
                                disabled={generatingSections.has(
                                  sec.sectionId || sec.id
                                )}
                              >
                                {generatingSections.has(
                                  sec.sectionId || sec.id
                                ) ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-2" />
                                )}
                                Generate Answers
                              </Button>
                            )
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-muted-foreground text-sm">
                                No questions added yet.
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveSectionTab("questions")}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Go to Questions
                              </Button>
                            </div>
                          )}
                        </div>
                        {(sec.fields || []).length > 0 && (
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
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3 pr-2">
                          {(sec.fields || []).map((f: any, idx: number) => {
                            if (!isFieldVisible(f, answers)) return null;
                            if (f.key === "documentation_reminder") return null;
                            const questionKey = `${sIdx}-${f.__uid}`;
                            const isEditingAnswer =
                              editingQuestionIds[`answer-${questionKey}`] ===
                              f.__uid;
                            const editAnswerValue =
                              editQuestionTexts[`answer-${questionKey}`] ??
                              answerToEditString(f);

                            return (
                              <Card key={f.__uid}>
                                <CardContent className="pt-6">
                                  <div className="font-medium mb-2">
                                    {idx + 1}. {f.label || f.key}
                                  </div>
                                  {isEditingAnswer ? (
                                    <FieldAnswerEditor
                                      field={f}
                                      value={editAnswerValue}
                                      onChange={(v) =>
                                        setEditQuestionTexts((prev) => ({
                                          ...prev,
                                          [`answer-${questionKey}`]: v,
                                        }))
                                      }
                                      onSave={(savedValue) => {
                                        setField(sIdx, f.__uid, {
                                          answer: savedValue,
                                        });
                                        setEditingQuestionIds((prev) => {
                                          const next = { ...prev };
                                          delete next[`answer-${questionKey}`];
                                          return next;
                                        });
                                        setEditQuestionTexts((prev) => {
                                          const next = { ...prev };
                                          delete next[`answer-${questionKey}`];
                                          return next;
                                        });
                                      }}
                                      onCancel={() => {
                                        setEditingQuestionIds((prev) => {
                                          const next = { ...prev };
                                          delete next[`answer-${questionKey}`];
                                          return next;
                                        });
                                        setEditQuestionTexts((prev) => {
                                          const next = { ...prev };
                                          delete next[`answer-${questionKey}`];
                                          return next;
                                        });
                                      }}
                                    />
                                  ) : (
                                    <>
                                      <div className="text-sm text-muted-foreground mb-3">
                                        <FieldAnswerDisplay field={f} />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingQuestionIds((prev) => ({
                                            ...prev,
                                            [`answer-${questionKey}`]: f.__uid,
                                          }));
                                          setEditQuestionTexts((prev) => ({
                                            ...prev,
                                            [`answer-${questionKey}`]: answerToEditString(f),
                                          }));
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4 mr-1" />
                                        {f.answer !== undefined && f.answer !== null && f.answer !== "" ? "Edit Answer" : "Add Answer"}
                                      </Button>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                          {(!sec.fields || sec.fields.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                              No answers yet.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="procedures" className="space-y-3 mt-4">
                      {(proceduresViewMode[sectionId] || "procedures") ===
                      "reviews" ? (
                        <div className="space-y-3 overflow-x-hidden w-full max-w-full">
                          <div className="flex flex-col gap-2 mb-4 w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setProceduresViewMode((prev) => ({
                                  ...prev,
                                  [sectionId]: "procedures",
                                }))
                              }
                              className="w-full"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Back to Procedures
                            </Button>
                            <div className="flex items-center justify-between w-full">
                              <h4 className="text-lg font-semibold">
                                Overall Review
                              </h4>
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-[180px] border rounded px-3 py-2 bg-background"
                                  value={reviewStatus}
                                  onChange={(e) =>
                                    setReviewStatus(e.target.value)
                                  }
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
                                  onClick={async () => {
                                    setIsSavingReview(true);
                                    try {
                                      const form = new FormData();
                                      form.append(
                                        "data",
                                        JSON.stringify({
                                          ...proc,
                                          reviewStatus,
                                          reviewComments,
                                          sectionId,
                                          reviewerId: currentUserId,
                                        })
                                      );
                                      await apiPostFormData(
                                        endPoints.PLANNING_PROCEDURES.SAVE(
                                          engagementId
                                        ),
                                        form
                                      );
                                      setReviewComments("");
                                      await fetchReviews();
                                      toast({
                                        title: "Saved",
                                        description: "Review updated.",
                                      });
                                    } catch (e: any) {
                                      toast({
                                        title: "Error",
                                        description: e?.message,
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setIsSavingReview(false);
                                    }
                                  }}
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
                          <div className="mb-4 w-full">
                            <Label htmlFor="review-comments-overall">
                              Overall Review Comments
                            </Label>
                            <Textarea
                              id="review-comments-overall"
                              value={reviewComments}
                              onChange={(e) =>
                                setReviewComments(e.target.value)
                              }
                              placeholder="Add your review comments here..."
                              className="min-h-[100px] mt-2 w-full"
                            />
                          </div>
                          <ScrollArea className="h-[400px] border border-gray-200 rounded-md p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold">
                                  Review History
                                </h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={fetchReviews}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                              {reviews
                                .filter(
                                  (r) =>
                                    r.sectionId === sectionId ||
                                    (!r.sectionId &&
                                      sectionId ===
                                        (proc.procedures?.[0]?.sectionId ||
                                          proc.procedures?.[0]?.id))
                                )
                                .map((review: any, rIdx: number) => {
                                  const statusColors: Record<string, string> = {
                                    "in-progress": "bg-gray-100 text-gray-800",
                                    "ready-for-review":
                                      "bg-blue-100 text-blue-800",
                                    "under-review":
                                      "bg-yellow-100 text-yellow-800",
                                    approved: "bg-green-100 text-green-800",
                                    rejected: "bg-red-100 text-red-800",
                                    "signed-off":
                                      "bg-purple-100 text-purple-800",
                                    "re-opened":
                                      "bg-orange-100 text-orange-800",
                                  };
                                  const isOwner = isReviewOwner(review);
                                  return (
                                    <Card
                                      key={review._id || rIdx}
                                      className="mb-4"
                                    >
                                      <CardContent className="pt-6 pb-6">
                                        <div className="space-y-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Badge
                                                  className={
                                                    statusColors[
                                                      review.status
                                                    ] || "bg-gray-100 text-gray-800"
                                                  }
                                                >
                                                  {review.status || "N/A"}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                  {review.itemType || "N/A"}
                                                </span>
                                              </div>
                                              {review.reviewComments && (
                                                <div className="text-sm text-muted-foreground mb-2">
                                                  {review.reviewComments}
                                                </div>
                                              )}
                                            </div>
                                            {isOwner && (
                                              <div className="flex gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleEditReview(review)
                                                  }
                                                  disabled={
                                                    isDeletingReview ===
                                                    review._id
                                                  }
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleDeleteReview(
                                                      review._id
                                                    )
                                                  }
                                                  disabled={
                                                    isDeletingReview ===
                                                    review._id
                                                  }
                                                >
                                                  {isDeletingReview ===
                                                  review._id ? (
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
                                              <span className="font-medium">
                                                Reviewer:
                                              </span>{" "}
                                              <span className="text-muted-foreground">
                                                {review.reviewerName ||
                                                  memberNamesMap[
                                                    review.reviewedBy ||
                                                      review.assignedReviewer
                                                  ] ||
                                                  review.reviewedBy ||
                                                  review.assignedReviewer ||
                                                  "Not assigned"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-lg font-semibold shrink-0">
                              Audit Recommendations
                            </h4>
                            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto min-w-0 pb-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap shrink-0"
                                onClick={() =>
                                  setProceduresViewMode((prev) => ({
                                    ...prev,
                                    [sectionId]: "reviews",
                                  }))
                                }
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Reviews
                              </Button>
                              {(() => {
                                const hasAnswers =
                                  (sec.fields || []).length > 0 &&
                                  (sec.fields || []).some((f: any) => f.answer);
                                const sectionRecs = recommendations.filter(
                                  (rec) =>
                                    String(rec.section || rec.sectionId) ===
                                    String(sectionId)
                                );
                                return hasAnswers ? (
                                  sectionRecs.length > 0 ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="whitespace-nowrap shrink-0"
                                      onClick={() =>
                                        handleGenerateProcedures(sectionId)
                                      }
                                      disabled={generatingProcedures}
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
                                      className="whitespace-nowrap shrink-0"
                                      onClick={() =>
                                        handleGenerateProcedures(sectionId)
                                      }
                                      disabled={generatingProcedures}
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
                                  <div className="text-muted-foreground text-sm shrink-0">
                                    {(sec.fields || []).length === 0
                                      ? "Generate questions first."
                                      : "Generate answers first."}
                                  </div>
                                );
                              })()}
                              <Button
                                variant="default"
                                size="sm"
                                className="whitespace-nowrap shrink-0"
                                onClick={handleSaveProcedures}
                                disabled={isSaving}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save Procedures
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap shrink-0"
                                onClick={() => {
                                  setRecommendations((prev) => [
                                    ...prev,
                                    {
                                      id: `rec-${Date.now()}`,
                                      text: "New recommendation",
                                      checked: false,
                                      section: sectionId,
                                      sectionId: sectionId,
                                    },
                                  ]);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                          <ScrollArea className="h-[500px]">
                            <div className="space-y-3 pr-2">
                              {recommendations
                                .filter(
                                  (rec) =>
                                    String(rec.section || rec.sectionId) ===
                                    String(sectionId)
                                )
                                .map((rec, idx) => {
                                  const recId =
                                    rec.id || rec.__uid || `rec-${idx}`;
                                  const isEditing =
                                    editingRecommendationId === recId;
                                  return (
                                    <Card key={recId}>
                                      <CardContent className="pt-6">
                                        {isEditing ? (
                                          <div className="space-y-3">
                                            <Textarea
                                              value={editRecommendationText}
                                              onChange={(e) =>
                                                setEditRecommendationText(
                                                  e.target.value
                                                )
                                              }
                                              className="min-h-[100px]"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={
                                                  handleSaveRecommendation
                                                }
                                              >
                                                <Save className="h-4 w-4 mr-1" />
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={
                                                  handleCancelEditRecommendation
                                                }
                                              >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start gap-3">
                                            <Checkbox
                                              checked={rec.checked || false}
                                              onCheckedChange={() =>
                                                handleCheckboxToggle(
                                                  rec.id || recId
                                                )
                                              }
                                            />
                                            <span
                                              className={`flex-1 ${
                                                rec.checked
                                                  ? "line-through text-muted-foreground"
                                                  : ""
                                              }`}
                                            >
                                              {rec.text}
                                            </span>
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleEditRecommendation(
                                                    rec,
                                                    idx
                                                  )
                                                }
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  setRecommendations((prev) =>
                                                    prev.filter((r) => {
                                                      const rId =
                                                        r.id || r.__uid;
                                                      return rId !== recId;
                                                    })
                                                  )
                                                }
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              {recommendations.filter(
                                (rec) =>
                                  String(rec.section || rec.sectionId) ===
                                  String(sectionId)
                              ).length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                  No recommendations generated for this section
                                  yet.
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-muted-foreground">No sections.</div>
            <Button
              variant="outline"
              onClick={addSectionAndQuestion}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        {onWizardComplete && (
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              try {
                const payload = {
                  ...proc,
                  procedures: (proc?.procedures || []).map((sec: any) => ({
                    ...sec,
                    fields: (sec.fields || []).map(({ __uid, ...rest }: any) => rest),
                  })),
                  recommendations: recommendations,
                  procedureType: "planning",
                };
                const formData = new FormData();
                formData.append("data", JSON.stringify(payload));
                await apiPostFormData(
                  endPoints.PLANNING_PROCEDURES.SAVE(engagementId),
                  formData
                );
                onWizardComplete({ ...payload, procedureType: "planning" });
              } catch (e: any) {
                toast({
                  title: "Save failed",
                  description: e?.message || "Could not save.",
                  variant: "destructive",
                });
              }
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleExportPlanningPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <FloatingNotesButton
        onClick={() => setIsNotesOpen(true)}
        isOpen={isNotesOpen}
      />

      <NotebookInterface
        isOpen={isNotesOpen}
        isEditable={true}
        onClose={() => setIsNotesOpen(false)}
        recommendations={recommendations}
        onSave={handleSaveRecommendations}
        isPlanning={true}
      />

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
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
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
