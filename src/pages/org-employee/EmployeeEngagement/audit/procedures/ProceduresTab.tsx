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
  /** Optional callback when user clicks close (e.g. in classification context) */
  onClose?: () => void;
}

export const ProceduresTab: React.FC<ProceduresTabProps> = ({
  engagementId,
  engagement: engagementProp,
  classification: classificationProp = null,
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

  // Load procedures: Planning and Completion via REFERENCE-style GET by engagement; Fieldwork via GET by auditCycleId+type
  useEffect(() => {
    if (!engagementId) return;
    const loadProcedures = async () => {
      setProcedureTypeLoading(true);
      try {
        const [fieldworkRes, planningRes, completionRes] = await Promise.all([
          auditCycleId
            ? apiGet<{ data?: any[] }>(endPoints.PROCEDURES.GET_ALL, {
                auditCycleId,
                type: "FIELDWORK",
              }).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          apiGet<{ data?: any }>(endPoints.PLANNING_PROCEDURES.GET_BY_ENGAGEMENT(engagementId)).catch(() => ({ data: null })),
          apiGet<{ data?: any }>(endPoints.COMPLETION_PROCEDURES.GET_BY_ENGAGEMENT(engagementId)).catch(() => ({ data: null })),
        ]);
        const fwRaw =
          auditCycleId && Array.isArray(fieldworkRes?.data)
            ? fieldworkRes.data[0] ?? null
            : null;
        const fw =
          fwRaw?.documentPayload && typeof fwRaw.documentPayload === "object"
            ? { ...fwRaw, ...fwRaw.documentPayload }
            : fwRaw;
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
  }, [engagementId, auditCycleId]);

  /** Refetch fieldwork procedure only (for onProcedureUpdate after save - matches REFERENCE loadProcedure("fieldwork")) */
  const loadFieldworkProcedure = useCallback(async () => {
    if (!engagementId || !auditCycleId) return;
    try {
      const fieldworkRes = await apiGet<{ data?: any[] }>(endPoints.PROCEDURES.GET_ALL, {
        auditCycleId,
        type: "FIELDWORK",
      }).catch(() => ({ data: [] }));
      const fwRaw = Array.isArray(fieldworkRes?.data) ? fieldworkRes.data[0] ?? null : null;
      const fw =
        fwRaw?.documentPayload && typeof fwRaw.documentPayload === "object"
          ? { ...fwRaw, ...fwRaw.documentPayload }
          : fwRaw;
      setFieldworkProcedure(fw);
    } catch (e) {
      console.error("Error loading fieldwork procedure:", e);
    }
  }, [engagementId, auditCycleId]);

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
        if (
          procedureData &&
          Array.isArray(procedureData.questions) &&
          procedureData.questions.length > 0
        ) {
          setFieldworkProcedure({
            ...procedureData,
            auditCycleId: procedureData.auditCycleId ?? auditCycleId,
          });
        } else {
          setFieldworkProcedure(null);
        }
        await loadFieldworkProcedure();
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
      loadFieldworkProcedure,
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
        return (
          fieldworkProcedure?.questions &&
          Array.isArray(fieldworkProcedure.questions) &&
          fieldworkProcedure.questions.length > 0
        );
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
        if (!fieldworkProcedure) return true;
        const questions = fieldworkProcedure.questions || [];
        if (!Array.isArray(questions) || questions.length === 0) return true;
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
    fieldworkProcedure,
    completionProcedure,
    hasProcedures,
  ]);

  /** Unique classifications from fieldwork questions for multi-section View (when no classification selected) */
  const fieldworkSections = useMemo(() => {
    if (!fieldworkProcedure || !Array.isArray(fieldworkProcedure.questions)) return [];
    const set = new Set<string>();
    fieldworkProcedure.questions.forEach((q: any) => {
      const c = (q?.classification ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [fieldworkProcedure]);

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
              existingProcedure={fieldworkProcedure}
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
            fieldworkProcedure ? (
              classificationProp && String(classificationProp).trim() !== "" ? (
                <ProcedureView
                  procedure={fieldworkProcedure}
                  engagement={eng}
                  onRegenerate={handleRegenerate}
                  currentClassification={classificationProp}
                  onProcedureUpdate={async (updatedProcedure: any) => {
                    setFieldworkProcedure(updatedProcedure);
                    await loadFieldworkProcedure();
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
                      procedure={fieldworkProcedure}
                      engagement={eng}
                      onRegenerate={handleRegenerate}
                      currentClassification={classification}
                      showStepInstruction={false}
                      onProcedureUpdate={async (updatedProcedure: any) => {
                        setFieldworkProcedure(updatedProcedure);
                        await loadFieldworkProcedure();
                      }}
                    />
                  ))}
                </div>
              ) : (
                <ProcedureView
                  procedure={fieldworkProcedure}
                  engagement={eng}
                  onRegenerate={handleRegenerate}
                  onProcedureUpdate={async (updatedProcedure: any) => {
                    setFieldworkProcedure(updatedProcedure);
                    await loadFieldworkProcedure();
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
