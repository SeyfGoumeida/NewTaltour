export function FlagDz({ className = 'h-3.5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="15" height="20" fill="#006233" />
      <rect x="15" width="15" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5" fill="#D21034" />
      <circle cx="16.4" cy="10" r="4" fill="#fff" />
      <path d="m18.4 10 1.9-.6-1.2 1.6V9l1.2 1.6z" fill="#D21034" />
    </svg>
  );
}

export function FlagMa({ className = 'h-3.5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#C1272D" />
      <path d="m15 5.2 1.4 4.3h4.5l-3.6 2.7 1.4 4.3-3.7-2.7-3.7 2.7 1.4-4.3-3.6-2.7h4.5z" fill="none" stroke="#006233" strokeWidth="0.9" />
    </svg>
  );
}
