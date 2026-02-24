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
import type { QBBillDetail } from '../types';

interface BillDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: QBBillDetail | Record<string, unknown> | null;
}

function formatAddr(addr: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string } | undefined) {
  if (!addr) return '—';
  return [addr.Line1, addr.City, addr.CountrySubDivisionCode, addr.PostalCode].filter(Boolean).join(', ') || '—';
}

export function BillDetailDialog({ open, onOpenChange, bill }: BillDetailDialogProps) {
  if (!bill) return null;
  const b = bill as QBBillDetail;
  const lines = Array.isArray(b.Line) ? b.Line : [];
  const detailLines = lines.filter((l) => l.DetailType !== 'SubTotalLineDetail');
  const currency = currencyCodeFromRef(b.CurrencyRef);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Bill {b.DocNumber ?? b.Id ?? ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vendor</p>
              <p className="font-medium text-foreground">{b.VendorRef?.name ?? '—'}</p>
              <p className="text-muted-foreground">{formatAddr(b.VendorAddr)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
              <p><span className="text-muted-foreground">Date:</span> {b.TxnDate ? new Date(b.TxnDate).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">Due:</span> {b.DueDate ? new Date(b.DueDate).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">A/P Account:</span> {b.APAccountRef?.name ?? '—'}</p>
              <p><span className="text-muted-foreground">Currency:</span> {currency}</p>
            </div>
          </div>
          <div className={TABLE_WRAPPER_CLASS}>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead>#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailLines.map((line, i) => {
                  const account = line.AccountBasedExpenseLineDetail?.AccountRef?.name ?? '—';
                  return (
                    <TableRow key={line.Id ?? i}>
                      <TableCell className="text-muted-foreground">{line.LineNum ?? i + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{line.Description ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{account}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{Number(line.Amount ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <div className="min-w-[220px] space-y-1 border-t border-[hsl(var(--foreground)/0.1)] pt-3">
              <div className="flex justify-between font-semibold text-foreground pt-1">
                <span>Total</span>
                <span className="tabular-nums">{(b.TotalAmt ?? 0).toFixed(2)} {currency}</span>
              </div>
              {b.Balance != null && (
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Balance due</span>
                  <span className={`font-semibold tabular-nums ${Number(b.Balance) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {Number(b.Balance).toFixed(2)} {currency}
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
