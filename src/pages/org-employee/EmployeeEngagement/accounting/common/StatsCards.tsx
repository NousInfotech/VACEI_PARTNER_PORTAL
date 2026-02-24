export interface StatCardItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface StatsCardsProps {
  items: StatCardItem[];
  className?: string;
}

export function StatsCards({ items, className = '' }: StatsCardsProps) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full ${className}`}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`rounded-xl border border-[hsl(var(--foreground)/0.1)] overflow-hidden bg-muted/30 min-h-[80px] flex flex-col justify-center px-5 py-4 ${
            item.highlight ? 'ring-1 ring-primary/20' : ''
          }`}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {item.label}
          </p>
          <p className={`text-xl md:text-2xl font-bold text-foreground tabular-nums ${item.highlight ? 'text-primary' : ''}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
