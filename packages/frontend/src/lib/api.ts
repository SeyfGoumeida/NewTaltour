'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const TOKEN_KEY = 'taltour_token';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function getSiteCookie(): 'dz' | 'ma' {
  if (typeof document === 'undefined') return 'dz';
  return /(?:^|; )site=ma(?:;|$)/.test(document.cookie) ? 'ma' : 'dz';
}

function token() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}): Promise<T> {
  const url = new URL(BASE + path);
  if (init.query) for (const [k, v] of Object.entries(init.query)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { 'x-site': getSiteCookie() };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  const t = token();
  if (t) headers.authorization = `Bearer ${t}`;
  const res = await fetch(url, { method: init.method || (init.body !== undefined ? 'POST' : 'GET'), headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Erreur ${res.status}`);
  return data as T;
}

export const fetcher = (path: string) => api(path);
