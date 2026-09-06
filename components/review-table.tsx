'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'
import type { ExtractedEvent } from '@/lib/extract'

export function ReviewTable({ course, rows, dispatch }: { course: Course; rows?: ExtractedEvent[]; dispatch: Dispatch<Action> }) {
  const list = rows ?? course.events
  if (list.length === 0) return <p className="py-6 text-center text-sm text-muted">Nothing to show here.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-muted">
            <th className="px-2 py-1">In</th>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Time</th>
            <th className="px-2 py-1">Title</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody className="stagger">
          {list.map((e) => {
            const update = (patch: Partial<typeof e>) => dispatch({ type: 'updateEvent', courseId: course.id, eventId: e.id, patch })
            const off = e.include === false
            return (
              <tr key={e.id} className={`${e.confidence === 'low' ? 'bg-accent-soft/60' : ''} ${off ? 'opacity-50' : ''} transition`}>
                <td className="px-2 py-1.5 align-top">
                  <input type="checkbox" checked={!off} onChange={(ev) => update({ include: ev.target.checked })} className="mt-2.5 h-4 w-4 accent-[var(--accent)]" />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <input type="date" value={e.date} onChange={(ev) => update({ date: ev.target.value })} className="field py-1.5" />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <input type="time" value={e.time ?? ''} onChange={(ev) => update({ time: ev.target.value || undefined })} className="field py-1.5" />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <div className="clearable">
                    <input
                      value={e.title}
                      onChange={(ev) => update({ title: ev.target.value, confidence: 'high', reason: undefined })}
                      className="field min-w-48 py-1.5 pr-8"
                      aria-label="Title"
                    />
                    {e.title && (
                      <button type="button" className="clear" aria-label="Clear title" onClick={() => update({ title: '' })}>
                        ✕
                      </button>
                    )}
                  </div>
                  {e.confidence === 'low' && <p className="mt-1 text-xs font-medium text-accent-strong">Check this one: {e.reason}</p>}
                </td>
                <td className="px-2 py-1.5 align-top">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'deleteEvent', courseId: course.id, eventId: e.id })}
                    className="btn btn-ghost mt-0.5 px-2 py-1"
                    aria-label="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
