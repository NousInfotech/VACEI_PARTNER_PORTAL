import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { ArrowRight, User, Bot, Users } from "lucide-react";
import { MaterialityStep } from "./steps/MaterialityStep";
import { ClassificationStep } from "./steps/ClassificationStep";
import { ProcedureQuestionsStep } from "./steps/ProcedureQuestionsStep";
import { RecommendationsStep } from "./steps/RecommendationsStep";
import AIProcedureQuestionsStep from "./steps/AIProcedureQuestionsStep";
import { HybridProceduresStep } from "./steps/HybridProceduresStep";
import { ProcedureTabsView } from "./ProcedureTabsView";
import { useETBData } from "../hooks/useETBData";

interface ProcedureGenerationProps {
  engagement: any;
  existingProcedure?: any;
  onComplete: (procedure: any) => void;
  onBack?: () => void;
  updateProcedureParams?: (
    updates: Record<string, string | null>,
    replace?: boolean
  ) => void;
  searchParams?: URLSearchParams | null;
  /** When true (e.g. classification from sidebar), skip "Choose Your Approach" and use defaultMode (AI). */
  skipModeSelection?: boolean;
  defaultMode?: GenerationMode;
  /** When set (e.g. from sidebar classification), passed to tabs view for categoryTitle and filtering. */
  currentClassification?: string | null;
}

type GenerationMode = "manual" | "ai" | "hybrid";

interface StepDef {
  title: string;
  render: (ctx: {
    stepData: any;
    setStepData: React.Dispatch<React.SetStateAction<any>>;
    onStepDone: (patch: any) => void;
    onBack: () => void;
  }) => React.ReactNode;
}

