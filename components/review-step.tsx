'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course, State } from '@/lib/store'
import { isComplete } from '@/lib/export'
import { diffCount } from '@/lib/merge'
import { ReviewTable } from './review-table'
import { DatePreview } from './date-preview'
import { PasteSheet } from './paste-sheet'
import { ChangeSummary } from './change-summary'
import { GradePanel } from './grade-panel'
import { ArrowLeft, ArrowRight, Camera, Chevron, Plus } from './icons'

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
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    )
  }

  const low = active.events.filter((e) => e.confidence === 'low')
  const rows = needsCheck ? low : active.events
  const included = active.events.filter((e) => e.include !== false && isComplete(e)).length
  const incomplete = active.events.filter((e) => !isComplete(e)).length

  return (
    <div className="step-enter">
      <h1 className="h1">Check the dates</h1>
      <p className="lede mt-2">
        Nothing reaches your calendar until you say so. Fix anything marked amber, untick what you do not want, and add what was missed.
      </p>

      {courses.length > 1 && (
        <div role="tablist" aria-label="Classes" className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
          {courses.map((c) => {
            const n = c.events.filter((e) => e.confidence === 'low').length
            const changes = diffCount(c.diff)
            const on = c.id === active.id
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => dispatch({ type: 'setActive', id: c.id })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                  on ? 'border-accent bg-accent text-accent-ink font-semibold' : 'border-line-strong bg-elev text-fg hover:border-muted'
                }`}
              >
                {c.name.trim() || <span className={on ? '' : 'text-warn'}>Unnamed</span>}
                {n > 0 && <span className={`pill ${on ? 'bg-black/15 text-current' : 'pill-warn'}`}>{n}</span>}
                {changes > 0 && n === 0 && <span className={`pill ${on ? 'bg-black/15 text-current' : 'pill-ok'}`}>{changes} new</span>}
              </button>
            )
          })}
        </div>
      )}

      {active.viaPhoto && (
        <div className="note note-warn rise mt-4 flex gap-2.5">
          <span className="mt-0.5 shrink-0 text-warn">
            <Camera size={16} />
          </span>
          <span>
            <strong>This one came from a picture.</strong> Reading text off a photo is the least reliable route, and a misread month or a mangled word will show
            up here as a wrong date or a missing row. Give this list a closer look than usual, and paste the text instead if too much of it is off.
          </span>
        </div>
      )}

      <ChangeSummary course={active} dispatch={dispatch} />

      <div className="card mt-4 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-auto text-sm text-muted">
            {active.events.length} event{active.events.length === 1 ? '' : 's'}, {included} will export
            {incomplete > 0 && <span className="pill pill-warn ml-2">{incomplete} need a date and title</span>}
          </span>
          <button type="button" onClick={() => dispatch({ type: 'setIncludeAll', courseId: active.id, include: true })} className="btn btn-secondary btn-sm">
            All
          </button>
          <button type="button" onClick={() => dispatch({ type: 'setIncludeAll', courseId: active.id, include: false })} className="btn btn-secondary btn-sm">
            None
          </button>
          <button
            type="button"
            aria-pressed={needsCheck}
            onClick={() => setNeedsCheck((v) => !v)}
            className={`btn btn-sm ${needsCheck ? 'btn-primary' : 'btn-secondary'}`}
          >
            Needs check {low.length > 0 && `(${low.length})`}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'addEvent', courseId: active.id })} className="btn btn-secondary btn-sm">
            <Plus size={13} /> Row
          </button>
          <button type="button" onClick={() => setEditing(active)} className="btn btn-secondary btn-sm">
            Edit text
          </button>
        </div>
        <ReviewTable course={active} rows={rows} dispatch={dispatch} />
      </div>

      <GradePanel course={active} dispatch={dispatch} />

      {courses.length > 1 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="btn btn-ghost btn-sm">
            <Chevron open={showAll} size={13} /> All classes by date
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
          <ArrowLeft size={15} /> Back
        </button>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 3 })} className="btn btn-primary">
          Put it on my calendar <ArrowRight size={15} />
        </button>
      </div>

      {editing && <PasteSheet course={editing} dispatch={dispatch} onClose={() => setEditing(null)} />}
    </div>
  )
}
