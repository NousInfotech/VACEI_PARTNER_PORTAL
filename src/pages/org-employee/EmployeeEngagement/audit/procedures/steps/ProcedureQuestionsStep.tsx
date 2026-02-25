import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/badge";
import { Textarea } from "@/ui/Textarea";
import { ScrollArea } from "@/ui/scroll-area";
import { Alert, AlertDescription } from "@/ui/alert";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  AlertCircle,
  Brain,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  mapClassificationToProcedureKey,
  formatClassificationForDisplay,
} from "./procedureClassificationMapping";

interface ProcedureQuestionsStepProps {
  engagement: any;
  mode: "manual" | "ai" | "hybrid";
  stepData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

const uid = () =>
  Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);

function normalizeQuestions(items: any[] | undefined | null): any[] {
  if (!Array.isArray(items)) return [];
  return items.map((q, i) => {
    const base = q || {};
    const __uid = `q_${uid()}_${i}`;
    return { ...base, __uid, id: base.id ?? __uid };
  });
}

function groupKeyFor(q: any): string {
  return (
    q.recommendationBucket ||
    q.recommendationCategory ||
    q.classification ||
    "General"
  );
}

function proceduresToQuestionsFallback(result: any): any[] {
  const procArr = result?.procedure?.procedures || result?.procedures || result?.data;
  if (!Array.isArray(procArr) || procArr.length === 0) return [];
  return procArr.map((p: any, idx: number) => ({
    id: p.id || `ai_${idx + 1}`,
    question: p.title || p.question || `Procedure ${idx + 1}`,
    answer: p.answer ?? "",
    isRequired: false,
    classification: p.classification || p.area || "General",
    procedure: p,
  }));
}

