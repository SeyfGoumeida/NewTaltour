import 'server-only';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { SiteCode, SiteInfo } from './types';

const BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function currentSite(): SiteCode {
  return cookies().get('site')?.value === 'ma' ? 'ma' : 'dz';
}

export async function sapi<T = any>(path: string, opts: { notFoundOn404?: boolean } = {}): Promise<T> {
  const res = await fetch(BASE + path, { headers: { 'x-site': currentSite() }, cache: 'no-store' });
  if (res.status === 404 && opts.notFoundOn404) notFound();
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export const getSite = () => sapi<SiteInfo>('/site');
