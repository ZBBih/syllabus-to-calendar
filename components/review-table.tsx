'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'

export function ReviewTable({ course, dispatch }: { course: Course; dispatch: Dispatch<Action> }) {
  const low = course.events.filter((e) => e.confidence === 'low').length
  const included = course.events.filter((e) => e.include !== false).length
  const name = course.name.trim() || 'Unnamed class'

  return (
    <div className="card rise p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-extrabold">{name}</h3>
        <p className="text-sm text-muted">
          {course.events.length} event{course.events.length === 1 ? '' : 's'}, {included} included
          {low > 0 && <span className="ml-2 pill bg-accent-soft text-accent-strong">{low} to check</span>}
        </p>
      </div>

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
            {course.events.map((e) => {
              const update = (patch: Partial<typeof e>) => dispatch({ type: 'updateEvent', courseId: course.id, eventId: e.id, patch })
              const off = e.include === false
              return (
                <tr key={e.id} className={`${e.confidence === 'low' ? 'bg-accent-soft/60' : ''} ${off ? 'opacity-50' : ''} rounded-lg transition`}>
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
                    <input
                      value={e.title}
                      onChange={(ev) => update({ title: ev.target.value, confidence: 'high', reason: undefined })}
                      className="field min-w-48 py-1.5"
                    />
                    {e.confidence === 'low' && (
                      <p className="mt-1 text-xs font-medium text-accent-strong">Check this one: {e.reason}</p>
                    )}
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

      <button type="button" onClick={() => dispatch({ type: 'addEvent', courseId: course.id })} className="btn btn-secondary mt-3 px-3 py-1.5 text-xs">
        + Add row
      </button>
    </div>
  )
}
