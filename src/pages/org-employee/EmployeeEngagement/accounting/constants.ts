export const CYCLE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] as const;
export const TRANSACTION_TYPES = ['INVOICE', 'BILL', 'EXPENSE', 'JOURNAL_ENTRY'] as const;

export const TABLE_WRAPPER_CLASS =
  'rounded-xl border border-[hsl(var(--foreground)/0.1)] overflow-hidden bg-background min-w-0 shadow-sm';
export const TABLE_HEADER_ROW_CLASS =
  'bg-muted/50 hover:bg-muted/50 border-b border-[hsl(var(--foreground)/0.08)] [&>th]:font-semibold [&>th]:text-foreground [&>th]:py-3';
