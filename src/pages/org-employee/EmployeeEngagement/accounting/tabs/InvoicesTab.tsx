import { useState } from 'react';
import { Plus, Eye, Link2, RefreshCw } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../ui/Table';
import {
  TableSkeleton,
  TABLE_WRAPPER_CLASS,
  TABLE_HEADER_ROW_CLASS,
  StatsCards,
  TablePagination,
  SearchAndDateFilter,
  useTableState,
  InvoiceDetailDialog,
} from '../common';
import type { QBInvoiceDetail } from '../types';

interface InvoiceRow {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CustomerRef?: { name?: string };
}

interface InvoicesTabProps {
  quickbooksAvailable: boolean;
  loading: boolean;
  invoices: InvoiceRow[];
  stats?: { total?: number; outstanding?: number; count?: number };
  isOrgAdmin?: boolean;
  mapInvoiceLoading: string | null;
  onMapInvoice: (qbInvoiceId: string) => void;
  onCreateClick?: () => void;
  viewInvoice: QBInvoiceDetail | Record<string, unknown> | null;
  onViewInvoice: (inv: InvoiceRow | null) => void;
}

export function InvoicesTab({
  quickbooksAvailable,
  loading,
  invoices,
  stats,
  isOrgAdmin,
  mapInvoiceLoading,
  onMapInvoice,
  onCreateClick,
  viewInvoice,
  onViewInvoice,
}: InvoicesTabProps) {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    total,
    sliced,
  } = useTableState({
    data: invoices,
    pageSize: 10,
    searchKeys: ['DocNumber', 'CustomerRef'] as (keyof InvoiceRow)[],
    searchFn: (item, s) => {
      const doc = (item.DocNumber ?? '').toLowerCase();
      const cust = (item.CustomerRef?.name ?? '').toLowerCase();
      return doc.includes(s) || cust.includes(s);
    },
    dateKey: 'TxnDate',
    filterByDateRange: true,
  });

  if (!quickbooksAvailable) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view and create invoices.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
        <TableSkeleton columns={isOrgAdmin ? 7 : 6} rows={5} />
      </div>
    );
  }

  const paidCount = invoices.filter((i) => (i.Balance ?? 0) <= 0).length;
  const unpaidCount = invoices.filter((i) => (i.Balance ?? 0) > 0).length;
  const outstanding = stats?.outstanding != null ? Number(stats.outstanding).toFixed(2) : invoices.reduce((s, i) => s + (Number(i.Balance) || 0), 0).toFixed(2);

  return (
    <div className="p-6 space-y-4">
      {isOrgAdmin && onCreateClick && (
        <div className="flex justify-end">
          <Button onClick={onCreateClick} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            Create invoice
          </Button>
        </div>
      )}
      <StatsCards
        items={[
          { label: 'Paid', value: paidCount },
          { label: 'Unpaid', value: unpaidCount },
          { label: 'Total invoices', value: invoices.length },
          { label: 'Outstanding balance', value: outstanding, highlight: true },
        ]}
        className="w-full"
      />
      <SearchAndDateFilter
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchPlaceholder="Search by doc # or customer..."
        showDateFilter={true}
      />
      <div className={TABLE_WRAPPER_CLASS}>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead>Doc #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="w-32">View</TableHead>
              {isOrgAdmin && <TableHead className="w-32">Link to cycle</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sliced.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOrgAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                  No data available here
                </TableCell>
              </TableRow>
            ) : (
              sliced.map((inv, idx) => (
                <TableRow key={inv.Id ?? idx}>
                  <TableCell>{inv.DocNumber ?? '—'}</TableCell>
                  <TableCell>{inv.TxnDate ? new Date(inv.TxnDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{inv.DueDate ? new Date(inv.DueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="font-medium">{inv.TotalAmt != null ? Number(inv.TotalAmt).toFixed(2) : '—'}</TableCell>
                  <TableCell>{inv.Balance != null ? Number(inv.Balance).toFixed(2) : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={() => onViewInvoice(inv)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                  {isOrgAdmin && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8"
                        disabled={!inv.Id || mapInvoiceLoading === inv.Id}
                        onClick={() => inv.Id && onMapInvoice(inv.Id)}
                      >
                        {mapInvoiceLoading === inv.Id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        Link
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
      <InvoiceDetailDialog
        open={!!viewInvoice}
        onOpenChange={(open) => !open && onViewInvoice(null)}
        invoice={viewInvoice}
      />
    </div>
  );
}
