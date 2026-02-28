import type React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowLeft,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { formatClassificationForDisplay } from "./steps/procedureClassificationMapping";
import { ProcedureTypeSelection } from "./ProcedureTypeSelection";
import { ProcedureGeneration } from "./ProcedureGeneration";
import { PlanningProcedureGeneration } from "./PlanningProcedureGeneration";
import { ProcedureView } from "./ProcedureView";
import { PlanningProcedureView } from "./PlanningProcedureView";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { useQuery } from "@tanstack/react-query";
import { useETBData } from "../hooks/useETBData";
import { CompletionProcedureGeneration } from "./CompletionProcedureGeneration";
import { CompletionProcedureView } from "./CompletionProcedureView";

interface ProceduresTabProps {
  engagementId: string;
  engagement?: any;
  /** When inside Sections → Classification view, pass the classification label for header and filtering */
  classification?: string | null;
  /** DB classification id for per-classification fieldwork procedure persistence (each sidebar item gets its own stored procedure id) */
  classificationId?: string | null;
  /** Optional callback when user clicks close (e.g. in classification context) */
  onClose?: () => void;
}

export const ProceduresTab: React.FC<ProceduresTabProps> = ({
  engagementId,
  engagement: engagementProp,
  classification: classificationProp = null,
  classificationId: classificationIdProp = null,
  onClose,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("procedureTab") || "generate";
  const selectedProcedureType = (searchParams.get("procedureType") as
    | "planning"
    | "fieldwork"
    | "completion")
    || null;
  const currentStep = searchParams.get("step");
  const selectedMode = (searchParams.get("mode") as "manual" | "ai" | "hybrid") || null;

  // Ref: set default procedure type when entering classification context (only once)
  const didSetDefaultProcedureTypeRef = useRef(false);
  /** When true, skip the useEffect that redirects view→generate (we just completed fieldwork save and switched to view). */
  const justCompletedFieldworkSaveRef = useRef(false);
  /** Holds the last saved fieldwork procedure so View tab stays enabled before state commits (matches planning/completion behavior). */
  const savedFieldworkRef = useRef<any>(null);

  const [fieldworkProcedure, setFieldworkProcedure] = useState<any>(null);
  const [completionProcedure, setCompletionProcedure] = useState<any>(null);
  const [planningProcedure, setPlanningProcedure] = useState<any>(null);
  const [procedureTypeLoading, setProcedureTypeLoading] = useState(false);
  const { toast } = useToast();

  const { data: engagementData } = useQuery({
    queryKey: ["engagement-view", engagementId],
    enabled: !!engagementId && !engagementProp,
    queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId)),
  });

  const engagement = engagementProp || engagementData?.data || engagementData;
  const { auditCycleId } = useETBData(engagementId);

  const updateProcedureParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams, { replace });
    },
    [searchParams, setSearchParams]
  );

  // Set default procedure type ("fieldwork" + "hybrid") when in classification context (once)
  useEffect(() => {
    if (classificationProp == null) {
      didSetDefaultProcedureTypeRef.current = false;
      return;
    }
    if (selectedProcedureType === null && searchParams.get("procedureType") === null && !didSetDefaultProcedureTypeRef.current) {
      updateProcedureParams({ procedureType: "fieldwork", mode: "hybrid" }, true);
      didSetDefaultProcedureTypeRef.current = true;
    }
  }, [classificationProp, selectedProcedureType, searchParams, updateProcedureParams]);

  /** SessionStorage key for last-saved fieldwork procedure id (so we prefer it after refresh). When classificationId is set, each classification has its own key. */
  const getFieldworkProcedureStorageKey = (eid: string, acid: string, cid?: string | null) =>
    cid ? `vacei_fieldwork_procedure_${eid}_${acid}_${cid}` : `vacei_fieldwork_procedure_${eid}_${acid}`;

  /** Normalize procedures list from API (supports { data: [] }, { data: { data: [] } }, or array). */
  const getProceduresList = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  /** Pick best fieldwork procedure from list: prefer by id when provided (e.g. just-saved), else one with saved documentPayload; when in classification context and no stored id, prefer procedure whose questions match that classification. */
  const normalizeFieldworkFromList = useCallback(
    (
      fwList: any[],
      preferredAuditCycleId: string | undefined,
      preferredProcedureId?: string | null,
      classificationTitle?: string | null
    ): any | null => {
      if (!fwList.length) return null;
      const norm = (c: string) => (c || "").trim().replace(/\s*>\s*/g, " > ").trim();
      const questionMatchesClassification = (q: any, filter: string) => {
        const item = norm((q?.classification ?? "") as string);
        const f = norm(filter);
        if (!item || !f) return false;
        if (item === f) return true;
        if (item.startsWith(f + " > ")) return true;
        if (f.startsWith(item + " > ")) return true;
        return false;
      };
      const hasQuestions = (p: any) => {
        const payload = p?.documentPayload;
        if (payload && typeof payload === "object" && Array.isArray(payload.questions) && payload.questions.length > 0)
          return true;
        return Array.isArray(p?.questions) && p.questions.length > 0;
      };
      const hasRecommendations = (p: any) => {
        const payload = p?.documentPayload;
        const recs = payload?.recommendations ?? p?.recommendations;
        return Array.isArray(recs) && recs.length > 0;
      };
      const mergePayload = (p: any) => {
        const payload = p?.documentPayload;
        if (payload && typeof payload === "object")
          return { ...p, ...payload, auditCycleId: p.auditCycleId ?? payload.auditCycleId ?? preferredAuditCycleId };
        return { ...p, auditCycleId: p.auditCycleId ?? preferredAuditCycleId };
      };
      // After save, prefer the procedure we just saved so we don't pick another row from the list (API returns many FIELDWORK rows)
      if (preferredProcedureId) {
        const byId = fwList.find((p) => p?.id === preferredProcedureId || (p?.documentPayload as any)?.id === preferredProcedureId);
        if (byId) {
          return mergePayload(byId);
        }
      }
      // When in classification context and no stored id, prefer procedures that have questions for this classification
      let list = fwList;
      if (classificationTitle && classificationTitle.trim()) {
        const forClassification = fwList.filter((p: any) => {
          const questions = p?.documentPayload?.questions ?? p?.questions ?? [];
          return Array.isArray(questions) && questions.some((q: any) => questionMatchesClassification(q, classificationTitle));
        });
        if (forClassification.length > 0) list = forClassification;
      }
      // Prefer procedure that has both questions and recommendations so View tab shows recommendations when API has them
      const withQuestionsAndRecs = list.find((p) => hasQuestions(p) && hasRecommendations(p));
      const withQuestions = withQuestionsAndRecs ?? list.find(hasQuestions);
      const raw = withQuestions ?? list[0];
      const fw = mergePayload(raw);
      return fw;
    },
    []
  );

  // Load procedures: Planning and Completion via REFERENCE-style GET by engagement; Fieldwork via GET by auditCycleId+type (like planning/completion so View tab works after login)
  useEffect(() => {
    if (!engagementId) return;
    const loadProcedures = async () => {
      setProcedureTypeLoading(true);
      try {
        const [fieldworkRes, planningRes, completionRes] = await Promise.all([
          auditCycleId
            ? apiGet<any>(endPoints.PROCEDURES.GET_ALL, {
                auditCycleId,
                type: "FIELDWORK",
                limit: 100,
                _t: Date.now(),
              }).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          apiGet<{ data?: any }>(endPoints.PLANNING_PROCEDURES.GET_BY_ENGAGEMENT(engagementId)).catch(() => ({ data: null })),
          apiGet<{ data?: any }>(endPoints.COMPLETION_PROCEDURES.GET_BY_ENGAGEMENT(engagementId)).catch(() => ({ data: null })),
        ]);
        const fwList = getProceduresList(fieldworkRes);
        const preferredProcedureId =
          auditCycleId && engagementId
            ? sessionStorage.getItem(getFieldworkProcedureStorageKey(engagementId, auditCycleId, classificationIdProp))
            : null;
        const fw = auditCycleId
          ? normalizeFieldworkFromList(fwList, auditCycleId, preferredProcedureId, classificationProp)
          : null;
        const pl = planningRes?.data ?? null;
        const co = completionRes?.data ?? null;
        setFieldworkProcedure(fw);
        setPlanningProcedure(pl);
        setCompletionProcedure(co);
      } catch (e) {
        console.error("Error loading procedures:", e);
      } finally {
        setProcedureTypeLoading(false);
      }
    };
    loadProcedures();
  }, [engagementId, auditCycleId, classificationIdProp, classificationProp, normalizeFieldworkFromList]);

  /** Fetch fieldwork procedure data only (returns merged procedure or null; used for refetch + merge). When preferredProcedureId is set (e.g. after save), prefer that procedure in the list. When in classification context, classificationTitle is used to prefer procedures matching that classification. */
  const loadFieldworkProcedureData = useCallback(
    async (preferredProcedureId?: string | null, classificationTitle?: string | null): Promise<any | null> => {
      if (!engagementId || !auditCycleId) return null;
      const fieldworkRes = await apiGet<any>(endPoints.PROCEDURES.GET_ALL, {
        auditCycleId,
        type: "FIELDWORK",
        limit: 100,
        _t: Date.now(),
      }).catch(() => ({ data: [] }));
      const fwList = getProceduresList(fieldworkRes);
      return normalizeFieldworkFromList(fwList, auditCycleId, preferredProcedureId, classificationTitle);
    },
    [engagementId, auditCycleId, normalizeFieldworkFromList]
  );

  // When auditCycleId becomes available after mount (e.g. after login), load fieldwork so View Procedures tab has data (matches planning/completion persistence).
  // Uses functional update so a late-arriving fetch never overwrites just-saved data (e.g. after Save Procedures).
  useEffect(() => {
    if (!auditCycleId || !engagementId) return;
    const hasFieldwork =
      fieldworkProcedure &&
      ((Array.isArray(fieldworkProcedure.questions) && fieldworkProcedure.questions.length > 0) ||
        (Array.isArray(fieldworkProcedure?.documentPayload?.questions) &&
          fieldworkProcedure.documentPayload.questions.length > 0));
    if (hasFieldwork) return;
    let cancelled = false;
    const preferredId =
      engagementId && auditCycleId
        ? sessionStorage.getItem(getFieldworkProcedureStorageKey(engagementId, auditCycleId, classificationIdProp))
        : null;
    loadFieldworkProcedureData(preferredId || undefined, classificationProp ?? undefined).then((fetched) => {
      if (cancelled) return;
      setFieldworkProcedure((prev: any) => {
        if (prev && Array.isArray(prev.recommendations) && prev.recommendations.length > 0) return prev;
        if (prev && Array.isArray(prev.questions) && prev.questions.length > 0) return prev;
        return fetched
          ? { ...fetched, auditCycleId: fetched.auditCycleId ?? auditCycleId ?? undefined }
          : null;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [auditCycleId, engagementId, classificationIdProp, classificationProp, fieldworkProcedure, loadFieldworkProcedureData]);

  /** Refetch completion procedure only (matches REFERENCE GET /api/completion-procedures/:engagementId) */
  const loadCompletionProcedure = useCallback(async () => {
    if (!engagementId) return;
    try {
      const res = await apiGet<{ data?: any }>(endPoints.COMPLETION_PROCEDURES.GET_BY_ENGAGEMENT(engagementId));
      setCompletionProcedure(res?.data ?? null);
    } catch (e) {
      console.error("Error loading completion procedure:", e);
    }
  }, [engagementId]);

  /** On complete from Generate tab: validate content, set state or null, reload from API, then navigate to view (matches REFERENCE) */
  const handleProcedureComplete = useCallback(
    async (procedureData: any) => {
      const type =
        procedureData?.procedureType === "procedures"
          ? "fieldwork"
          : procedureData?.procedureType;

      if (type === "planning") {
        const hasProceduresData =
          procedureData &&
          Array.isArray(procedureData.procedures) &&
          procedureData.procedures.length > 0;
        if (hasProceduresData) {
          setPlanningProcedure(procedureData);
        } else {
          setPlanningProcedure(null);
        }
        try {
          const res = await apiGet<{ data?: any }>(endPoints.PLANNING_PROCEDURES.GET_BY_ENGAGEMENT(engagementId));
          const apiData = res?.data ?? null;
          const apiHasProcedures =
            apiData &&
            Array.isArray(apiData.procedures) &&
            apiData.procedures.length > 0;
          if (apiHasProcedures) {
            setPlanningProcedure(apiData);
          }
          // else keep current state (minimal procedure from Proceed to Procedures so sections still show)
        } catch (e) {
          console.error("Error loading planning procedure:", e);
        }
      } else if (type === "fieldwork") {
        const savedProcedureId = procedureData?.id ?? procedureData?._id;
        const savedFieldwork =
          procedureData &&
          Array.isArray(procedureData.questions) &&
          procedureData.questions.length > 0
            ? { ...procedureData, auditCycleId: procedureData.auditCycleId ?? auditCycleId }
            : null;
        savedFieldworkRef.current = savedFieldwork ?? null;
        setFieldworkProcedure(savedFieldwork ?? null);
        if (savedProcedureId && auditCycleId) {
          try {
            sessionStorage.setItem(
              getFieldworkProcedureStorageKey(engagementId, auditCycleId, classificationIdProp),
              savedProcedureId
            );
          } catch (_) {}
        }
        justCompletedFieldworkSaveRef.current = true;
        // Switch to View tab immediately so user sees View Procedures with questions/answers/procedures.
        updateProcedureParams(
          {
            procedureTab: "view",
            procedureType: type,
            mode: null,
            step: null,
          },
          false
        );
        // Refetch preferring the procedure we just saved (API returns many FIELDWORK rows; pick same id)
        const fetched = await loadFieldworkProcedureData(savedProcedureId);
        setFieldworkProcedure((prev: any) => {
          const next = fetched
            ? { ...fetched, auditCycleId: fetched.auditCycleId ?? auditCycleId ?? undefined }
            : null;
          // Keep just-saved data if refetch failed or returned empty (e.g. timing/DB delay)
          if (!next) return prev ?? null;
          const hasQuestions =
            next.questions && Array.isArray(next.questions) && next.questions.length > 0;
          const hasRecommendations =
            next.recommendations && Array.isArray(next.recommendations) && next.recommendations.length > 0;
          // Prefer the just-saved procedureData so we never overwrite with stale prev (which can be pre-save state)
          const questions =
            (procedureData?.questions && Array.isArray(procedureData.questions) && procedureData.questions.length > 0)
              ? procedureData.questions
              : (hasQuestions ? next.questions : (prev?.questions ?? []));
          const recommendations =
            (procedureData?.recommendations && Array.isArray(procedureData.recommendations) && procedureData.recommendations.length > 0)
              ? procedureData.recommendations
              : (hasRecommendations ? next.recommendations : (prev?.recommendations ?? []));
          return { ...next, questions, recommendations };
        });
        // When transitioning to Generate/View tabs (Proceed to Procedures), keep URL so we stay on Generate tab with step=tabs — avoid clearing step which causes step1→step2→step1 loop.
        if (procedureData?.status === "in_progress") {
          return;
        }
      } else if (type === "completion") {
        if (
          procedureData &&
          Array.isArray(procedureData.procedures) &&
          procedureData.procedures.length > 0
        ) {
          setCompletionProcedure(procedureData);
        } else {
          setCompletionProcedure(null);
        }
        await loadCompletionProcedure();
      }

      updateProcedureParams(
        {
          procedureTab: "view",
          procedureType: type ?? null,
          mode: null,
          step: null,
        },
        false
      );
      toast({
        title: "Procedures Generated",
        description: "Saved successfully.",
      });
    },
    [
      engagementId,
      auditCycleId,
      classificationIdProp,
      loadFieldworkProcedureData,
      loadCompletionProcedure,
      updateProcedureParams,
      toast,
    ]
  );

  const handleRegenerate = () => {
    updateProcedureParams(
      {
        procedureType: null,
        mode: null,
        step: null,
      },
      false
    );
  };

  /** Close procedure panel (REFERENCE handleCloseProcedure): reset type, switch to view tab, clear mode/step */
  const handleCloseProcedure = () => {
    updateProcedureParams(
      {
        procedureType: null,
        procedureTab: "view",
        mode: null,
        step: null,
      },
      false
    );
  };

  /** Hierarchical back for classification context (matches REFERENCE-PORTAL): step-by-step back, only "Back to Procedure Selection" clears type */
  const handleClassificationBackArrow = () => {
    if (!selectedProcedureType) return;
    // If in tabs view (step === "tabs"), go back to questions step
    if (currentStep === "tabs") {
      updateProcedureParams({ procedureTab: "generate", step: "1" }, false);
      return;
    }
    // If in a numbered step, go back one step or to mode selection
    if (selectedMode && currentStep != null && currentStep !== "") {
      const stepNum = parseInt(currentStep, 10);
      if (!Number.isNaN(stepNum)) {
        if (stepNum > 0) {
          updateProcedureParams({ procedureTab: "generate", step: (stepNum - 1).toString() }, false);
        } else {
          updateProcedureParams({ procedureTab: "generate", mode: null, step: null }, false);
        }
        return;
      }
    }
    // If at mode selection (mode exists but no step), set to hybrid step 0 (REFERENCE: "reset to step 0 with hybrid mode")
    if (selectedMode && !currentStep) {
      updateProcedureParams({ procedureTab: "generate", mode: "hybrid", step: "0" }, false);
      return;
    }
    // If at procedure type selection (type exists but no mode), clear procedureType - back to type selection (matches REFERENCE handleProcedureTypeBack)
    if (!selectedMode) {
      updateProcedureParams({ procedureTab: "generate", procedureType: null, mode: null, step: null }, false);
      return;
    }
    updateProcedureParams({ procedureTab: "generate", mode: "hybrid", step: "0" }, false);
  };

  /** Whether we have procedure data to show in View tab (aligns with planning/completion: any loadable data enables View). */
  const hasProcedures = useCallback(
    (procedureType: "planning" | "fieldwork" | "completion" | null) => {
      if (!procedureType) return false;
      if (procedureType === "planning") {
        return (
          planningProcedure?.procedures &&
          Array.isArray(planningProcedure.procedures) &&
          planningProcedure.procedures.length > 0
        );
      }
      if (procedureType === "fieldwork") {
        const hasQuestions = (p: any) =>
          p &&
          ((Array.isArray(p.questions) && p.questions.length > 0) ||
            (Array.isArray(p?.documentPayload?.questions) && p.documentPayload.questions.length > 0));
        const fromState = hasQuestions(fieldworkProcedure);
        const fromSavedRef = hasQuestions(savedFieldworkRef.current);
        return fromState || fromSavedRef;
      }
      if (procedureType === "completion") {
        return (
          completionProcedure?.procedures &&
          Array.isArray(completionProcedure.procedures) &&
          completionProcedure.procedures.length > 0
        );
      }
      return false;
    },
    [planningProcedure, fieldworkProcedure, completionProcedure]
  );

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

  /** Effective fieldwork procedure: state or saved ref so View tab has data before state commits (like planning/completion). */
  const effectiveFieldworkProcedure = useMemo(() => {
    const hasQuestions = (p: any) =>
      p &&
      ((Array.isArray(p.questions) && p.questions.length > 0) ||
        (Array.isArray(p?.documentPayload?.questions) && p.documentPayload.questions.length > 0));
    const fromState = hasQuestions(fieldworkProcedure) ? fieldworkProcedure : null;
    const fromRef = hasQuestions(savedFieldworkRef.current) ? savedFieldworkRef.current : null;
    return fromState ?? fromRef ?? fieldworkProcedure;
  }, [fieldworkProcedure]);

  /** Clear saved ref once state has caught up so we don't rely on ref indefinitely. */
  useEffect(() => {
    const hasQuestions = (p: any) =>
      p &&
      ((Array.isArray(p.questions) && p.questions.length > 0) ||
        (Array.isArray(p?.documentPayload?.questions) && p.documentPayload.questions.length > 0));
    if (hasQuestions(fieldworkProcedure)) savedFieldworkRef.current = null;
  }, [fieldworkProcedure]);

  /** Unique classifications from fieldwork questions for multi-section View (when no classification selected) */
  const fieldworkSections = useMemo(() => {
    const proc = effectiveFieldworkProcedure;
    if (!proc || !Array.isArray(proc.questions)) return [];
    const set = new Set<string>();
    proc.questions.forEach((q: any) => {
      const c = (q?.classification ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [effectiveFieldworkProcedure]);

  const isViewProceduresDisabled = useMemo(() => {
    if (!selectedProcedureType) return true;
    if (classificationProp) {
      if (selectedProcedureType === "planning") {
        if (!planningProcedure) return true;
        const procedures = planningProcedure.procedures || [];
        if (!Array.isArray(procedures) || procedures.length === 0) return true;
        const matching = procedures.filter(
          (p: any) => p?.fields && Array.isArray(p.fields) && p.fields.length > 0
        );
        return matching.length === 0;
      }
      if (selectedProcedureType === "fieldwork") {
        const proc = effectiveFieldworkProcedure;
        if (!proc) return true;
        const questions = proc.questions ?? proc?.documentPayload?.questions ?? [];
        if (!Array.isArray(questions) || questions.length === 0) return true;
        const anyHasClassification = questions.some((q: any) => (q?.classification ?? "").trim() !== "");
        if (!anyHasClassification) return false;
        const matching = questions.filter((q: any) =>
          matchesClassification(q.classification, classificationProp)
        );
        return matching.length === 0;
      }
      if (selectedProcedureType === "completion") {
        if (!completionProcedure) return true;
        const procedures = completionProcedure.procedures || [];
        if (!Array.isArray(procedures) || procedures.length === 0) return true;
        const matching = procedures.filter(
          (p: any) => p?.fields && Array.isArray(p.fields) && p.fields.length > 0
        );
        return matching.length === 0;
      }
    }
    return !hasProcedures(selectedProcedureType);
  }, [
    selectedProcedureType,
    classificationProp,
    planningProcedure,
    effectiveFieldworkProcedure,
    completionProcedure,
    hasProcedures,
  ]);

  const handleTabChange = (tab: string) => {
    if (tab === "view") {
      const disabled =
        classificationProp != null
          ? isViewProceduresDisabled
          : selectedProcedureType === "fieldwork"
            ? !hasProcedures("fieldwork")
            : false;
      if (disabled) return;
    }
    updateProcedureParams({ procedureTab: tab }, false);
  };

  useEffect(() => {
    if (justCompletedFieldworkSaveRef.current) {
      justCompletedFieldworkSaveRef.current = false;
      return;
    }
    if (
      activeTab === "view" &&
      selectedProcedureType &&
      (classificationProp
        ? isViewProceduresDisabled
        : selectedProcedureType === "fieldwork" && !hasProcedures("fieldwork"))
    ) {
      updateProcedureParams({ procedureTab: "generate" }, true);
    }
  }, [
    activeTab,
    selectedProcedureType,
    planningProcedure,
    fieldworkProcedure,
    completionProcedure,
    updateProcedureParams,
    hasProcedures,
    classificationProp,
    isViewProceduresDisabled,
  ]);

  const handleProcedureTypeSelect = (
    type: "planning" | "fieldwork" | "completion"
  ) => {
    updateProcedureParams(
      {
        procedureType: type,
        mode: null,
        step: null,
      },
      false
    );
  };

  const handleProcedureTypeBack = () => {
    updateProcedureParams(
      {
        procedureType: null,
        mode: null,
        step: null,
      },
      false
    );
  };

  const getProcedureStatusBadge = () => {
    const procedure =
      selectedProcedureType === "planning"
        ? planningProcedure
        : selectedProcedureType === "fieldwork"
          ? fieldworkProcedure
          : null;
    if (!procedure) return null;
    const statusConfig = {
      draft: {
        variant: "secondary" as const,
        label: "Draft",
        icon: FileText,
      },
      "in-progress": {
        variant: "default" as const,
        label: "In Progress",
        icon: AlertCircle,
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        icon: CheckCircle,
      },
    };
    const config =
      statusConfig[procedure.status as keyof typeof statusConfig] ||
      statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProcedureTypeBadge = () => {
    if (!selectedProcedureType) return null;
    const typeConfig = {
      planning: { label: "Planning", color: "bg-blue-500" },
      fieldwork: { label: "Field Work", color: "bg-green-500" },
      completion: { label: "Completion", color: "bg-purple-500" },
    };
    const config =
      typeConfig[selectedProcedureType as keyof typeof typeConfig];
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div
          className={`h-2 w-2 rounded-full ${config?.color ?? "bg-gray-500"}`}
        />
        {config?.label ?? selectedProcedureType}
      </Badge>
    );
  };

  if (!engagement && !engagementProp && engagementId) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        Loading engagement...
      </div>
    );
  }

  const eng = engagement || engagementProp;

  return (
    <div className="h-full flex flex-col">
      {classificationProp != null ? (
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/80">
          <div className="flex items-center gap-3">
            {selectedProcedureType && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 shadow-sm"
                aria-label="Back"
                onClick={handleClassificationBackArrow}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {selectedProcedureType ? (
                <span className="border border-gray-200 rounded-md px-2 py-1 bg-gray-50/80">
                  {selectedProcedureType === "planning" ? "Planning Procedures" : selectedProcedureType === "fieldwork" ? "Fieldwork Procedures" : "Completion Procedures"}
                </span>
              ) : (
                formatClassificationForDisplay(classificationProp)
              )}
            </h3>
            {selectedProcedureType && (
              <Button
                variant="outline"
                onClick={handleProcedureTypeBack}
                className="flex items-center gap-2 bg-transparent rounded-md hover:bg-gray-100 hover:text-foreground transition-colors border-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                Back to Procedure Selection
              </Button>
            )}
          </div>
          {classificationProp != null ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose ?? handleCloseProcedure}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : onClose ? (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {selectedProcedureType ? (
              <>
                <h3 className="font-heading text-xl text-foreground text-gray-900 flex items-center gap-2">
                  <span className="border border-gray-200 rounded-md px-2 py-1 bg-gray-50/80">
                    {selectedProcedureType === "planning" ? "Planning Procedures" : selectedProcedureType === "fieldwork" ? "Fieldwork Procedures" : "Completion Procedures"}
                  </span>
                </h3>
                <Button
                  variant="outline"
                  onClick={handleProcedureTypeBack}
                  className="flex items-center gap-2 bg-transparent rounded-md hover:bg-gray-100 hover:text-foreground transition-colors border-gray-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  Back to Procedure Selection
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-heading text-2xl text-foreground text-gray-900">
                  Audit Procedures
                </h2>
                <div className="flex items-center gap-2">
                  {getProcedureStatusBadge()}
                  {getProcedureTypeBadge()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {procedureTypeLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading Procedures...</span>
        </div>
      ) : (
        <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200">
            <Sparkles className="h-4 w-4" /> Generate Procedures
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="flex items-center justify-center gap-2 w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200"
            disabled={
              classificationProp != null
                ? isViewProceduresDisabled
                : selectedProcedureType === "fieldwork"
                  ? !hasProcedures("fieldwork")
                  : false
            }
            title={
              classificationProp != null && isViewProceduresDisabled
                ? "Generate procedures first"
                : selectedProcedureType === "fieldwork" && !hasProcedures("fieldwork")
                  ? "Generate procedures first"
                  : undefined
            }
          >
            <Eye className="h-4 w-4" /> View Procedures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="flex-1 mt-6 px-4">
          {!selectedProcedureType ? (
            <ProcedureTypeSelection
              onTypeSelect={handleProcedureTypeSelect}
              title="Choose the type of audit procedures you want to generate"
            />
          ) : selectedProcedureType === "planning" ? (
            <PlanningProcedureGeneration
              engagement={eng}
              existingProcedure={planningProcedure}
              onComplete={handleProcedureComplete}
              onBack={handleProcedureTypeBack}
              updateProcedureParams={updateProcedureParams}
              searchParams={searchParams}
            />
          ) : selectedProcedureType === "fieldwork" ? (
            /* Classification from sidebar: skip "Choose Your Approach", default to AI; then Materiality → Classifications → Generate/View tabs. Main flow: full wizard. */
            <ProcedureGeneration
              engagement={eng}
              existingProcedure={effectiveFieldworkProcedure ?? fieldworkProcedure}
              currentClassification={classificationProp}
              onBack={handleProcedureTypeBack}
              onComplete={handleProcedureComplete}
              updateProcedureParams={updateProcedureParams}
              searchParams={searchParams}
              skipModeSelection={
                classificationProp != null &&
                String(classificationProp).trim() !== ""
              }
              defaultMode="ai"
            />
          ) : (
            <CompletionProcedureGeneration
              engagement={eng}
              onBack={handleProcedureTypeBack}
              existingProcedure={completionProcedure}
              onComplete={handleProcedureComplete}
              updateProcedureParams={updateProcedureParams}
              searchParams={searchParams}
            />
          )}
        </TabsContent>

        <TabsContent value="view" className="flex-1 mt-6 px-4 pb-4">
          {!selectedProcedureType ? (
            <ProcedureTypeSelection
              onTypeSelect={handleProcedureTypeSelect}
              title="Choose the type of audit procedures you want to view"
            />
          ) : selectedProcedureType === "planning" ? (
            <PlanningProcedureView
              procedure={planningProcedure ?? {}}
              engagement={eng}
              onProcedureUpdate={setPlanningProcedure}
            />
          ) : selectedProcedureType === "fieldwork" ? (
            effectiveFieldworkProcedure ? (
              classificationProp && String(classificationProp).trim() !== "" ? (
                <ProcedureView
                  procedure={effectiveFieldworkProcedure}
                  engagement={eng}
                  onRegenerate={handleRegenerate}
                  currentClassification={classificationProp}
                  auditCycleId={auditCycleId ?? undefined}
                  onProcedureUpdate={(updatedProcedure: any) => {
                    setFieldworkProcedure(updatedProcedure);
                    // Refetch only in onComplete (handleProcedureComplete) to avoid race where merge uses stale prev
                  }}
                />
              ) : fieldworkSections.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Step-1: Generate questions for each classification separately. You can freely edit / add / remove questions here before moving to the next step.
                  </p>
                  {fieldworkSections.map((classification: string) => (
                    <ProcedureView
                      key={classification}
                      procedure={effectiveFieldworkProcedure}
                      engagement={eng}
                      onRegenerate={handleRegenerate}
                      currentClassification={classification}
                      showStepInstruction={false}
                      auditCycleId={auditCycleId ?? undefined}
                      onProcedureUpdate={(updatedProcedure: any) => {
                        setFieldworkProcedure(updatedProcedure);
                        // Refetch only in onComplete (handleProcedureComplete) to avoid race where merge uses stale prev
                      }}
                    />
                  ))}
                </div>
              ) : (
                <ProcedureView
                  procedure={effectiveFieldworkProcedure}
                  engagement={eng}
                  onRegenerate={handleRegenerate}
                  auditCycleId={auditCycleId ?? undefined}
                  onProcedureUpdate={(updatedProcedure: any) => {
                    setFieldworkProcedure(updatedProcedure);
                    // Refetch only in onComplete (handleProcedureComplete) to avoid race where merge uses stale prev
                  }}
                />
              )
            ) : (
              <div className="text-muted-foreground text-gray-500">
                No Fieldwork procedures found.
              </div>
            )
          ) : (
            <CompletionProcedureView
              procedure={completionProcedure ?? {}}
              engagement={eng}
              onRegenerate={handleRegenerate}
              onProcedureUpdate={setCompletionProcedure}
            />
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};
