import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { User, Bot, Users, ArrowLeft } from "lucide-react";
import { CompletionClassificationStep } from "./steps/CompletionClassificationStep";
import { AICompletionQuestionsStep } from "./steps/AICompletionQuestionsStep";
import { AICompletionAnswersStep } from "./steps/AICompletionAnswersStep";
import { HybridCompletionProceduresStep } from "./steps/HybridCompletionProceduresStep";
import { ManualCompletionProceduresStep } from "./steps/ManualCompletionProceduresStep";
import { CompletionRecommendationsStep } from "./steps/CompletionRecommendationsStep";
import { CompletionMaterialityStep } from "./steps/CompletionMaterialityStep";
import { CompletionProcedureView } from "./CompletionProcedureView";

interface CompletionProcedureGenerationProps {
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
  status?: string;
}

const modes = [
  {
    id: "manual" as GenerationMode,
    title: "Manual",
    description: "Create completion procedures manually with predefined templates",
    icon: User,
    color: "bg-primary",
    features: [
      "Predefined completion templates",
      "Manual procedure completion",
      "Full control over content",
      "Traditional completion approach",
    ],
  },
  {
    id: "ai" as GenerationMode,
    title: "AI",
    description: "AI-generated completion procedures",
    icon: Bot,
    color: "bg-accent",
    features: ["AI-generated completion", "Context-aware", "Quick setup"],
  },
  {
    id: "hybrid" as GenerationMode,
    title: "Hybrid",
    description: "Combine manual and AI completion procedures",
    icon: Users,
    color: "bg-secondary",
    features: ["Manual first", "AI adds more", "Flexible editing"],
  },
];

export const CompletionProcedureGeneration: React.FC<CompletionProcedureGenerationProps> = ({
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

  useEffect(() => {
    if (!selectedMode || steps.length > 0) return;
    if (selectedMode === "ai") {
      setSteps([
        { title: "Set Materiality", component: CompletionMaterialityStep },
        { title: "Select Sections", component: CompletionClassificationStep },
        { title: "Generate Questions", component: AICompletionQuestionsStep },
        { title: "Generate Answers", component: AICompletionAnswersStep },
      ]);
    } else if (selectedMode === "hybrid") {
      setSteps([
        { title: "Set Materiality", component: CompletionMaterialityStep },
        { title: "Select Sections", component: CompletionClassificationStep },
        { title: "Manual + AI (Hybrid)", component: HybridCompletionProceduresStep },
        { title: "Generate Answers", component: AICompletionAnswersStep },
      ]);
    } else {
      setSteps([
        { title: "Set Materiality", component: CompletionMaterialityStep },
        { title: "Select Sections", component: CompletionClassificationStep },
        { title: "Completion Procedures", component: ManualCompletionProceduresStep },
        { title: "Recommendations", component: CompletionRecommendationsStep },
      ]);
    }
  }, [selectedMode, steps.length]);

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
    if (currentStep < steps.length - 1) {
      setStepData((prev) => ({ ...prev, ...data }));
      const next = currentStep + 1;
      setCurrentStep(next);
      if (updateProcedureParams) updateProcedureParams({ step: next.toString() }, false);
    } else if (
      (selectedMode === "ai" || selectedMode === "hybrid") &&
      data?.procedures?.length > 0
    ) {
      setStepData((prev) => ({ ...prev, ...data }));
      setShowTabsView(true);
      if (updateProcedureParams) updateProcedureParams({ step: "tabs" }, false);
    } else {
      const payload = data?.procedureType === "completion" ? data : { ...data, procedureType: "completion" };
      onComplete(payload);
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

  const handleTabsBack = () => {
    setShowTabsView(false);
    setCurrentStep(steps.length - 1);
    if (updateProcedureParams) updateProcedureParams({ step: String(steps.length - 1) }, false);
  };

  if (!selectedMode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Completion Procedures — Choose Approach
          </h3>
          <p className="text-gray-600">Select how you want to generate completion procedures.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.id}
                className="cursor-pointer hover:shadow-lg border border-gray-200"
                onClick={() => {
                  setSelectedMode(m.id);
                  if (updateProcedureParams) updateProcedureParams({ mode: m.id, step: "0" }, false);
                }}
              >
                <CardHeader>
                  <div className={`p-3 rounded-lg ${m.color} text-white w-fit`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-gray-900">{m.title}</CardTitle>
                  <p className="text-sm text-gray-600">{m.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {m.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
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

  if (showTabsView && (stepData?.procedures?.length ?? 0) > 0) {
    const procedurePayload = {
      ...stepData,
      procedures: stepData.procedures,
      recommendations: stepData.recommendations || [],
      status: stepData.status || "draft",
      mode: selectedMode ?? "ai",
      procedureType: "completion",
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTabsBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Generate
          </Button>
        </div>
        <CompletionProcedureView
          procedure={procedurePayload}
          engagement={engagement}
          onWizardComplete={(proc) => {
            setShowTabsView(false);
            onComplete(proc?.procedureType === "completion" ? proc : { ...proc, procedureType: "completion" });
            if (updateProcedureParams) updateProcedureParams({ mode: null, step: null }, false);
          }}
        />
      </div>
    );
  }

  const StepComponent = steps[currentStep].component;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>—</span>
        <span className="font-medium text-foreground">{steps[currentStep].title}</span>
      </div>
      <StepComponent
        engagement={engagement}
        mode={selectedMode}
        stepData={stepData}
        onComplete={handleStepComplete}
        onBack={handleStepBack}
      />
    </div>
  );
};
