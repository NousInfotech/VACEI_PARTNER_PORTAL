import { useState, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 10;

export interface UseTableStateOptions<T> {
  data: T[];
  pageSize?: number;
  searchKeys?: (keyof T)[];
  searchFn?: (item: T, search: string) => boolean;
  dateKey?: keyof T;
  filterByDateRange?: boolean;
}

export function useTableState<T>({
  data,
  pageSize = DEFAULT_PAGE_SIZE,
  searchKeys,
  searchFn,
  dateKey,
  filterByDateRange = false,
}: UseTableStateOptions<T>) {
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    let result = data;

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      if (searchFn) {
        result = result.filter((item) => searchFn(item, s));
      } else if (searchKeys?.length) {
        result = result.filter((item) =>
          searchKeys.some((key) => {
            const v = item[key];
            return typeof v === 'string' && v.toLowerCase().includes(s);
          })
        );
      } else {
        result = result.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(s)
        );
      }
    }

    if (filterByDateRange && dateKey && (dateFrom || dateTo)) {
      result = result.filter((item) => {
        const raw = item[dateKey];
        if (raw == null) return true;
        const d = typeof raw === 'string' ? new Date(raw) : (raw as unknown) as Date;
        if (isNaN(d.getTime())) return true;
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
        return true;
      });
    }

    return result;
  }, [data, search, searchKeys, searchFn, dateFrom, dateTo, dateKey, filterByDateRange]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSizeState));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const sliced = useMemo(
    () => filtered.slice((pageSafe - 1) * pageSizeState, pageSafe * pageSizeState),
    [filtered, pageSafe, pageSizeState]
  );

  const setPageSafe = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    page: pageSafe,
    setPage: setPageSafe,
    pageSize: pageSizeState,
    setPageSize: (s: number) => {
      setPageSizeState(s);
      setPage(1);
    },
    search,
    setSearch,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    total,
    totalPages,
    sliced,
    filtered,
  };
}
