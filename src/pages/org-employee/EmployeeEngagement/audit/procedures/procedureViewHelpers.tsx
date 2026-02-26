import type React from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { Checkbox } from "@/ui/checkbox";
import { Textarea } from "@/ui/Textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const uid = () => Math.random().toString(36).slice(2, 9);

export const withUids = (procedures: any[]) =>
  (Array.isArray(procedures) ? procedures : []).map((sec: any) => ({
    ...sec,
    fields: (sec?.fields || []).map((f: any) => ({
      __uid: f.__uid || uid(),
      ...f,
    })),
  }));

export const normalizeType = (t?: string) => {
  const v = String(t || "").toLowerCase();
  if (v === "textfield") return "text";
  if (v === "selection") return "select";
  return v;
};

export const assignSectionToRecommendations = (
  recs: any[],
  procedures: any[]
) => {
  const defaultSectionId =
    procedures?.[0]?.sectionId || procedures?.[0]?.id || "general";
  return (Array.isArray(recs) ? recs : []).map((rec) => {
    const recSection = rec?.section || rec?.sectionId;
    if (recSection) return rec;
    return { ...rec, section: defaultSectionId };
  });
};

export const normalizeRecommendations = (
  incoming: any,
  sectionId: string
): any[] => {
  if (!incoming) return [];
  if (typeof incoming === "string") {
    try {
      const parsed = JSON.parse(incoming);
      return normalizeRecommendations(parsed, sectionId);
    } catch {
      return [
        {
          id: `rec-${Date.now()}`,
          text: incoming.trim(),
          checked: false,
          section: sectionId,
        },
      ];
    }
  }
  if (Array.isArray(incoming)) {
    return incoming.map((rec: any, idx: number) => {
      if (typeof rec === "string") {
        return {
          id: `rec-${Date.now()}-${idx}`,
          text: rec.trim(),
          checked: false,
          section: sectionId,
        };
      }
      return {
        ...rec,
        id: rec.id || rec.__uid || `rec-${Date.now()}-${idx}`,
        section: rec.section || rec.sectionId || sectionId,
      };
    });
  }
  if (typeof incoming === "object") {
    const collected: any[] = [];
    Object.values(incoming).forEach((arr: any, idxOuter: number) => {
      if (Array.isArray(arr)) {
        arr.forEach((rec: any, idxInner: number) => {
          if (typeof rec === "string") {
            collected.push({
              id: `rec-${Date.now()}-${idxOuter}-${idxInner}`,
              text: rec.trim(),
              checked: false,
              section: sectionId,
            });
          } else {
            collected.push({
              ...rec,
              id:
                rec.id ||
                rec.__uid ||
                `rec-${Date.now()}-${idxOuter}-${idxInner}`,
              section: rec.section || rec.sectionId || sectionId,
            });
          }
        });
      }
    });
    return collected;
  }
  return [];
};

export function SmallLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-xs font-medium text-muted-foreground">{children}</div>
  );
}

