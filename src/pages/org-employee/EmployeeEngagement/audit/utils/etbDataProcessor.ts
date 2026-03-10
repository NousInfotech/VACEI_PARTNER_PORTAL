import type { ExtendedTBRow } from '../extended-tb/data';

// Normalize group key for consistent lookup (trim + case-insensitive)
const normalizeGroupKey = (s: string): string => s.trim().toLowerCase();

// Numeric coercion: safe for CSV/API (handles "", null, NaN, Infinity)
const toNumber = (v: unknown): number =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

// Parse classification string into groups (trimmed; supports 4 levels for Balance Sheet)
const parseClassification = (classification: string = ""): {
  grouping1: string | null;
  grouping2: string | null;
  grouping3: string | null;
  grouping4: string | null;
} => {
  const parts = classification.split(" > ").map((p) => p.trim()).filter(Boolean);
  return {
    grouping1: parts[0] || null,
    grouping2: parts[1] || null,
    grouping3: parts[2] || null,
    grouping4: parts[3] || null,
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

// Build lead sheet index (by level-4 group name for new 4-level Balance Sheet structure)
export const buildLeadSheetIndex = (tree: TreeNode[]): Record<string, string> => {
  const index: Record<string, string> = {};

  for (const g1 of tree) {
    for (const g2 of g1.children) {
      for (const g3 of g2.children) {
        for (const g4 of g3.children) {
          if (g4.id) {
            index[g4.group] = g4.id;
          }
        }
      }
    }
  }

  return index;
};

// Internal node type during build: has _map for O(1) lookup (removed before return)
interface TreeNodeWithMap extends TreeNode {
  _map?: Map<string, TreeNodeWithMap>;
}

// Build lead sheet tree from normalized ETB rows (4-level: group1 → group2 → group3 → group4; totals at leaf)
export const buildLeadSheetTree = (rows: ExtendedTBRow[]): TreeNode[] => {
  const tree: TreeNodeWithMap[] = [];
  let idCounter = 1;
  const normalize = normalizeGroupKey;

  const g1Map = new Map<string, TreeNodeWithMap>();

  for (const row of rows) {
    const parsed = parseClassification(row.classification);
    const grouping1 = row.group1 ?? parsed.grouping1;
    const grouping2 = row.group2 ?? parsed.grouping2;
    const grouping3 = row.group3 ?? parsed.grouping3;
    const grouping4 = row.group4 ?? parsed.grouping4;

    if (!grouping1 || !grouping2 || !grouping3) continue;

    const k1 = normalize(grouping1);
    const k2 = normalize(grouping2);
    const k3 = normalize(grouping3);
    const k4 = normalize(grouping4 ?? "");

    // ---------- grouping1 ----------
    let g1 = g1Map.get(k1);
    if (!g1) {
      g1 = {
        level: "grouping1",
        group: grouping1,
        children: [],
        _map: new Map(),
      };
      g1Map.set(k1, g1);
      tree.push(g1);
    }

    // ---------- grouping2 ----------
    let g2 = g1._map!.get(k2);
    if (!g2) {
      g2 = {
        level: "grouping2",
        group: grouping2,
        children: [],
        _map: new Map(),
      };
      g1._map!.set(k2, g2);
      g1.children.push(g2);
    }

    // ---------- grouping3 ----------
    let g3 = g2._map!.get(k3);
    if (!g3) {
      g3 = {
        level: "grouping3",
        group: grouping3,
        children: [],
        _map: new Map(),
      };
      g2._map!.set(k3, g3);
      g2.children.push(g3);
    }

    // ---------- grouping4 (leaf; totals here) ----------
    const leafKey = k4 || `__unnamed_${idCounter}`;
    let g4 = g3._map!.get(leafKey);
    if (!g4) {
      g4 = {
        level: "grouping4",
        id: `LS_${idCounter++}`,
        group: grouping4 || "",
        children: [],
        totals: {
          currentYear: 0,
          priorYear: 0,
          adjustments: 0,
          reclassification: 0,
          finalBalance: 0,
        },
        rows: [],
      };
      g3._map!.set(leafKey, g4);
      g3.children.push(g4);
    }

    g4.totals!.currentYear += toNumber(row.currentYear);
    g4.totals!.priorYear += toNumber(row.priorYear);
    g4.totals!.adjustments += toNumber(row.adjustments);
    g4.totals!.reclassification += toNumber(row.reClassification);
    g4.totals!.finalBalance += toNumber(row.finalBalance);
    g4.rows!.push(row.id);
  }

  const cleanup = (nodes: TreeNodeWithMap[]): void => {
    for (const n of nodes) {
      delete n._map;
      if (n.children?.length) cleanup(n.children as TreeNodeWithMap[]);
    }
  };
  cleanup(tree);

  return tree;
};

// Find first node in tree (any level) whose group matches name (case-insensitive)
const findNodeByGroup = (nodes: TreeNode[], name: string): TreeNode | null => {
  const n = normalizeGroupKey(name);
  for (const node of nodes) {
    if (normalizeGroupKey(node.group) === n) return node;
    const found = findNodeByGroup(node.children, name);
    if (found) return found;
  }
  return null;
};

// Sum all leaf (g4) totals under a node (only g4 nodes have .totals)
const sumLeavesUnder = (node: TreeNode, field: "priorYear" | "finalBalance"): number => {
  if (node.totals) return node.totals[field] ?? 0;
  let total = 0;
  for (const child of node.children) total += sumLeavesUnder(child, field);
  return total;
};

// Collect all leaf (g4) IDs under a node (for breakdown accounts)
const collectLeafIdsUnder = (node: TreeNode): string[] => {
  if (node.id) return [node.id];
  const ids: string[] = [];
  for (const child of node.children) ids.push(...collectLeafIdsUnder(child));
  return ids;
};

// Result of buildBranchTotals; shared by Income Statement and Balance Sheet for single-scan pipeline.
export type BranchTotals = ReturnType<typeof buildBranchTotals>;

// Single full-tree scan: build priorYear/finalBalance totals and node index for every branch.
// Used by Income Statement and Balance Sheet so the tree is scanned only once.
// Keys are normalized (trim + toLowerCase); duplicate group names accumulate in totals, nodeIndex keeps last node.
export const buildBranchTotals = (tree: TreeNode[]) => {
  const priorYearMap: Record<string, number> = {};
  const finalBalanceMap: Record<string, number> = {};
  const nodeIndex: Record<string, TreeNode> = {};

  const traverse = (node: TreeNode): { priorYear: number; finalBalance: number } => {
    if (!node) return { priorYear: 0, finalBalance: 0 };

    if (!node.children?.length) {
      const priorYear = node.totals?.priorYear ?? 0;
      const finalBalance = node.totals?.finalBalance ?? 0;
      const key = normalizeGroupKey(node.group);
      if (key) {
        priorYearMap[key] = (priorYearMap[key] ?? 0) + priorYear;
        finalBalanceMap[key] = (finalBalanceMap[key] ?? 0) + finalBalance;
        nodeIndex[key] = node;
      }
      return { priorYear, finalBalance };
    }

    let priorYear = 0;
    let finalBalance = 0;
    for (const child of node.children) {
      const sub = traverse(child);
      priorYear += sub.priorYear;
      finalBalance += sub.finalBalance;
    }
    const key = normalizeGroupKey(node.group);
    if (key) {
      priorYearMap[key] = (priorYearMap[key] ?? 0) + priorYear;
      finalBalanceMap[key] = (finalBalanceMap[key] ?? 0) + finalBalance;
      nodeIndex[key] = node;
    }
    return { priorYear, finalBalance };
  };

  for (const root of tree) traverse(root);

  return {
    priorYear: priorYearMap,
    finalBalance: finalBalanceMap,
    nodeIndex,
  };
};

const getBranch = (
  totals: { priorYear: Record<string, number>; finalBalance: Record<string, number> },
  groupName: string,
  field: "priorYear" | "finalBalance"
) => totals[field][normalizeGroupKey(groupName)] ?? 0;

// Derive Income Statement (4-level tree; P&L under "Current Year Profits & Losses" – sum by Level-2 branch).
// Branch names (Revenue, Cost of Sales, Administrative Expenses, etc.) must match classifications.map.ts;
// matching is case-insensitive via normalizeGroupKey.
// Pass branchTotals from buildBranchTotals(tree) to avoid scanning the tree (single-scan pipeline).
export const deriveIncomeStatement = (
  tree: TreeNode[],
  currentYear: number,
  branchTotals?: BranchTotals
) => {
  const priorYear = currentYear - 1;
  const totalsMap = branchTotals ?? buildBranchTotals(tree);
  const { priorYear: priorYearMap, finalBalance: finalBalanceMap, nodeIndex } = totalsMap;
  const totals = { priorYear: priorYearMap, finalBalance: finalBalanceMap };

  const calculate = (field: "priorYear" | "finalBalance") => {
    const revenue = getBranch(totals, "Revenue", field);
    const costOfSales = getBranch(totals, "Cost of Sales", field);
    // Gross profit = revenue minus cost of sales. Use magnitude so it works whether
    // TB stores expenses as negative (debit) or positive; Revenue is expected positive.
    const grossProfit = revenue - Math.abs(costOfSales);

    const salesMarketing = getBranch(totals, "Selling & Marketing Expenses", field);
    const adminExpenses = getBranch(totals, "Administrative Expenses", field);
    const otherOperatingIncome = getBranch(totals, "Other Operating Income", field);
    // Expenses: subtract magnitude so result is correct whether TB stores them negative or positive
    const operatingProfit =
      grossProfit - Math.abs(adminExpenses) - Math.abs(salesMarketing) + otherOperatingIncome;

    const investmentIncome = getBranch(totals, "Investment Income", field);
    const otherGainsLosses = getBranch(totals, "Other Gains/Losses", field);
    const financeCosts = getBranch(totals, "Finance Costs", field);
    const profitBeforeTax =
      operatingProfit + investmentIncome + otherGainsLosses - Math.abs(financeCosts);

    const taxExpense = getBranch(totals, "Taxation", field);
    const net = profitBeforeTax - Math.abs(taxExpense);

    const accountsFor = (groupName: string) => {
      const node = nodeIndex[normalizeGroupKey(groupName)] ?? findNodeByGroup(tree, groupName);
      return node ? collectLeafIdsUnder(node) : [];
    };

    const breakdowns: Record<string, { value: number; accounts: string[] }> = {
      Revenue: { value: Math.abs(revenue), accounts: accountsFor("Revenue") },
      "Cost of sales": { value: Math.abs(costOfSales), accounts: accountsFor("Cost of Sales") },
      "Sales and marketing expenses": {
        value: Math.abs(salesMarketing),
        accounts: accountsFor("Selling & Marketing Expenses"),
      },
      "Administrative expenses": {
        value: Math.abs(adminExpenses),
        accounts: accountsFor("Administrative Expenses"),
      },
      "Other operating income": {
        value: Math.abs(otherOperatingIncome),
        accounts: accountsFor("Other Operating Income"),
      },
      "Investment income": {
        value: Math.abs(investmentIncome),
        accounts: accountsFor("Investment Income"),
      },
      "Other Gains/Losses": {
        value: Math.abs(otherGainsLosses),
        accounts: accountsFor("Other Gains/Losses"),
      },
      "Finance costs": {
        value: Math.abs(financeCosts),
        accounts: accountsFor("Finance Costs"),
      },
      "Income tax expense": {
        value: Math.abs(taxExpense),
        accounts: accountsFor("Taxation"),
      },
    };

    return {
      net_result: net,
      resultType: net >= 0 ? ("net_profit" as const) : ("net_loss" as const),
      breakdowns,
    };
  };

  return {
    prior_year: {
      year: priorYear,
      ...calculate("priorYear"),
    },
    current_year: {
      year: currentYear,
      ...calculate("finalBalance"),
    },
  };
};

// Derive Retained Earnings (new structure: Equity > Retained Earnings > Accumulated Profits > Retained Earnings B/F)
export const deriveRetainedEarnings = (
  tree: TreeNode[],
  incomeStatement: ReturnType<typeof deriveIncomeStatement>,
  currentYear: number
) => {
  const priorYear = currentYear - 1;

  const equity = tree.find((n) => normalizeGroupKey(n.group) === normalizeGroupKey("Equity"));
  const retainedEarnings = equity?.children.find(
    (n) => normalizeGroupKey(n.group) === normalizeGroupKey("Retained Earnings")
  );
  const accumulatedProfits = retainedEarnings?.children.find(
    (n) => normalizeGroupKey(n.group) === normalizeGroupKey("Accumulated Profits")
  );

  let priorValue = 0;
  if (accumulatedProfits?.children) {
    for (const g4 of accumulatedProfits.children) {
      if (normalizeGroupKey(g4.group) === normalizeGroupKey("Retained Earnings B/F")) {
        priorValue += g4.totals?.priorYear || 0;
        break;
      }
    }
  }

  const net = incomeStatement.current_year.net_result;

  return {
    prior_year: { year: priorYear, value: priorValue },
    current_year: {
      year: currentYear,
      value: priorValue + net,
    },
  };
};

// Collect group accounts (4-level tree; skip by grouping2, grouping3, or grouping4)
export const collectGroupAccounts = (
  tree: TreeNode[],
  groupName: string,
  skip: { grouping2?: string[]; grouping3?: string[]; grouping4?: string[] } = {}
): string[] => {
  const node = tree.find((n) => normalizeGroupKey(n.group) === normalizeGroupKey(groupName));
  if (!node) return [];

  const ids: string[] = [];

  for (const g2 of node.children) {
    if (skip.grouping2?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g2.group))) continue;

    for (const g3 of g2.children) {
      if (skip.grouping3?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g3.group))) continue;

      for (const g4 of g3.children) {
        if (skip.grouping4?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g4.group))) continue;
        if (g4.id) ids.push(g4.id);
      }
    }
  }

  return ids;
};

