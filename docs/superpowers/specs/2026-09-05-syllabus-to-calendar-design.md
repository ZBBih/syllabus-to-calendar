# Syllabus to Calendar — Design

Date: 2026-09-05

## Goal

A browser-only web app. A student adds one or more classes, pastes or uploads each syllabus, reviews the dates the app found, and downloads a single `.ics` file that imports into Google Calendar, Apple Calendar, or Outlook. No account, no API key, nothing leaves the browser.

## Non-goals (v1)

- Recurring weekly class meetings
- Image / photo OCR
- Canvas, Blackboard, or LMS integration
- Sharing links or server-side storage
- AI-assisted parsing

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind v4
- `chrono-node` for natural-language date parsing
- `pdfjs-dist` for PDF text extraction (client worker)
- `mammoth` for `.docx` to text
- Hand-written ICS generator (no library)
- Vitest for unit tests
- Deployable to Vercel as a static app

## User flow

Single page, three stacked steps.

### Step 1 — Classes

- Page loads with one card titled **Class 1**.
- Card fields:
  - **Class name** (required). Used verbatim as the event title prefix, e.g. `ECON 101: Midterm`.
  - **Term**: select Fall / Spring / Summer / Winter + year select (current year ±1). Default: nearest upcoming term.
  - **Syllabus**: a drop zone / file picker plus a textarea. Uploading a file converts it to text and fills the textarea. The user can edit the text before extracting.
- **Add another class** button appends **Class 2**, **Class 3**, … Each card has a remove button (except when only one remains).
- **Find dates** button on each card runs extraction and populates Step 2 for that class.

### Step 2 — Review

- One table per class, headed by the class name.
- Columns: Include (checkbox, default on), Date (date input), Time (optional time input; blank = all-day), Title (text input), Delete.
- Rows flagged **low confidence** get a yellow background and a short reason ("no title found", "date only").
- **Add row** button per table.
- Counts shown: "12 events found, 2 need a look".

### Step 3 — Download

- Button: **Download calendar file**. Produces `my-classes.ics` containing every included row from every class.
- Disabled with a hint if no rows are included.
- Below: tabbed walkthrough (Google / Apple / Outlook) with exact menu paths:
  - Google: calendar.google.com → gear → Settings → Import & export → select file → choose calendar → Import.
  - Apple (Mac): double-click the `.ics` → choose calendar → OK. (iPhone): open the file from Files or Mail → Add All.
  - Outlook (desktop): File → Open & Export → Import/Export → Import an iCalendar file. (Web): Add calendar → Upload from file.
- Tip: create a separate calendar named "School" first so events can be hidden or colored together.

## Modules

### `lib/convert.ts` — file to text

`fileToText(file: File): Promise<string>`

| Type | Handling |
|---|---|
| `application/pdf`, `.pdf` | pdfjs: concatenate page text, join items with spaces, pages with newlines |
| `.docx` | mammoth `extractRawText` |
| `text/*`, `.txt`, `.md` | `file.text()` |
| anything else | throw `UnsupportedFileError(ext)`; UI shows "Please upload a PDF, Word, or text file, or paste the text" |

Detection by extension first, MIME second (browsers mislabel). Result is normalised: CRLF → LF, collapse 3+ blank lines to 2, trim.

### `lib/extract.ts` — text to events

```ts
type ExtractedEvent = {
  id: string
  date: string        // YYYY-MM-DD
  time?: string       // HH:MM 24h, absent = all-day
  title: string
  confidence: 'high' | 'low'
  reason?: string
}
extractEvents(text: string, term: Term): ExtractedEvent[]
```

Algorithm:
1. `referenceDate` = first day of the term (Fall → Aug 15, Spring → Jan 5, Summer → May 15, Winter → Dec 15 of the term year). Passed to chrono so year-less dates resolve into the term. `forwardDate: true`.
2. Split text into lines, trim, drop empties.
3. For each line, `chrono.parse(line, referenceDate, { forwardDate: true })`.
4. For each parse result on the line:
   - `date` from result start. If chrono reports a certain hour, set `time`.
   - `title` = line with the matched date text removed, then strip leading/trailing `-–—:|•*` and whitespace, collapse spaces.
   - If title is empty: use the next non-empty line as title, mark `reason: 'date only'`.
   - If title has fewer than 3 characters after cleanup: `low`, `reason: 'no title found'`.
   - Otherwise `high`.
5. Date ranges ("Sept 14–16"): emit a single event on the start date with the full line as title.
6. Skip dates outside `[referenceDate − 30 days, referenceDate + 180 days]` (kills phone numbers and stray years). Skip results whose matched text is only a 4-digit year.
7. Dedupe on `(date, title)`.
8. Sort by date, then time.

### `lib/ics.ts` — events to ICS

`buildIcs(courses: { name: string; events: ExtractedEvent[] }[]): string`

- `VCALENDAR` with `PRODID:-//syllabus-to-calendar//EN`, `VERSION:2.0`, `CALSCALE:GREGORIAN`.
- All-day: `DTSTART;VALUE=DATE:YYYYMMDD`, `DTEND;VALUE=DATE:` next day.
- Timed: `DTSTART:YYYYMMDDTHHMMSS` floating local time, `DTEND` +1 hour.
- `SUMMARY:` `${name}: ${title}` with ICS escaping (`\` `;` `,` newline).
- `UID:` `${id}@syllabus-to-calendar`, `DTSTAMP` now in UTC.
- `VALARM` display, `TRIGGER:-P1D`.
- Lines folded at 75 octets, CRLF line endings.

### State

- `courses: Course[]` where `Course = { id, name, term, text, events }`.
- Held in a single `useReducer` in the page; persisted to `localStorage` under `stc:v1` on every change, hydrated on load.
- **Clear everything** link in the footer.

## Components

- `app/page.tsx` — layout, reducer, step sections
- `components/course-card.tsx` — Step 1 card
- `components/file-drop.tsx` — drop zone + picker, calls `fileToText`, shows conversion errors
- `components/review-table.tsx` — Step 2 table for one course
- `components/download-panel.tsx` — Step 3 button + walkthrough tabs

## Error handling

- Conversion errors show inline under the drop zone; the textarea stays usable.
- PDF with no extractable text (scanned) → message "This PDF has no text layer. Paste the text or use a text-based PDF."
- Extraction finding zero dates → message "No dates found. Check the term and try pasting the schedule section."
- Missing class name blocks **Find dates** and **Download** with an inline hint.

## Testing

- `lib/extract.test.ts`: five fixture snippets (bulleted schedule, table-like tab-separated rows, prose paragraph, dates-on-own-line, weekday-prefixed "Mon Sept 14") asserting dates, titles, confidence, and the year rolling from the term.
- `lib/ics.test.ts`: all-day and timed events serialise correctly, escaping, folding, valid structure.
- `lib/convert.test.ts`: unsupported extension throws; txt round-trips.
- Manual: import the generated file into Google Calendar once and confirm titles and dates.
