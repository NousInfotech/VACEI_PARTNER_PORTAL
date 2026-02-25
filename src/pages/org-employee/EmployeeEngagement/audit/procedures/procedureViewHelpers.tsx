import type React from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { Checkbox } from "@/ui/checkbox";

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
