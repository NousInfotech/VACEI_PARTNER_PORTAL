import { Search } from 'lucide-react';

interface SearchAndDateFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
  searchPlaceholder?: string;
  showDateFilter?: boolean;
  className?: string;
}

export function SearchAndDateFilter({
  search,
  onSearchChange,
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  searchPlaceholder = 'Search...',
  showDateFilter = true,
  className = '',
}: SearchAndDateFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-[hsl(var(--foreground)/0.15)] bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {showDateFilter && onDateFromChange && onDateToChange && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 rounded-lg border border-[hsl(var(--foreground)/0.15)] bg-background px-2 text-foreground text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 rounded-lg border border-[hsl(var(--foreground)/0.15)] bg-background px-2 text-foreground text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
