export function StepHeading({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-black text-accent-ink shadow-sm">
        {n}
      </span>
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
    </div>
  )
}
