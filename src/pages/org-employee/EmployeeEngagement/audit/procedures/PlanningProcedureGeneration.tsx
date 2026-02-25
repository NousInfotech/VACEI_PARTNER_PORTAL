import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/Button";
import { User, Bot, Users, FileText } from "lucide-react";
import { PlanningClassificationStep } from "./steps/PlanningClassificationStep";
import { AIPlanningQuestionsStep } from "./steps/AIPlanningQuestionsStep";
import { HybridPlanningProceduresStep } from "./steps/HybridPlanningProceduresStep";
import { ManualPlanningProceduresStep } from "./steps/ManualPlanningProceduresStep";
import { PlanningRecommendationsStep } from "./steps/PlanningRecommendationsStep";
import { PlanningProcedureTabsView } from "./PlanningProcedureTabsView";

interface PlanningProcedureGenerationProps {
  engagement: any;
  existingProcedure?: any;
  onComplete: (procedure: any) => void;
  onBack: () => void;
  updateProcedureParams?: (
    updates: Record<string, string | null>,
    replace?: boolean
  ) => void;
  searchParams?: URLSearchParams | null;
}

type GenerationMode = "manual" | "ai" | "hybrid";

interface StepData {
  materiality?: number;
  selectedSections?: string[];
  procedures?: any[];
  recommendations?: string;
}

const modes = [
  {
    id: "manual" as GenerationMode,
    title: "Manual",
    description: "Create planning procedures manually with predefined templates",
    icon: User,
    color: "bg-primary",
    features: [
      "Predefined planning templates",
      "Manual procedure completion",
      "Full control over content",
      "Traditional planning approach",
    ],
  },
  {
    id: "ai" as GenerationMode,
    title: "AI",
    description: "AI-generated planning procedures",
    icon: Bot,
    color: "bg-accent",
    features: ["AI-generated planning", "Context-aware", "Quick setup"],
  },
  {
    id: "hybrid" as GenerationMode,
    title: "Hybrid",
    description: "Combine manual and AI planning procedures",
    icon: Users,
    color: "bg-secondary",
    features: ["Manual first", "AI adds more", "Flexible editing"],
  },
];

