import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Checkbox } from "@/ui/checkbox";

interface PlanningRecommendationsStepProps {
  engagement: any;
  mode: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export const PlanningRecommendationsStep: React.FC<PlanningRecommendationsStepProps> = ({
  engagement,
  mode,
  stepData,
  onComplete,
  onBack,
}) => {
  const [recommendations, setRecommendations] = useState<Array<{ id: string; text: string; checked: boolean }>>(
    () => {
      const r = stepData.recommendations;
      if (Array.isArray(r) && r.length > 0) {
        return r.map((x: any, i: number) => ({
          id: x.id || `rec-${i}-${Date.now()}`,
          text: typeof x === "string" ? x : (x.text ?? x.title ?? ""),
          checked: Boolean(x.checked),
        }));
      }
      return [];
    }
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const engagementId = engagement?.id ?? engagement?._id;

  const addItem = () => {
    setRecommendations((prev) => [
      ...prev,
      { id: `rec-${Date.now()}`, text: "New recommendation", checked: false },
    ]);
  };

  const updateItem = (id: string, updates: Partial<{ text: string; checked: boolean }>) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const removeItem = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const generateAI = async () => {
    if (!engagementId) return;
    setLoading(true);
    try {
      const res = await apiPost<{ data?: { recommendations?: any[] }; recommendations?: any[] }>(
        endPoints.PLANNING_PROCEDURES.GENERATE_RECOMMENDATIONS(engagementId),
        {
          procedures: stepData.procedures,
          materiality: stepData.materiality ?? 0,
        }
      );
      const raw = res?.data ?? (res as any);
      const recs = Array.isArray(raw?.data?.recommendations)
        ? raw.data.recommendations
        : Array.isArray(raw?.recommendations)
          ? raw.recommendations
          : [];
      setRecommendations(
        recs.map((r: any, i: number) => ({
          id: r.id || `rec-${i}-${Date.now()}`,
          text: typeof r === "string" ? r : (r.text ?? r.title ?? ""),
          checked: Boolean(r.checked),
        }))
      );
      toast({ title: "Recommendations generated" });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e?.message || "Could not generate recommendations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!engagementId) {
      onComplete({ ...stepData, recommendations });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...stepData,
        procedures: stepData.procedures ?? [],
        recommendations,
        status: "completed",
        procedureType: "planning",
        mode: stepData.mode || mode || "manual",
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      await apiPostFormData(endPoints.PLANNING_PROCEDURES.SAVE(engagementId), formData);
      toast({ title: "Saved", description: "Planning procedures and recommendations saved." });
      onComplete({ ...payload, procedureType: "planning" });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Could not save.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Planning recommendations</h3>
        <p className="text-sm text-muted-foreground">
          Add or generate recommendations, then save and complete.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Recommendations</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateAI} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI
            </Button>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.length === 0 && (
            <p className="text-sm text-muted-foreground">No recommendations yet. Add manually or generate with AI.</p>
          )}
          {recommendations.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded border p-2">
              <Checkbox
                checked={r.checked}
                onCheckedChange={(c) => updateItem(r.id, { checked: Boolean(c) })}
              />
              <Input
                value={r.text}
                onChange={(e) => updateItem(r.id, { text: e.target.value })}
                className="flex-1"
                placeholder="Recommendation text"
              />
              <Button variant="ghost" size="sm" onClick={() => removeItem(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSaveAndComplete} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save and complete
        </Button>
      </div>
    </div>
  );
};
