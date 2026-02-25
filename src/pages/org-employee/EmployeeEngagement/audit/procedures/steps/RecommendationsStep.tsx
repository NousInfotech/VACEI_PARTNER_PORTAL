import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Textarea";
import { Alert, AlertDescription } from "@/ui/alert";
import { Lightbulb, Save, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendationsStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const RecommendationsStep: React.FC<RecommendationsStepProps> = ({
  engagement: _engagement,
  mode: _mode,
  stepData,
  onComplete,
  onBack,
}) => {
  const [recommendations, setRecommendations] = useState<any[]>(
    Array.isArray(stepData.recommendations) ? stepData.recommendations : []
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addRecommendation = () => {
    setRecommendations((prev) => [
      ...prev,
      { id: `rec_${Date.now()}`, text: "", classification: stepData?.selectedClassifications?.[0] ?? "General" },
    ]);
  };

  const updateRecommendation = (id: string, text: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, text } : r))
    );
  };

  const removeRecommendation = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      const procedureId = stepData?.procedureId;
      if (procedureId) {
        const { apiPost } = await import("@/config/base");
        const { endPoints } = await import("@/config/endPoint");
        const res = await apiPost<any>(
          endPoints.PROCEDURES.GENERATE_RECOMMENDATIONS(procedureId)
        ).catch(() => null);
        const next = res?.data ?? res;
        const list = Array.isArray(next) ? next : Array.isArray(next?.recommendations) ? next.recommendations : [];
        if (list.length > 0) {
          setRecommendations(list.map((r: any, i: number) => ({ id: `ai_${i}`, ...r })));
          toast({
            title: "Recommendations Generated",
            description: "AI has generated recommendations based on your procedures.",
          });
        }
      } else {
        toast({
          title: "Save procedures first",
          description: "Generate and save procedures to enable AI recommendations.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Generation Failed",
        description: (e as Error)?.message ?? "Failed to generate recommendations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      ...stepData,
      recommendations,
      status: "completed",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-foreground flex items-center gap-2 text-gray-900">
            <Lightbulb className="h-5 w-5 text-primary text-amber-500" />
            Recommendations
          </CardTitle>
          <p className="text-muted-foreground font-body text-gray-600">
            Add or generate recommendations based on your procedures. You can
            refine them before completing.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate AI Recommendations
            </Button>
            <Button variant="outline" size="sm" onClick={addRecommendation}>
              Add manual
            </Button>
          </div>

          {recommendations.length === 0 && !loading && (
            <Alert className="border-gray-200">
              <AlertDescription className="text-gray-600">
                No recommendations yet. Click &quot;Generate AI Recommendations&quot;
                (after saving procedures) or add them manually.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex gap-2 items-start p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <Textarea
                  value={typeof rec.text === "string" ? rec.text : rec.recommendation ?? ""}
                  onChange={(e) => updateRecommendation(rec.id, e.target.value)}
                  placeholder="Recommendation text"
                  className="min-h-[80px] flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRecommendation(rec.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete}>
          <Save className="h-4 w-4 mr-2" />
          Complete & Save
        </Button>
      </div>
    </div>
  );
};
