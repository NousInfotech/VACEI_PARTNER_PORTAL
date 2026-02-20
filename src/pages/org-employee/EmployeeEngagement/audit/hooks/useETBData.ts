import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";
import type { ExtendedTBRow } from "../extended-tb/data";
import { extractETBData } from "../utils/etbDataProcessor";

interface TrialBalanceWithAccountsResponse {
  data: {
    trialBalance: {
      id: string;
      year: number;
      auditCycleId: string;
      role: string;
      version: number;
    };
    accounts: Array<{
      id: string;
      code: string;
      accountName: string;
      currentYear: number | '-';
      priorYear: number | '-';
      adjustmentAmount: number;
      reclassificationAmount: number;
      finalBalance: number;
      auditEntries: Array<{
        id: string;
        auditEntryType: 'ADJUSTMENT' | 'RECLASSIFICATION';
        value: number;
      }>;
      group1: string | null;
      group2: string | null;
      group3: string | null;
      group4: string | null;
    }>;
  };
}

/**
 * Hook to fetch and process Extended Trial Balance data
 * Returns normalized ETB rows and processed financial reports
 */
export const useETBData = (engagementId?: string) => {
  // Fetch audit cycles
  const { data: auditCyclesData, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['audit-cycles-by-engagement', engagementId],
    queryFn: () => apiGet<any>(endPoints.AUDIT.GET_CYCLES, { engagementId: engagementId! }),
    enabled: !!engagementId,
  });

  const auditCycles = auditCyclesData?.data || auditCyclesData || [];
  const auditCycle = Array.isArray(auditCycles) ? auditCycles[0] : null;
  const auditCycleId = auditCycle?.id;

  // Fetch trial balances
  const { data: trialBalancesData, isLoading: isLoadingTrialBalances } = useQuery({
    queryKey: ['trial-balances', auditCycleId],
    queryFn: () => apiGet<any>(endPoints.AUDIT.GET_TRIAL_BALANCES(auditCycleId!)),
    enabled: !!auditCycleId,
  });

  const trialBalances = trialBalancesData?.data || trialBalancesData || [];
  const trialBalanceList = Array.isArray(trialBalances) ? trialBalances : [];
  const currentTrialBalance = trialBalanceList.find((tb: any) => tb.role === 'CURRENT') || trialBalanceList[0];
  const trialBalanceId = currentTrialBalance?.id;

  // Fetch trial balance with accounts
  const { data: trialBalanceWithAccountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['trial-balance-with-accounts', auditCycleId, trialBalanceId],
    queryFn: () => apiGet<TrialBalanceWithAccountsResponse>(
      endPoints.AUDIT.GET_TRIAL_BALANCE_WITH_ACCOUNTS(auditCycleId!, trialBalanceId!)
    ),
    enabled: !!auditCycleId && !!trialBalanceId,
  });

  // Process the data
  const processedData = React.useMemo(() => {
    // API response structure: { data: { accounts: [...], trialBalance: {...} } }
    if (!trialBalanceWithAccountsData?.data?.accounts) {
      return null;
    }

    const accounts = trialBalanceWithAccountsData.data.accounts;
    const currentYear = trialBalanceWithAccountsData.data.trialBalance.year;

    // Map backend data to ExtendedTBRow format
    const etbRows: ExtendedTBRow[] = accounts.map((account: any, index: number) => {
      const parseAmount = (value: any): number => {
        if (value === null || value === undefined || value === '-') return 0;
        if (typeof value === 'number') return value;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? 0 : parsed;
      };

      const currentYearVal = parseAmount(account.currentYear);
      const priorYearVal = parseAmount(account.priorYear);
      const adjustments = parseAmount(account.adjustmentAmount);
      const reClassification = parseAmount(account.reclassificationAmount);
      const finalBalance = parseAmount(account.finalBalance);

      // Build classification from groups
      const classificationParts = [
        account.group1,
        account.group2,
        account.group3,
        account.group4
      ].filter(Boolean);
      const classification = classificationParts.join(' > ') || '';

      return {
        id: index + 1,
        code: account.code || '',
        accountName: account.accountName || '',
        currentYear: currentYearVal,
        reClassification,
        adjustments,
        finalBalance,
        priorYear: priorYearVal,
        classification,
        group1: account.group1 || null,
        group2: account.group2 || null,
        group3: account.group3 || null,
        group4: account.group4 || null,
        accountId: account.id,
        actions: [],
        linkedFiles: []
      };
    });

    // Process the data
    const processed = extractETBData(etbRows, currentYear);

    return {
      etbRows,
      normalizedRows: processed.normalized_rows,
      leadSheets: processed.lead_sheets,
      incomeStatement: processed.income_statement,
      balanceSheet: processed.balance_sheet,
      currentYear,
      trialBalanceId,
      auditCycleId,
      // Include raw accounts with audit entries for Adjustments/Reclassifications
      rawAccounts: accounts,
    };
  }, [trialBalanceWithAccountsData, trialBalanceId, auditCycleId]);

  const isLoading = isLoadingCycles || isLoadingTrialBalances || isLoadingAccounts;

  return {
    data: processedData,
    isLoading,
    trialBalanceId,
    auditCycleId,
    currentYear: processedData?.currentYear,
  };
};

