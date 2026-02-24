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
  BillDetailDialog,
} from '../common';
import type { QBBillDetail } from '../types';

interface BillRow {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  VendorRef?: { name?: string };
}

interface BillsTabProps {
  quickbooksAvailable: boolean;
  loading: boolean;
  bills: BillRow[];
  isOrgAdmin?: boolean;
  mapBillLoading: string | null;
  onMapBill: (qbBillId: string) => void;
  onCreateClick?: () => void;
  viewBill: QBBillDetail | Record<string, unknown> | null;
  onViewBill: (bill: BillRow | null) => void;
}

export function BillsTab({
  quickbooksAvailable,
  loading,
  bills,
  isOrgAdmin,
  mapBillLoading,
  onMapBill,
  onCreateClick,
  viewBill,
  onViewBill,
}: BillsTabProps) {
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
    data: bills,
    pageSize: 10,
    searchKeys: ['DocNumber', 'VendorRef'] as (keyof BillRow)[],
    searchFn: (item, s) => {
      const doc = (item.DocNumber ?? '').toLowerCase();
      const vendor = (item.VendorRef?.name ?? '').toLowerCase();
      return doc.includes(s) || vendor.includes(s);
    },
    dateKey: 'TxnDate',
    filterByDateRange: true,
  });

  if (!quickbooksAvailable) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view and create bills.</p>
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

  const balanceDue = bills.reduce((s, b) => s + (Number(b.Balance) || 0), 0);
  const paidCount = bills.filter((b) => (b.Balance ?? 0) <= 0).length;
  const unpaidCount = bills.filter((b) => (b.Balance ?? 0) > 0).length;

  return (
    <div className="p-6 space-y-4">
      {isOrgAdmin && onCreateClick && (
        <div className="flex justify-end">
          <Button onClick={onCreateClick} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            Create bill
          </Button>
        </div>
      )}
      <StatsCards
        items={[
          { label: 'Paid', value: paidCount },
          { label: 'Unpaid', value: unpaidCount },
          { label: 'Total bills', value: bills.length },
          { label: 'Balance due', value: balanceDue.toFixed(2), highlight: true },
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
        searchPlaceholder="Search by doc # or vendor..."
        showDateFilter={true}
      />
      <div className={TABLE_WRAPPER_CLASS}>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead>Doc #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24">View</TableHead>
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
              sliced.map((bill, idx) => (
                <TableRow key={bill.Id ?? idx}>
                  <TableCell>{bill.DocNumber ?? '—'}</TableCell>
                  <TableCell>{bill.TxnDate ? new Date(bill.TxnDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{bill.DueDate ? new Date(bill.DueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{bill.VendorRef?.name ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">{bill.TotalAmt != null ? Number(bill.TotalAmt).toFixed(2) : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={() => onViewBill(bill)}>
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
                        disabled={!bill.Id || mapBillLoading === bill.Id}
                        onClick={() => bill.Id && onMapBill(bill.Id)}
                      >
                        {mapBillLoading === bill.Id ? (
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
      <BillDetailDialog
        open={!!viewBill}
        onOpenChange={(open) => !open && onViewBill(null)}
        bill={viewBill}
      />
    </div>
  );
}
