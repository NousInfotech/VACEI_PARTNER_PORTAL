import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../ui/Table';
import { TableSkeleton, TABLE_WRAPPER_CLASS, TABLE_HEADER_ROW_CLASS } from '../common';

interface AgingRow {
  id: string;
  entityName: string;
  current: number;
  agingBucket1_30: number;
  agingBucket31_60: number;
  agingBucket61_90: number;
  agingBucket91Over: number;
  total: number;
}

interface AgingData {
  id: string;
  reportDate: string;
  type: string;
  currency: string;
  current: number;
  agingBucket1_30: number;
  agingBucket31_60: number;
  agingBucket61_90: number;
  agingBucket91Over: number;
  total: number;
  rows: AgingRow[];
}

interface AgingTabProps {
  quickbooksAvailable: boolean;
  loading: boolean;
  ap: AgingData | null;
  ar: AgingData | null;
}

function formatCurrency(amount: number, currency: string) {
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AgingSection({
  title,
  entityLabel,
  data,
  currency,
}: {
  title: string;
  entityLabel: string;
  data: AgingData | null;
  currency: string;
}) {
  if (!data) return null;
  const rows = data.rows ?? [];
  const curr = data.currency || currency;

  return (
    <div className="mb-10">
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Data as of {data.reportDate ? new Date(data.reportDate).toLocaleDateString() : '—'}. Run &quot;Sync from QuickBooks&quot; on Overview to refresh.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        {[
          { label: 'Current', value: data.current },
          { label: '1-30 Days', value: data.agingBucket1_30 },
          { label: '31-60 Days', value: data.agingBucket31_60 },
          { label: '61-90 Days', value: data.agingBucket61_90 },
          { label: '91+ Days', value: data.agingBucket91Over },
          { label: `Total ${title.includes('Payable') ? 'AP' : 'AR'}`, value: data.total },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[hsl(var(--foreground)/0.1)] bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(Number(value), curr)}</p>
          </div>
        ))}
      </div>
      <div className={TABLE_WRAPPER_CLASS}>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead>{entityLabel}</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">1-30 Days</TableHead>
              <TableHead className="text-right">31-60 Days</TableHead>
              <TableHead className="text-right">61-90 Days</TableHead>
              <TableHead className="text-right">91+ Days</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No detail rows
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">{row.entityName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.current), curr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.agingBucket1_30), curr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.agingBucket31_60), curr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.agingBucket61_90), curr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.agingBucket91Over), curr)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(Number(row.total), curr)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2 border-[hsl(var(--foreground)/0.12)]">
                  <TableCell className="font-bold text-foreground">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.current), curr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.agingBucket1_30), curr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.agingBucket31_60), curr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.agingBucket61_90), curr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.agingBucket91Over), curr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(data.total), curr)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AgingTab({ quickbooksAvailable, loading, ap, ar }: AgingTabProps) {
  if (!quickbooksAvailable) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground py-8 text-center">Connect QuickBooks to view AP/AR aging.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
        <TableSkeleton columns={7} rows={5} />
      </div>
    );
  }

  const hasData = ap || ar;
  if (!hasData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground py-8 text-center">
          No aging data yet. Run &quot;Sync from QuickBooks&quot; on the Overview tab to sync AP and AR aging.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-2">Accounts Payable &amp; Receivable Aging</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Synced from QuickBooks. Aging buckets are based on the report date at sync time.
      </p>
      <AgingSection title="Accounts Payable Aging" entityLabel="Vendor" data={ap} currency="USD" />
      <AgingSection title="Accounts Receivable Aging" entityLabel="Customer" data={ar} currency="USD" />
    </div>
  );
}
