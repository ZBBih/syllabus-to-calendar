'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'
import type { ExtractedEvent } from '@/lib/extract'
import { isComplete } from '@/lib/export'
import { nextDay } from '@/lib/ics'
import { Plus, Trash, X } from './icons'

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
                  <input type="date" value={e.date} onChange={(ev) => update({ date: ev.target.value })} className="field py-1 font-mono text-[0.875rem]" aria-label="Date" />
                  {/* A range is editable wherever it came from. Extraction finds "Oct 20-21" on
                      its own, but a student recovering that line from the read report, or adding
                      a break by hand, arrives with a single day and used to have no way to
                      widen it. The end date starts the day after the start, which is what
                      asking for a range means, and DTEND is computed from it either way. */}
                  {e.endDate ? (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="shrink-0 text-xs text-muted">to</span>
                      <input
                        type="date"
                        value={e.endDate}
                        min={e.date || undefined}
                        onChange={(ev) => update({ endDate: ev.target.value || undefined })}
                        className="field py-1 font-mono text-[0.875rem]"
                        aria-label="Last day"
                      />
                      <button
                        type="button"
                        onClick={() => update({ endDate: undefined })}
                        className="icon-btn shrink-0"
                        aria-label={`This runs to ${e.endDate}. Make it one day.`}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    e.date !== '' && (
                      <button
                        type="button"
                        onClick={() => update({ endDate: nextDay(e.date) })}
                        className="pill mt-1 hover:text-fg"
                        aria-label={`Make ${e.title || 'this row'} run over more than one day`}
                      >
                        <Plus size={11} /> end date
                      </button>
                    )
                  )}
                </td>
                <td className="cell-time px-2 py-1.5 align-top">
                  <input type="time" value={e.time ?? ''} onChange={(ev) => update({ time: ev.target.value || undefined })} className="field py-1 font-mono text-[0.875rem]" aria-label="Time" />
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
