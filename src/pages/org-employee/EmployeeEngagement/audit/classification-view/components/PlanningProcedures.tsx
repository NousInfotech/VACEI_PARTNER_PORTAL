import { useState, useCallback } from "react";
import { Sparkles, Eye, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import GenerateProcedures from "./GenerateProcedures";
import ClassificationSelectionStep from "./ClassificationSelectionStep";
import { PlanningProcedureView } from "../../procedures/PlanningProcedureView";

interface PlanningProceduresProps {
    title: string;
    engagementId?: string;
}

type WizardStep = 'select-mode' | 'materiality' | 'classifications';
type Mode = 'generate' | 'view';
type WizardMode = 'manual' | 'ai' | 'hybrid';

export default function PlanningProcedures({ title: _title, engagementId }: PlanningProceduresProps) {
    const [mode, setMode] = useState<Mode>('generate');
    const [wizardStep, setWizardStep] = useState<WizardStep>('select-mode');
    const [activeWizardMode, setActiveWizardMode] = useState<WizardMode>('manual');

    const { data: engagementData } = useQuery({
        queryKey: ["engagement-view", engagementId],
        enabled: !!engagementId,
        queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!)),
    });
    const engagement = engagementData?.data ?? engagementData;

    const { data: procedureRes, refetch: refetchProcedure } = useQuery({
        queryKey: ["planning-procedure", engagementId],
        enabled: !!engagementId && mode === "view",
        queryFn: async () => {
            try {
                const res = await apiGet<any>(endPoints.PLANNING_PROCEDURES.GET_BY_ENGAGEMENT(engagementId!));
                return res?.data ?? res ?? null;
            } catch {
                return null;
            }
        },
        retry: false,
    });
    const planningProcedure = procedureRes ?? null;

    const handleProcedureUpdate = useCallback(() => {
        refetchProcedure();
    }, [refetchProcedure]);

    const handleModeSelect = (selectedMode: WizardMode) => {
        setActiveWizardMode(selectedMode);
        setWizardStep('classifications');
    };

    const handleClassificationProceed = () => {
        setMode('view');
    };

    const handleBackToMode = () => {
        setWizardStep('select-mode');
    };

    const handleBackToProcedureSelection = () => {
        setWizardStep("select-mode");
        setMode("generate");
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 border border-gray-200 rounded-md px-3 py-2">
                <div className="flex items-center gap-3">
                    <h3 className="font-heading text-xl text-foreground text-gray-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-9 h-9 border border-gray-200 rounded-md bg-gray-50/80 text-gray-600 shrink-0" aria-hidden>
                            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
                        </span>
                        <span className="border border-gray-200 rounded-md px-2 py-1 bg-gray-50/80">Planning Procedures</span>
                    </h3>
                    <Button
                        variant="outline"
                        onClick={handleBackToProcedureSelection}
                        className="flex items-center gap-2 bg-transparent rounded-md hover:bg-gray-100 hover:text-foreground transition-colors border-gray-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Back to Procedure Selection
                    </Button>
                </div>
            </div>

            <Tabs
                value={mode}
                onValueChange={(v) => {
                    if (v === "generate") {
                        setMode("generate");
                        setWizardStep("select-mode");
                    } else {
                        setMode("view");
                    }
                }}
                className="flex-1"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200">
                        <Sparkles className="h-4 w-4" />
                        Generate Procedures
                    </TabsTrigger>
                    <TabsTrigger
                        value="view"
                        className="flex items-center justify-center gap-2 w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200"
                    >
                        <Eye className="h-4 w-4" />
                        View Procedures
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="flex-1 mt-6 px-4">
                    {wizardStep === "select-mode" && (
                        <GenerateProcedures onProceed={handleModeSelect} />
                    )}
                    {wizardStep === "classifications" && (
                        <ClassificationSelectionStep
                            mode={activeWizardMode}
                            materialityAmount="0"
                            onProceed={handleClassificationProceed}
                            onBack={handleBackToMode}
                        />
                    )}
                </TabsContent>

                <TabsContent value="view" className="flex-1 mt-6 px-4 pb-4">
                    {!engagementId ? (
                        <div className="text-muted-foreground">Select an engagement to view planning procedures.</div>
                    ) : procedureRes === undefined ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <PlanningProcedureView
                            procedure={planningProcedure ?? {}}
                            engagement={engagement}
                            onProcedureUpdate={handleProcedureUpdate}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