export function MultiSelectEditor({
  field,
  onChange,
}: {
  field: any;
  onChange: (v: any) => void;
}) {
  const valueArray = Array.isArray(field.answer) ? field.answer : [];
  const opts = Array.isArray(field.options) ? field.options : [];
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((opt: string) => {
        const checked = valueArray.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-2 border rounded px-2 py-1"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(ck) => {
                if (!!ck) onChange([...valueArray, opt]);
                else onChange(valueArray.filter((x: string) => x !== opt));
              }}
            />
            <span className="text-sm">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

export function SelectEditor({
  field,
  onChange,
}: {
  field: any;
  onChange: (v: any) => void;
}) {
  const opts = Array.isArray(field.options) ? field.options : [];
  const value = typeof field.answer === "string" ? field.answer : "";
  return (
    <select
      className="w-full border rounded px-3 py-2 bg-background"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Select…
      </option>
      {opts.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/** Resolve display value for select: answer can be index (number) or option label (string). */
export function getSelectDisplayLabel(field: any): string {
  const opts = Array.isArray(field.options) ? field.options : [];
  const a = field.answer;
  if (typeof a === "number" && a >= 0 && a < opts.length) return opts[a];
  if (typeof a === "string" && opts.includes(a)) return a;
  return String(a ?? "");
}

/** Convert field.answer to string suitable for FieldAnswerEditor (e.g. select → option label). */
export function answerToEditString(field: any): string {
  const t = normalizeType(field?.type);
  if (t === "select") return getSelectDisplayLabel(field);
  if (t === "checkbox")
    return field?.answer === true || field?.answer === "true"
      ? "true"
      : field?.answer === false || field?.answer === "false"
        ? "false"
        : String(field?.answer ?? "");
  if (t === "multiselect" && Array.isArray(field?.answer))
    return (field.answer as string[]).join(", ");
  return String(field?.answer ?? "");
}

/** Read-only display of an answer according to field type (checkbox, select, number, textarea, etc.). */
export function FieldAnswerDisplay({ field }: { field: any }) {
  const t = normalizeType(field?.type);
  const answer = field?.answer;

  const isEmpty =
    answer === undefined ||
    answer === null ||
    (typeof answer === "string" && answer.trim() === "") ||
    (Array.isArray(answer) && answer.length === 0);
  if (isEmpty) {
    return <span className="italic text-muted-foreground">No answer.</span>;
  }

  if (t === "checkbox") {
    const isExplicitFalse = answer === false || answer === "false" || (typeof answer === "string" && /^(no|false)$/i.test(String(answer).trim()));
    const checked = !isExplicitFalse && (answer === true || answer === "true" || (typeof answer === "string" && answer.toLowerCase() === "yes") || (typeof answer === "string" && answer.trim().length > 0));
    const isLongText = typeof answer === "string" && answer.length > 50 && !/^(yes|no|true|false)$/i.test(answer.trim());
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={checked} disabled className="pointer-events-none" />
          <span>{checked ? "Yes" : "No"}</span>
        </label>
        {isLongText && (
          <div className="text-sm text-muted-foreground pl-6 border-l-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(answer)}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  if (t === "select") {
    const label = getSelectDisplayLabel(field);
    return <span className="text-sm">{label || "—"}</span>;
  }

  if (t === "multiselect") {
    const arr = Array.isArray(answer) ? answer : [];
    if (arr.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
    return (
      <ul className="list-disc list-inside text-sm space-y-1">
        {arr.map((item: string, i: number) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (t === "number") {
    const num = typeof answer === "number" ? answer : Number(answer);
    return <span className="text-sm">{Number.isNaN(num) ? String(answer) : num}</span>;
  }

  if (t === "table") {
    const rows = Array.isArray(answer) ? answer : [];
    const cols = Array.isArray((field as any).columns) ? (field as any).columns : [];
    if (cols.length === 0 || rows.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
    return (
      <div className="overflow-x-auto rounded border text-sm">
        <table className="min-w-full">
          <thead className="bg-muted/50">
            <tr>
              {cols.map((c: string) => (
                <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, rIdx: number) => (
              <tr key={rIdx} className="border-t">
                {cols.map((c: string) => (
                  <td key={c} className="px-3 py-2">{String(row?.[c] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // text, textarea: support array (e.g. list of items) or string
  if (Array.isArray(answer)) {
    return (
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        {answer.map((item: any, i: number) => (
          <li key={i}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(answer)}</ReactMarkdown>
    </div>
  );
}

/** Editable input for an answer according to field type; value/onChange are string-based for state. */
export function FieldAnswerEditor({
  field,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  field: any;
  value: string;
  onChange: (v: string) => void;
  onSave: (savedValue: string) => void;
  onCancel: () => void;
}) {
  const t = normalizeType(field?.type);
  const opts = Array.isArray(field?.options) ? field.options : [];

  const saveButton = (
    <Button size="sm" onClick={() => onSave(value)}>
      <span className="sr-only">Save</span>
      Save
    </Button>
  );
  const cancelButton = (
    <Button size="sm" variant="outline" onClick={onCancel}>
      <span className="sr-only">Cancel</span>
      Cancel
    </Button>
  );

  if (t === "checkbox") {
    const checked = value !== "false" && value !== "" && (value === "true" || value === "yes" || value.length > 1);
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={checked}
            onCheckedChange={(c) => onChange(c ? (value && value !== "false" ? value : "true") : "false")}
          />
          <span className="text-sm">Yes / No</span>
        </label>
        <Textarea
          placeholder="Details (optional)"
          value={value === "false" || value === "true" ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex gap-2">
          {saveButton}
          {cancelButton}
        </div>
      </div>
    );
  }

  if (t === "select") {
    const currentValue = value !== "" && (opts.includes(value) || opts[Number(value)] !== undefined)
      ? (opts.includes(value) ? value : opts[Number(value)])
      : "";
    return (
      <div className="space-y-3">
        <select
          className="w-full border rounded px-3 py-2 bg-background"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {opts.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {saveButton}
          {cancelButton}
        </div>
      </div>
    );
  }

  if (t === "number") {
    return (
      <div className="space-y-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field?.placeholder ?? "Number"}
        />
        <div className="flex gap-2">
          {saveButton}
          {cancelButton}
        </div>
      </div>
    );
  }

  if (t === "multiselect") {
    const valueArray = (value && value.trim() ? value.split(",").map((s: string) => s.trim()) : []) as string[];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {opts.map((opt: string) => {
            const checked = valueArray.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 border rounded px-2 py-1">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c ? [...valueArray, opt] : valueArray.filter((x) => x !== opt);
                    onChange(next.join(", "));
                  }}
                />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
        <div className="flex gap-2">
          {saveButton}
          {cancelButton}
        </div>
      </div>
    );
  }

  // text, textarea, default
  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Answer"
        className="min-h-[100px]"
      />
      <div className="flex gap-2">
        {saveButton}
        {cancelButton}
      </div>
    </div>
  );
}

export function TableDisplay({
  columns,
  rows,
}: {
  columns?: string[];
  rows?: any[];
}) {
  const cols = Array.isArray(columns) && columns.length ? columns : [];
  const data = Array.isArray(rows) ? rows : [];
  if (!cols.length)
    return (
      <div className="text-sm text-muted-foreground">No columns defined.</div>
    );
  if (!data.length)
    return <div className="text-sm text-muted-foreground">No rows.</div>;
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx} className="border-t">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2">
                  {String(row?.[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableEditor({
  columns,
  value,
  onChange,
}: {
  columns?: string[];
  value?: any[];
  onChange: (rows: any[]) => void;
}) {
  const cols = Array.isArray(columns) ? columns : [];
  const rows = Array.isArray(value) ? value : [];

  const addRow = () => {
    const empty: any = {};
    cols.forEach((c) => {
      empty[c] = "";
    });
    onChange([...(rows || []), empty]);
  };

  const removeRow = (idx: number) => {
    const next = [...rows];
    next.splice(idx, 1);
    onChange(next);
  };

  const updateCell = (idx: number, col: string, cellVal: string) => {
    const next = [...rows];
    const r = { ...(next[idx] || {}) };
    r[col] = cellVal;
    next[idx] = r;
    onChange(next);
  };

  if (!cols.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No columns defined for this table.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-medium">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t">
                <td
                  className="px-3 py-2 text-muted-foreground"
                  colSpan={cols.length + 1}
                >
                  No rows. Click &quot;Add row&quot;.
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-t">
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-2">
                      <Input
                        value={String(row?.[c] ?? "")}
                        onChange={(e) =>
                          updateCell(rIdx, c, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(rIdx)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Button size="sm" variant="outline" onClick={addRow}>
        + Add row
      </Button>
    </div>
  );
}

function isNotEmpty(val: any) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return String(val).trim() !== "";
}

function evaluateCondition(
  fieldValue: any,
  cond: { operator?: string; value?: any }
) {
  const op = cond?.operator;
  const v = cond?.value;
  if (!op)
    return Array.isArray(v) ? v.includes(fieldValue) : fieldValue === v;
  switch (op) {
    case "not_empty":
      return isNotEmpty(fieldValue);
    case ">=":
      return Number(fieldValue ?? 0) >= Number(v);
    case "<=":
      return Number(fieldValue ?? 0) <= Number(v);
    case ">":
      return Number(fieldValue ?? 0) > Number(v);
    case "<":
      return Number(fieldValue ?? 0) < Number(v);
    case "any":
      if (Array.isArray(fieldValue))
        return fieldValue.some((x) => (v as string[]).includes(x));
      if (typeof fieldValue === "object" && fieldValue !== null)
        return Object.keys(fieldValue).some(
          (k) => fieldValue[k] && (v as string[]).includes(k)
        );
      return false;
    default:
      return Array.isArray(v) ? v.includes(fieldValue) : fieldValue === v;
  }
}

export function isFieldVisible(
  field: any,
  answersMap: Record<string, any>
): boolean {
  if (!field.visibleIf) return true;
  const clauses = field.visibleIf as any;
  return Object.entries(clauses).every(([depKey, requirement]) => {
    const depVal = answersMap[depKey];
    if (Array.isArray(requirement)) {
      if (
        requirement.length > 0 &&
        typeof requirement[0] === "object" &&
        "operator" in requirement[0]
      ) {
        return (requirement as any[]).every((cond) =>
          evaluateCondition(depVal, cond)
        );
      }
      return (requirement as any[]).includes(depVal);
    }
    return requirement === depVal;
  });
}
