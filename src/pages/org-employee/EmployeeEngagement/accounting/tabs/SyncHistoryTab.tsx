import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../../../ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../ui/Table';
import { TableSkeleton, TABLE_WRAPPER_CLASS, TABLE_HEADER_ROW_CLASS, TablePagination, SearchAndDateFilter, useTableState } from '../common';
import type { QuickbooksSyncHistoryRow } from '../types';

interface SyncHistoryTabProps {
  quickbooksAvailable: boolean;
  loading: boolean;
  list: QuickbooksSyncHistoryRow[];
}

export function SyncHistoryTab({ quickbooksAvailable, loading, list }: SyncHistoryTabProps) {
  const [viewingRow, setViewingRow] = useState<QuickbooksSyncHistoryRow | null>(null);
  const { page, setPage, pageSize, setPageSize, search, setSearch, dateFrom, dateTo, setDateFrom, setDateTo, total, sliced } = useTableState<QuickbooksSyncHistoryRow>({
    data: list,
    pageSize: 10,
    searchKeys: ['syncMessage'],
    searchFn: (item, s) => (item.syncMessage ?? '').toLowerCase().includes(s),
    dateKey: 'syncStartTime',
    filterByDateRange: true,
  });

  if (!quickbooksAvailable) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground py-8 text-center">
          Connect QuickBooks to view sync history.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <TableSkeleton columns={5} rows={5} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-foreground mb-4">QuickBooks sync history</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Runs when you use &quot;Sync from QuickBooks&quot; (import) or when transactions are
        pushed to QuickBooks.
      </p>
      <SearchAndDateFilter
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchPlaceholder="Search by message..."
        showDateFilter={true}
      />
      <div className={TABLE_WRAPPER_CLASS}>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead>Started</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-24">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sliced.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No data available here
                </TableCell>
              </TableRow>
            ) : (
              sliced.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.syncStartTime ? new Date(row.syncStartTime).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    {row.syncEndTime ? new Date(row.syncEndTime).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    {row.status === 0 ? 'Pending' : row.status === 1 ? 'Success' : 'Failed'}
                  </TableCell>
                  <TableCell>{row.syncMessage ?? '—'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-8"
                      onClick={() => setViewingRow(row)}
                      disabled={!row.syncedEntities || Object.keys(row.syncedEntities).length === 0}
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

      <Dialog open={!!viewingRow} onOpenChange={() => setViewingRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Synced entities</DialogTitle>
            <DialogDescription>
              Counts per entity type for this sync run.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {viewingRow?.syncedEntities &&
              Object.entries(viewingRow.syncedEntities).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-1 border-b border-[hsl(var(--foreground)/0.08)] last:border-0">
                  <span className="font-medium text-foreground capitalize">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            {viewingRow?.syncedEntities && Object.keys(viewingRow.syncedEntities).length === 0 && (
              <p className="text-muted-foreground">No entity counts recorded.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewingRow(null)} className="rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
