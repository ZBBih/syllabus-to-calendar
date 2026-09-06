'use client'

import { useState, type Dispatch } from 'react'
import { SEASONS, type Season } from '@/lib/extract'
import type { Action, Course } from '@/lib/store'
import { DAY_LABEL } from '@/lib/meeting'
import { Doc, Trash, X } from './icons'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function ClassRow({
  course,
  index,
  dispatch,
  onEditText,
}: {
  course: Course
  index: number
  dispatch: Dispatch<Action>
  onEditText: () => void
}) {
  const [touched, setTouched] = useState(false)
  const n = course.events.length
  const weights = course.weights?.length ?? 0
  const nameMissing = course.name.trim() === ''

  return (
    <div className="card rise flex flex-col gap-3 p-3.5 sm:flex-row sm:items-start">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Doc size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="clearable">
          <input
            value={course.name}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { name: e.target.value } })}
            onBlur={() => setTouched(true)}
            placeholder={`Class ${index + 1} name, e.g. ECON 101`}
            aria-label="Class name"
            className="field pr-8 font-medium"
          />
          {course.name && (
            <button type="button" className="clear" aria-label="Clear name" onClick={() => dispatch({ type: 'update', id: course.id, patch: { name: '' } })}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          {touched && nameMissing ? (
            <span className="font-medium text-danger">Name required. It prefixes every event.</span>
          ) : (
            <>
              <span className={`pill ${n ? 'pill-ok' : 'pill-quiet'}`}>{n ? `${n} date${n === 1 ? '' : 's'}` : 'no dates yet'}</span>
              {weights > 0 && <span className="pill pill-quiet">grading table found</span>}
            </>
          )}
          <button type="button" onClick={onEditText} className="link text-xs">
            {course.text.trim() ? 'Edit text' : 'Paste text'}
          </button>
        </div>

        {course.meeting && (
          <label className="mt-1.5 flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={course.meetingIncluded !== false}
              onChange={(e) => dispatch({ type: 'setMeetingIncluded', courseId: course.id, include: e.target.checked })}
              className="mt-0.5 h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span>
              Weekly class {course.meeting.days.map((d) => DAY_LABEL[d]).join('/')} {course.meeting.start}&ndash;{course.meeting.end}
              {course.meeting.location ? `, ${course.meeting.location}` : ''}
            </span>
          </label>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <select
          value={course.term.season}
          aria-label="Term"
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, season: e.target.value as Season } } })}
          className="field w-auto py-1 text-xs"
        >
          {SEASONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={course.term.year}
          aria-label="Year"
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, year: Number(e.target.value) } } })}
          className="field w-auto py-1 text-xs"
        >
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const named = course.name.trim()
            const dates = course.events.length
            const warn = dates > 0 ? `Remove ${named || 'this class'} and its ${dates} date${dates === 1 ? '' : 's'}?` : null
            if (!warn || confirm(warn)) dispatch({ type: 'remove', id: course.id })
          }}
          className="icon-btn"
          aria-label={`Remove ${course.name.trim() || 'class'}`}
          title="Remove this class"
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  )
}
