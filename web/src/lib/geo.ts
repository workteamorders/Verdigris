'use client';
import { useQuery } from '@tanstack/react-query';
import { CONFIG } from './config';

/** Asks the relay whether this visitor's region is view-only. Failure means "not blocked"; the relay never returns the country. */
export function useGeoBlocked(): boolean {
  const q = useQuery({
    queryKey: ['geo'],
    enabled: !CONFIG.rpcUrl,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<boolean> => {
      const r = await fetch('/api/rpc', { headers: { accept: 'application/json' } });
      if (!r.ok) return false;
      return ((await r.json()) as { blocked?: boolean }).blocked === true;
    },
  });
  return q.data === true;
}
