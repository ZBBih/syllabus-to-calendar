# Syllabus to Calendar

Paste or upload your syllabi and download one `.ics` file that puts every deadline in your calendar. Runs entirely in your browser: no account, no API key, and nothing is uploaded anywhere.

## How it works

1. **Your classes.** Start with Class 1. Give it a name (this becomes the prefix on every event, e.g. `ECON 101: Midterm`), pick the term, then drop in the syllabus as a PDF, Word (.docx), or text file, or paste the text. Add more classes with the button below.
2. **Review dates.** Click **Find dates**. The app scans the text for dates and shows them in an editable table. Rows it is unsure about are highlighted in yellow. Fix, delete, or add rows as needed.
3. **Download and import.** One button gives you `my-classes.ics` with every included event and a reminder the day before. Tabs below walk through importing into Google Calendar, Apple Calendar, and Outlook.

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
- `lib/ics.ts` turns events into an iCalendar file
- `lib/store.ts` reducer and localStorage persistence
- `components/` the three steps of the UI
- `docs/superpowers/` design spec and implementation plan
