'use client'

import { useState, type Dispatch } from 'react'
import { extractEvents, SEASONS, type Season } from '@/lib/extract'
import type { Action, Course } from '@/lib/store'
import { nameFromFileName } from '@/lib/course-name'
import { FileDrop } from './file-drop'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function CourseCard({
  course,
  index,
  canRemove,
  dispatch,
}: {
  course: Course
  index: number
  canRemove: boolean
  dispatch: Dispatch<Action>
}) {
  const [touched, setTouched] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const nameMissing = course.name.trim() === ''
  const canExtract = !nameMissing && course.text.trim() !== ''

  function report(found: number, verb = 'Found') {
    setNotice(
      found === 0
        ? 'No dates found. Check the term, or paste just the schedule section.'
        : `${verb} ${found} date${found === 1 ? '' : 's'}. They are waiting in step 2.`,
    )
  }

  function findDates() {
    const events = extractEvents(course.text, course.term)
    dispatch({ type: 'mergeEvents', id: course.id, events })
    report(events.length, course.extracted ? 'Re-ran and found' : 'Found')
  }

  return (
    <div className="card rise p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold">
          <span className="text-muted">Class {index + 1}</span>
          {course.name.trim() && <span className="ml-2">{course.name.trim()}</span>}
        </h3>
        {canRemove && (
          <button type="button" onClick={() => dispatch({ type: 'remove', id: course.id })} className="btn btn-ghost px-3 py-1 text-xs">
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="block text-sm">
          <span className="font-semibold">Class name</span>
          <input
            value={course.name}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { name: e.target.value } })}
            onBlur={() => setTouched(true)}
            placeholder="e.g. ECON 101"
            className="field mt-1"
          />
          {touched && nameMissing ? (
            <span className="text-xs font-medium text-danger">Required. It becomes the prefix on every event.</span>
          ) : (
            <span className="text-xs text-muted">
              {nameMissing ? 'Shows in your calendar as “Name: Midterm”' : `Shows as “${course.name.trim()}: Midterm”`}
            </span>
          )}
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Term</span>
          <select
            value={course.term.season}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, season: e.target.value as Season } } })}
            className="field mt-1"
          >
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Year</span>
          <select
            value={course.term.year}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, year: Number(e.target.value) } } })}
            className="field mt-1"
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <FileDrop
          onFiles={([file]) => {
            const name = course.name.trim() || nameFromFileName(file.fileName)
            dispatch({ type: 'update', id: course.id, patch: { text: file.text, name } })
            if (name) {
              const events = extractEvents(file.text, course.term)
              dispatch({ type: 'mergeEvents', id: course.id, events })
              report(events.length)
            } else {
              setNotice('File read. Add a class name, then click Find dates.')
            }
          }}
        />
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-semibold">Syllabus text</span>
        <textarea
          value={course.text}
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { text: e.target.value } })}
          placeholder="Or paste your syllabus here. The schedule section is all it needs."
          rows={7}
          className="field mt-1 font-mono text-xs"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={findDates} disabled={!canExtract} className="btn btn-primary">
          {course.extracted ? 'Re-run' : 'Find dates'}
        </button>
        {!canExtract ? (
          <span className="text-xs text-muted">Add a class name and some syllabus text first.</span>
        ) : (
          notice && <span className="pop text-sm font-medium">{notice}</span>
        )}
      </div>
    </div>
  )
}
