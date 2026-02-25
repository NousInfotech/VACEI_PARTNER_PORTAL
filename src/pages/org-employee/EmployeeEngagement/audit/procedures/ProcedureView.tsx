import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ProcedureTabsView } from "./ProcedureTabsView";
import { formatClassificationForDisplay } from "./steps/procedureClassificationMapping";
import { Loader2, Sparkles } from "lucide-react";

interface ProcedureViewProps {
  procedure: any;
  engagement: any;
  onRegenerate?: () => void;
  currentClassification?: string;
  onProcedureUpdate?: (updatedProcedure: any) => void;
  /** When false, step instruction text is not shown (e.g. when rendering multiple sections and instruction is at top). */
  showStepInstruction?: boolean;
}

/** Format currency for subtitle (matches REFERENCE ProcedureView) */
function formatCurrency(amount: number | undefined): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount ?? 0);
}

/**
 * Fieldwork procedures view. When currentClassification is set (e.g. inside Sections → Classification → Procedures),
 * matches REFERENCE-PORTAL: Card with CardHeader (classification title + subtitle) and CardContent with ProcedureTabsView.
 * Otherwise shows "Fieldwork Procedures" heading + Regenerate and ProcedureTabsView.
 */
export const ProcedureView: React.FC<ProcedureViewProps> = ({
  procedure,
  engagement,
  onRegenerate,
  currentClassification,
  onProcedureUpdate,
  showStepInstruction = true,
}) => {
  const stepData = procedure ?? {};
  const mode = (procedure?.mode as "manual" | "ai" | "hybrid") || "manual";

  const safeTitle = engagement?.title || "Engagement";
  const yEnd = engagement?.yearEndDate ? new Date(engagement.yearEndDate) : null;
  const yearEndStr = yEnd
    ? `${yEnd.getFullYear()}-${String(yEnd.getMonth() + 1).padStart(2, "0")}-${String(yEnd.getDate()).padStart(2, "0")}`
    : "N/A";

  const inClassificationContext = !!currentClassification?.trim();
  const generateQuestionsRef = useRef<{ generate: () => Promise<void> } | null>(null);
  const [headerGenerating, setHeaderGenerating] = useState(false);

  if (inClassificationContext) {
    return (
      <div className="space-y-4">
        {showStepInstruction && (
          <p className="text-sm text-muted-foreground">
            Step-1: Generate questions for each classification separately. You can freely edit / add / remove questions here before moving to the next step.
          </p>
        )}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {formatClassificationForDisplay(currentClassification)}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {safeTitle} • Mode: {(procedure?.mode || "").toUpperCase() || "N/A"} • Materiality:{" "}
                {formatCurrency(procedure?.materiality)} • Year End: {yearEndStr}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateQuestionsRef.current?.generate()}
              disabled={headerGenerating}
            >
              {headerGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProcedureTabsView
            engagement={engagement}
            stepData={stepData}
            mode={mode}
            currentClassification={currentClassification}
            onProcedureUpdate={onProcedureUpdate}
            generateQuestionsRef={generateQuestionsRef}
            onGeneratingChange={setHeaderGenerating}
          />
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground">
          Fieldwork Procedures
        </h3>
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate} className="flex items-center gap-2">
            Regenerate
          </Button>
        )}
      </div>
      <ProcedureTabsView
        engagement={engagement}
        stepData={stepData}
        mode={mode}
        currentClassification={currentClassification}
        onProcedureUpdate={onProcedureUpdate}
      />
    </div>
  );
};
