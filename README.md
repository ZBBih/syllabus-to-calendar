# Syllabify

Syllabify your semester. Drop your syllabi and get every deadline on your calendar. Runs entirely in your browser: no account, no API key, and nothing is uploaded anywhere.

Live: https://syllabus-to-calendar-ten.vercel.app

## How it works

1. **Your classes.** Drop all your syllabi (PDF, Word, or text) on the big zone at the top. Each file becomes a class, named from the file name, with its dates found automatically. Or start with Class 1 by hand: give it a name (this becomes the prefix on every event, e.g. `ECON 101: Midterm`), pick the term, and paste or upload the syllabus. Add more classes with the button below.
2. **Review dates.** Dates appear in an editable table per class. Rows the app is unsure about are highlighted in yellow. Fix, delete, or add rows as needed. **Re-run** after editing the text keeps your edits and only adds what is new; nothing is ever removed for you.
3. **Send or download.** On a phone, **Send to my calendar** opens the share sheet so you can add every event in one tap. Anywhere, **Download calendar file** gives you `syllabify.ics` with every included event and a reminder the day before. Tabs below walk through importing into Google Calendar, Apple Calendar, and Outlook.

Your classes are saved in your browser (localStorage) so a refresh does not lose your work. If the browser blocks saving, a banner tells you to download before closing. A reminder select (1 day, 2 days, morning of, none) applies to every event, and a combined by-date list appears when you have more than one class. Light and dark mode, with a toggle in the header.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm test        # unit + component tests (vitest, jsdom)
npm run lint
npm run build
```

## Stack

Next.js 16 (App Router), React 19, Tailwind v4, [chrono-node](https://github.com/wanasit/chrono) for date parsing, [pdf.js](https://mozilla.github.io/pdf.js/) for PDFs, [mammoth](https://github.com/mwilliamson/mammoth.js) for Word files.

## Layout

- `lib/convert.ts` turns an uploaded file into plain text
- `lib/extract.ts` turns text into dated events
- `lib/merge.ts` merges a re-run into existing rows without losing edits
- `lib/course-name.ts` guesses a class name from a file name
- `lib/ics.ts` turns events into an iCalendar file
- `lib/store.ts` reducer and localStorage persistence
- `components/` the three steps of the UI, theme toggle, logo, by-date preview
- `app/icon.svg`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` favicon and link-preview image
- `app/not-found.tsx` custom 404
- `docs/superpowers/` design spec and implementation plan
- `docs/reviews/` improvement reviews
