# Syllabus to Calendar

Paste or upload your syllabi and download one `.ics` file that puts every deadline in your calendar. Runs entirely in your browser: no account, no API key, and nothing is uploaded anywhere.

## How it works

1. **Your classes.** Drop all your syllabi (PDF, Word, or text) on the big zone at the top. Each file becomes a class, named from the file name, with its dates found automatically. Or start with Class 1 by hand: give it a name (this becomes the prefix on every event, e.g. `ECON 101: Midterm`), pick the term, and paste or upload the syllabus. Add more classes with the button below.
2. **Review dates.** Dates appear in an editable table per class. Rows the app is unsure about are highlighted in yellow. Fix, delete, or add rows as needed. **Re-run** after editing the text keeps your edits and only adds what is new; nothing is ever removed for you.
3. **Send or download.** On a phone, **Send to my calendar** opens the share sheet so you can add every event in one tap. Anywhere, **Download calendar file** gives you `my-classes.ics` with every included event and a reminder the day before. Tabs below walk through importing into Google Calendar, Apple Calendar, and Outlook.

Your classes are saved in your browser (localStorage) so a refresh does not lose your work.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm test        # unit tests (vitest)
npm run lint
npm run build
```

## Stack

Next.js 15 (App Router), React 19, Tailwind v4, [chrono-node](https://github.com/wanasit/chrono) for date parsing, [pdf.js](https://mozilla.github.io/pdf.js/) for PDFs, [mammoth](https://github.com/mwilliamson/mammoth.js) for Word files.

## Layout

- `lib/convert.ts` turns an uploaded file into plain text
- `lib/extract.ts` turns text into dated events
- `lib/merge.ts` merges a re-run into existing rows without losing edits
- `lib/course-name.ts` guesses a class name from a file name
- `lib/ics.ts` turns events into an iCalendar file
- `lib/store.ts` reducer and localStorage persistence
- `components/` the three steps of the UI
- `docs/superpowers/` design spec and implementation plan
- `docs/reviews/` improvement reviews
