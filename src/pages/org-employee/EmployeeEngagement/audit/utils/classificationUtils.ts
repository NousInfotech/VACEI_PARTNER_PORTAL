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
 * Extract all unique classification groups (group3) from ETB data
 * Returns a map of classification groups organized by group1 and group2
 */
export function extractClassificationGroups(etbRows: ExtendedTBRow[]): ClassificationGroup[] {
  const tree = buildLeadSheetTree(etbRows);
  const groups: ClassificationGroup[] = [];

  for (const g1 of tree) {
    for (const g2 of g1.children) {
      for (const g3 of g2.children) {
        if (g3.group && g3.totals) {
          groups.push({
            id: g3.id || `classification-${g3.group}`,
            label: g3.group,
            group1: g1.group,
            group2: g2.group,
            group3: g3.group,
            accountIds: (g3.rows || []) as string[],
            totals: {
              currentYear: g3.totals.currentYear || 0,
              priorYear: g3.totals.priorYear || 0,
              adjustments: g3.totals.adjustments || 0,
              reclassification: g3.totals.reclassification || 0,
              finalBalance: g3.totals.finalBalance || 0,
            },
          });
        }
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

