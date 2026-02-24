import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookMarked,
  Calendar,
  Plus,
  LayoutDashboard,
  FileText,
  ListTree,
  RefreshCw,
  Pencil,
  Trash2,
  Receipt,
  BookOpen,
  Repeat,
  BarChart2,
  Eye,
  Landmark,
  History,
  Percent,
  Wallet,
} from 'lucide-react';
import PillTab from '../../../common/PillTab';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Button } from '../../../../ui/Button';
import { Skeleton } from '../../../../ui/Skeleton';
import { useAuth } from '../../../../context/auth-context-core';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../../ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/Table';

import { CYCLE_STATUSES, TRANSACTION_TYPES, TABLE_WRAPPER_CLASS, TABLE_HEADER_ROW_CLASS } from './constants';
import type { AccountingCycle, AccountingTransaction, ChartAccount, QBReportRow } from './types';
import { TableSkeleton, useTableState, TablePagination, SearchAndDateFilter } from './common';
import { SyncHistoryTab, InvoicesTab, BillsTab, AgingTab } from './tabs';
import { flattenReportRows, currencyCodeFromRef } from './utils';

const ACCOUNTING_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'chart-of-accounts', label: 'Chart of accounts', icon: ListTree },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'recurring-expenses', label: 'Recurring expenses', icon: Repeat },
  { id: 'bank-accounts', label: 'Bank accounts', icon: Landmark },
  { id: 'ap-ar-aging', label: 'AP/AR Aging', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'sync-history', label: 'Sync history', icon: History },
  { id: 'tax', label: 'Tax', icon: Percent },
];

interface AccountingContentProps {
  engagementId?: string;
  companyId?: string;
}

