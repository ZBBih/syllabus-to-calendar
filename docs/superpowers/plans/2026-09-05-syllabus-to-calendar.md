# Syllabus to Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser-only Next.js app that turns pasted or uploaded syllabi into one downloadable `.ics` file with a calendar import walkthrough.

**Architecture:** Pure client rendering. Three lib modules (`convert`, `extract`, `ics`) are pure functions with unit tests. One page holds a `useReducer` store persisted to localStorage and renders three step sections built from four components.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, chrono-node, pdfjs-dist, mammoth, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-05-syllabus-to-calendar-design.md`

## Global Constraints

- No server code, no API keys, no network calls at runtime beyond static assets.
- First card is titled "Class 1"; class name is required and prefixes every event `Name: Title`.
- Supported uploads: `.pdf`, `.docx`, `.txt`, `.md`. Everything else → friendly error.
- Output is one combined file `my-classes.ics`, CRLF, folded at 75 octets, `VALARM` `-P1D`.
- localStorage key `stc:v1`.

---

### Task 1: Scaffold + test runner

**Files:** `package.json`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`

- [ ] `npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm`
- [ ] `npm i chrono-node pdfjs-dist mammoth && npm i -D vitest`
- [ ] `vitest.config.ts`: `export default defineConfig({ test: { environment: 'node', include: ['lib/**/*.test.ts'] } })`
- [ ] Add `"test": "vitest run"` script. Run `npm test` → "No test files found" exit 0 acceptable.
- [ ] Commit `chore: scaffold next app with vitest`.

### Task 2: `lib/ics.ts`

**Produces:** `buildIcs(courses: CourseEvents[]): string`, `type CalendarEvent`, `escapeIcs`, `foldLine`.

- [ ] Test (`lib/ics.test.ts`): all-day event serialises `DTSTART;VALUE=DATE:20260914` and `DTEND;VALUE=DATE:20260915`; timed event `DTSTART:20260914T140000` / `DTEND:20260914T150000`; `SUMMARY:ECON 101: Midterm\, part 1` escaped; every line ≤ 75 octets; contains `TRIGGER:-P1D`; lines end with `\r\n`.
- [ ] Run → fails (module missing).
- [ ] Implement per spec §`lib/ics.ts`.
- [ ] Run → pass. Commit `feat: ics builder`.

### Task 3: `lib/extract.ts`

**Produces:** `type Term = { season: 'Fall'|'Spring'|'Summer'|'Winter'; year: number }`, `termReferenceDate(term): Date`, `extractEvents(text, term): ExtractedEvent[]`.

- [ ] Tests (`lib/extract.test.ts`) with five fixtures:
  1. `"- Sept 14: Midterm 1"` Fall 2026 → `{date:'2026-09-14', title:'Midterm 1', confidence:'high'}`.
  2. Tab-separated `"Mon Oct 5\tQuiz 2\tCh 4"` → date `2026-10-05`, title `Quiz 2 Ch 4`.
  3. Prose `"The final exam will be held on December 12 at 2pm in Room 4."` → time `14:00`, high.
  4. Date-only line then title line `"Nov 3\nEssay due"` → title `Essay due`, low, reason `date only`.
  5. Spring 2027 `"Feb 2 – Problem set 1"` → `2027-02-02`.
  Plus: phone number `"Call 555-1234"` yields nothing; bare `"2026"` yields nothing; duplicates collapsed; output sorted.
- [ ] Run → fails.
- [ ] Implement per spec algorithm (chrono `parse` with `forwardDate`, window ±30/+180 days, cleanup regex `^[\s\-–—:|•*]+|[\s\-–—:|•*]+$`).
- [ ] Run → pass. Commit `feat: date extraction`.

### Task 4: `lib/convert.ts`

**Produces:** `fileToText(file: File): Promise<string>`, `class UnsupportedFileError`, `normalizeText(s): string`.

- [ ] Test (`lib/convert.test.ts`, node env with a `File` polyfill from `buffer`): `.exe` rejects with `UnsupportedFileError`; `.txt` with `"a\r\n\r\n\r\n\r\nb"` → `"a\n\nb"`.
- [ ] Implement: extension switch; pdf branch dynamic-imports `pdfjs-dist` and sets `GlobalWorkerOptions.workerSrc` to the bundled `pdf.worker.min.mjs` via `new URL(..., import.meta.url)`; docx branch dynamic-imports `mammoth` `extractRawText({ arrayBuffer })`; empty PDF text → throw `NoTextLayerError`.
- [ ] Run → pass. Commit `feat: file to text conversion`.

### Task 5: State + page shell

**Files:** `lib/store.ts` (types, reducer, `load()`/`save()`), `app/page.tsx`.

- [ ] Types: `Course = { id, name, term, text, events: ExtractedEvent[], extracted: boolean }`. Actions: `add`, `remove`, `update(id, patch)`, `setEvents(id, events)`, `updateEvent(courseId, eventId, patch)`, `addEvent(courseId)`, `deleteEvent(courseId, eventId)`, `clear`, `hydrate`.
- [ ] Reducer test (`lib/store.test.ts`): initial state has one course; `add` appends; `remove` refuses when one remains.
- [ ] `app/page.tsx`: `'use client'`, `useReducer`, `useEffect` hydrate from localStorage then save on change, renders `<header>` and three `<section>`s with headings "1. Your classes", "2. Review dates", "3. Download".
- [ ] Commit `feat: page shell and store`.

### Task 6: Components

**Files:** `components/file-drop.tsx`, `components/course-card.tsx`, `components/review-table.tsx`, `components/download-panel.tsx`.

- [ ] `FileDrop({ onText })`: drag-over highlight, hidden `<input type=file accept=".pdf,.docx,.txt,.md">`, calls `fileToText`, shows "Converting…" and error text from `UnsupportedFileError` / `NoTextLayerError`.
- [ ] `CourseCard({ course, index, canRemove, dispatch })`: heading `Class {index+1}`, name input (required, red hint when empty), season+year selects, `FileDrop`, textarea, "Find dates" button (disabled without name or text) → `dispatch(setEvents(id, extractEvents(text, term)))`; "No dates found…" message when result empty.
- [ ] `ReviewTable({ course, dispatch })`: rows with include checkbox, date input, time input, title input, delete button; yellow row + reason when low; "Add row"; counts line.
- [ ] `DownloadPanel({ courses })`: builds ICS via `buildIcs`, creates Blob + object URL, anchor click download `my-classes.ics`; disabled when no included events or any course missing name; tabs Google / Apple / Outlook with exact steps from spec; tip about a "School" calendar.
- [ ] Wire into `page.tsx`. `npm run build` passes. Commit `feat: ui components`.

### Task 7: Polish + verify

- [ ] README: what it is, how to run, how it works, privacy note.
- [ ] `npm run lint && npm test && npm run build` all green.
- [ ] Manual: start dev server, paste a sample syllabus, download, open the `.ics` and eyeball it.
- [ ] Commit `docs: readme` and push to `origin main`.
