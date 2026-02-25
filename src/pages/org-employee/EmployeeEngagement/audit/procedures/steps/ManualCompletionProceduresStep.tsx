import type React from "react";
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/Textarea";
import { ScrollArea } from "@/ui/scroll-area";
import { ArrowLeft, ArrowRight, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const COMPLETION_SECTIONS = [
  { sectionId: "initial_completion", title: "P1: Initial Completion" },
  { sectionId: "audit_highlights_report", title: "P2: Audit Highlights Report" },
  { sectionId: "final_analytical_review", title: "P3: Final Analytical Review" },
  { sectionId: "points_forward_next_year", title: "P4: Points Forward for Next Year" },
  { sectionId: "final_client_meeting_notes", title: "P5: Notes of Final Client Meeting" },
  { sectionId: "summary_unadjusted_errors", title: "P6: Summary of Unadjusted Errors" },
  { sectionId: "reappointment_schedule", title: "P7: Reappointment Schedule" },
];

type FieldEntry = { id: string; label: string; answer: string };

interface ManualCompletionProceduresStepProps {
  engagement: any;
  mode: "manual" | "hybrid";
  stepData: any;
  onComplete: (data: { procedures?: any[] }) => void;
  onBack: () => void;
}

export const ManualCompletionProceduresStep: React.FC<ManualCompletionProceduresStepProps> = ({
  stepData,
  onComplete,
  onBack,
}) => {
  const selectedSections: string[] =
    stepData?.selectedSections?.length > 0
      ? stepData.selectedSections
      : COMPLETION_SECTIONS.map((s) => s.sectionId);
  const sectionTitles = Object.fromEntries(
    COMPLETION_SECTIONS.map((s) => [s.sectionId, s.title])
  );

  const [sectionFields, setSectionFields] = useState<Record<string, FieldEntry[]>>(() => {
    const existing = stepData?.procedures;
    if (Array.isArray(existing) && existing.length > 0) {
      const out: Record<string, FieldEntry[]> = {};
      existing.forEach((p: any) => {
        const sid = p.sectionId ?? p.id;
        const fields = Array.isArray(p.fields) ? p.fields : [];
        out[sid] = fields.map((f: any, i: number) => ({
          id: f.id || f.key || `f-${sid}-${i}`,
          label: f.label ?? f.question ?? "",
          answer: f.answer ?? "",
        }));
      });
      return out;
    }
    return {};
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(selectedSections[0] ?? null);

  const addField = (sectionId: string) => {
    const id = `f-${sectionId}-${Date.now()}`;
    setSectionFields((prev) => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] ?? []), { id, label: "New question", answer: "" }],
    }));
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<FieldEntry>) => {
    setSectionFields((prev) => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    }));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSectionFields((prev) => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).filter((f) => f.id !== fieldId),
    }));
  };

  const handleContinue = () => {
    const procedures = selectedSections.map((sectionId) => ({
      sectionId,
      id: sectionId,
      title: sectionTitles[sectionId] ?? sectionId,
      fields: (sectionFields[sectionId] ?? []).map((f) => ({
        id: f.id,
        key: f.id,
        label: f.label,
        answer: f.answer,
        type: "textarea",
      })),
    }));
    onComplete({ procedures });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Manual completion procedures</h3>
        <p className="text-sm text-muted-foreground">
          Add questions and answers per section below, or click Continue to open the full editor for the selected sections.
        </p>
      </div>
      <ScrollArea className="h-[400px] rounded border">
        <div className="p-2 space-y-2">
          {selectedSections.map((sectionId) => {
            const fields = sectionFields[sectionId] ?? [];
            const isExpanded = expandedSection === sectionId;
            return (
              <Card key={sectionId} className="overflow-hidden">
                <CardHeader
                  className="py-3 cursor-pointer flex flex-row items-center justify-between space-y-0"
                  onClick={() => setExpandedSection(isExpanded ? null : sectionId)}
                >
                  <CardTitle className="text-sm font-medium">
                    {sectionTitles[sectionId] ?? sectionId}
                    {fields.length > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        ({fields.length} field{fields.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    {(fields.length === 0 && (
                      <p className="text-sm text-muted-foreground">No questions yet. Add one below.</p>
                    )) ||
                      fields.map((f) => (
                        <div key={f.id} className="rounded border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              value={f.label}
                              onChange={(e) => updateField(sectionId, f.id, { label: e.target.value })}
                              placeholder="Question / label"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(sectionId, f.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <Textarea
                            value={f.answer}
                            onChange={(e) => updateField(sectionId, f.id, { answer: e.target.value })}
                            placeholder="Answer / notes"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addField(sectionId)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add question
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue to editor
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
