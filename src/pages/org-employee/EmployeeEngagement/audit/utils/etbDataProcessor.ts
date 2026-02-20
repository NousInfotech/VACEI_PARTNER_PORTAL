import type { ExtendedTBRow } from '../extended-tb/data';

// Parse classification string into groups
const parseClassification = (classification: string = ""): {
  grouping1: string | null;
  grouping2: string | null;
  grouping3: string | null;
} => {
  const parts = classification.split(" > ").filter(Boolean);
  return {
    grouping1: parts[0] || null,
    grouping2: parts[1] || null,
    grouping3: parts[2] || null,
  };
};

// Normalize ETB data - flip sign for Equity & Liabilities, then compute finalBalance
export const normalizeETB = (rows: ExtendedTBRow[]): ExtendedTBRow[] => {
  const round = (v: number | undefined | null): number => {
    if (typeof v === "number") return Math.round(v);
    return 0;
  };

  return rows.map((row) => {
    // Use group1 if available, otherwise parse from classification
    const grouping1 = row.group1 || parseClassification(row.classification).grouping1;
    const sign = grouping1 === "Equity" || grouping1 === "Liabilities" ? -1 : 1;

    const currentYear = round(row.currentYear) * sign;
    const priorYear = round(row.priorYear) * sign;
    const adjustments = round(row.adjustments) * sign;
    const reclassification = round(row.reClassification) * sign;
    const finalBalance = currentYear + adjustments + reclassification;

    return {
      ...row,
      currentYear,
      priorYear,
      adjustments,
      reClassification: reclassification,
      finalBalance,
    };
  });
};

// Tree node structure
interface TreeNode {
  level: string;
  group: string;
  children: TreeNode[];
  id?: string;
  totals?: {
    currentYear: number;
    priorYear: number;
    adjustments: number;
    reclassification: number;
    finalBalance: number;
  };
  rows?: (string | number)[];
}

// Build lead sheet index
export const buildLeadSheetIndex = (tree: TreeNode[]): Record<string, string> => {
  const index: Record<string, string> = {};

  for (const g1 of tree) {
    for (const g2 of g1.children) {
      for (const g3 of g2.children) {
        if (g3.id) {
          index[g3.group] = g3.id;
        }
      }
    }
  }

  return index;
};

// Build lead sheet tree from normalized ETB rows
export const buildLeadSheetTree = (rows: ExtendedTBRow[]): TreeNode[] => {
  const tree: TreeNode[] = [];
  let idCounter = 1;

  const getOrCreate = <T extends { group: string }>(
    arr: T[],
    key: string | null,
    factory: () => T
  ): T => {
    if (!key) {
      const node = factory();
      arr.push(node);
      return node;
    }
    let node = arr.find((n) => n.group === key);
    if (!node) {
      node = factory();
      arr.push(node);
    }
    return node;
  };

  for (const row of rows) {
    // Use group1, group2, group3 if available, otherwise parse from classification
    const grouping1 = row.group1 || parseClassification(row.classification).grouping1;
    const grouping2 = row.group2 || parseClassification(row.classification).grouping2;
    const grouping3 = row.group3 || parseClassification(row.classification).grouping3;

    // Reference code requires grouping1, grouping2, and grouping3
    // Skip rows that don't have all three levels
    if (!grouping1 || !grouping2 || !grouping3) continue;

    const g1 = getOrCreate(tree, grouping1, () => ({
      level: "grouping1",
      group: grouping1,
      children: [],
    }));

    const g2 = getOrCreate(g1.children, grouping2, () => ({
      level: "grouping2",
      group: grouping2,
      children: [],
    }));

    const g3 = getOrCreate(g2.children, grouping3, () => ({
      level: "grouping3",
      id: `LS_${idCounter++}`,
      group: grouping3,
      children: [], // Leaf nodes have empty children array
      totals: {
        currentYear: 0,
        priorYear: 0,
        adjustments: 0,
        reclassification: 0,
        finalBalance: 0,
      },
      rows: [],
    }));

    if (g3.totals) {
      g3.totals.currentYear += row.currentYear || 0;
      g3.totals.priorYear += row.priorYear || 0;
      g3.totals.adjustments += row.adjustments || 0;
      g3.totals.reclassification += row.reClassification || 0;
      g3.totals.finalBalance += row.finalBalance || 0;
    }
    if (g3.rows && row.accountId) {
      g3.rows.push(row.accountId);
    } else if (g3.rows) {
      g3.rows.push(row.id);
    }
  }

  return tree;
};

