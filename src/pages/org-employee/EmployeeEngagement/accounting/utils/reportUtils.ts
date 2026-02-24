import type { QBReportRow } from '../types';

export type FlattenedReportRow = {
  cells: string[];
  isSection?: boolean;
  isSummary?: boolean;
};

export function flattenReportRows(
  rows: QBReportRow[] | undefined,
  _depth = 0
): FlattenedReportRow[] {
  const out: FlattenedReportRow[] = [];
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (row.ColData && Array.isArray(row.ColData)) {
      const cells = row.ColData.map((c) =>
        c && typeof c.value === 'string' ? c.value : ''
      );
      out.push({ cells, isSection: row.type === 'Section' });
    }
    if (row.Header?.ColData && Array.isArray(row.Header.ColData)) {
      const cells = row.Header.ColData.map((c) =>
        c && typeof c.value === 'string' ? c.value : ''
      );
      out.push({ cells, isSection: true });
    }
    if (row.Rows?.Row?.length) {
      out.push(...flattenReportRows(row.Rows.Row, _depth + 1));
    }
    if (row.Summary?.ColData && Array.isArray(row.Summary.ColData)) {
      const cells = row.Summary.ColData.map((c) =>
        c && typeof c.value === 'string' ? c.value : ''
      );
      out.push({ cells, isSummary: true });
    }
  }
  return out;
}