export const ProcedureQuestionsStep: React.FC<ProcedureQuestionsStepProps> = ({
  engagement: _engagement,
  mode,
  stepData,
  onComplete,
  onBack: _onBack,
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [phase, setPhase] = useState("");
  const { toast } = useToast();

  const groups = useMemo(() => {
    const by: Record<string, any[]> = {};
    for (const q of questions) {
      const key = groupKeyFor(q);
      if (!by[key]) by[key] = [];
      by[key].push(q);
    }
    return by;
  }, [questions]);

  const sectionIds = useMemo(
    () => Object.keys(groups).map((_, index) => `section-${index}`),
    [groups]
  );

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!loading || mode === "manual") return;
    const phases = [
      "Analyzing working papers…",
      "Identifying risk areas…",
      "Generating procedures…",
      "Optimizing recommendations…",
      "Finalizing…",
    ];
    let i = 0;
    const int = setInterval(() => setPhase(phases[i++ % phases.length]), 1200);
    return () => clearInterval(int);
  }, [loading, mode]);

  const loadManual = async () => {
    setLoading(true);
    try {
      const staticProceduresModule = await import("@/static/procedures");
      const staticProcedures = staticProceduresModule.default || {};
      const selected: string[] = Array.isArray(stepData?.selectedClassifications)
        ? stepData.selectedClassifications
        : [];
      const all: any[] = [];
      selected.forEach((hierarchicalClassification: string) => {
        const procedureKey = mapClassificationToProcedureKey(hierarchicalClassification);
        const arr = staticProcedures[procedureKey] || staticProcedures.default || [];
        arr.forEach((proc: any) =>
          all.push({
            ...proc,
            classification: hierarchicalClassification,
            answer: "",
          })
        );
      });
      setQuestions(normalizeQuestions(all));
      setRecommendations([]);
      if (all.length === 0) {
        toast({
          title: "No Templates Found",
          description:
            "Add templates in src/static/procedures.ts for your selected classifications.",
        });
      } else {
        toast({
          title: "Manual Procedures Loaded",
          description: `Loaded ${all.length} procedures for ${selected.length} classifications.`,
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Template load failed",
        description: String((e as Error)?.message ?? e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAI = async () => {
    setLoading(true);
    try {
      const auditCycleId = stepData?.auditCycleId;
      if (auditCycleId) {
        const { apiPost } = await import("@/config/base");
        const { endPoints } = await import("@/config/endPoint");
        const res = await apiPost<any>(endPoints.PROCEDURES.GENERATE, {
          auditCycleId,
          type: "FIELDWORK",
          materialityValue: stepData?.materiality ?? 0,
        }).catch(() => null);
        const raw = res?.data;
        const next = Array.isArray(raw?.questions)
          ? raw.questions
          : proceduresToQuestionsFallback(res) || proceduresToQuestionsFallback({ data: raw }) || [];
        const recs = raw?.recommendations || res?.procedure?.recommendations || res?.recommendations || [];
        if (next.length > 0) {
          setQuestions(normalizeQuestions(next));
          setRecommendations(Array.isArray(recs) ? recs : []);
          toast({ title: "Procedures Ready", description: `Generated ${next.length} procedures.` });
          setLoading(false);
          return;
        }
      }
      loadManual();
    } catch (e) {
      console.error(e);
      toast({
        title: "Generation failed",
        description: (e as Error)?.message ?? "Unexpected error.",
        variant: "destructive",
      });
      loadManual();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "manual") loadManual();
    else loadAI();
  }, [mode, JSON.stringify(stepData?.selectedClassifications || [])]);

  const startEdit = (uidKey: string) => {
    const q = questions.find((x) => x.__uid === uidKey);
    if (!q) return;
    setEditingUid(uidKey);
    setEditedText(q.question || "");
    setEditedAnswer(q.answer || "");
  };

  const saveEdit = (uidKey: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.__uid === uidKey
          ? { ...q, question: editedText, answer: editedAnswer }
          : q
      )
    );
    setEditingUid(null);
    setEditedText("");
    setEditedAnswer("");
  };

  const cancelEdit = () => {
    setEditingUid(null);
    setEditedText("");
    setEditedAnswer("");
  };

  const deleteItem = (uidKey: string) => {
    setQuestions((prev) => prev.filter((q) => q.__uid !== uidKey));
    toast({ title: "Removed", description: "The procedure item was deleted." });
  };

  const addItem = (classification: string) => {
    const __uid = `custom_${uid()}`;
    const item = {
      __uid,
      id: __uid,
      question: "New custom procedure item",
      answer: "",
      isRequired: false,
      classification,
    };
    setQuestions((prev) => [...prev, item]);
    setEditingUid(__uid);
    setEditedText(item.question);
    setEditedAnswer("");
  };

  const setAnswer = (uidKey: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.__uid === uidKey ? { ...q, answer } : q))
    );
  };

  const toggleRequired = (uidKey: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.__uid === uidKey ? { ...q, isRequired: !q.isRequired } : q
      )
    );
  };

  const recTextFor = (bucket: string) => {
    const hit = (recommendations || []).find((r: any) =>
      [r.bucket, r.category, r.classification, r.classificationTag]
        .filter(Boolean)
        .some(
          (k) => String(k).toLowerCase() === String(bucket).toLowerCase()
        )
    );
    return typeof hit?.text === "string"
      ? hit.text
      : typeof hit?.recommendation === "string"
        ? hit.recommendation
        : "";
  };

  const handleProceed = () => {
    onComplete({
      questions: questions.map(({ __uid, ...rest }) => rest),
      recommendations,
    });
  };

  if (loading && mode !== "manual") {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden relative border-2 border-primary/20 border-blue-200">
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg bg-blue-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="font-heading text-2xl text-gray-900">
                AI Procedure Generation
              </CardTitle>
            </div>
            <p className="text-muted-foreground mt-1 text-gray-500">
              {phase || "Working…"}
            </p>
          </CardHeader>
          <CardContent className="py-8 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{mode.toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground text-gray-500">
            Review & refine your procedures
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleProceed}>
            Continue <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {Object.keys(groups).length > 0 && (
        <div className="flex justify-start">
          <select
            className="w-auto bg-white text-black border border-black hover:bg-gray-100 focus:bg-gray-100 rounded-md px-3 py-2 text-sm"
            onChange={(e) => scrollToSection(e.target.value)}
            defaultValue={sectionIds[0]}
          >
            {Object.keys(groups).map((bucket, index) => (
              <option key={bucket} value={`section-${index}`}>
                {formatClassificationForDisplay(bucket)}
              </option>
            ))}
          </select>
        </div>
      )}

      {questions.length === 0 ? (
        <Alert className="border-gray-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-gray-600">
            {mode === "manual"
              ? "No procedures for your selections. Ensure src/static/procedures.ts has entries matching your classifications."
              : "No AI procedures received. You can use Manual mode or ensure the backend generate endpoint is configured."}
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[60vh] overflow-y-auto">
          <div className="space-y-5 pr-4">
            {Object.entries(groups).map(([bucket, items], index) => (
              <Card
                key={bucket}
                id={`section-${index}`}
                className="border-2 border-primary/10 border-gray-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatClassificationForDisplay(bucket)}
                        </Badge>
                        <Badge variant="secondary">
                          {items.length} item{items.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {recTextFor(bucket) ? (
                        <p className="text-xs text-muted-foreground mt-2 text-gray-500">
                          {recTextFor(bucket)}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(bucket)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((q) => {
                    const isEditing = editingUid === q.__uid;
                    const badge = formatClassificationForDisplay(q.classification);
                    return (
                      <div
                        key={q.__uid}
                        className="space-y-3 p-4 rounded-md border border-gray-300 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{badge}</Badge>
                            {q.isRequired ? (
                              <Badge variant="default">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleRequired(q.__uid)}
                            >
                              {q.isRequired ? "Mark Optional" : "Mark Required"}
                            </Button>
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(q.__uid)}
                                >
                                  <Save className="h-4 w-4 mr-1" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(q.__uid)}
                                >
                                  <Edit3 className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteItem(q.__uid)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            Question
                          </div>
                          {isEditing ? (
                            <Textarea
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              placeholder="Edit the procedure question"
                            />
                          ) : (
                            <div className="text-sm text-gray-700">
                              {q.question}
                            </div>
                          )}
                          <div className="text-sm font-medium mt-2 text-gray-900">
                            Answer
                          </div>
                          {isEditing ? (
                            <Textarea
                              value={editedAnswer}
                              onChange={(e) => setEditedAnswer(e.target.value)}
                              placeholder="Add the planned response / notes"
                            />
                          ) : (
                            <Textarea
                              value={String(q.answer ?? "")}
                              onChange={(e) => setAnswer(q.__uid, e.target.value)}
                              placeholder="Add the planned response / notes"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
