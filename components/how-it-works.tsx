/**
 * Three panels with arrows between them: the shape people already recognise from every
 * "how it works" strip, which is the point. It should be readable in one glance without
 * anybody having to read it.
 */

function DocGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <path d="M14 6h24l12 12v40a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M38 6v12h12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M21 32h22M21 41h22M21 50h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function ListGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <text x="2" y="22" fontSize="19" fontWeight="700" fill="currentColor" fontFamily="var(--font-body), sans-serif">
        1
      </text>
      <text x="2" y="42" fontSize="19" fontWeight="700" fill="currentColor" fontFamily="var(--font-body), sans-serif">
        2
      </text>
      <text x="2" y="62" fontSize="19" fontWeight="700" fill="currentColor" fontFamily="var(--font-body), sans-serif">
        3
      </text>
      <rect x="20" y="8" width="42" height="9" rx="4.5" fill="currentColor" />
      <rect x="20" y="28" width="42" height="9" rx="4.5" fill="currentColor" />
      <rect x="20" y="48" width="42" height="9" rx="4.5" fill="currentColor" />
    </svg>
  )
}

function CalGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <rect x="6" y="12" width="52" height="46" rx="5" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M6 26h52" stroke="currentColor" strokeWidth="4" />
      <path d="M18 6v10M46 6v10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="15" y="33" width="8" height="7" rx="2" fill="currentColor" />
      <rect x="28" y="33" width="8" height="7" rx="2" fill="currentColor" />
      <rect x="41" y="33" width="8" height="7" rx="2" fill="currentColor" />
      <rect x="15" y="45" width="8" height="7" rx="2" fill="currentColor" />
      <rect x="28" y="45" width="8" height="7" rx="2" fill="currentColor" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 48 24" className="arrow-nudge h-5 w-10 shrink-0 text-line-strong sm:h-6 sm:w-12" aria-hidden="true">
      <path d="M2 12h34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 4l12 8-12 8z" fill="currentColor" />
    </svg>
  )
}

const PANELS = [
  { glyph: <DocGlyph />, lead: 'Drop', rest: 'your syllabi', detail: 'PDF, Word, a screenshot, or a photo of the page' },
  { glyph: <ListGlyph />, lead: 'Every date', rest: 'pulled out', detail: 'Homework, exams, papers, and your weekly class time' },
  { glyph: <CalGlyph />, lead: 'Import', rest: 'to your calendar', detail: 'Google, Apple, or Outlook, with reminders attached' },
]

export function HowItWorks({ onSample }: { onSample?: () => void }) {
  return (
    <section aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-center font-display text-3xl sm:text-4xl">
        How it works
      </h2>

      <div className="stagger mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        {PANELS.map((p, i) => (
          <div key={p.lead} className="contents">
            {i > 0 && (
              <div className="rotate-90 sm:mt-12 sm:rotate-0">
                <Arrow />
              </div>
            )}
            <div className="flex max-w-xs flex-1 flex-col items-center text-center">
              <span className="text-accent">{p.glyph}</span>
              <p className="mt-4 text-lg">
                <strong className="font-semibold">{p.lead}</strong> {p.rest}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.detail}</p>
              {i === 0 && onSample && (
                <button type="button" onClick={onSample} className="link mt-2 text-sm">
                  or get a sample
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
