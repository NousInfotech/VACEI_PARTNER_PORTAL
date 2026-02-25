import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

interface AICompletionAnswersStepProps {
  engagement: any;
  mode: "ai" | "hybrid";
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const AICompletionAnswersStep: React.FC<AICompletionAnswersStepProps> = ({
  engagement,
  stepData,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [procedures, setProcedures] = useState<any[]>(
    Array.isArray(stepData?.procedures) ? stepData.procedures : []
  );
  const { toast } = useToast();

  const engagementId = engagement?.id ?? engagement?._id;

  const handleGenerateAll = async () => {
    if (!engagementId || procedures.length === 0) {
      toast({
        title: "No sections",
        description: "Generate questions first or go back.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const updated = [...procedures];

    for (let i = 0; i < updated.length; i++) {
      const sec = updated[i];
      const sectionId = sec.sectionId ?? sec.id;
      if (!sectionId) continue;
      setGeneratingSections((prev) => new Set(prev).add(sectionId));
      try {
        const res = await apiPost<{ data?: { fields?: any[] } }>(
          endPoints.COMPLETION_PROCEDURES.GENERATE_SECTION_ANSWERS(engagementId),
          { sectionId }
        );
        const raw = res?.data ?? (res as any);
        const fields = Array.isArray(raw?.data?.fields)
          ? raw.data.fields
          : Array.isArray(raw?.fields)
            ? raw.fields
            : [];
        const existingFields = sec.fields || [];
        const merged = existingFields.map((f: any) => {
          const match = fields.find((x: any) => (x.key || x.id) === (f.key || f.id));
          return match != null ? { ...f, answer: match.answer ?? f.answer } : f;
        });
        updated[i] = { ...sec, fields: merged.length ? merged : fields };
        setProcedures([...updated]);
        setCompletedSections((prev) => new Set(prev).add(sectionId));
      } catch (e: any) {
        toast({
          title: "Generation failed",
          description: e?.message || `Failed for ${sec.title || sectionId}`,
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
    toast({ title: "Answers generated", description: "You can edit and then continue." });
  };

  const handleContinue = async () => {
    if (!engagementId || procedures.length === 0) {
      onComplete({ procedures });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        procedureType: "completion",
        status: "draft",
        mode: stepData.mode || "AI",
        procedures,
        recommendations: stepData.recommendations || [],
        materiality: stepData.materiality,
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      await apiPostFormData(endPoints.COMPLETION_PROCEDURES.SAVE(engagementId), formData);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Could not save.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    onComplete({ procedures, ...stepData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate completion answers (AI)</h3>
        <p className="text-sm text-muted-foreground">
          Generate answers for each section, then continue to the editor to review or complete.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {procedures.map((sec) => {
            const sectionId = sec.sectionId ?? sec.id;
            const isGenerating = generatingSections.has(sectionId);
            const isDone = completedSections.has(sectionId);
            return (
              <div
                key={sectionId}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm font-medium">{sec.title || sectionId}</span>
                {isGenerating && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleGenerateAll} disabled={loading || procedures.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate all answers"
            )}
          </Button>
          <Button onClick={handleContinue} disabled={loading}>
            Continue to editor
          </Button>
        </div>
      </div>
    </div>
  );
};
