import { newId } from './extract'

export type Weight = {
  id: string
  label: string
  /** Share of the final grade, as a percentage. */
  weight: number
  /** What the student scored in that category, as a percentage. Undefined until they enter one. */
  earned?: number
}

const PERCENT_LINE = /^(.{2,60}?)[\s.·:…\-]*(\d{1,3}(?:\.\d)?)\s*%\s*$/
const PERCENT_LEADING = /^(\d{1,3}(?:\.\d)?)\s*%\s*[\s.·:…\-]*(.{2,60}?)\s*$/
const DROP = /\b(late|penalt|per day|per class|deduct|attendance polic|curve|scale|minimum|at least|below|above|threshold|extra credit|bonus)\b/i
const GRADE_SCALE = /^[A-F][+-]?\b/
// The last row of a grading table states the sum of the rows above it, not another category.
// Counting it doubles the total, and the sum guard below then discards the whole table.
const TOTAL_ROW = /^(?:sub)?total\b|^overall\b|^sum\b/i
const CLEAN = /^[\s\-–—:|•*.,\d)(]+|[\s\-–—:|•*.,]+$/g
// A syllabus often writes the whole breakdown as one sentence rather than a table:
// "Grading: Problem sets 20%, Quizzes 15%, Midterm 25%". These pick the pairs out of it.
const LEAD_IN = /^(?:grading|grades?|grade breakdown|assessment|evaluation|course grade|final grade|weighting|weights?)\s*[:\-–—]\s*/i
const PERCENT_TOKEN = /\d{1,3}(?:\.\d)?\s*%/g
// Lazy label, so "Exam 1 20%" keeps its number while "Exams 40%" stops before the weight.
const PAIR = /([A-Za-z][^%]{0,59}?)\s*[:\-–—]?\s*(\d{1,3}(?:\.\d)?)\s*%/g

function cleanLabel(s: string) {
  return s
    .replace(/\.{2,}/g, ' ')
    .replace(/[…]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(CLEAN, '')
    .trim()
}

/**
 * Pull a grading breakdown out of a syllabus.
 *
 * Syllabi state this as a small table (Exams 40%, Homework 25%) and almost nothing else in the
 * document is a list of percentages that adds to roughly one hundred. That sum is the whole
 * precision guard: a page that happens to mention percentages will not add up, so it returns
 * nothing rather than a plausible-looking wrong answer. A student can always add rows by hand.
 */
export function extractWeights(text: string): Weight[] {
  const found: { label: string; weight: number; inline: boolean }[] = []
  let readingInline = false
  const keep = (rawLabel: string, rawWeight: string) => {
    let label = cleanLabel(rawLabel)
    const weight = Number(rawWeight)
    // A three-column table puts the points beside the percentage: "Midterm II 200 20%". The
    // points are not part of the category's name, and they are the larger of the two numbers,
    // which is what tells them apart from a label that ends in a number of its own ("Quiz 2").
    const points = /^(.*\S)\s+(\d{2,4})$/.exec(label)
    if (points && Number(points[2]) > weight) label = points[1]
    if (!label || label.length < 2 || weight <= 0 || weight > 100) return
    if (/^\d+$/.test(label)) return
    if (DROP.test(label)) return
    if (TOTAL_ROW.test(label)) return
    found.push({ label, weight, inline: readingInline })
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (DROP.test(line)) continue
    if (GRADE_SCALE.test(line)) continue

    // Several percentages on one line means the breakdown is written as prose, not a table.
    // Each label-and-weight pair is read out of it; the sum guard below still decides whether
    // any of it was really a grading breakdown.
    const inline = line.match(PERCENT_TOKEN)
    if (inline && inline.length > 1) {
      if (line.length > 300) continue
      const body = line.replace(LEAD_IN, '')
      if (GRADE_SCALE.test(body)) continue
      readingInline = true
      for (const m of body.matchAll(PAIR)) keep(m[1], m[2])
      readingInline = false
      continue
    }

    if (line.length > 80) continue
    // "Homework 25%" is by far the common shape; "25% Homework" is the same table transposed.
    const trailing = PERCENT_LINE.exec(line)
    const leading = trailing ? null : PERCENT_LEADING.exec(line)
    if (!trailing && !leading) continue
    keep(trailing ? trailing[1] : leading![2], trailing ? trailing[2] : leading![1])
  }

  const byLabel = new Map<string, { label: string; weight: number; inline: boolean }>()
  for (const f of found) {
    const k = f.label.toLowerCase()
    if (!byLabel.has(k)) byLabel.set(k, f)
  }
  const rows = [...byLabel.values()]
  if (rows.length < 2) return []

  // The sum is the whole precision guard, and prose needs a stricter one than a table does.
  // A table can be read off a PDF with a digit misread, so it gets room; a sentence that
  // happens to contain percentages ("attendance is 95% expected... 12% of the time") lands
  // inside a loose window by luck, and a breakdown actually written out always totals 100.
  const total = rows.reduce((n, r) => n + r.weight, 0)
  const strict = rows.every((r) => r.inline)
  if (total < (strict ? 98 : 90) || total > (strict ? 102 : 110)) return []

  return rows.map((r) => ({ id: newId(), label: r.label, weight: r.weight }))
}

export type GradeSummary = {
  /** Weight of the categories that have a score entered. */
  graded: number
  /** Weight of every category, entered or not. Usually 100. */
  total: number
  /** Grade across graded work only. Null until something is entered. */
  current: number | null
  /** Final grade if every remaining category is a perfect score. */
  ceiling: number | null
  /** Final grade if every remaining category is a zero. */
  floor: number | null
}

export function gradeSummary(weights: Weight[]): GradeSummary {
  const total = weights.reduce((n, w) => n + w.weight, 0)
  const scored = weights.filter((w) => typeof w.earned === 'number' && !Number.isNaN(w.earned))
  const graded = scored.reduce((n, w) => n + w.weight, 0)
  const points = scored.reduce((n, w) => n + w.weight * (w.earned as number), 0)
  if (graded === 0 || total === 0) return { graded, total, current: null, ceiling: null, floor: null }
  return {
    graded,
    total,
    current: points / graded,
    ceiling: (points + (total - graded) * 100) / total,
    floor: points / total,
  }
}

const LETTERS: [number, string][] = [
  [93, 'A'],
  [90, 'A-'],
  [87, 'B+'],
  [83, 'B'],
  [80, 'B-'],
  [77, 'C+'],
  [73, 'C'],
  [70, 'C-'],
  [67, 'D+'],
  [63, 'D'],
  [60, 'D-'],
]

/** The usual US cutoffs. Schools differ, so this is a hint next to the number, not the number itself. */
export function letterFor(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return ''
  for (const [min, letter] of LETTERS) if (pct >= min) return letter
  return 'F'
}

export function blankWeight(): Weight {
  return { id: newId(), label: '', weight: 0 }
}

/**
 * Keep the scores a student has already typed when the syllabus is read again.
 * Categories are matched by label, so a revised grading table adds and removes rows
 * without wiping the numbers next to the ones that survived.
 */
export function mergeWeights(existing: Weight[], fresh: Weight[]): Weight[] {
  if (existing.length === 0) return fresh
  if (fresh.length === 0) return existing
  const scores = new Map(existing.filter((w) => typeof w.earned === 'number').map((w) => [w.label.toLowerCase(), w.earned as number]))
  const edited = existing.some((w) => typeof w.earned === 'number')
  if (!edited) return fresh
  return fresh.map((w) => {
    const earned = scores.get(w.label.toLowerCase())
    return earned === undefined ? w : { ...w, earned }
  })
}
