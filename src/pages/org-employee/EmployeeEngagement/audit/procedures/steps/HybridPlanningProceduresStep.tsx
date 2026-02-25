/**
 * Hybrid planning: manual content per section first, then "Generate AI" per section.
 * Matches REFERENCE-PORTAL hybrid flow: manual first, AI adds more.
 */
import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Textarea } from "@/ui/Textarea";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { Loader2, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

const PLANNING_SECTIONS = [
  { sectionId: "engagement_setup_acceptance_independence", title: "Engagement Setup, Acceptance & Independence" },
  { sectionId: "understanding_entity_environment", title: "Understanding the Entity & Its Environment" },
  { sectionId: "materiality_risk_summary", title: "Materiality & Risk Summary" },
  { sectionId: "risk_response_planning", title: "Risk Register & Audit Response Planning" },
  { sectionId: "fraud_gc_planning", title: "Fraud Risk & Going Concern Planning" },
  { sectionId: "compliance_laws_regulations", title: "Compliance with Laws & Regulations (ISA 250)" },
];

interface HybridPlanningProceduresStepProps {
  engagement: any;
  mode: "ai" | "hybrid";
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const HybridPlanningProceduresStep: React.FC<HybridPlanningProceduresStepProps> = ({
  engagement,
  stepData,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [procedures, setProcedures] = useState<any[]>(() => {
    const existing = stepData?.procedures;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    return [];
  });
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const engagementId = engagement?.id ?? engagement?._id;
  const selectedSections: string[] =
    stepData?.selectedSections?.length > 0
      ? stepData.selectedSections
      : PLANNING_SECTIONS.map((s) => s.sectionId);

  const sectionTitles = Object.fromEntries(
    PLANNING_SECTIONS.map((s) => [s.sectionId, s.title])
  );

  const handleGenerateOne = async (sectionId: string) => {
    if (!engagementId) {
      toast({ title: "Error", description: "Engagement not found.", variant: "destructive" });
      return;
    }
    setGeneratingSection(sectionId);
    try {
      const res = await apiPost<{ data?: { fields?: any[] } }>(
        endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId),
        { sectionId }
      );
      const raw = res?.data ?? (res as any);
      const fields = Array.isArray(raw?.data?.fields) ? raw.data.fields : Array.isArray(raw?.fields) ? raw.fields : [];
      const note = manualNotes[sectionId]?.trim();
      const existingFields = Array.isArray(fields) ? fields : [];
      const withManual = note
        ? [{ key: "manual_note", label: "Manual note", answer: note, type: "textarea" }, ...existingFields]
        : existingFields;
      setProcedures((prev) => {
        const rest = prev.filter((p) => (p.sectionId ?? p.id) !== sectionId);
        return [
          ...rest,
          {
            sectionId,
            id: sectionId,
            title: sectionTitles[sectionId] ?? sectionId,
            fields: withManual,
          },
        ];
      });
      toast({ title: "Generated", description: `${sectionTitles[sectionId] ?? sectionId} done.` });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || `Failed for ${sectionId}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!engagementId) {
      toast({ title: "Error", description: "Engagement not found.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const next: any[] = [];
    for (const sectionId of selectedSections) {
      try {
        const res = await apiPost<{ data?: { fields?: any[] } }>(
          endPoints.PLANNING_PROCEDURES.GENERATE_SECTION_QUESTIONS(engagementId),
          { sectionId }
        );
        const raw = res?.data ?? (res as any);
        const fields = Array.isArray(raw?.data?.fields) ? raw.data.fields : Array.isArray(raw?.fields) ? raw.fields : [];
        const note = manualNotes[sectionId]?.trim();
        const withManual = note
          ? [{ key: "manual_note", label: "Manual note", answer: note, type: "textarea" }, ...fields]
          : fields;
        next.push({
          sectionId,
          id: sectionId,
          title: sectionTitles[sectionId] ?? sectionId,
          fields: withManual,
        });
      } catch (e: any) {
        toast({
          title: "Generation failed",
          description: e?.message || `Failed for ${sectionId}`,
          variant: "destructive",
        });
      }
    }
    setProcedures(next);
    setLoading(false);
    if (next.length > 0) {
      onComplete({ procedures: next, ...stepData });
    }
  };

  const handleContinue = () => {
    if (procedures.length > 0) {
      onComplete({ procedures, ...stepData });
      return;
    }
    const built = selectedSections.map((sectionId) => ({
      sectionId,
      id: sectionId,
      title: sectionTitles[sectionId] ?? sectionId,
      fields: manualNotes[sectionId]?.trim()
        ? [{ key: "manual_note", label: "Manual note", answer: manualNotes[sectionId], type: "textarea" }]
        : [],
    }));
    onComplete({ procedures: built, ...stepData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Hybrid: Manual first, then AI</h3>
        <p className="text-sm text-muted-foreground">
          Add optional manual notes per section, then generate AI questions per section or for all. You can generate per section or &quot;Generate all & continue&quot;.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSections.map((sectionId) => {
            const isGenerating = generatingSection === sectionId;
            const hasData = procedures.some((p) => (p.sectionId ?? p.id) === sectionId);
            return (
              <div
                key={sectionId}
                className="rounded border p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium">{sectionTitles[sectionId] ?? sectionId}</span>
                  <div className="flex items-center gap-2">
                    {hasData && !isGenerating && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateOne(sectionId)}
                      disabled={loading || isGenerating}
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate AI
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Optional: add manual notes or context for this section"
                  value={manualNotes[sectionId] ?? ""}
                  onChange={(e) =>
                    setManualNotes((prev) => ({ ...prev, [sectionId]: e.target.value }))
                  }
                  className="min-h-[60px]"
                />
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
        <div className="flex gap-2">
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
          <Button variant="default" onClick={handleContinue} disabled={loading}>
            Continue to answers
          </Button>
        </div>
      </div>
    </div>
  );
};
