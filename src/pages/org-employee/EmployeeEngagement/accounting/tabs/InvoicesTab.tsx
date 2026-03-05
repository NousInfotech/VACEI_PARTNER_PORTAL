import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Link2, RefreshCw, Upload, Paperclip } from 'lucide-react';
import { apiGet } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../ui/Dialog';
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

export interface LinkedFileInfo {
  id: string;
  url: string;
  file_name: string;
}

interface InvoiceRow {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CustomerRef?: { name?: string };
  linkedFile?: LinkedFileInfo | null;
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
  cycleId?: string | null;
  onUploadInvoice?: (file: File) => Promise<void>;
  uploadInvoiceLoading?: boolean;
  uploadInvoiceError?: string | null;
  onClearUploadError?: () => void;
  companyIdForQb?: string | null;
  engagementId?: string | null;
  onLinkFile?: (qbInvoiceId: string, fileId: string) => Promise<void>;
  viewInvoice: QBInvoiceDetail | Record<string, unknown> | null;
  onViewInvoice: (inv: InvoiceRow | null) => void;
}

const ACCEPT_INVOICE_FILES = 'application/pdf,image/jpeg,image/png,image/tiff';

export function InvoicesTab({
  quickbooksAvailable,
  loading,
  invoices,
  stats,
  isOrgAdmin,
  mapInvoiceLoading,
  onMapInvoice,
  onCreateClick,
  cycleId,
  onUploadInvoice,
  uploadInvoiceLoading = false,
  uploadInvoiceError,
  onClearUploadError,
  companyIdForQb,
  engagementId,
  onLinkFile,
  viewInvoice,
  onViewInvoice,
}: InvoicesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkFileForId, setLinkFileForId] = useState<string | null>(null);
  const [linkFileSubmitting, setLinkFileSubmitting] = useState(false);
  const [linkFileError, setLinkFileError] = useState<string | null>(null);

  const { data: invoicesFolderData, isLoading: invoicesFolderLoading } = useQuery({
    queryKey: ['engagement-invoices-folder', engagementId],
    queryFn: () =>
      apiGet<{ data: { files: Array<{ id: string; filename: string; type: string; size: number }> } }>(
        endPoints.ENGAGEMENTS.INVOICES_FOLDER(engagementId!)
      ),
    enabled: !!engagementId && !!linkFileForId,
  });
  const invoicesFolderFiles = invoicesFolderData?.data?.files ?? [];
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
        <TableSkeleton columns={isOrgAdmin ? 9 : 8} rows={5} />
      </div>
    );
  }

  const paidCount = invoices.filter((i) => (i.Balance ?? 0) <= 0).length;
  const unpaidCount = invoices.filter((i) => (i.Balance ?? 0) > 0).length;
  const outstanding = stats?.outstanding != null ? Number(stats.outstanding).toFixed(2) : invoices.reduce((s, i) => s + (Number(i.Balance) || 0), 0).toFixed(2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadInvoice) {
      onUploadInvoice(file).finally(() => {
        e.target.value = '';
      });
    }
  };

  const handleLinkFile = async (fileId: string) => {
    if (!linkFileForId || !onLinkFile) return;
    setLinkFileError(null);
    setLinkFileSubmitting(true);
    try {
      await onLinkFile(linkFileForId, fileId);
      setLinkFileForId(null);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setLinkFileError(err?.message ?? 'Failed to link file');
    } finally {
      setLinkFileSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {(onCreateClick || onUploadInvoice) && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {cycleId && onUploadInvoice && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_INVOICE_FILES}
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadInvoiceLoading}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadInvoiceLoading}
                className="gap-2 rounded-xl"
              >
                {uploadInvoiceLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload invoice
              </Button>
            </>
          )}
          {isOrgAdmin && onCreateClick && (
            <Button onClick={onCreateClick} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Create invoice
            </Button>
          )}
        </div>
      )}
      {uploadInvoiceError && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center justify-between">
          <span>{uploadInvoiceError}</span>
          {onClearUploadError && (
            <Button variant="ghost" size="sm" onClick={onClearUploadError}>
              Dismiss
            </Button>
          )}
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
              <TableHead>Invoice number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="w-32">View</TableHead>
              <TableHead className="w-24" title="View file">
                <Eye className="h-4 w-4 inline" />
              </TableHead>
              <TableHead className="w-32">Attachment</TableHead>
              {isOrgAdmin && <TableHead className="w-32">Link to cycle</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sliced.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOrgAdmin ? 9 : 8} className="text-center text-muted-foreground py-8">
                  No data available here
                </TableCell>
              </TableRow>
            ) : (
              sliced.map((inv, idx) => (
                <TableRow key={inv.Id ?? idx}>
                  <TableCell className="font-medium">{inv.DocNumber ?? '—'}</TableCell>
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-8"
                      disabled={!inv.linkedFile}
                      title={inv.linkedFile ? 'View file' : 'No file linked'}
                      onClick={() => inv.linkedFile && window.open(inv.linkedFile.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {inv.linkedFile ? (
                      <span className="text-sm truncate max-w-[120px] block" title={inv.linkedFile.file_name}>
                        {inv.linkedFile.file_name}
                      </span>
                    ) : (
                      '—'
                    )}
                    {companyIdForQb && onLinkFile && inv.Id && !String(inv.Id).startsWith('local-') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8 mt-1"
                        onClick={() => {
                          setLinkFileForId(inv.Id!);
                          setLinkFileError(null);
                        }}
                      >
                        <Paperclip className="h-4 w-4" />
                        Link file
                      </Button>
                    )}
                  </TableCell>
                  {isOrgAdmin && inv.Id && !String(inv.Id).startsWith('local-') && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8"
                        disabled={mapInvoiceLoading === inv.Id}
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
                  {isOrgAdmin && inv.Id && String(inv.Id).startsWith('local-') && (
                    <TableCell className="text-muted-foreground text-xs">Uploaded</TableCell>
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
      <Dialog open={!!linkFileForId} onOpenChange={(open) => !open && setLinkFileForId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link file to invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a file from the engagement&apos;s Invoices folder to attach to this QuickBooks invoice.
          </p>
          {linkFileError && (
            <p className="text-sm text-destructive">{linkFileError}</p>
          )}
          {invoicesFolderLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading files…</div>
          ) : invoicesFolderFiles.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No files in the Invoices folder. Upload an invoice first to see files here.
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto rounded-md border border-input divide-y divide-border">
              {invoicesFolderFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="truncate flex-1" title={file.filename}>
                    {file.filename}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={linkFileSubmitting}
                    onClick={() => handleLinkFile(file.id)}
                  >
                    {linkFileSubmitting ? 'Linking…' : 'Link'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkFileForId(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
