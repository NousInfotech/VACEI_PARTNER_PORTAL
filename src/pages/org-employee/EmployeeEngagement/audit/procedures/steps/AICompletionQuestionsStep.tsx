import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const COMPLETION_SECTIONS = [
  { sectionId: "initial_completion", title: "P1: Initial Completion" },
  { sectionId: "audit_highlights_report", title: "P2: Audit Highlights Report" },
  { sectionId: "final_analytical_review", title: "P3: Final Analytical Review" },
  { sectionId: "points_forward_next_year", title: "P4: Points Forward for Next Year" },
  { sectionId: "final_client_meeting_notes", title: "P5: Notes of Final Client Meeting" },
  { sectionId: "summary_unadjusted_errors", title: "P6: Summary of Unadjusted Errors" },
  { sectionId: "reappointment_schedule", title: "P7: Reappointment Schedule" },
];

interface AICompletionQuestionsStepProps {
  engagement: any;
  mode: "ai" | "hybrid";
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const AICompletionQuestionsStep: React.FC<AICompletionQuestionsStepProps> = ({
  engagement,
  stepData,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const engagementId = engagement?.id ?? engagement?._id;
  const selectedSections: string[] =
    stepData?.selectedSections?.length > 0
      ? stepData.selectedSections
      : COMPLETION_SECTIONS.map((s) => s.sectionId);

  const sectionTitles = Object.fromEntries(
    COMPLETION_SECTIONS.map((s) => [s.sectionId, s.title])
  );

  const handleGenerateAll = async () => {
    if (!engagementId) {
      toast({ title: "Error", description: "Engagement not found.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const procedures: Array<{ sectionId: string; id?: string; title: string; fields: any[] }> = [];

    for (const sectionId of selectedSections) {
      setGeneratingSections((prev) => new Set(prev).add(sectionId));
      try {
        const res = await apiPost<{ data?: { fields?: any[] } }>(
          endPoints.COMPLETION_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId),
          { sectionId }
        );
        const raw = res?.data ?? (res as any);
        const fields = Array.isArray(raw?.data?.fields) ? raw.data.fields : Array.isArray(raw?.fields) ? raw.fields : [];
        procedures.push({
          sectionId,
          id: sectionId,
          title: sectionTitles[sectionId] ?? sectionId,
          fields,
        });
        setCompletedSections((prev) => new Set(prev).add(sectionId));
      } catch (e: any) {
        toast({
          title: "Generation failed",
          description: e?.message || `Failed for section ${sectionId}`,
          variant: "destructive",
        });
      } finally {
        setGeneratingSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      }
    }

    setLoading(false);
    if (procedures.length > 0) {
      const procedurePayload = {
        procedureType: "completion",
        status: "draft",
        mode: "AI",
        procedures,
        recommendations: [],
      };
      try {
        const formData = new FormData();
        formData.append("data", JSON.stringify(procedurePayload));
        await apiPostFormData(
          endPoints.COMPLETION_PROCEDURES.SAVE(engagementId),
          formData
        );
      } catch (saveErr: any) {
        toast({
          title: "Save failed",
          description: saveErr?.message || "Procedures generated but could not save.",
          variant: "destructive",
        });
      }
      onComplete(procedurePayload);
    } else {
      toast({
        title: "No sections generated",
        description: "Try again or add sections manually in the view.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate completion questions (AI)</h3>
        <p className="text-sm text-muted-foreground">
          AI will generate questions for each selected section. Click &quot;Generate all&quot; to run generation for every section.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections to generate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedSections.map((sectionId) => {
            const isGenerating = generatingSections.has(sectionId);
            const isDone = completedSections.has(sectionId);
            return (
              <div
                key={sectionId}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm font-medium">
                  {sectionTitles[sectionId] ?? sectionId}
                </span>
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {isDone && !isGenerating && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleGenerateAll} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate all & continue"
          )}
        </Button>
      </div>
    </div>
  );
};
