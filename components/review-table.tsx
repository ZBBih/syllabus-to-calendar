'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'

export function ReviewTable({ course, dispatch }: { course: Course; dispatch: Dispatch<Action> }) {
  const low = course.events.filter((e) => e.confidence === 'low').length
  const included = course.events.filter((e) => e.include !== false).length
  const name = course.name.trim() || 'Unnamed class'

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-zinc-600">
          {course.events.length} event{course.events.length === 1 ? '' : 's'}, {included} included
          {low > 0 && <span className="text-amber-700">, {low} need a look</span>}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-2 py-1">Include</th>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">Title</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {course.events.map((e) => {
              const update = (patch: Partial<typeof e>) =>
                dispatch({ type: 'updateEvent', courseId: course.id, eventId: e.id, patch })
              return (
                <tr key={e.id} className={e.confidence === 'low' ? 'bg-amber-50' : ''}>
                  <td className="px-2 py-1 align-top">
                    <input
                      type="checkbox"
                      checked={e.include !== false}
                      onChange={(ev) => update({ include: ev.target.checked })}
                      className="mt-2"
                    />
                  </td>
                  <td className="px-2 py-1 align-top">
                    <input
                      type="date"
                      value={e.date}
                      onChange={(ev) => update({ date: ev.target.value })}
                      className="rounded border border-zinc-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1 align-top">
                    <input
                      type="time"
                      value={e.time ?? ''}
                      onChange={(ev) => update({ time: ev.target.value || undefined })}
                      className="rounded border border-zinc-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1 align-top">
                    <input
                      value={e.title}
                      onChange={(ev) => update({ title: ev.target.value, confidence: 'high', reason: undefined })}
                      className="w-full min-w-48 rounded border border-zinc-300 px-2 py-1"
                    />
                    {e.confidence === 'low' && <p className="mt-1 text-xs text-amber-700">Check this one: {e.reason}</p>}
                  </td>
                  <td className="px-2 py-1 align-top">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'deleteEvent', courseId: course.id, eventId: e.id })}
                      className="mt-1 text-zinc-400 hover:text-red-600"
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

      <button
        type="button"
        onClick={() => dispatch({ type: 'addEvent', courseId: course.id })}
        className="mt-3 text-sm font-medium text-blue-700 hover:underline"
      >
        + Add row
      </button>
    </div>
  )
}
