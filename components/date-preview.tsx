import type { Course } from '@/lib/store'

type Row = { key: string; date: string; time?: string; course: string; title: string; clash: boolean }

export function previewRows(courses: Course[]): Row[] {
  const rows = courses.flatMap((c) =>
    c.events
      .filter((e) => e.include !== false && e.date && e.title.trim())
      .map((e) => ({ key: e.id, date: e.date, time: e.time, course: c.name.trim() || 'Unnamed', title: e.title.trim(), clash: false })),
  )
  const perDay = new Map<string, number>()
  for (const r of rows) perDay.set(r.date, (perDay.get(r.date) ?? 0) + 1)
  return rows
    .map((r) => ({ ...r, clash: (perDay.get(r.date) ?? 0) > 1 }))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
}

const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export function DatePreview({ courses }: { courses: Course[] }) {
  const rows = previewRows(courses)
  if (rows.length === 0) return null
  const clashes = rows.filter((r) => r.clash).length
  return (
    <div className="card rise p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-extrabold">Everything, by date</h3>
        <p className="text-sm text-muted">
          {rows.length} event{rows.length === 1 ? '' : 's'}
          {clashes > 0 && <span className="ml-2 pill bg-accent-soft text-accent-strong">{clashes} share a day</span>}
        </p>
      </div>
      <ol className="stagger max-h-72 divide-y divide-line overflow-y-auto text-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex items-baseline gap-3 py-1.5">
            <span className={`w-28 shrink-0 font-semibold tabular-nums ${r.clash ? 'text-accent-strong' : 'text-muted'}`}>
              {fmt.format(new Date(`${r.date}T12:00:00`))}
              {r.time && <span className="ml-1 text-xs font-normal">{r.time}</span>}
            </span>
            <span className="truncate">
              <span className="font-semibold">{r.course}:</span> {r.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