// Derive Income Statement from tree
export const deriveIncomeStatement = (tree: TreeNode[], currentYear: number) => {
  const priorYear = currentYear - 1;
  const leadIndex = buildLeadSheetIndex(tree);
  const equity = tree.find((n) => n.group === "Equity");
  const pl = equity?.children.find(
    (n) => n.group === "Current Year Profits & Losses"
  );

  const empty = (year: number) => ({
    year,
    net_result: 0,
    resultType: "net_profit" as const,
    breakdowns: {} as Record<string, { value: number; accounts: string[] }>,
  });

  if (!pl) {
    return {
      prior_year: empty(priorYear),
      current_year: empty(currentYear),
    };
  }

  const collect = (field: "priorYear" | "finalBalance") => {
    const totals: Record<string, number> = {};
    for (const g3 of pl.children) {
      totals[g3.group] = g3.totals?.[field] || 0;
    }
    return totals;
  };

  const calculate = (totals: Record<string, number>) => {
    const grossProfit =
      (totals["Revenue"] || 0) + (totals["Cost of sales"] || 0);

    const operatingProfit =
      grossProfit +
      (totals["Sales and marketing expenses"] || 0) +
      (totals["Administrative expenses"] || 0) +
      (totals["Other operating income"] || 0);

    const netProfitBeforeTax =
      operatingProfit +
      (totals["Investment income"] || 0) +
      (totals["Investment losses"] || 0) +
      (totals["Finance costs"] || 0) +
      (totals["Share of profit of subsidiary"] || 0) +
      (totals["PBT Expenses"] || 0);

    const net = netProfitBeforeTax + (totals["Income tax expense"] || 0);

    return {
      net_result: net,
      resultType: net >= 0 ? ("net_profit" as const) : ("net_loss" as const),
      breakdowns: Object.fromEntries(
        Object.entries(totals).map(([k, v]) => [
          k,
          {
            value: Math.abs(v),
            accounts: leadIndex[k] ? [leadIndex[k]] : [],
          },
        ])
      ),
    };
  };

  return {
    prior_year: {
      year: priorYear,
      ...calculate(collect("priorYear")),
    },
    current_year: {
      year: currentYear,
      ...calculate(collect("finalBalance")),
    },
  };
};

// Derive Retained Earnings
export const deriveRetainedEarnings = (
  tree: TreeNode[],
  incomeStatement: ReturnType<typeof deriveIncomeStatement>,
  currentYear: number
) => {
  const priorYear = currentYear - 1;

  const equity = tree.find((n) => n.group === "Equity");
  const eqBlock = equity?.children.find((n) => n.group === "Equity");
  const re = eqBlock?.children.find((n) => n.group === "Retained earnings");

  const priorValue = re?.totals?.priorYear || 0;
  const net = incomeStatement.current_year.net_result;

  return {
    prior_year: { year: priorYear, value: priorValue },
    current_year: {
      year: currentYear,
      value: priorValue + net,
    },
  };
};

// Collect group accounts
export const collectGroupAccounts = (
  tree: TreeNode[],
  groupName: string,
  skip: { grouping2?: string[]; grouping3?: string[] } = {}
): string[] => {
  const node = tree.find((n) => n.group === groupName);
  if (!node) return [];

  const ids: string[] = [];

  for (const g2 of node.children) {
    if (skip.grouping2?.includes(g2.group)) continue;

    for (const g3 of g2.children) {
      if (skip.grouping3?.includes(g3.group)) continue;
      if (g3.id) {
        ids.push(g3.id);
      }
    }
  }

  return ids;
};

