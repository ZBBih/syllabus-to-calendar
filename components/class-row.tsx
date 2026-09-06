'use client'

import { useState, type Dispatch } from 'react'
import { SEASONS, type Season } from '@/lib/extract'
import type { Action, Course } from '@/lib/store'
import { DAY_LABEL } from '@/lib/meeting'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function ClassRow({
  course,
  index,
  canRemove,
  dispatch,
  onEditText,
}: {
  course: Course
  index: number
  canRemove: boolean
  dispatch: Dispatch<Action>
  onEditText: () => void
}) {
  const [touched, setTouched] = useState(false)
  const n = course.events.length
  const nameMissing = course.name.trim() === ''

  return (
    <div className="card rise flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="clearable">
          <input
            value={course.name}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { name: e.target.value } })}
            onBlur={() => setTouched(true)}
            placeholder={`Class ${index + 1} name, e.g. ECON 101`}
            aria-label="Class name"
            className="field pr-9 font-semibold"
          />
          {course.name && (
            <button
              type="button"
              className="clear"
              aria-label="Clear name"
              onClick={() => dispatch({ type: 'update', id: course.id, patch: { name: '' } })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {touched && nameMissing ? (
            <span className="font-medium text-danger">Name required. It prefixes every event.</span>
          ) : (
            <span className={`pill ${n ? 'bg-ok-soft text-ok' : 'bg-line text-muted'}`}>{n ? `${n} date${n === 1 ? '' : 's'}` : 'no dates yet'}</span>
          )}
          <button type="button" onClick={onEditText} className="font-semibold text-accent-strong hover:underline">
            {course.text.trim() ? 'Edit text' : 'Paste text'}
          </button>
        </div>
        {course.meeting && (
          <label className="mt-1.5 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={course.meetingIncluded !== false}
              onChange={(e) => dispatch({ type: 'setMeetingIncluded', courseId: course.id, include: e.target.checked })}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span>
              Weekly class {course.meeting.days.map((d) => DAY_LABEL[d]).join('/')} {course.meeting.start}–{course.meeting.end}
              {course.meeting.location ? `, ${course.meeting.location}` : ''}
            </span>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={course.term.season}
          aria-label="Term"
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, season: e.target.value as Season } } })}
          className="field w-auto py-1.5 text-xs"
        >
          {SEASONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={course.term.year}
          aria-label="Year"
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, year: Number(e.target.value) } } })}
          className="field w-auto py-1.5 text-xs"
        >
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        {canRemove && (
          <button type="button" onClick={() => dispatch({ type: 'remove', id: course.id })} className="btn btn-ghost px-2 py-1" aria-label="Remove class">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