// Derive Balance Sheet (4-level tree; Equity excludes "Current Year Profit / Loss" and adds retained earnings).
// Pass branchTotals from buildBranchTotals(tree) to use map lookups instead of tree traversal (single-scan pipeline).
export const deriveBalanceSheet = (
  tree: TreeNode[],
  retainedEarnings: ReturnType<typeof deriveRetainedEarnings>,
  currentYear: number,
  branchTotals?: BranchTotals
) => {
  const priorYear = currentYear - 1;

  const key = normalizeGroupKey;
  // Normalized key so map lookup matches buildBranchTotals (avoids undefined from spacing/case)
  const currentYearProfitLossKey = key("Current Year Profit / Loss");

  let assetsCY: number;
  let liabilitiesCY: number;
  let equityCY: number;
  let assetsPY: number;
  let liabilitiesPY: number;
  let equityPY: number;

  if (branchTotals) {
    const py = branchTotals.priorYear;
    const cy = branchTotals.finalBalance;
    assetsCY = cy[key("Assets")] ?? 0;
    liabilitiesCY = cy[key("Liabilities")] ?? 0;
    assetsPY = py[key("Assets")] ?? 0;
    liabilitiesPY = py[key("Liabilities")] ?? 0;
    const equityFromTreeCY = cy[key("Equity")] ?? 0;
    const equityFromTreePY = py[key("Equity")] ?? 0;
    const currentYearProfitLossCY = cy[currentYearProfitLossKey] ?? 0;
    const currentYearProfitLossPY = py[currentYearProfitLossKey] ?? 0;
    equityCY = equityFromTreeCY - currentYearProfitLossCY + retainedEarnings.current_year.value;
    equityPY = equityFromTreePY - currentYearProfitLossPY + retainedEarnings.prior_year.value;
  } else {
    const sum = (
      group: string,
      field: "priorYear" | "finalBalance",
      skip: { grouping2?: string[]; grouping3?: string[]; grouping4?: string[] } = {}
    ) => {
      const node = tree.find((n) => normalizeGroupKey(n.group) === normalizeGroupKey(group));
      if (!node) return 0;
      let total = 0;
      for (const g2 of node.children) {
        if (skip.grouping2?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g2.group))) continue;
        for (const g3 of g2.children) {
          if (skip.grouping3?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g3.group))) continue;
          for (const g4 of g3.children) {
            if (skip.grouping4?.some((s) => normalizeGroupKey(s) === normalizeGroupKey(g4.group))) continue;
            total += g4.totals?.[field] || 0;
          }
        }
      }
      return total;
    };
    assetsCY = sum("Assets", "finalBalance");
    liabilitiesCY = sum("Liabilities", "finalBalance");
    equityCY =
      sum("Equity", "finalBalance", { grouping4: ["Current Year Profit / Loss"] }) +
      retainedEarnings.current_year.value;
    assetsPY = sum("Assets", "priorYear");
    liabilitiesPY = sum("Liabilities", "priorYear");
    equityPY =
      sum("Equity", "priorYear", { grouping4: ["Current Year Profit / Loss"] }) +
      retainedEarnings.prior_year.value;
  }

  const totalAssetsCY = assetsCY;
  const totalEquityAndLiabilitiesCY = equityCY + liabilitiesCY;
  const totalAssetsPY = assetsPY;
  const totalEquityAndLiabilitiesPY = equityPY + liabilitiesPY;

  const equityAccountsSkip = { grouping4: ["Current Year Profit / Loss"] };

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
          accounts: collectGroupAccounts(tree, "Equity", equityAccountsSkip),
        },
        total_assets: {
          value: totalAssetsPY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        total_equity_and_liabilities: {
          value: totalEquityAndLiabilitiesPY,
          accounts: [
            ...collectGroupAccounts(tree, "Equity", equityAccountsSkip),
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
          accounts: collectGroupAccounts(tree, "Equity", equityAccountsSkip),
        },
        total_assets: {
          value: totalAssetsCY,
          accounts: collectGroupAccounts(tree, "Assets"),
        },
        total_equity_and_liabilities: {
          value: totalEquityAndLiabilitiesCY,
          accounts: [
            ...collectGroupAccounts(tree, "Equity", equityAccountsSkip),
            ...collectGroupAccounts(tree, "Liabilities"),
          ],
        },
      },
      balanced: Math.abs(assetsCY - (liabilitiesCY + equityCY)) < 1,
    },
  };
};

// Main export: one tree scan (buildBranchTotals) feeds both Income Statement and Balance Sheet.
export const extractETBData = (etbRows: ExtendedTBRow[], year: number) => {
  const normalized = normalizeETB(etbRows);
  const leadSheets = buildLeadSheetTree(normalized);
  const branchTotals = buildBranchTotals(leadSheets);
  const incomeStatement = deriveIncomeStatement(leadSheets, year, branchTotals);
  const retainedEarnings = deriveRetainedEarnings(leadSheets, incomeStatement, year);
  const balanceSheet = deriveBalanceSheet(leadSheets, retainedEarnings, year, branchTotals);

  return {
    lead_sheets: leadSheets,
    income_statement: incomeStatement,
    balance_sheet: balanceSheet,
    normalized_rows: normalized,
  };
};

