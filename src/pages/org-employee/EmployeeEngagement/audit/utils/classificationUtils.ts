import type { ExtendedTBRow } from '../extended-tb/data';
import { buildLeadSheetTree } from './etbDataProcessor';

export interface ClassificationGroup {
  id: string;
  label: string;
  group1: string;
  group2: string;
  group3: string;
  accountIds: string[];
  totals: {
    currentYear: number;
    priorYear: number;
    adjustments: number;
    reclassification: number;
    finalBalance: number;
  };
}

/**
 * Aggregate totals from level-4 (leaf) nodes under a level-3 node.
 * Tree is 4-level: group1 → group2 → group3 → group4; only g4 has .totals and .rows.
 */
function aggregateG4UnderG3(g3: { children: { totals?: ClassificationGroup['totals']; rows?: (string | number)[] }[] }) {
  let currentYear = 0;
  let priorYear = 0;
  let adjustments = 0;
  let reclassification = 0;
  let finalBalance = 0;
  const rowIds: (string | number)[] = [];
  for (const g4 of g3.children) {
    if (g4.totals) {
      currentYear += g4.totals.currentYear ?? 0;
      priorYear += g4.totals.priorYear ?? 0;
      adjustments += g4.totals.adjustments ?? 0;
      reclassification += g4.totals.reclassification ?? 0;
      finalBalance += g4.totals.finalBalance ?? 0;
    }
    if (g4.rows?.length) rowIds.push(...g4.rows);
  }
  return { totals: { currentYear, priorYear, adjustments, reclassification, finalBalance }, rowIds };
}

/**
 * Extract all unique classification groups (group3) from ETB data.
 * Supports 4-level tree: group1 → group2 → group3 → group4 (totals at g4); aggregates g4 under each g3 for sidebar.
 */
export function extractClassificationGroups(etbRows: ExtendedTBRow[]): ClassificationGroup[] {
  const tree = buildLeadSheetTree(etbRows);
  const groups: ClassificationGroup[] = [];

  for (const g1 of tree) {
    for (const g2 of g1.children) {
      for (const g3 of g2.children) {
        if (!g3.group) continue;
        const { totals, rowIds } = aggregateG4UnderG3(g3);
        groups.push({
          id: `classification-${g1.group}-${g2.group}-${g3.group}`.replace(/\s+/g, '-'),
          label: g3.group,
          group1: g1.group,
          group2: g2.group,
          group3: g3.group,
          accountIds: rowIds.map((rowId) => {
            const row = etbRows.find((r) => r.id === rowId);
            return row?.accountId ?? String(rowId);
          }),
          totals,
        });
      }
    }
  }

  return groups;
}

/**
 * Get rows for a specific classification group
 */
export function getRowsForClassification(
  etbRows: ExtendedTBRow[],
  classificationGroup: ClassificationGroup
): ExtendedTBRow[] {
  return etbRows.filter((row) => {
    const rowGroup1 = row.group1 || '';
    const rowGroup2 = row.group2 || '';
    const rowGroup3 = row.group3 || '';
    
    return (
      rowGroup1 === classificationGroup.group1 &&
      rowGroup2 === classificationGroup.group2 &&
      rowGroup3 === classificationGroup.group3
    );
  });
}

/**
 * Organize classification groups by group1 and group2 for sidebar display
 */
export interface OrganizedClassifications {
  [group1: string]: {
    [group2: string]: ClassificationGroup[];
  };
}

export function organizeClassificationsByHierarchy(
  groups: ClassificationGroup[]
): OrganizedClassifications {
  const organized: OrganizedClassifications = {};

  for (const group of groups) {
    if (!organized[group.group1]) {
      organized[group.group1] = {};
    }
    if (!organized[group.group1][group.group2]) {
      organized[group.group1][group.group2] = [];
    }
    organized[group.group1][group.group2].push(group);
  }

  return organized;
}

