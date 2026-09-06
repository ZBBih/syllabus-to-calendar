'use client'

import { useState, type Dispatch } from 'react'
import type { Action, Course } from '@/lib/store'
import { gradeSummary, letterFor } from '@/lib/grades'
import { Chevron, Plus, Trash } from './icons'

/**
 * The grading table from the syllabus, turned into a running grade.
 *
 * Three of the competing products charge for exactly this, and it is the feature their own
 * reviewers name as the reason to pay. It costs nothing here because the number is arithmetic
 * on a table the syllabus already contains, and because there is no server to bill for.
 */

const pct = (n: number | null) => (n === null ? '--' : `${n.toFixed(1)}%`)

export function GradePanel({ course, dispatch }: { course: Course; dispatch: Dispatch<Action> }) {
  const weights = course.weights ?? []
  const [open, setOpen] = useState(false)
  const summary = gradeSummary(weights)
  const detected = weights.length > 0

  return (
    <section className="card mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left sm:px-5"
      >
        <span className="text-muted">
          <Chevron open={open} size={14} />
        </span>
        <span className="font-display text-lg">Grade</span>
        <span className="ml-auto flex items-center gap-2 text-sm">
          {summary.current !== null ? (
            <>
              <span className="font-semibold tabular-nums">{pct(summary.current)}</span>
              <span className="pill pill-ok">{letterFor(summary.current)}</span>
            </>
          ) : (
            <span className="text-muted">{detected ? `${weights.length} categories found` : 'add your categories'}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-4 sm:px-5">
          {!detected && (
            <p className="mb-3 text-sm text-muted">
              No grading table was found in this syllabus. Add the categories yourself and the maths still works.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-2 pr-2 font-semibold">Category</th>
                  <th className="w-20 pb-2 pr-2 font-semibold">Weight</th>
                  <th className="w-24 pb-2 pr-2 font-semibold">Your score</th>
                  <th className="w-8 pb-2" />
                </tr>
              </thead>
              <tbody>
                {weights.map((w) => (
                  <tr key={w.id} className="border-t border-line">
                    <td className="py-1.5 pr-2">
                      <input
                        value={w.label}
                        onChange={(e) => dispatch({ type: 'updateWeight', courseId: course.id, weightId: w.id, patch: { label: e.target.value } })}
                        placeholder="e.g. Midterm"
                        aria-label="Category"
                        className="field py-1"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={w.weight || ''}
                          onChange={(e) => dispatch({ type: 'updateWeight', courseId: course.id, weightId: w.id, patch: { weight: Number(e.target.value) } })}
                          aria-label="Weight percent"
                          className="field py-1 tabular-nums"
                        />
                        <span className="text-xs text-muted">%</span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={150}
                          value={w.earned ?? ''}
                          placeholder="--"
                          onChange={(e) =>
                            dispatch({
                              type: 'updateWeight',
                              courseId: course.id,
                              weightId: w.id,
                              patch: { earned: e.target.value === '' ? undefined : Number(e.target.value) },
                            })
                          }
                          aria-label="Your score percent"
                          className="field py-1 tabular-nums"
                        />
                        <span className="text-xs text-muted">%</span>
                      </div>
                    </td>
                    <td className="py-1.5">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'removeWeight', courseId: course.id, weightId: w.id })}
                        className="icon-btn"
                        aria-label={`Remove ${w.label || 'category'}`}
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => dispatch({ type: 'addWeight', courseId: course.id })} className="btn btn-secondary btn-sm">
              <Plus size={13} /> Add category
            </button>
            <span className={`text-xs ${Math.abs(summary.total - 100) > 0.5 ? 'text-warn' : 'text-muted'}`}>
              Weights total {summary.total.toFixed(0)}%
              {Math.abs(summary.total - 100) > 0.5 && ', which is not 100. Check the syllabus.'}
            </span>
          </div>

          {summary.current !== null && (
            <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Grade so far</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">
                  {pct(summary.current)} <span className="text-base text-muted">{letterFor(summary.current)}</span>
                </dd>
                <p className="mt-0.5 text-xs text-muted">Across the {summary.graded.toFixed(0)}% that has been graded.</p>
              </div>
              <div>
                <dt className="eyebrow">Best case</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">
                  {pct(summary.ceiling)} <span className="text-base text-muted">{letterFor(summary.ceiling)}</span>
                </dd>
                <p className="mt-0.5 text-xs text-muted">If everything left is a perfect score.</p>
              </div>
              <div>
                <dt className="eyebrow">Worst case</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">
                  {pct(summary.floor)} <span className="text-base text-muted">{letterFor(summary.floor)}</span>
                </dd>
                <p className="mt-0.5 text-xs text-muted">If you hand in nothing else.</p>
              </div>
            </dl>
          )}

          <p className="mt-4 text-xs text-muted">
            Letters use the common cutoffs. Your school may round differently, so treat the letter as a hint and the percentage as the number.
          </p>
        </div>
      )}
    </section>
  )
}