export default function AccountingContent({ engagementId, companyId }: AccountingContentProps) {
  const { user, organizationMember } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AccountingTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [transactionFormError, setTransactionFormError] = useState<string | null>(null);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [invoiceFormError, setInvoiceFormError] = useState<string | null>(null);
  const [billFormError, setBillFormError] = useState<string | null>(null);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [billSubmitting, setBillSubmitting] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer: '',
    docNumber: '',
    txnDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    totalAmount: '',
    currency: 'USD',
    description: '',
    lineItems: [{ chartAccountId: '', amount: '', description: '' }],
  });
  const [billForm, setBillForm] = useState({
    vendor: '',
    docNumber: '',
    txnDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    totalAmount: '',
    currency: 'USD',
    description: '',
    lineItems: [{ chartAccountId: '', amount: '', description: '' }],
  });
  const [txForm, setTxForm] = useState<{
    type: string;
    txnDate: string;
    dueDate: string;
    totalAmount: string;
    taxAmount: string;
    currency: string;
    vendor: string;
    customer: string;
    docNumber: string;
    description: string;
    lineItems: { chartAccountId: string; amount: string; description: string }[];
  }>({
    type: 'EXPENSE',
    txnDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    totalAmount: '',
    taxAmount: '',
    currency: 'USD',
    vendor: '',
    customer: '',
    docNumber: '',
    description: '',
    lineItems: [{ chartAccountId: '', amount: '', description: '' }],
  });
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [editPeriodStart, setEditPeriodStart] = useState('');
  const [editPeriodEnd, setEditPeriodEnd] = useState('');
  const [editPeriodSubmitting, setEditPeriodSubmitting] = useState(false);
  const [editPeriodError, setEditPeriodError] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Record<string, unknown> | null>(null);
  const [viewBill, setViewBill] = useState<Record<string, unknown> | null>(null);
  const [viewJournalId, setViewJournalId] = useState<string | null>(null);
  const [mapInvoiceLoading, setMapInvoiceLoading] = useState<string | null>(null);
  const [mapBillLoading, setMapBillLoading] = useState<string | null>(null);

  const { data: qbAvailableResponse } = useQuery({
    queryKey: ['quickbooks-available', companyId],
    enabled: !!companyId,
    queryFn: () =>
      apiGet<{ data: { available: boolean } }>(
        endPoints.ACCOUNTING.QUICKBOOKS_AVAILABLE(companyId!)
      ),
  });
  const quickbooksAvailable = qbAvailableResponse?.data?.available ?? false;

  const isOrgAdmin =
    user?.role === 'ORG_ADMIN' ||
    organizationMember?.role === 'ORG_ADMIN' ||
    (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'ORG_ADMIN');

  const {
    data: cycleResponse,
    isLoading: cycleLoading,
    isError: cycleError,
  } = useQuery({
    queryKey: ['accounting-cycle', engagementId],
    enabled: !!engagementId,
    retry: false,
    queryFn: async () => {
      if (!engagementId) return null;
      try {
        const res = await apiGet<{ data: AccountingCycle }>(
          endPoints.ACCOUNTING.GET_BY_ENGAGEMENT_ID(engagementId)
        );
        return res;
      } catch (e: unknown) {
        const err = e as { response?: { status?: number }; status?: number };
        if (err?.response?.status === 404 || err?.status === 404) {
          return { data: null };
        }
        throw e;
      }
    },
  });

  const cycle = cycleResponse?.data ?? null;
  const hasCycle = !!cycle && typeof cycle === 'object' && 'id' in cycle;
  const cycleId = cycle?.id;
  const cycleCompanyId = cycle?.companyId;

  const {
    data: transactionsResponse,
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useQuery({
    queryKey: ['accounting-transactions', cycleId],
    enabled: !!cycleId && activeTab === 'transactions',
    retry: false,
    queryFn: async () => {
      if (!cycleId) return { data: [], forbidden: false };
      try {
        const res = await apiGet<{ data: AccountingTransaction[] }>(
          endPoints.ACCOUNTING.TRANSACTIONS_BY_CYCLE(cycleId)
        );
        return { data: res?.data ?? [], forbidden: false };
      } catch (e: unknown) {
        const err = e as { response?: { status?: number }; status?: number };
        if (err?.response?.status === 403 || err?.status === 403) {
          return { data: [], forbidden: true };
        }
        throw e;
      }
    },
  });

  const transactionsForbidden = transactionsResponse?.forbidden ?? false;
  const transactions = transactionsResponse?.data ?? [];

  const { data: chartAccountsResponse, isLoading: chartAccountsLoading } = useQuery({
    queryKey: ['chart-of-accounts', cycleCompanyId],
    enabled: !!cycleCompanyId && (activeTab === 'chart-of-accounts' || isTransactionModalOpen || isCreateInvoiceModalOpen || isCreateBillModalOpen),
    queryFn: () =>
      apiGet<{ data: ChartAccount[] }>(
        endPoints.ACCOUNTING.CHART_OF_ACCOUNTS(cycleCompanyId!)
      ),
  });
  const chartAccounts = chartAccountsResponse?.data ?? [];

  const chartAccountsTableState = useTableState({
    data: chartAccounts,
    pageSize: 10,
    searchKeys: ['code', 'name', 'classification', 'accountType'],
  });

  const qbCompanyId = cycleCompanyId ?? companyId;
  const { data: qbInvoicesResponse, isLoading: qbInvoicesLoading } = useQuery({
    queryKey: ['qb-invoices', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'invoices',
    queryFn: () =>
      apiGet<{ data: unknown[] }>(endPoints.QUICKBOOKS.INVOICES(qbCompanyId!)),
  });
  const qbInvoices = (qbInvoicesResponse?.data ?? []) as Array<{
    Id?: string;
    DocNumber?: string;
    TxnDate?: string;
    DueDate?: string;
    TotalAmt?: number;
    Balance?: number;
    CustomerRef?: { name?: string };
  }>;

  const { data: qbInvoiceStatsResponse } = useQuery({
    queryKey: ['qb-invoice-stats', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'invoices',
    queryFn: () =>
      apiGet<{ data: { total?: number; outstanding?: number; count?: number } }>(
        endPoints.QUICKBOOKS.INVOICE_STATS(qbCompanyId!)
      ),
  });
  const qbInvoiceStats = qbInvoiceStatsResponse?.data;

  const { data: qbBillsResponse, isLoading: qbBillsLoading } = useQuery({
    queryKey: ['qb-bills', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'bills',
    queryFn: () =>
      apiGet<{ data: unknown[] }>(endPoints.QUICKBOOKS.BILLS(qbCompanyId!)),
  });
  const qbBills = (qbBillsResponse?.data ?? []) as Array<{
    Id?: string;
    DocNumber?: string;
    TxnDate?: string;
    DueDate?: string;
    TotalAmt?: number;
    VendorRef?: { name?: string };
  }>;

  const { data: qbJournalResponse, isLoading: qbJournalLoading } = useQuery({
    queryKey: ['qb-journal', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'journal',
    queryFn: () =>
      apiGet<{ data: unknown[] }>(endPoints.QUICKBOOKS.JOURNAL(qbCompanyId!)),
  });
  const qbJournal = (qbJournalResponse?.data ?? []) as Array<{
    Id?: string;
    TxnDate?: string;
    TotalAmt?: number;
    PrivateNote?: string;
  }>;

  const { data: qbRecurringResponse, isLoading: qbRecurringLoading } = useQuery({
    queryKey: ['qb-recurring-expenses', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'recurring-expenses',
    queryFn: () =>
      apiGet<{ data: unknown[] }>(endPoints.QUICKBOOKS.RECURRING_EXPENSES(qbCompanyId!)),
  });
  const qbRecurring = (qbRecurringResponse?.data ?? []) as Array<{
    vendorName?: string;
    vendorId?: string;
    totalAmount?: number;
    TotalAmt?: number;
    transactions?: unknown[];
    VendorRef?: { name?: string };
  }>;

  const { data: qbReportsResponse, isLoading: qbReportsLoading } = useQuery({
    queryKey: ['qb-reports-dashboard', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'reports',
    queryFn: () =>
      apiGet<{ data: { balanceSheet?: unknown; profitLoss?: unknown; cashFlow?: unknown } }>(
        endPoints.QUICKBOOKS.REPORTS_DASHBOARD(qbCompanyId!)
      ),
  });
  const qbReportsDashboard = qbReportsResponse?.data;

  const { data: qbBankAccountsResponse, isLoading: qbBankAccountsLoading } = useQuery({
    queryKey: ['qb-bank-accounts', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'bank-accounts',
    queryFn: () =>
      apiGet<{ data: unknown[] }>(endPoints.QUICKBOOKS.BANK_ACCOUNTS(qbCompanyId!)),
  });
  const qbBankAccounts = (qbBankAccountsResponse?.data ?? []) as Array<{
    Id?: string;
    Name?: string;
    AccountType?: string;
    AccountSubType?: string;
    Balance?: number;
    CurrencyRef?: { value?: string };
  }>;

  const { data: journalItemsResponse, isLoading: journalItemsLoading } = useQuery({
    queryKey: ['qb-journal-items', viewJournalId],
    enabled: !!qbCompanyId && !!viewJournalId,
    queryFn: () =>
      apiGet<{ data: unknown }>(
        endPoints.QUICKBOOKS.JOURNAL_ITEMS(qbCompanyId!, viewJournalId!)
      ),
  });
  // Backend returns { lineItems: JournalEntryLine[] }; fallback for legacy full JournalEntry
  type JournalLineItem = {
    Description?: string;
    Amount?: number;
    AccountRef?: { name?: string };
    JournalEntryLineDetail?: { AccountRef?: { name?: string } };
  };
  const rawJournalData = journalItemsResponse?.data;
  const journalLineItems: JournalLineItem[] =
    (rawJournalData && typeof rawJournalData === 'object' && Array.isArray((rawJournalData as { lineItems?: unknown[] }).lineItems))
      ? ((rawJournalData as { lineItems: JournalLineItem[] }).lineItems)
      : Array.isArray(rawJournalData)
        ? rawJournalData
        : (rawJournalData && typeof rawJournalData === 'object' && Array.isArray((rawJournalData as { Line?: unknown[] }).Line)
            ? ((rawJournalData as { Line: JournalLineItem[] }).Line)
            : []);

  const { data: syncHistoryResponse, isLoading: syncHistoryLoading } = useQuery({
    queryKey: ['qb-sync-history', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'sync-history',
    queryFn: () =>
      apiGet<{ data: Array<{
        id: string;
        syncStartTime: string;
        syncEndTime: string | null;
        status: number;
        syncMessage: string | null;
        syncedEntities: Record<string, number> | null;
      }> }>(endPoints.QUICKBOOKS.SYNC_HISTORY(qbCompanyId!)),
  });
  const syncHistoryList = syncHistoryResponse?.data ?? [];

  const { data: agingSyncedResponse, isLoading: agingSyncedLoading } = useQuery({
    queryKey: ['aging-synced', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'ap-ar-aging',
    queryFn: () =>
      apiGet<{ data: { ap: Record<string, unknown> | null; ar: Record<string, unknown> | null } }>(
        endPoints.QUICKBOOKS.AGING_SYNCED(qbCompanyId!)
      ),
  });
  const agingSyncedData = agingSyncedResponse?.data ?? { ap: null, ar: null };

  const { data: taxEntityResponse, isLoading: taxEntityLoading } = useQuery({
    queryKey: ['qb-tax-entity', qbCompanyId],
    enabled: !!qbCompanyId && quickbooksAvailable && activeTab === 'tax',
    queryFn: () =>
      apiGet<{ data: { jsonData?: Record<string, unknown>; entityType?: string } | null }>(
        endPoints.QUICKBOOKS.TAX_ENTITY(qbCompanyId!)
      ),
  });
  const taxEntity = taxEntityResponse?.data ?? null;

  const handleCreateCycle = async () => {
    if (!engagementId) return;
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const payload: { engagementId: string; periodStart?: string; periodEnd?: string } = {
        engagementId,
      };
      if (periodStart) payload.periodStart = new Date(periodStart).toISOString();
      if (periodEnd) payload.periodEnd = new Date(periodEnd).toISOString();
      await apiPost(endPoints.ACCOUNTING.CREATE_CYCLE, payload);
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      setIsCreateModalOpen(false);
      setPeriodStart('');
      setPeriodEnd('');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setCreateError(err?.message ?? 'Failed to create accounting cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setCreateError(null);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodStart(firstDay.toISOString().slice(0, 10));
    setPeriodEnd(lastDay.toISOString().slice(0, 10));
    setIsCreateModalOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!cycleId || !engagementId) return;
    setStatusUpdateError(null);
    setStatusUpdateLoading(true);
    try {
      await apiPatch(endPoints.ACCOUNTING.UPDATE_STATUS(cycleId), { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setStatusUpdateError(err?.message ?? 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const openEditPeriodModal = () => {
    setEditPeriodError(null);
    if (cycle?.periodStart) setEditPeriodStart(new Date(cycle.periodStart).toISOString().slice(0, 10));
    else setEditPeriodStart('');
    if (cycle?.periodEnd) setEditPeriodEnd(new Date(cycle.periodEnd).toISOString().slice(0, 10));
    else setEditPeriodEnd('');
    setIsEditPeriodOpen(true);
  };

  const handleUpdatePeriod = async () => {
    if (!cycleId || !cycleCompanyId) return;
    setEditPeriodError(null);
    setEditPeriodSubmitting(true);
    try {
      const payload: { periodStart?: string; periodEnd?: string } = {};
      if (editPeriodStart) payload.periodStart = new Date(editPeriodStart).toISOString();
      if (editPeriodEnd) payload.periodEnd = new Date(editPeriodEnd).toISOString();
      await apiPatch(endPoints.ACCOUNTING.UPDATE_CYCLE(cycleId), payload);
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      setIsEditPeriodOpen(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setEditPeriodError(err?.message ?? 'Failed to update period');
    } finally {
      setEditPeriodSubmitting(false);
    }
  };

  const handleMapInvoiceToTransaction = async (qbInvoiceId: string) => {
    if (!cycleCompanyId || !cycleId) return;
    setMapInvoiceLoading(qbInvoiceId);
    try {
      await apiPost(
        endPoints.ACCOUNTING.MAP_INVOICE_TO_TRANSACTION(cycleCompanyId, qbInvoiceId),
        { accountingCycleId: cycleId }
      );
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err?.message ?? 'Failed to link invoice to transaction');
    } finally {
      setMapInvoiceLoading(null);
    }
  };

  const handleMapBillToTransaction = async (qbBillId: string) => {
    if (!cycleCompanyId || !cycleId) return;
    setMapBillLoading(qbBillId);
    try {
      await apiPost(
        endPoints.ACCOUNTING.MAP_BILL_TO_TRANSACTION(cycleCompanyId, qbBillId),
        { accountingCycleId: cycleId }
      );
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err?.message ?? 'Failed to link bill to transaction');
    } finally {
      setMapBillLoading(null);
    }
  };

  const handleSyncFromQB = async () => {
    if (!cycleCompanyId || !engagementId || !cycleId) return;
    setSyncError(null);
    setSyncLoading(true);
    try {
      await apiPost(endPoints.ACCOUNTING.IMPORT_SYNC_ALL(cycleCompanyId));
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts', cycleCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['qb-sync-history', cycleCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['aging-synced', cycleCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['qb-bank-accounts', cycleCompanyId] });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setSyncError(err?.message ?? 'Sync failed');
    } finally {
      setSyncLoading(false);
    }
  };

  const openTransactionModal = (txn?: AccountingTransaction | null) => {
    setTransactionFormError(null);
    if (txn) {
      setEditingTransaction(txn);
      setTxForm({
        type: txn.type,
        txnDate: txn.txnDate ? new Date(txn.txnDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        dueDate: txn.dueDate ? new Date(txn.dueDate).toISOString().slice(0, 10) : '',
        totalAmount: String(txn.totalAmount ?? ''),
        taxAmount: txn.taxAmount != null ? String(txn.taxAmount) : '',
        currency: txn.currency ?? 'USD',
        vendor: txn.vendor ?? '',
        customer: txn.customer ?? '',
        docNumber: txn.docNumber ?? '',
        description: txn.description ?? '',
        lineItems:
          txn.lineItems?.length > 0
            ? txn.lineItems.map((li) => ({
                chartAccountId: li.chartAccountId,
                amount: String(li.amount),
                description: li.description ?? '',
              }))
            : [{ chartAccountId: '', amount: '', description: '' }],
      });
    } else {
      setEditingTransaction(null);
      setTxForm({
        type: 'EXPENSE',
        txnDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        totalAmount: '',
        taxAmount: '',
        currency: 'USD',
        vendor: '',
        customer: '',
        docNumber: '',
        description: '',
        lineItems: [{ chartAccountId: '', amount: '', description: '' }],
      });
    }
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(false);
    setTransactionFormError(null);
  };

  const addLineItem = () => {
    setTxForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { chartAccountId: '', amount: '', description: '' }],
    }));
  };

  const updateLineItem = (index: number, field: 'chartAccountId' | 'amount' | 'description', value: string) => {
    setTxForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li, i) =>
        i === index ? { ...li, [field]: value } : li
      ),
    }));
  };

  const removeLineItem = (index: number) => {
    setTxForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index).length > 0
        ? prev.lineItems.filter((_, i) => i !== index)
        : [{ chartAccountId: '', amount: '', description: '' }],
    }));
  };

  const handleSubmitTransaction = async () => {
    if (!cycleId || !engagementId) return;
    setTransactionFormError(null);
    const totalNum = parseFloat(txForm.totalAmount);
    if (isNaN(totalNum) || txForm.lineItems.some((li) => !li.chartAccountId || li.amount === '')) {
      setTransactionFormError('Please fill required fields: type, date, total amount, and at least one line item with account and amount.');
      return;
    }
    const lineItems = txForm.lineItems
      .filter((li) => li.chartAccountId && li.amount !== '')
      .map((li) => ({
        chartAccountId: li.chartAccountId,
        amount: parseFloat(li.amount) || 0,
        description: li.description || undefined,
      }));
    if (lineItems.length === 0) {
      setTransactionFormError('At least one line item with account and amount is required.');
      return;
    }
    setTransactionSubmitting(true);
    try {
      const payload = {
        type: txForm.type,
        txnDate: new Date(txForm.txnDate).toISOString(),
        totalAmount: totalNum,
        currency: txForm.currency,
        vendor: txForm.vendor || undefined,
        customer: txForm.customer || undefined,
        docNumber: txForm.docNumber || undefined,
        description: txForm.description || undefined,
        dueDate: txForm.dueDate ? new Date(txForm.dueDate).toISOString() : undefined,
        taxAmount: txForm.taxAmount ? parseFloat(txForm.taxAmount) : undefined,
        lineItems,
      };
      if (editingTransaction) {
        await apiPatch(
          endPoints.ACCOUNTING.UPDATE_TRANSACTION(cycleId, editingTransaction.id),
          payload
        );
      } else {
        await apiPost(endPoints.ACCOUNTING.CREATE_TRANSACTION(cycleId), payload);
      }
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      closeTransactionModal();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setTransactionFormError(err?.message ?? 'Failed to save transaction');
    } finally {
      setTransactionSubmitting(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!qbCompanyId || !cycleId) return;
    setInvoiceFormError(null);
    const totalNum = parseFloat(invoiceForm.totalAmount);
    if (isNaN(totalNum) || invoiceForm.lineItems.some((li) => !li.chartAccountId || li.amount === '')) {
      setInvoiceFormError('Fill required fields: date, total amount, and at least one line item (account + amount).');
      return;
    }
    const lineItems = invoiceForm.lineItems
      .filter((li) => li.chartAccountId && li.amount !== '')
      .map((li) => ({
        chartAccountId: li.chartAccountId,
        amount: parseFloat(li.amount) || 0,
        description: li.description || undefined,
      }));
    if (lineItems.length === 0) {
      setInvoiceFormError('At least one line item with account and amount is required.');
      return;
    }
    setInvoiceSubmitting(true);
    try {
      await apiPost(endPoints.QUICKBOOKS.CREATE_INVOICE(qbCompanyId), {
        accountingCycleId: cycleId,
        type: 'INVOICE',
        customer: invoiceForm.customer || undefined,
        docNumber: invoiceForm.docNumber || undefined,
        txnDate: new Date(invoiceForm.txnDate).toISOString(),
        dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toISOString() : undefined,
        totalAmount: totalNum,
        currency: invoiceForm.currency,
        description: invoiceForm.description || undefined,
        lineItems,
      });
      queryClient.invalidateQueries({ queryKey: ['qb-invoices', qbCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['qb-invoice-stats', qbCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      setIsCreateInvoiceModalOpen(false);
      setInvoiceForm({
        customer: '',
        docNumber: '',
        txnDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        totalAmount: '',
        currency: 'USD',
        description: '',
        lineItems: [{ chartAccountId: '', amount: '', description: '' }],
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setInvoiceFormError(err?.message ?? 'Failed to create invoice');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const addInvoiceLineItem = () => {
    setInvoiceForm((p) => ({
      ...p,
      lineItems: [...p.lineItems, { chartAccountId: '', amount: '', description: '' }],
    }));
  };
  const updateInvoiceLineItem = (index: number, field: 'chartAccountId' | 'amount' | 'description', value: string) => {
    setInvoiceForm((p) => ({
      ...p,
      lineItems: p.lineItems.map((li, i) => (i === index ? { ...li, [field]: value } : li)),
    }));
  };
  const removeInvoiceLineItem = (index: number) => {
    setInvoiceForm((p) => ({
      ...p,
      lineItems: p.lineItems.length > 1 ? p.lineItems.filter((_, i) => i !== index) : [{ chartAccountId: '', amount: '', description: '' }],
    }));
  };
  const addBillLineItem = () => {
    setBillForm((p) => ({
      ...p,
      lineItems: [...p.lineItems, { chartAccountId: '', amount: '', description: '' }],
    }));
  };
  const updateBillLineItem = (index: number, field: 'chartAccountId' | 'amount' | 'description', value: string) => {
    setBillForm((p) => ({
      ...p,
      lineItems: p.lineItems.map((li, i) => (i === index ? { ...li, [field]: value } : li)),
    }));
  };
  const removeBillLineItem = (index: number) => {
    setBillForm((p) => ({
      ...p,
      lineItems: p.lineItems.length > 1 ? p.lineItems.filter((_, i) => i !== index) : [{ chartAccountId: '', amount: '', description: '' }],
    }));
  };

  const handleCreateBill = async () => {
    if (!qbCompanyId || !cycleId) return;
    setBillFormError(null);
    const totalNum = parseFloat(billForm.totalAmount);
    if (isNaN(totalNum) || billForm.lineItems.some((li) => !li.chartAccountId || li.amount === '')) {
      setBillFormError('Fill required fields: date, total amount, and at least one line item (account + amount).');
      return;
    }
    const lineItems = billForm.lineItems
      .filter((li) => li.chartAccountId && li.amount !== '')
      .map((li) => ({
        chartAccountId: li.chartAccountId,
        amount: parseFloat(li.amount) || 0,
        description: li.description || undefined,
      }));
    if (lineItems.length === 0) {
      setBillFormError('At least one line item with account and amount is required.');
      return;
    }
    setBillSubmitting(true);
    try {
      await apiPost(endPoints.QUICKBOOKS.CREATE_BILL(qbCompanyId), {
        accountingCycleId: cycleId,
        type: 'BILL',
        vendor: billForm.vendor || undefined,
        docNumber: billForm.docNumber || undefined,
        txnDate: new Date(billForm.txnDate).toISOString(),
        dueDate: billForm.dueDate ? new Date(billForm.dueDate).toISOString() : undefined,
        totalAmount: totalNum,
        currency: billForm.currency,
        description: billForm.description || undefined,
        lineItems,
      });
      queryClient.invalidateQueries({ queryKey: ['qb-bills', qbCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
      setIsCreateBillModalOpen(false);
      setBillForm({
        vendor: '',
        docNumber: '',
        txnDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        totalAmount: '',
        currency: 'USD',
        description: '',
        lineItems: [{ chartAccountId: '', amount: '', description: '' }],
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setBillFormError(err?.message ?? 'Failed to create bill');
    } finally {
      setBillSubmitting(false);
    }
  };

  if (cycleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px] p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (cycleError && !hasCycle) {
    return (
      <div className="space-y-6">
        <ShadowCard className="p-10 text-center text-muted-foreground">
          Failed to load accounting cycle. Please try again.
        </ShadowCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {companyId && (
        <div
          className={
            quickbooksAvailable
              ? 'flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100 text-green-800 text-sm font-medium'
              : 'flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/40 border border-primary/10 text-foreground text-sm font-medium'
          }
        >
          <span className="font-semibold">QuickBooks:</span>
          <span>{quickbooksAvailable ? 'Connected' : 'Not connected'}</span>
        </div>
      )}

      {!hasCycle ? (
        <ShadowCard className="p-10 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4 text-muted-foreground">
            <BookMarked className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Accounting cycle not created yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            {isOrgAdmin
              ? 'Create an accounting cycle to start bookkeeping for this engagement.'
              : 'Contact your organization admin to create an accounting cycle for this engagement.'}
          </p>
          {isOrgAdmin && (
            <Button
              onClick={openCreateModal}
              className="rounded-xl font-bold gap-2 px-6 py-6 shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Create accounting cycle
            </Button>
          )}
        </ShadowCard>
      ) : (
        <>
          <div className="w-full overflow-hidden flex items-center">
            <PillTab
              tabs={ACCOUNTING_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
            {activeTab === 'overview' ? (
              <div className="p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Cycle overview</h3>
                      <p className="text-sm text-muted-foreground">
                        {cycle?.company?.name ?? 'Company'} · {cycle?.status ?? '—'}
                      </p>
                    </div>
                  </div>
                  {isOrgAdmin && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <select
                          value={cycle?.status ?? ''}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          disabled={statusUpdateLoading}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-60"
                        >
                          {CYCLE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      {quickbooksAvailable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSyncFromQB}
                          disabled={syncLoading}
                          className="gap-2 rounded-xl"
                        >
                          <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                          {syncLoading ? 'Syncing…' : 'Sync from QuickBooks'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {statusUpdateError && (
                  <p className="mb-4 text-sm text-red-600 font-medium">{statusUpdateError}</p>
                )}
                {syncError && (
                  <p className="mb-4 text-sm text-red-600 font-medium">{syncError}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-primary/10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Period start
                    </p>
                    <p className="font-semibold text-foreground">
                      {cycle?.periodStart
                        ? new Date(cycle.periodStart).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-primary/10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Period end
                    </p>
                    <p className="font-semibold text-foreground">
                      {cycle?.periodEnd
                        ? new Date(cycle.periodEnd).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>
                {isOrgAdmin && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={openEditPeriodModal} className="gap-2 rounded-xl">
                      <Pencil className="h-4 w-4" />
                      Edit period
                    </Button>
                  </div>
                )}
                {typeof cycle?.transactionsCount === 'number' && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {cycle.transactionsCount} transaction(s) in this cycle
                  </p>
                )}
              </div>
            ) : activeTab === 'transactions' ? (
              <div className="p-6">
                {transactionsForbidden ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                    <p className="font-medium">Only organization admins can view and manage transactions.</p>
                  </div>
                ) : (
                  <>
                    {isOrgAdmin && (
                      <div className="mb-4">
                        <Button
                          onClick={() => openTransactionModal(null)}
                          className="gap-2 rounded-xl"
                        >
                          <Plus className="h-4 w-4" />
                          Add transaction
                        </Button>
                      </div>
                    )}
                    {transactionsLoading ? (
                      <TableSkeleton columns={isOrgAdmin ? 8 : 7} rows={5} />
                    ) : transactionsError ? (
                      <p className="text-sm text-red-600">Failed to load transactions.</p>
                    ) : (
                      <div className={TABLE_WRAPPER_CLASS}>
                        <Table>
                          <TableHeader>
                            <TableRow className={TABLE_HEADER_ROW_CLASS}>
                              <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Doc #</TableHead>
                            <TableHead>Vendor / Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>QB Sync</TableHead>
                            {isOrgAdmin && <TableHead className="w-24">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={isOrgAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">
                                No data available here
                              </TableCell>
                            </TableRow>
                          ) : transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.type}</TableCell>
                              <TableCell>
                                {tx.txnDate ? new Date(tx.txnDate).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell>{tx.docNumber ?? '—'}</TableCell>
                              <TableCell>
                                {tx.vendor ?? tx.customer ?? '—'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {typeof tx.totalAmount === 'number' ? tx.totalAmount.toFixed(2) : tx.totalAmount}
                              </TableCell>
                              <TableCell>{tx.currency ?? 'USD'}</TableCell>
                              <TableCell>{tx.quickbooksSyncStatus ?? '—'}</TableCell>
                              {isOrgAdmin && (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openTransactionModal(tx)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirmId(tx.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                        </Table>
                      </div>
                    )}
                    {deleteConfirmId && (
                      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Delete transaction</DialogTitle>
                            <DialogDescription>
                              Are you sure? This cannot be undone. Synced transactions cannot be deleted.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl">
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              className="rounded-xl"
                              onClick={async () => {
                                if (!cycleId || !deleteConfirmId) return;
                                try {
                                  await apiDelete(endPoints.ACCOUNTING.DELETE_TRANSACTION(cycleId, deleteConfirmId));
                                  queryClient.invalidateQueries({ queryKey: ['accounting-transactions', cycleId] });
                                  queryClient.invalidateQueries({ queryKey: ['accounting-cycle', engagementId] });
                                  setDeleteConfirmId(null);
                                } catch (e: unknown) {
                                  const err = e as { message?: string };
                                  alert(err?.message ?? 'Delete failed');
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </div>
            ) : activeTab === 'chart-of-accounts' ? (
              <div className="p-6">
                {cycleCompanyId && quickbooksAvailable && isOrgAdmin && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncFromQB}
                      disabled={syncLoading}
                      className="gap-2 rounded-xl"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                      {syncLoading ? 'Syncing…' : 'Sync from QuickBooks'}
                    </Button>
                  </div>
                )}
                {chartAccountsLoading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                  <>
                    <SearchAndDateFilter
                      search={chartAccountsTableState.search}
                      onSearchChange={chartAccountsTableState.setSearch}
                      showDateFilter={false}
                    />
                    <div className={TABLE_WRAPPER_CLASS}>
                      <Table>
                        <TableHeader>
                          <TableRow className={TABLE_HEADER_ROW_CLASS}>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartAccountsTableState.sliced.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No data available here
                              </TableCell>
                            </TableRow>
                          ) : (
                            chartAccountsTableState.sliced.map((acc) => (
                              <TableRow key={acc.id}>
                                <TableCell className="font-mono">{acc.code}</TableCell>
                                <TableCell>{acc.name}</TableCell>
                                <TableCell>{acc.classification}</TableCell>
                                <TableCell>{acc.accountType ?? '—'}</TableCell>
                                <TableCell>{acc.active ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <TablePagination
                      page={chartAccountsTableState.page}
                      pageSize={chartAccountsTableState.pageSize}
                      total={chartAccountsTableState.total}
                      onPageChange={chartAccountsTableState.setPage}
                      onPageSizeChange={chartAccountsTableState.setPageSize}
                    />
                  </>
                )}
              </div>
            ) : activeTab === 'invoices' ? (
              <InvoicesTab
                quickbooksAvailable={quickbooksAvailable}
                loading={qbInvoicesLoading}
                invoices={qbInvoices}
                stats={qbInvoiceStats}
                isOrgAdmin={isOrgAdmin}
                mapInvoiceLoading={mapInvoiceLoading}
                onMapInvoice={handleMapInvoiceToTransaction}
                onCreateClick={() => setIsCreateInvoiceModalOpen(true)}
                viewInvoice={viewInvoice}
                onViewInvoice={(inv) => setViewInvoice(inv as Record<string, unknown> | null)}
              />
            ) : activeTab === 'bills' ? (
              <BillsTab
                quickbooksAvailable={quickbooksAvailable}
                loading={qbBillsLoading}
                bills={qbBills}
                isOrgAdmin={isOrgAdmin}
                mapBillLoading={mapBillLoading}
                onMapBill={handleMapBillToTransaction}
                onCreateClick={() => setIsCreateBillModalOpen(true)}
                viewBill={viewBill}
                onViewBill={(bill) => setViewBill(bill as Record<string, unknown> | null)}
              />
            ) : activeTab === 'journal' ? (
              <div className="p-6">
                {!quickbooksAvailable ? (
                  <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view journal entries.</p>
                ) : qbJournalLoading ? (
                  <TableSkeleton columns={4} rows={5} />
                ) : (
                  <div className={TABLE_WRAPPER_CLASS}>
                    <Table>
                      <TableHeader>
                        <TableRow className={TABLE_HEADER_ROW_CLASS}>
                          <TableHead>Date</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-24">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qbJournal.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No data available here
                            </TableCell>
                          </TableRow>
                      ) : (
                        qbJournal.map((entry, idx) => (
                          <TableRow key={entry.Id ?? idx}>
                            <TableCell>{entry.TxnDate ? new Date(entry.TxnDate).toLocaleDateString() : '—'}</TableCell>
                            <TableCell>{entry.PrivateNote ?? '—'}</TableCell>
                            <TableCell className="text-right font-medium">{entry.TotalAmt != null ? Number(entry.TotalAmt).toFixed(2) : '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => setViewJournalId(entry.Id ?? null)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    </Table>
                  </div>
                )}
                {viewJournalId && (
                  <Dialog open={!!viewJournalId} onOpenChange={() => setViewJournalId(null)}>
                    <DialogContent className="w-[40vw] max-w-[40vw] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Journal entry lines</DialogTitle>
                        <DialogDescription>Line items for this journal entry</DialogDescription>
                      </DialogHeader>
                      {journalItemsLoading ? (
                        <TableSkeleton columns={2} rows={3} />
                      ) : (
                      <div className={TABLE_WRAPPER_CLASS}>
                        <Table>
                          <TableHeader>
                            <TableRow className={TABLE_HEADER_ROW_CLASS}>
                            <TableHead>Account / Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!Array.isArray(journalLineItems) || journalLineItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                                No journal entry lines to show
                              </TableCell>
                            </TableRow>
                          ) : (
                            journalLineItems.map((line, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  {line.Description ?? line.AccountRef?.name ?? line.JournalEntryLineDetail?.AccountRef?.name ?? '—'}
                                </TableCell>
                                <TableCell className="text-right">{line.Amount != null ? Number(line.Amount).toFixed(2) : '—'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        </Table>
                      </div>
                      )}
                      <DialogFooter>
                        <Button onClick={() => setViewJournalId(null)} className="rounded-xl">Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : activeTab === 'recurring-expenses' ? (
              <div className="p-6">
                {!quickbooksAvailable ? (
                  <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view recurring expenses.</p>
                ) : qbRecurringLoading ? (
                  <TableSkeleton columns={3} rows={5} />
                ) : (
                  <div className={TABLE_WRAPPER_CLASS}>
                    <Table>
                      <TableHeader>
                        <TableRow className={TABLE_HEADER_ROW_CLASS}>
                          <TableHead>Vendor</TableHead>
                          <TableHead className="text-right">Total amount</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qbRecurring.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              No data available here
                            </TableCell>
                          </TableRow>
                      ) : (
                        qbRecurring.map((row, idx) => (
                          <TableRow key={row.vendorId ?? idx}>
                            <TableCell>{row.vendorName ?? row.VendorRef?.name ?? '—'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {(row.totalAmount ?? row.TotalAmt) != null ? Number(row.totalAmount ?? row.TotalAmt).toFixed(2) : '—'}
                            </TableCell>
                            <TableCell className="text-right">{Array.isArray(row.transactions) ? row.transactions.length : '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : activeTab === 'bank-accounts' ? (
              <div className="p-6">
                {!quickbooksAvailable ? (
                  <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view bank accounts.</p>
                ) : qbBankAccountsLoading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-4">Bank accounts</h3>
                    <div className={TABLE_WRAPPER_CLASS}>
                      <Table>
                        <TableHeader>
                          <TableRow className={TABLE_HEADER_ROW_CLASS}>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead>Currency</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!qbBankAccounts.length ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No data available here
                              </TableCell>
                            </TableRow>
                        ) : (
                          qbBankAccounts.map((acc, idx) => (
                            <TableRow key={acc.Id ?? idx}>
                              <TableCell className="font-medium">{acc.Name ?? '—'}</TableCell>
                              <TableCell>{acc.AccountType ?? '—'}</TableCell>
                              <TableCell className="text-right">
                                {acc.Balance != null ? Number(acc.Balance).toFixed(2) : '—'}
                              </TableCell>
                              <TableCell>{acc.CurrencyRef ? currencyCodeFromRef(acc.CurrencyRef) : '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'reports' ? (
              <div className="p-6">
                {!quickbooksAvailable ? (
                  <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view financial reports.</p>
                ) : qbReportsLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-8 w-48 rounded" />
                    <TableSkeleton columns={2} rows={4} />
                    <TableSkeleton columns={2} rows={4} />
                    <TableSkeleton columns={2} rows={4} />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <h3 className="text-lg font-bold text-foreground">Financial reports</h3>
                    {['balanceSheet', 'profitLoss', 'cashFlow'].map((key) => {
                      const report = (qbReportsDashboard as Record<string, unknown>)[key] as { Rows?: { Row?: QBReportRow[] }; Header?: { ReportName?: string } } | undefined;
                      const rows = report?.Rows?.Row;
                      const flat = flattenReportRows(rows ?? []);
                      const title = key === 'balanceSheet' ? 'Balance Sheet' : key === 'profitLoss' ? 'Profit & Loss' : 'Cash Flow';
                      return (
                        <div key={key}>
                          <h4 className="text-base font-semibold text-foreground mb-2">{title}</h4>
                          <div className={TABLE_WRAPPER_CLASS}>
                            <Table>
                              <TableHeader>
                                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                                  <TableHead>Account / Description</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {flat.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                                      No data available here
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  flat.map((r, i) => (
                                    <TableRow key={i} className={r.isSummary ? 'bg-muted/30 font-medium' : r.isSection ? 'bg-muted/20' : ''}>
                                      <TableCell className={r.isSection ? 'font-medium' : ''}>{r.cells[0] ?? '—'}</TableCell>
                                      <TableCell className="text-right">{r.cells[1] ?? '—'}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'sync-history' ? (
              <SyncHistoryTab
                quickbooksAvailable={quickbooksAvailable}
                loading={syncHistoryLoading}
                list={syncHistoryList}
              />
            ) : activeTab === 'ap-ar-aging' ? (
              <AgingTab
                quickbooksAvailable={quickbooksAvailable}
                loading={agingSyncedLoading}
                ap={agingSyncedData.ap as Parameters<typeof AgingTab>[0]['ap']}
                ar={agingSyncedData.ar as Parameters<typeof AgingTab>[0]['ar']}
              />
            ) : activeTab === 'tax' ? (
              <div className="p-6">
                {!quickbooksAvailable ? (
                  <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view tax information.</p>
                ) : taxEntityLoading ? (
                  <TableSkeleton columns={2} rows={4} />
                ) : !taxEntity?.jsonData ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No tax/company info synced yet. Run &quot;Sync from QuickBooks&quot; on Overview to pull company (tax) data.
                  </p>
                ) : (() => {
                  const j = taxEntity.jsonData as { time?: string; CompanyInfo?: Record<string, unknown> };
                  const info = j?.CompanyInfo ?? {};
                  const time = j?.time;
                  const addr = (a: Record<string, unknown> | undefined) =>
                    a ? [a.Line1, a.Line2, a.City, a.CountrySubDivisionCode, a.PostalCode, a.Country].filter(Boolean).join(', ') : '—';
                  const email = (e: { Address?: string } | undefined) => (e?.Address ? String(e.Address) : '—');
                  const nameValues = Array.isArray(info.NameValue) ? (info.NameValue as Array<{ Name?: string; Value?: string }>) : [];
                  return (
                    <>
                      <h3 className="text-lg font-bold text-foreground mb-1">Company information</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        From QuickBooks (synced with &quot;Sync from QuickBooks&quot;).
                        {time ? (
                          <span className="block mt-1">Last synced: {new Date(String(time)).toLocaleString()}</span>
                        ) : null}
                      </p>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-muted/30 border border-[hsl(var(--foreground)/0.08)]">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company</p>
                            <p className="font-semibold text-foreground">{String(info.CompanyName ?? info.LegalName ?? '—')}</p>
                            <p className="text-sm text-muted-foreground mt-1">{String(info.Country ?? '—')} · {String(info.domain ?? '—')}</p>
                            <p className="text-sm text-muted-foreground mt-1">Email: {email(info.Email as { Address?: string }) || email(info.CustomerCommunicationEmailAddr as { Address?: string })}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/30 border border-[hsl(var(--foreground)/0.08)]">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fiscal &amp; time</p>
                            <p className="text-sm text-foreground">Fiscal year starts: {String(info.FiscalYearStartMonth ?? '—')}</p>
                            <p className="text-sm text-foreground">Company start: {info.CompanyStartDate ? new Date(String(info.CompanyStartDate)).toLocaleDateString() : '—'}</p>
                            <p className="text-sm text-foreground">Time zone: {String(info.DefaultTimeZone ?? '—')}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Addresses</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg border border-[hsl(var(--foreground)/0.08)] bg-background">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Legal</p>
                              <p className="text-sm text-foreground">{addr(info.LegalAddr as Record<string, unknown>)}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-[hsl(var(--foreground)/0.08)] bg-background">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Company</p>
                              <p className="text-sm text-foreground">{addr(info.CompanyAddr as Record<string, unknown>)}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-[hsl(var(--foreground)/0.08)] bg-background">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Customer communication</p>
                              <p className="text-sm text-foreground">{addr(info.CustomerCommunicationAddr as Record<string, unknown>)}</p>
                            </div>
                          </div>
                        </div>
                        {typeof info.MetaData === 'object' && info.MetaData !== null && (() => {
                          const meta = info.MetaData as { CreateTime?: string; LastUpdatedTime?: string };
                          const created = meta.CreateTime ? new Date(meta.CreateTime).toLocaleString() : '—';
                          const updated = meta.LastUpdatedTime ? new Date(meta.LastUpdatedTime).toLocaleString() : '—';
                          return (
                            <div className="p-4 rounded-xl bg-muted/20 border border-[hsl(var(--foreground)/0.08)]">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata</p>
                              <p className="text-sm text-foreground">
                                Created: {created} · Last updated: {updated}
                              </p>
                            </div>
                          );
                        })()}
                        {nameValues.length > 0 && (
                          <div className={TABLE_WRAPPER_CLASS}>
                            <Table>
                              <TableHeader>
                                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {nameValues.map((nv, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium text-foreground">{nv.Name ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{nv.Value ?? '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </>
      )}

      <Dialog open={isTransactionModalOpen} onOpenChange={(open) => !open && closeTransactionModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? 'Update transaction details and line items.'
                : 'Create a new transaction for this cycle. At least one line item with account and amount is required.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction date *</label>
                <input
                  type="date"
                  value={txForm.txnDate}
                  onChange={(e) => setTxForm((p) => ({ ...p, txnDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <input
                  type="date"
                  value={txForm.dueDate}
                  onChange={(e) => setTxForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={txForm.totalAmount}
                  onChange={(e) => setTxForm((p) => ({ ...p, totalAmount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={txForm.taxAmount}
                  onChange={(e) => setTxForm((p) => ({ ...p, taxAmount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={txForm.currency}
                  onChange={(e) => setTxForm((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={txForm.vendor}
                  onChange={(e) => setTxForm((p) => ({ ...p, vendor: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  type="text"
                  value={txForm.customer}
                  onChange={(e) => setTxForm((p) => ({ ...p, customer: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doc number</label>
              <input
                type="text"
                value={txForm.docNumber}
                onChange={(e) => setTxForm((p) => ({ ...p, docNumber: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={txForm.description}
                onChange={(e) => setTxForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line items *</label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="rounded-lg">
                  Add line
                </Button>
              </div>
              <div className="space-y-2">
                {txForm.lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                    <select
                      value={li.chartAccountId}
                      onChange={(e) => updateLineItem(idx, 'chartAccountId', e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    >
                      <option value="">Select account</option>
                      {chartAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} – {acc.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={li.amount}
                      onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(idx)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {transactionFormError && (
              <p className="text-sm text-red-600 font-medium">{transactionFormError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTransactionModal} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTransaction}
              disabled={transactionSubmitting}
              className="rounded-xl px-6"
            >
              {transactionSubmitting ? 'Saving…' : editingTransaction ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create accounting cycle</DialogTitle>
            <DialogDescription>
              Set the period (start and end date) for this bookkeeping cycle. If omitted, the
              current month is used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            {createError && (
              <p className="text-sm text-red-600 font-medium">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreateCycle}
              disabled={isSubmitting}
              className="rounded-xl px-6"
            >
              {isSubmitting ? 'Creating…' : 'Create cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPeriodOpen} onOpenChange={setIsEditPeriodOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit cycle period</DialogTitle>
            <DialogDescription>
              Change the start and end dates for this accounting cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={editPeriodStart}
                onChange={(e) => setEditPeriodStart(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={editPeriodEnd}
                onChange={(e) => setEditPeriodEnd(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            {editPeriodError && (
              <p className="text-sm text-red-600 font-medium">{editPeriodError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPeriodOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePeriod}
              disabled={editPeriodSubmitting}
              className="rounded-xl px-6"
            >
              {editPeriodSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateInvoiceModalOpen} onOpenChange={setIsCreateInvoiceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>Create an invoice for this cycle. It will be stored and can sync to QuickBooks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                type="text"
                value={invoiceForm.customer}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, customer: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doc number</label>
                <input
                  type="text"
                  value={invoiceForm.docNumber}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, docNumber: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={invoiceForm.txnDate}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, txnDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceForm.totalAmount}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, totalAmount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={invoiceForm.currency}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line items *</label>
                <Button type="button" variant="outline" size="sm" onClick={addInvoiceLineItem} className="rounded-lg">Add line</Button>
              </div>
              <div className="space-y-2">
                {invoiceForm.lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                    <select
                      value={li.chartAccountId}
                      onChange={(e) => updateInvoiceLineItem(idx, 'chartAccountId', e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    >
                      <option value="">Select account</option>
                      {chartAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} – {acc.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={li.amount}
                      onChange={(e) => updateInvoiceLineItem(idx, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateInvoiceLineItem(idx, 'description', e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeInvoiceLineItem(idx)} className="text-red-600 hover:text-red-700 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {invoiceFormError && <p className="text-sm text-red-600 font-medium">{invoiceFormError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInvoiceModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={invoiceSubmitting} className="rounded-xl px-6">
              {invoiceSubmitting ? 'Creating…' : 'Create invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateBillModalOpen} onOpenChange={setIsCreateBillModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create bill</DialogTitle>
            <DialogDescription>Create a bill for this cycle. It will be stored and can sync to QuickBooks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <input
                type="text"
                value={billForm.vendor}
                onChange={(e) => setBillForm((p) => ({ ...p, vendor: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doc number</label>
                <input
                  type="text"
                  value={billForm.docNumber}
                  onChange={(e) => setBillForm((p) => ({ ...p, docNumber: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={billForm.txnDate}
                  onChange={(e) => setBillForm((p) => ({ ...p, txnDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={billForm.totalAmount}
                  onChange={(e) => setBillForm((p) => ({ ...p, totalAmount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={billForm.currency}
                onChange={(e) => setBillForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={billForm.description}
                onChange={(e) => setBillForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line items *</label>
                <Button type="button" variant="outline" size="sm" onClick={addBillLineItem} className="rounded-lg">Add line</Button>
              </div>
              <div className="space-y-2">
                {billForm.lineItems.map((li, idx) => (
                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                    <select
                      value={li.chartAccountId}
                      onChange={(e) => updateBillLineItem(idx, 'chartAccountId', e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    >
                      <option value="">Select account</option>
                      {chartAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} – {acc.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={li.amount}
                      onChange={(e) => updateBillLineItem(idx, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateBillLineItem(idx, 'description', e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeBillLineItem(idx)} className="text-red-600 hover:text-red-700 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {billFormError && <p className="text-sm text-red-600 font-medium">{billFormError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBillModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateBill} disabled={billSubmitting} className="rounded-xl px-6">
              {billSubmitting ? 'Creating…' : 'Create bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
