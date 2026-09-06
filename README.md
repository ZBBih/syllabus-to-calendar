# Syllabify

Syllabify your semester. Drop your syllabi and get every deadline on your calendar. Runs entirely in your browser: no account, no API key, and nothing is uploaded anywhere.

Live: https://syllabus-to-calendar-ten.vercel.app

## How it works

Three guided steps, one screen at a time, built for a phone or a laptop.

1. **Upload.** Drop all your syllabi (PDF, Word, or text) on the big zone. Each file becomes a class row with its name guessed from the file name, a term picker, and a count of the dates found. Fix the name inline (there is a clear button), or use **Add by pasting** to type a class in by hand. **Try a sample** if you have nothing handy.
2. **Review.** One tab per class. Rows the app is unsure about are amber; a **Needs check** filter shows only those. Select all or none, add rows, or **Edit text** and re-run without losing your edits. **All classes by date** shows every deadline in one list.
3. **Export.** Pick a reminder lead (1 day, 2 days, morning of, none). On a phone, **Send to my calendar** opens the share sheet. Anywhere, **Download all** gives `syllabify.ics`, or download one class at a time. Import guides for Google, Apple, and Outlook are right there.

Your work is saved in your browser (localStorage) and the app is installable as a PWA that opens offline. Light or dark: the first visit matches your system, and the switch in the header remembers your choice.

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
- `components/` the three step screens, stepper, class row, paste sheet, theme control, logo, by-date preview
- `lib/export.ts` combined and per-class calendar files
- `app/manifest.ts`, `public/sw.js` PWA manifest and offline shell cache
- `app/icon.svg`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` favicon and link-preview image
- `app/not-found.tsx` custom 404
- `docs/superpowers/` design spec and implementation plan
- `docs/reviews/` improvement reviews
