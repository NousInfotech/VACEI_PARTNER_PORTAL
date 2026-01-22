import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export function useTabQuery(initialTab: string, paramName: string = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    return searchParams.get(paramName) || initialTab;
  }, [searchParams, paramName, initialTab]);

  const setTab = useCallback((newTab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(paramName, newTab);
      return next;
    }, { replace: true });
  }, [setSearchParams, paramName]);

  return [activeTab, setTab] as const;
}
