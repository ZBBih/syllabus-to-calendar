export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="var(--accent)" />
      <rect x="12" y="15" width="40" height="37" rx="7" fill="var(--accent-ink)" />
      <rect x="12" y="15" width="40" height="9" rx="7" fill="var(--accent-strong)" />
      <rect x="12" y="20" width="40" height="4" fill="var(--accent-strong)" />
      <rect x="20" y="9" width="5" height="11" rx="2.5" fill="var(--accent-strong)" />
      <rect x="39" y="9" width="5" height="11" rx="2.5" fill="var(--accent-strong)" />
      <path d="M22 37 L29 44 L43 30" fill="none" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
