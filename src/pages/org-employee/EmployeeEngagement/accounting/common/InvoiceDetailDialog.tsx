import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../ui/Dialog';
import { Button } from '../../../../../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../ui/Table';
import { TABLE_WRAPPER_CLASS, TABLE_HEADER_ROW_CLASS } from '../constants';
import { currencyCodeFromRef } from '../utils';
import type { QBInvoiceDetail } from '../types';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: QBInvoiceDetail | Record<string, unknown> | null;
}

function formatAddr(addr: { Line1?: string; Line2?: string; Line3?: string; Line4?: string } | undefined) {
  if (!addr) return '—';
  return [addr.Line1, addr.Line2, addr.Line3, addr.Line4].filter(Boolean).join(', ') || '—';
}

function formatShipAddr(addr: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string } | undefined) {
  if (!addr) return '—';
  return [addr.Line1, addr.City, addr.CountrySubDivisionCode, addr.PostalCode].filter(Boolean).join(', ') || '—';
}

export function InvoiceDetailDialog({ open, onOpenChange, invoice }: InvoiceDetailDialogProps) {
  if (!invoice) return null;
  const inv = invoice as QBInvoiceDetail;
  const lines = Array.isArray(inv.Line) ? inv.Line : [];
  const detailLines = lines.filter((l) => l.DetailType !== 'SubTotalLineDetail');
  const currency = currencyCodeFromRef(inv.CurrencyRef);
  const taxTotal = inv.TxnTaxDetail?.TotalTax ?? 0;
  const subtotal = detailLines.reduce((s, l) => s + (Number(l.Amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Invoice {inv.DocNumber ?? inv.Id ?? ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bill to</p>
              <p className="font-medium text-foreground">{inv.CustomerRef?.name ?? '—'}</p>
              <p className="text-muted-foreground whitespace-pre-line">{formatAddr(inv.BillAddr)}</p>
              {inv.BillEmail?.Address && (
                <p className="text-muted-foreground mt-1">{inv.BillEmail.Address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
              <p><span className="text-muted-foreground">Date:</span> {inv.TxnDate ? new Date(inv.TxnDate).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">Due:</span> {inv.DueDate ? new Date(inv.DueDate).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">Terms:</span> {inv.SalesTermRef?.name ?? '—'}</p>
              <p><span className="text-muted-foreground">Currency:</span> {currency}</p>
            </div>
          </div>
          {inv.ShipAddr && (inv.ShipAddr as { Line1?: string }).Line1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ship to</p>
              <p className="text-muted-foreground">{formatShipAddr(inv.ShipAddr as { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string })}</p>
            </div>
          )}
          {inv.CustomerMemo?.value && (
            <div className="p-3 rounded-lg bg-muted/30 border border-[hsl(var(--foreground)/0.08)]">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Memo</p>
              <p className="text-foreground">{inv.CustomerMemo.value}</p>
            </div>
          )}
          <div className={TABLE_WRAPPER_CLASS}>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead>#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailLines.map((line, i) => {
                  const detail = line.SalesItemLineDetail;
                  const qty = detail?.Qty ?? 1;
                  const rate = detail?.UnitPrice ?? line.Amount ?? 0;
                  const amt = line.Amount ?? 0;
                  return (
                    <TableRow key={line.Id ?? i}>
                      <TableCell className="text-muted-foreground">{line.LineNum ?? i + 1}</TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{line.Description || detail?.ItemRef?.name || '—'}</span>
                        {detail?.ItemAccountRef?.name && (
                          <span className="block text-xs text-muted-foreground">{detail.ItemAccountRef.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(rate).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{Number(amt).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <div className="min-w-[220px] space-y-1 border-t border-[hsl(var(--foreground)/0.1)] pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{subtotal.toFixed(2)}</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="tabular-nums">{taxTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-foreground pt-1">
                <span>Total</span>
                <span className="tabular-nums">{(inv.TotalAmt ?? 0).toFixed(2)} {currency}</span>
              </div>
              {inv.Balance != null && (
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Balance due</span>
                  <span className={`font-semibold tabular-nums ${Number(inv.Balance) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {Number(inv.Balance).toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