export const ProcedureGeneration: React.FC<ProcedureGenerationProps> = ({
  engagement,
  existingProcedure,
  onComplete,
  onBack,
  updateProcedureParams,
  searchParams,
  skipModeSelection = false,
  defaultMode = "ai",
  currentClassification = null,
}) => {
  const engagementId = engagement?.id ?? engagement?._id;
  const { data: etbData } = useETBData(engagementId);
  const auditCycleId = etbData?.auditCycleId ?? undefined;

  const modeFromUrl = (searchParams?.get("mode") as GenerationMode) || null;
  const stepFromUrl = searchParams?.get("step");
  const stepFromUrlNum =
    stepFromUrl && stepFromUrl !== "tabs"
      ? parseInt(stepFromUrl || "0", 10)
      : null;

  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(
    () => (skipModeSelection ? defaultMode : modeFromUrl ?? null)
  );
  const [currentStep, setCurrentStep] = useState(
    stepFromUrlNum !== null ? stepFromUrlNum : 0
  );
  const [stepData, setStepData] = useState<any>({});
  const [showTabsView, setShowTabsView] = useState(stepFromUrl === "tabs");

  useEffect(() => {
    if (auditCycleId) setStepData((prev: any) => ({ ...prev, auditCycleId }));
  }, [auditCycleId]);

  useEffect(() => {
    const step = searchParams?.get("step");
    const stepNum = step && step !== "tabs" ? parseInt(step || "0", 10) : null;

    if (skipModeSelection) {
      if (selectedMode !== defaultMode) setSelectedMode(defaultMode);
      const urlMode = searchParams?.get("mode") as GenerationMode | null;
      if (urlMode !== defaultMode && updateProcedureParams) {
        updateProcedureParams({ mode: defaultMode }, true);
      }
    } else {
      const mode = (searchParams?.get("mode") as GenerationMode) || null;
      if (mode !== null && mode !== selectedMode) setSelectedMode(mode);
    }

    if (step === "tabs") {
      setShowTabsView(true);
      if (existingProcedure?.questions?.length > 0) {
        setStepData((prev: any) => ({ ...prev, ...existingProcedure }));
      }
    }
    if (stepNum !== null && stepNum !== currentStep) setCurrentStep(stepNum);
  }, [searchParams, existingProcedure]);

  const steps: StepDef[] = useMemo(() => {
    if (!selectedMode) return [];
    const baseSteps: StepDef[] = [
      {
        title: "Set Materiality",
        render: ({ stepData: sd, onStepDone, onBack: ob }) => (
          <MaterialityStep
            engagement={engagement}
            mode={selectedMode}
            stepData={sd}
            onBack={ob}
            onComplete={onStepDone}
          />
        ),
      },
      {
        title: "Select Classifications",
        render: ({ stepData: sd, onStepDone, onBack: ob }) => (
          <ClassificationStep
            engagement={engagement}
            mode={selectedMode}
            stepData={sd}
            onBack={ob}
            onComplete={onStepDone}
          />
        ),
      },
    ];
    if (selectedMode === "manual") {
      return [
        ...baseSteps,
        {
          title: "Manual Procedures",
          render: ({ stepData: sd, onStepDone, onBack: ob }) => (
            <ProcedureQuestionsStep
              engagement={engagement}
              mode="manual"
              stepData={{ ...sd, auditCycleId }}
              onBack={ob}
              onComplete={onStepDone}
            />
          ),
        },
        {
          title: "Recommendations",
          render: ({ stepData: sd, onStepDone, onBack: ob }) => (
            <RecommendationsStep
              engagement={engagement}
              mode="manual"
              stepData={sd}
              onBack={ob}
              onComplete={onStepDone}
            />
          ),
        },
      ];
    }
    if (selectedMode === "ai") {
      return [
        ...baseSteps,
        {
          title: "AI — Generate Questions",
          render: ({ stepData: sd, onStepDone, onBack: ob }) => (
            <AIProcedureQuestionsStep
              engagement={engagement}
              mode="ai"
              stepData={{ ...sd, auditCycleId }}
              onBack={ob}
              onComplete={onStepDone}
            />
          ),
        },
      ];
    }
    return [
      ...baseSteps,
      {
        title: "Hybrid — Manual First, then AI",
        render: ({ stepData: sd, onStepDone, onBack: ob }) => (
          <HybridProceduresStep
            engagement={engagement}
            mode="hybrid"
            stepData={{ ...sd, auditCycleId }}
            onBack={ob}
            onComplete={onStepDone}
          />
        ),
      },
    ];
  }, [selectedMode, engagement, auditCycleId]);

  const onStepDone = (patch: any) => {
    const updatedData = { ...stepData, ...patch };
    setStepData(updatedData);

    // When "Proceed to Procedures" is clicked (completing Classifications = step 1),
    // go directly to Generate/View tabs (ProcedureTabsView) with Questions/Answers/Procedures — skip Hybrid/AI step UI.
    if (currentStep === 1) {
      const selectedClassifications = updatedData.selectedClassifications || [];
      const initialQuestions = selectedClassifications.map((classification: string) => ({
        classification,
        question: "",
        answer: "",
        __uid: `temp-${Date.now()}-${Math.random()}`,
      }));
      const minimalProcedure = {
        procedureType: "procedures",
        mode: selectedMode,
        materiality: updatedData.materiality ?? 0,
        questions: initialQuestions,
        selectedClassifications,
        validitySelections: updatedData.validitySelections ?? {},
        recommendations: [],
        status: "in_progress",
        auditCycleId: updatedData.auditCycleId,
      };
      setStepData((prev: any) => ({ ...prev, ...minimalProcedure }));
      setShowTabsView(true);
      if (updateProcedureParams) {
        updateProcedureParams({ step: "tabs", procedureTab: "generate" }, false);
      }
      onComplete(minimalProcedure);
      return;
    }

    const isLastStep = currentStep >= steps.length - 1;
    const hasQuestions =
      updatedData.questions && updatedData.questions.length > 0;

    if (hasQuestions && (selectedMode === "ai" || selectedMode === "hybrid" || selectedMode === "manual") && currentStep === 2) {
      setShowTabsView(true);
      if (updateProcedureParams) {
        updateProcedureParams({ step: "tabs", procedureTab: "generate" }, false);
      }
      onComplete({
        ...updatedData,
        mode: selectedMode,
        status: "in_progress",
        procedureType: "procedures",
      });
      return;
    }

    if (!isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (updateProcedureParams) {
        updateProcedureParams({ step: nextStep.toString() }, false);
      }
    } else {
      if (updateProcedureParams) {
        updateProcedureParams({ mode: null, step: null }, false);
      }
      onComplete({
        ...updatedData,
        mode: selectedMode,
        status: "completed",
        procedureType: "procedures",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (updateProcedureParams) {
        updateProcedureParams({ step: prevStep.toString() }, false);
      }
    } else {
      if (!skipModeSelection) setSelectedMode(null);
      if (updateProcedureParams) {
        updateProcedureParams({ mode: null, step: null }, false);
      }
      if (onBack) onBack();
    }
  };

  const modes: Array<{
    id: GenerationMode;
    title: string;
    description: string;
    icon: typeof User;
    color: string;
    features: string[];
  }> = [
    {
      id: "manual",
      title: "Manual",
      description:
        "Use predefined manual procedures from templates, filtered by your selections.",
      icon: User,
      color: "bg-primary",
      features: [
        "Predefined templates",
        "Full manual control",
        "Auditor-crafted wording",
      ],
    },
    {
      id: "ai",
      title: "AI",
      description:
        "Two-step AI flow: generate questions, then generate answers & recommendations.",
      icon: Bot,
      color: "bg-accent",
      features: [
        "AI-generated questions",
        "AI-generated draft answers",
        "Context-aware insights",
      ],
    },
    {
      id: "hybrid",
      title: "Hybrid",
      description:
        "Start from manual templates, then ask AI to add more — keep full oversight.",
      icon: Users,
      color: "bg-secondary",
      features: ["Manual first", "AI adds more", "Flexible editing"],
    },
  ];

  if (!selectedMode && !skipModeSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="font-heading text-2xl text-foreground mb-2 text-gray-900">
            Choose Your Approach
          </h3>
          <p className="text-muted-foreground font-body text-gray-600">
            Generate your audit procedures the way you prefer
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.id}
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/20 border-gray-200"
                onClick={() => {
                  setSelectedMode(m.id);
                  setCurrentStep(0);
                  setStepData({});
                  if (updateProcedureParams) {
                    updateProcedureParams({ mode: m.id, step: "0" }, false);
                  }
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-lg ${m.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground text-gray-500" />
                  </div>
                  <CardTitle className="font-heading text-xl text-foreground text-gray-900">
                    {m.title}
                  </CardTitle>
                  <p className="text-muted-foreground font-body text-sm text-gray-600">
                    {m.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {m.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm font-body text-gray-700"
                      >
                        <span>•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-start pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Always keep auditCycleId so save always has it (existingProcedure can overwrite; restore from parent)
  const procedureForTabs = {
    ...stepData,
    ...(existingProcedure || {}),
    auditCycleId: stepData.auditCycleId ?? existingProcedure?.auditCycleId ?? auditCycleId,
  };
  const hasQuestionsForTabs =
    (procedureForTabs?.questions && procedureForTabs.questions.length > 0) ||
    (stepData?.questions && stepData.questions.length > 0);

  if (showTabsView || (hasQuestionsForTabs && selectedMode)) {
    return (
      <ProcedureTabsView
        engagement={engagement}
        stepData={procedureForTabs}
        mode={selectedMode || "ai"}
        currentClassification={currentClassification}
        auditCycleId={auditCycleId}
        onProcedureUpdate={(data) => {
          setStepData((prev: any) => ({
            ...prev,
            ...data,
            id: data?.id ?? data?.procedure?.id ?? data?._id ?? prev?.id,
            _id: data?._id ?? data?.procedure?.id ?? data?.id ?? prev?._id,
            questions: data?.questions ?? prev?.questions,
          }));
        }}
        onComplete={(data) => {
          // Do not set showTabsView(false) or clear step here: parent handleProcedureComplete
          // will set procedureTab to "view" and switch tabs; clearing step would show step 0 (Set Materiality).
          onComplete({
            ...data,
            mode: selectedMode,
            status: "completed",
            procedureType: "procedures",
          });
        }}
        onBack={() => {
          setShowTabsView(false);
          setCurrentStep(1);
          if (updateProcedureParams) {
            updateProcedureParams({ step: "1", procedureTab: "generate" }, false);
          }
        }}
        updateProcedureParams={updateProcedureParams}
      />
    );
  }

  const stepDef = steps[currentStep];
  if (!stepDef) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Invalid step. Resetting.</p>
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground text-gray-500">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>—</span>
        <span className="font-medium text-foreground text-gray-700">
          {stepDef.title}
        </span>
      </div>
      {stepDef.render({
        stepData,
        setStepData,
        onStepDone,
        onBack: handleBack,
      })}
    </div>
  );
};
