'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/api';

export function useApi<T>(key: string | null, opts?: SWRConfiguration<T>) {
  return useSWR<T>(key, fetcher, opts);
}
