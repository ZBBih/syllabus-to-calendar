'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course, State } from '@/lib/store'
import { ReviewTable } from './review-table'
import { DatePreview } from './date-preview'
import { PasteSheet } from './paste-sheet'

export function ReviewStep({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const courses = state.courses.filter((c) => c.events.length > 0)
  const active = courses.find((c) => c.id === state.activeCourseId) ?? courses[0]
  const [needsCheck, setNeedsCheck] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (!active) {
    return (
      <div className="step-enter">
        <p className="text-muted">No dates yet. Go back and add a syllabus.</p>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-secondary mt-4">
          ← Back
        </button>
      </div>
    )
  }

  const low = active.events.filter((e) => e.confidence === 'low')
  const rows = needsCheck ? low : active.events
  const included = active.events.filter((e) => e.include !== false).length

  return (
    <div className="step-enter">
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Check the dates</h1>
      <p className="mt-2 text-muted">Fix anything amber, uncheck what you don&apos;t want, add what we missed.</p>

      <div role="tablist" aria-label="Classes" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {courses.map((c) => {
          const n = c.events.filter((e) => e.confidence === 'low').length
          const on = c.id === active.id
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={on}
              onClick={() => dispatch({ type: 'setActive', id: c.id })}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-elev text-fg hover:border-accent'
              }`}
            >
              {c.name.trim() || 'Unnamed'}
              {n > 0 && <span className={`pill ${on ? 'bg-accent-ink/15' : 'bg-accent-soft text-accent-strong'}`}>{n}</span>}
            </button>
          )
        })}
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="mr-auto text-sm text-muted">
            {active.events.length} event{active.events.length === 1 ? '' : 's'}, {included} included
          </span>
          <button type="button" onClick={() => dispatch({ type: 'setIncludeAll', courseId: active.id, include: true })} className="btn btn-secondary px-3 py-1">
            Select all
          </button>
          <button type="button" onClick={() => dispatch({ type: 'setIncludeAll', courseId: active.id, include: false })} className="btn btn-secondary px-3 py-1">
            Select none
          </button>
          <button
            type="button"
            aria-pressed={needsCheck}
            onClick={() => setNeedsCheck((v) => !v)}
            className={`btn px-3 py-1 ${needsCheck ? 'btn-primary' : 'btn-secondary'}`}
          >
            Needs check {low.length > 0 && `(${low.length})`}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'addEvent', courseId: active.id })} className="btn btn-secondary px-3 py-1">
            + Add row
          </button>
          <button type="button" onClick={() => setEditing(active)} className="btn btn-secondary px-3 py-1">
            Edit text
          </button>
        </div>
        <ReviewTable course={active} rows={rows} dispatch={dispatch} />
      </div>

      {courses.length > 1 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="btn btn-ghost px-2">
            {showAll ? '▾' : '▸'} All classes by date
          </button>
          {showAll && (
            <div className="mt-2">
              <DatePreview courses={state.courses} />
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-secondary">
          ← Back
        </button>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 3 })} className="btn btn-primary">
          Put it on my calendar →
        </button>
      </div>

      {editing && <PasteSheet course={editing} dispatch={dispatch} onClose={() => setEditing(null)} />}
    </div>
  )
}
