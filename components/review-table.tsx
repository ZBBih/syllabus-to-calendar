'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'
import type { ExtractedEvent } from '@/lib/extract'
import { isComplete } from '@/lib/export'
import { Trash, X } from './icons'

/** A range's last day, written the short way: the row already shows the year on the start date. */
function dayLabel(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function ReviewTable({ course, rows, dispatch }: { course: Course; rows?: ExtractedEvent[]; dispatch: Dispatch<Action> }) {
  const list = rows ?? course.events
  if (list.length === 0) return <p className="py-6 text-center text-sm text-muted">Nothing to show here.</p>
  return (
    <div className="review-table">
      <table className="w-full text-sm">
        <thead className="hidden sm:table-header-group">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
            <th className="px-2 pb-2">In</th>
            <th className="px-2 pb-2">Date</th>
            <th className="px-2 pb-2">Time</th>
            <th className="px-2 pb-2">Title</th>
            <th className="px-2 pb-2" />
          </tr>
        </thead>
        <tbody className="stagger">
          {list.map((e) => {
            const update = (patch: Partial<typeof e>) => dispatch({ type: 'updateEvent', courseId: course.id, eventId: e.id, patch })
            const off = e.include === false
            const blank = !isComplete(e)
            const flagged = e.confidence === 'low' || blank || e.missing
            return (
              <tr key={e.id} className={`${flagged ? 'bg-warn-soft/50' : ''} ${off ? 'opacity-50' : ''}`}>
                <td className="cell-check px-2 py-1.5 align-top">
                  <input
                    type="checkbox"
                    checked={!off}
                    onChange={(ev) => update({ include: ev.target.checked })}
                    className="mt-2 h-4 w-4 accent-[var(--accent)]"
                    aria-label={`Include ${e.title || 'this row'}`}
                  />
                </td>
                <td className="cell-date px-2 py-1.5 align-top">
                  <input type="date" value={e.date} onChange={(ev) => update({ date: ev.target.value })} className="field py-1" aria-label="Date" />
                  {e.endDate && (
                    <button
                      type="button"
                      onClick={() => update({ endDate: undefined })}
                      className="pill mt-1 hover:text-fg"
                      aria-label={`This runs to ${e.endDate}. Make it one day.`}
                    >
                      to {dayLabel(e.endDate)} <X size={11} />
                    </button>
                  )}
                </td>
                <td className="cell-time px-2 py-1.5 align-top">
                  <input type="time" value={e.time ?? ''} onChange={(ev) => update({ time: ev.target.value || undefined })} className="field py-1" aria-label="Time" />
                </td>
                <td className="cell-title px-2 py-1.5 align-top">
                  <div className="clearable">
                    <input
                      value={e.title}
                      onChange={(ev) => update({ title: ev.target.value, confidence: 'high', reason: undefined })}
                      className="field min-w-48 py-1 pr-8"
                      aria-label="Title"
                    />
                    {e.title && (
                      <button type="button" className="clear" aria-label="Clear title" onClick={() => update({ title: '' })}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  {blank ? (
                    <p className="mt-1 text-xs font-medium text-warn">Needs a date and a title to export.</p>
                  ) : e.missing ? (
                    <p className="mt-1 text-xs font-medium text-warn">The latest version of the syllabus does not mention this.</p>
                  ) : (
                    e.confidence === 'low' && <p className="mt-1 text-xs font-medium text-warn">Check this one: {e.reason}</p>
                  )}
                </td>
                <td className="cell-delete px-2 py-1.5 align-top">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'deleteEvent', courseId: course.id, eventId: e.id })}
                    className="icon-btn mt-0.5"
                    aria-label={`Delete ${e.title || 'this row'}`}
                  >
                    <Trash size={14} />
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
