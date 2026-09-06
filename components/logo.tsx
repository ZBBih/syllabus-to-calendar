export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="var(--accent)" />
      <rect x="12" y="16" width="40" height="36" rx="6" fill="#1c1917" />
      <rect x="12" y="22" width="40" height="4" fill="var(--accent)" opacity="0.35" />
      <rect x="20" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
      <rect x="39" y="10" width="5" height="12" rx="2.5" fill="#1c1917" />
      <path d="M23 38 L30 45 L42 31" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