export const PlanningProcedureGeneration: React.FC<PlanningProcedureGenerationProps> = ({
  engagement,
  onComplete,
  onBack,
  updateProcedureParams,
  searchParams,
}) => {
  const modeFromUrl = (searchParams?.get("mode") as GenerationMode) || null;
  const stepFromUrl = searchParams?.get("step");
  const stepFromUrlNum =
    stepFromUrl && stepFromUrl !== "tabs" ? parseInt(stepFromUrl || "0", 10) : null;

  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(modeFromUrl);
  const [currentStep, setCurrentStep] = useState(
    stepFromUrlNum !== null ? stepFromUrlNum : 0
  );
  const [showTabsView, setShowTabsView] = useState(stepFromUrl === "tabs");
  const [stepData, setStepData] = useState<StepData>({ materiality: 0 });
  const [steps, setSteps] = useState<Array<{ title: string; component: React.ComponentType<any> }>>([]);

  const sectionTitlesMap: Record<string, string> = {
    engagement_setup_acceptance_independence: "Engagement Setup, Acceptance & Independence",
    understanding_entity_environment: "Understanding the Entity & Its Environment",
    materiality_risk_summary: "Materiality & Risk Summary",
    risk_response_planning: "Risk Register & Audit Response Planning",
    fraud_gc_planning: "Fraud Risk & Going Concern Planning",
    compliance_laws_regulations: "Compliance with Laws & Regulations (ISA 250)",
  };

  useEffect(() => {
    if (!selectedMode || steps.length > 0) return;
    if (selectedMode === "ai") {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Generate Procedures", component: AIPlanningQuestionsStep },
      ]);
    } else if (selectedMode === "hybrid") {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Generate Procedures", component: HybridPlanningProceduresStep },
      ]);
    } else {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Planning Procedures", component: ManualPlanningProceduresStep },
        { title: "Recommendations", component: PlanningRecommendationsStep },
      ]);
    }
  }, [selectedMode, steps.length]);

  const handleModeSelect = (mode: GenerationMode, updateUrl = true) => {
    setSelectedMode(mode);
    if (mode === "ai") {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Generate Procedures", component: AIPlanningQuestionsStep },
      ]);
    } else if (mode === "hybrid") {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Generate Procedures", component: HybridPlanningProceduresStep },
      ]);
    } else {
      setSteps([
        { title: "Select Classifications", component: PlanningClassificationStep },
        { title: "Planning Procedures", component: ManualPlanningProceduresStep },
        { title: "Recommendations", component: PlanningRecommendationsStep },
      ]);
    }
    setCurrentStep(0);
    setStepData({ materiality: 0 });
    if (updateUrl && updateProcedureParams) {
      updateProcedureParams({ mode, step: "0" }, false);
    }
  };

  useEffect(() => {
    const mode = (searchParams?.get("mode") as GenerationMode) || null;
    const step = searchParams?.get("step");
    const stepNum = step && step !== "tabs" ? parseInt(step || "0", 10) : null;
    if (mode !== selectedMode) setSelectedMode(mode);
    if (step === "tabs") setShowTabsView(true);
    else if (stepNum !== null && stepNum !== currentStep) setCurrentStep(stepNum);
  }, [searchParams]);

  useEffect(() => {
    if (!steps.length) return;
    if (currentStep < 0 || currentStep >= steps.length) {
      const safe = Math.max(0, Math.min(currentStep, steps.length - 1));
      setCurrentStep(safe);
      if (updateProcedureParams) updateProcedureParams({ step: safe.toString() }, true);
    }
  }, [steps, currentStep, updateProcedureParams]);

  const handleStepComplete = (data: any) => {
    let combinedRecommendations = "";
    if (data.sectionRecommendations) {
      Object.entries(data.sectionRecommendations).forEach(([sectionId, recommendations]) => {
        const sectionTitle = sectionTitlesMap[sectionId] || sectionId;
        const recText = Array.isArray(recommendations) ? recommendations.join("\n") : recommendations;
        combinedRecommendations += `### Section: ${sectionTitle}\n${recText}\n\n`;
      });
    }
    const updatedData = { ...stepData, ...data, recommendations: combinedRecommendations };
    setStepData(updatedData);

    if (currentStep === 0) {
      const selectedSections = updatedData.selectedSections || [];
      const initialProcedures = selectedSections.map((sectionId: string) => ({
        id: sectionId,
        sectionId,
        title: sectionTitlesMap[sectionId] || sectionId,
        fields: [],
      }));
      const minimalProcedure = {
        procedureType: "planning",
        mode: selectedMode,
        materiality: updatedData.materiality ?? 0,
        procedures: initialProcedures,
        recommendations: [],
        status: "in-progress",
        selectedSections,
      };
      setStepData((prev) => ({ ...prev, ...updatedData, procedures: initialProcedures }));
      if (updateProcedureParams) updateProcedureParams({ procedureTab: "view", step: "tabs" }, false);
      onComplete(minimalProcedure);
      return;
    }

    const hasQuestions =
      updatedData.procedures &&
      Array.isArray(updatedData.procedures) &&
      updatedData.procedures.some((proc: any) => proc.fields && proc.fields.length > 0);
    if (hasQuestions && (selectedMode === "ai" || selectedMode === "hybrid") && currentStep === 1) {
      setShowTabsView(true);
      if (updateProcedureParams) updateProcedureParams({ step: "tabs", procedureTab: "view" }, false);
      return;
    }

    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (updateProcedureParams) updateProcedureParams({ step: next.toString() }, false);
    } else {
      onComplete({
        procedureType: "planning",
        mode: selectedMode,
        ...stepData,
        ...data,
        recommendations: combinedRecommendations,
        status: "completed",
      });
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (updateProcedureParams) updateProcedureParams({ step: prev.toString() }, false);
    } else {
      setSelectedMode(null);
      if (updateProcedureParams) updateProcedureParams({ mode: null, step: null }, false);
    }
  };

  useEffect(() => {
    const shouldShowTabs =
      showTabsView ||
      (stepData.procedures &&
        Array.isArray(stepData.procedures) &&
        stepData.procedures.some((proc: any) => proc.fields && proc.fields.length > 0) &&
        (selectedMode === "ai" || selectedMode === "hybrid"));
    if (shouldShowTabs && updateProcedureParams) {
      updateProcedureParams({ procedureTab: "view" }, false);
    }
  }, [showTabsView, stepData.procedures, selectedMode, updateProcedureParams]);

  if (!selectedMode) {
    const shortDescriptions: Record<GenerationMode, string> = {
      manual: "Predefined templates",
      ai: "AI-powered generation",
      hybrid: "AI + Manual control",
    };
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="font-heading text-2xl font-bold text-foreground text-gray-900 mb-2">
            Choose Your Approach
          </h3>
          <p className="text-muted-foreground font-body text-gray-500 text-sm">
            Select how you&apos;d like to generate your procedures
          </p>
        </div>
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.id}
                className="w-full cursor-pointer transition-all duration-200 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                onClick={() => handleModeSelect(m.id, true)}
              >
                <CardHeader className="p-4">
                  <div className="flex flex-row items-center gap-4">
                    <div className={`shrink-0 p-3 rounded-lg ${m.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-heading text-lg font-bold text-gray-900 mb-0.5">
                        {m.title}
                      </CardTitle>
                      <p className="text-muted-foreground font-body text-sm text-gray-600">
                        {shortDescriptions[m.id]}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Loading steps…</p>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  const hasProceduresWithFields =
    stepData.procedures &&
    Array.isArray(stepData.procedures) &&
    stepData.procedures.some((proc: any) => proc.fields && proc.fields.length > 0) &&
    (selectedMode === "ai" || selectedMode === "hybrid");

  if (showTabsView || hasProceduresWithFields) {
    return (
      <PlanningProcedureTabsView
        engagement={engagement}
        stepData={stepData}
        mode={selectedMode || "ai"}
        onComplete={(data) => {
          setShowTabsView(false);
          onComplete({
            ...data,
            procedureType: "planning",
            status: "completed",
          });
          if (updateProcedureParams) updateProcedureParams({ mode: null, step: null }, false);
        }}
        onBack={() => {
          setShowTabsView(false);
          setCurrentStep(1);
          if (updateProcedureParams) updateProcedureParams({ step: "1" }, false);
        }}
        updateProcedureParams={updateProcedureParams}
      />
    );
  }

  const CurrentStepComponent = steps[currentStep]?.component;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            {React.createElement(modes.find((m) => m.id === selectedMode)?.icon || FileText, { className: "h-4 w-4" })}
            {selectedMode?.toUpperCase()} Mode
          </Badge>
          <h3 className="text-xl font-semibold text-foreground">{steps[currentStep]?.title || ""}</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {Math.min(currentStep + 1, Math.max(steps.length, 1))} of {steps.length}
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      {CurrentStepComponent ? (
        <CurrentStepComponent
          engagement={engagement}
          mode={selectedMode}
          stepData={stepData}
          onComplete={handleStepComplete}
          onBack={handleStepBack}
        />
      ) : (
        <div className="text-muted-foreground">Preparing step…</div>
      )}
    </div>
  );
};
