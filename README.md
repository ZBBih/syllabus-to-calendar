# Syllabify

Drop your syllabi and get every deadline on your calendar. Runs entirely in your browser: no account, no class limit, no API key, and nothing is uploaded anywhere.

Live: https://syllabus-to-calendar-ten.vercel.app

## Where this sits

Every comparable product asks for an account, uploads your syllabus to a server, and starts charging around the third or fourth class. Several are Apple-only. Syllabify is the one that does none of that, which is the whole positioning: **no account, nothing uploaded, no class limit, free.**

The standard criticism of a syllabus-only planner is that the schedule freezes on upload day and is wrong by week three. The answer here is not an integration but a re-read: drop the revised file in again, see exactly what changed, and export a file that corrects the calendar in place instead of leaving two of everything.

## How it works

Three guided steps, one screen at a time, built for a phone or a laptop.

1. **Upload.** Drop all your syllabi on the big zone. PDF, Word, plain text, a screenshot, or a photo of the printed page. Each file becomes a class row with its name guessed from the file name, a term picker, and a count of the dates found. A weekly meeting in the header ("MWF 10:00-10:50 in Olin 204") becomes a repeating calendar event, and a grading table becomes the grade calculator. Every class with dates needs a name before you can continue. **Add by pasting** types a class in by hand, and **Try a sample** shows the whole thing working.
2. **Review.** One tab per class. Rows the app is unsure about are amber; a **Needs check** filter shows only those. Re-reading a syllabus produces a **what changed** panel listing what moved, what was added, and what the new file no longer mentions. **All classes by date** shows every deadline in one list. On a phone each row is a card, no sideways scrolling.
3. **Export.** Pick a reminder lead. Each event carries the original syllabus line as its description. A callout flags days with two or more things due, and on a repeat export you are told how many events will be corrected, added, and withdrawn. On a phone, **Send to my calendar** opens the share sheet. Anywhere, **Download all** gives `syllabify.ics`. Import guides for Google, Apple, and Outlook are right there.

Your work is saved in your browser and the app is installable as a PWA that opens offline. Light or dark: the first visit matches your system, and the switch in the header remembers your choice.

## Reading a photo

Screenshots and camera photos are read on the device. The recogniser, its WebAssembly core, and the English model are all served from this origin rather than a CDN, so an image of your syllabus never leaves the browser and no third party learns a scan happened. The cost is a one-time download of roughly six megabytes, which the service worker then keeps.

`scripts/vendor-ocr.mjs` copies the worker and the wasm core out of `node_modules` into `public/tesseract` before every dev run, build, and test. The language model is committed because it never changes.

## Updating instead of duplicating

Calendar apps match an imported event to an existing one by its UID. Random per-run identifiers mean a second import creates a second copy of everything, which is why re-importing is normally a mess.

Here the UID is a hash of the class name plus what extraction originally found (`lib/uid.ts`), so it survives a new browser, another laptop, and the student renaming or re-dating the row. Exports carry a rising `SEQUENCE` so calendar apps accept the newer version, and an event the student has since removed goes out as a `STATUS:CANCELLED` entry so it comes off the calendar rather than sitting there for the term.

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

Next.js 16 (App Router), React 19, Tailwind v4, [chrono-node](https://github.com/wanasit/chrono) for date parsing, [pdf.js](https://mozilla.github.io/pdf.js/) for PDFs, [mammoth](https://github.com/mwilliamson/mammoth.js) for Word files, [tesseract.js](https://github.com/naptha/tesseract.js) for photos.

## Layout

- `lib/convert.ts` turns an uploaded file into plain text, routing images to the recogniser
- `lib/ocr.ts` on-device text recognition for photos and screenshots
- `lib/extract.ts` turns text into dated events
- `lib/merge.ts` folds a re-run into existing rows and reports what changed
- `lib/grades.ts` grading-table extraction and the running-grade maths
- `lib/uid.ts` stable calendar identity, so a re-export updates rather than duplicates
- `lib/course-name.ts` guesses a class name from a file name
- `lib/ics.ts` turns events into an iCalendar file, including cancellations
- `lib/export.ts` builds an export plan: the file, what it updates, adds, and withdraws
- `lib/meeting.ts` weekly class meeting detection
- `lib/store.ts` reducer and localStorage persistence
- `components/` the three step screens, hero, stepper, class row, change summary, grade panel, paste sheet, theme control, icons, by-date preview
- `app/manifest.ts`, `public/sw.js` PWA manifest and offline shell cache
- `app/icon.svg`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` favicon and link-preview image
- `scripts/vendor-ocr.mjs` copies the recogniser's runtime files into `public/`
- `docs/reviews/` improvement reviews and the competitor audit
