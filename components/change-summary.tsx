'use client'

import type { Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'
import { diffCount, isEmptyDiff } from '@/lib/merge'
import { Plus, Swap, Alert, X } from './icons'

/**
 * What re-reading a syllabus changed.
 *
 * The standard criticism of every syllabus-only planner is that the schedule freezes on upload
 * day and is wrong by the third week. The honest answer is not to pretend otherwise, it is to
 * make re-reading the revised file cheap and to show plainly what moved, so a student can trust
 * the second pass as much as the first.
 */

const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const day = (iso: string) => (iso ? fmt.format(new Date(`${iso}T12:00:00`)) : 'no date')

export function ChangeSummary({ course, dispatch }: { course: Course; dispatch: Dispatch<Action> }) {
  const diff = course.diff
  if (isEmptyDiff(diff) || !diff) return null

  const byId = new Map(course.events.map((e) => [e.id, e]))
  const added = diff.added.map((id) => byId.get(id)).filter(Boolean)
  const missing = diff.missing.map((id) => byId.get(id)).filter(Boolean)
  const moved = diff.moved.filter((m) => byId.has(m.id))

  return (
    <section className="note note-accent rise mt-4" aria-label="What changed">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">
            {diffCount(diff)} change{diffCount(diff) === 1 ? '' : 's'} since the last read
          </h3>
          <p className="mt-0.5 text-xs text-muted">Your edits and tick boxes were kept. Exporting again updates these on your calendar rather than adding a second copy.</p>
        </div>
        <button type="button" onClick={() => dispatch({ type: 'dismissDiff', courseId: course.id })} className="icon-btn shrink-0" aria-label="Dismiss change summary">
          <X size={14} />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {moved.map((m) => (
          <li key={m.id} className="flex items-baseline gap-2">
            <span className="mt-0.5 shrink-0 text-accent">
              <Swap size={14} />
            </span>
            <span className="min-w-0">
              <span className="font-medium">{byId.get(m.id)!.title || 'Untitled'}</span>{' '}
              <span className="text-muted">
                moved from {day(m.from)} to {day(m.to)}
              </span>
            </span>
          </li>
        ))}
        {added.map((e) => (
          <li key={e!.id} className="flex items-baseline gap-2">
            <span className="mt-0.5 shrink-0 text-ok">
              <Plus size={14} />
            </span>
            <span className="min-w-0">
              <span className="font-medium">{e!.title || 'Untitled'}</span> <span className="text-muted">added on {day(e!.date)}</span>
            </span>
          </li>
        ))}
        {missing.map((e) => (
          <li key={e!.id} className="flex items-baseline gap-2">
            <span className="mt-0.5 shrink-0 text-warn">
              <Alert size={14} />
            </span>
            <span className="min-w-0">
              <span className="font-medium">{e!.title || 'Untitled'}</span> <span className="text-muted">on {day(e!.date)} is not in the new file</span>
            </span>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <p className="mr-auto text-xs text-muted">
            {missing.length === 1 ? 'That row is' : 'Those rows are'} still on your list and still ticked. The professor may have dropped{' '}
            {missing.length === 1 ? 'it' : 'them'}, or the new file may just be worded differently.
          </p>
          <button type="button" onClick={() => dispatch({ type: 'dropMissing', courseId: course.id })} className="btn btn-secondary btn-sm">
            Remove {missing.length === 1 ? 'it' : 'them'}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'keepMissing', courseId: course.id })} className="btn btn-secondary btn-sm">
            Keep {missing.length === 1 ? 'it' : 'them'}
          </button>
        </div>
      )}
    </section>
  )
}
