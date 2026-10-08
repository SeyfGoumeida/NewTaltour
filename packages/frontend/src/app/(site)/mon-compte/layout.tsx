import type { Metadata } from 'next';
import AccountShell from '@/components/compte/AccountShell';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false } };

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