// Derive Balance Sheet
export const deriveBalanceSheet = (
  tree: TreeNode[],
  retainedEarnings: ReturnType<typeof deriveRetainedEarnings>,
  currentYear: number
) => {
  const priorYear = currentYear - 1;

  const sum = (
    group: string,
    field: "priorYear" | "finalBalance",
    skip: { grouping2?: string[]; grouping3?: string[] } = {}
  ) => {
    const node = tree.find((n) => n.group === group);
    if (!node) return 0;

    let total = 0;
    for (const g2 of node.children) {
      if (skip.grouping2?.includes(g2.group)) continue;

      for (const g3 of g2.children) {
        if (skip.grouping3?.includes(g3.group)) continue;
        total += g3.totals?.[field] || 0;
      }
    }
    return total;
  };

  const assetsCY = sum("Assets", "finalBalance");
  const liabilitiesCY = sum("Liabilities", "finalBalance");
  const equityCY =
    sum("Equity", "finalBalance", {
      grouping2: ["Current Year Profits & Losses"],
      grouping3: ["Retained earnings"],
    }) + retainedEarnings.current_year.value;

  const assetsPY = sum("Assets", "priorYear");
  const liabilitiesPY = sum("Liabilities", "priorYear");
  const equityPY =
    sum("Equity", "priorYear", {
      grouping2: ["Current Year Profits & Losses"],
      grouping3: ["Retained earnings"],
    }) + retainedEarnings.prior_year.value;

  const totalAssetsCY = assetsCY;
  const totalEquityAndLiabilitiesCY = equityCY + liabilitiesCY;

  const totalAssetsPY = assetsPY;
  const totalEquityAndLiabilitiesPY = equityPY + liabilitiesPY;

  return {
    prior_year: {
      year: priorYear,
      totals: {
        assets: {
          value: assetsPY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        liabilities: {
          value: liabilitiesPY,
          accounts: collectGroupAccounts(tree, "Liabilities"),
        },
        equity: {
          value: equityPY,
          accounts: collectGroupAccounts(tree, "Equity", {
            grouping2: ["Current Year Profits & Losses"],
            grouping3: ["Retained earnings"],
          }),
        },
        total_assets: {
          value: totalAssetsPY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        total_equity_and_liabilities: {
          value: totalEquityAndLiabilitiesPY,
          accounts: [
            ...collectGroupAccounts(tree, "Equity", {
              grouping2: ["Current Year Profits & Losses"],
              grouping3: ["Retained earnings"],
            }),
            ...collectGroupAccounts(tree, "Liabilities"),
          ],
        },
      },
      balanced: Math.abs(assetsPY - (liabilitiesPY + equityPY)) < 1,
    },
    current_year: {
      year: currentYear,
      totals: {
        assets: {
          value: assetsCY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        liabilities: {
          value: liabilitiesCY,
          accounts: collectGroupAccounts(tree, "Liabilities"),
        },
        equity: {
          value: equityCY,
          accounts: collectGroupAccounts(tree, "Equity", {
            grouping2: ["Current Year Profits & Losses"],
            grouping3: ["Retained earnings"],
          }),
        },
        total_assets: {
          value: totalAssetsCY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        total_equity_and_liabilities: {
          value: totalEquityAndLiabilitiesCY,
          accounts: [
            ...collectGroupAccounts(tree, "Equity", {
              grouping2: ["Current Year Profits & Losses"],
              grouping3: ["Retained earnings"],
            }),
            ...collectGroupAccounts(tree, "Liabilities"),
          ],
        },
      },
      balanced: Math.abs(assetsCY - (liabilitiesCY + equityCY)) < 1,
    },
  };
};

// Main export function to process ETB data
export const extractETBData = (etbRows: ExtendedTBRow[], year: number) => {
  const normalized = normalizeETB(etbRows);
  const leadSheets = buildLeadSheetTree(normalized);
  const incomeStatement = deriveIncomeStatement(leadSheets, year);
  const retainedEarnings = deriveRetainedEarnings(leadSheets, incomeStatement, year);
  const balanceSheet = deriveBalanceSheet(leadSheets, retainedEarnings, year);

  return {
    lead_sheets: leadSheets,
    income_statement: incomeStatement,
    balance_sheet: balanceSheet,
    normalized_rows: normalized,
  };
};

