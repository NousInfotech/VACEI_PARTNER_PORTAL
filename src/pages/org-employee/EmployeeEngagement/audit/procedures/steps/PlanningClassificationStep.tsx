import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/checkbox";
import { ScrollArea } from "@/ui/scroll-area";
import { ArrowRight, ArrowLeft } from "lucide-react";

const PLANNING_SECTIONS = [
  { sectionId: "engagement_setup_acceptance_independence", title: "Engagement Setup, Acceptance & Independence" },
  { sectionId: "understanding_entity_environment", title: "Understanding the Entity & Its Environment" },
  { sectionId: "materiality_risk_summary", title: "Materiality & Risk Summary" },
  { sectionId: "risk_response_planning", title: "Risk Register & Audit Response Planning" },
  { sectionId: "fraud_gc_planning", title: "Fraud Risk & Going Concern Planning" },
  { sectionId: "compliance_laws_regulations", title: "Compliance with Laws & Regulations (ISA 250)" },
];

interface PlanningClassificationStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: { selectedSections?: string[] }) => void;
  onBack: () => void;
}

export const PlanningClassificationStep: React.FC<PlanningClassificationStepProps> = ({
  stepData,
  onComplete,
  onBack,
}) => {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    stepData?.selectedSections?.length
      ? stepData.selectedSections
      : PLANNING_SECTIONS.map((s) => s.sectionId)
  );

  const toggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectAll = () => setSelectedSections(PLANNING_SECTIONS.map((s) => s.sectionId));
  const clearAll = () => setSelectedSections([]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Select planning sections</h3>
        <p className="text-sm text-muted-foreground">
          Choose which sections to include for planning procedures. You can generate questions per section in the next step.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sections</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] rounded border p-3">
            <div className="space-y-2">
              {PLANNING_SECTIONS.map((sec) => (
                <label
                  key={sec.sectionId}
                  className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedSections.includes(sec.sectionId)}
                    onCheckedChange={() => toggle(sec.sectionId)}
                  />
                  <span className="text-sm font-medium">{sec.title}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => onComplete({ selectedSections })}
          disabled={selectedSections.length === 0}
        >
          Next: Generate questions
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
