# Syllabify improvement review

Date: 2026-09-07
Reviewed by: improve-project skill
Prior review: docs/reviews/2026-09-05-improve-project-2.md

## State of the project

Syllabify is live at https://syllabus-to-calendar-ten.vercel.app: a browser-only Next 16 app that turns uploaded syllabi into one `.ics` file with no account, no upload, no class limit, and no price. The guided flow is unchanged since the last review — Your classes, Review, Export — and everything both prior reviews raised was built. Since then the work has been about telling the truth and reading messier files: honest import guidance for iPhone, two overstated claims removed from the landing copy, a grading breakdown read out of a sentence rather than only a table, robots and sitemap and a real 404, and the tip jar switched on. Lint, typecheck, and `npm audit` are clean, and the suite covers the extraction and export libraries plus most components.

Earlier in this session the app was driven in a browser at desktop, 390px, and 320px in both themes. That surfaced two defects, both fixed and sitting uncommitted in the working tree: a hydration-order bug in `app/page.tsx` where the save effect wrote the empty starting state over restored work, so a reload dropped a student back on the landing page with everything gone; and phone layout clipping in the review rows, the header, the step footers, and the comparison table. A regression test for the reload came with the first fix.

## Who it is for and what they need

College students at the start of a semester, loading three to six syllabi in one sitting, mostly on a phone, so every deadline lands in their calendar without retyping. The link spreads by word of mouth.

The owner named all three sources of friction rather than picking one: extraction misses dates because real syllabi are messier than the sample, and getting them right without hand-fixing is what wins people over; nobody has tried it yet, so what matters most is being ready for the first batch of friends who open the link; and it can look unfinished, since people judge it in the first five seconds and polish and trustworthy copy decide whether it gets passed on.

Deploy target: Vercel, fully static prerendered.

Not flagged by design:
- No AI and no API key; extraction is rule-based.
- No accounts, localStorage only, nothing uploaded to any server.
- `'unsafe-inline'` in the production CSP so the theme script and Next's own inline scripts work on a static build (recorded decision, 2026-09-05).
- The tesseract OCR worker, wasm core, and English model self-hosted from this origin instead of a CDN.

## Working well and worth keeping

- **Re-reading a syllabus preserves every hand edit and checkbox, and separates what moved from what was added from what the new file no longer mentions** (`lib/merge.ts:53`) This is what lets a student drop a corrected syllabus back in without redoing their fixes, which is the answer to the standard "the schedule is wrong by week three" objection. Verified: verifier confirmed.
- **The extraction regexes carry no catastrophic-backtracking shape: every repeating quantifier is bounded to a fixed or small count** (`lib/grades.ts:12`) A long line in a messy real syllabus cannot freeze the student's tab, which closes an open question carried through both prior reviews. Verified: verifier confirmed.
- **Every user-controlled string is escaped before it enters the calendar file** (`lib/ics.ts:82`) Syllabus text and student-edited titles reach a parser in the calendar app; unescaped separators or newlines would corrupt events. Verified: verifier confirmed.
- **Saved state is rebuilt field by field with type guards instead of trusting parsed JSON, and both load and save fail closed** (`lib/store.ts:294`) A corrupted or hand-edited save resets cleanly rather than crashing the only copy of the student's work. Raised by two lenses. Verified: verifier confirmed.
- **Photos are downsampled before recognition and the OCR bundle is loaded only when an image is actually dropped** (`lib/ocr.ts:17`) Students who upload PDFs never pay for the recogniser, which protects the first impression on a phone. Verified: verifier confirmed.
- **The security headers close clickjacking, base-tag hijacking, and plugin-object vectors alongside the accepted inline-script allowance** (`next.config.ts:3`) The parts of the policy that can be tight on a static build are tight. Verified: verifier confirmed.
- **The paste sheet re-runs extraction with the corrected term after an edit** (`components/paste-sheet.tsx:31`) It is the one path that already does the right thing on a term change, and it is the model for fixing the row control below. Verified: verifier confirmed.

## Not working and why

- **Changing a class's term on its row updates the label and nothing else** (`components/class-row.tsx:82`) The row dispatches a plain field merge with no re-extraction, so the date window, the weekly-meeting detection, and the recurrence bounds all keep using the term that was in effect at upload time. A student whose syllabus is for next spring picks the right term, watches the count stay at zero, and concludes the app cannot read their file. The paste sheet already shows the two-dispatch fix. Verified: verifier confirmed.
- **The grade panel has no test** (`components/grade-panel.tsx`) Every category add, remove, and edit plus the running-grade maths live only in that component, and it is the feature the competitor audit says rivals charge for. Verified: verifier confirmed.
- **A bulk re-extraction exists in the reducer but nothing in the app can reach it** (`lib/store.ts:132`) The `extractAll` case is exercised only by tests, so there is no way to force a re-read across classes after correcting several terms. Verified: verifier confirmed.
- **The store file carries both the state machine and the persistence layer** (`lib/store.ts:206`) The sanitizers have to be kept in lockstep with the state shape by hand, and every new field is a chance to miss one — which is how a field silently stops surviving a reload. Verified: verifier confirmed.

## Worth adding and why

Built the same day, in the session that produced this review: the cheap win, the workflow
change, and the three extraction items below. The bigger bet is not built.


- **Cheap win: a "send this to a friend" action on the finished screen** (`components/export-step.tsx:171`) `SITE_URL` exists and `navigator.share` is already wired for the file itself, so the share of a link is a few lines. The link spreads by word of mouth and the one moment a student feels the payoff is the card that says it worked; today that moment ends with "Do that again" and "Start over". Verified: verifier confirmed the gap.
- **Workflow change: read the class name out of the syllabus text, not just the file name** (`lib/course-name.ts:20`) Pasted syllabi and anything called `Syllabus (1).pdf` arrive nameless, and a name is required before the flow continues, so the student types on a phone keyboard once per class. The first lines of a syllabus carry the course code in the same shape the file-name path already tidies. Verified: verifier confirmed the gap.
- **Bigger bet: show what the extractor read and what it skipped** (`lib/extract.ts:66`) Lines whose date is not certain, or that fall outside the term window, are dropped with no record, so the review table can only ever show what was found. The fear that keeps a student retyping is "what did it miss?", and a view that highlights the captured dates in their own text and offers every uncaptured date-looking line as a one-tap add turns an unknowable risk into a scannable check. Verified: verifier confirmed the gap.
- **One event per date on a line, instead of only the first** (`lib/extract.ts:64`) Real schedule tables put two dates on one row; the second is currently swallowed into the title. This is the most direct answer to "extraction misses dates". Verified: verifier confirmed the gap.
- **Detect the term from the syllabus text instead of guessing it from today's date** (`components/class-row.tsx:9`) Dates outside a window around the guessed term are dropped silently, which is the quietest way the app can appear to read nothing at all. Verified: verifier confirmed the gap.
- **Carry a date range through as a multi-day event** (`lib/extract.ts:68`) The end of a chrono result is never read, so a fall break or an exam window lands on its first day only and the table stops matching the paper the student is checking against. Verified: verifier confirmed the gap.

## Code health

- Grade panel has no test (`components/grade-panel.tsx`). Confirmed.
- No test for the by-date preview's ordering and clash logic (`components/date-preview.tsx:5`). Downgraded: the clash path is covered indirectly through `components/export-step.test.tsx:66`, so a bug there is not wholly untested.
- Store file mixes the state machine and the persistence layer (`lib/store.ts:206`). Confirmed.
- Sanitizers rebuild saved state with type guards and fail closed (`lib/store.ts:294`). Confirmed, keep.

## Security

- Extraction regexes are bounded against catastrophic backtracking (`lib/grades.ts:12`). Confirmed, keep.
- Headers set object-src, base-uri, frame-ancestors, form-action, nosniff, and a restrictive permissions policy (`next.config.ts:3`). Confirmed, keep.
- Calendar output escapes every user-controlled string (`lib/ics.ts:82`). Confirmed, keep.
- Saved state is validated before it re-enters the app (`lib/store.ts:294`). Confirmed, keep.

## Performance

- Photos downsampled and the OCR bundle lazily loaded (`lib/ocr.ts:17`). Confirmed, keep.
- Dropped files convert one after another rather than concurrently (`components/file-drop.tsx:29`). Downgraded: the loop is real, but the seconds-per-file cost is the OCR path only, and concurrent tesseract workers on a phone are memory-bound, so the gain is smaller than claimed.
- PDF pages are read sequentially (`lib/convert.ts:55`). Downgraded: pdf.js runs those calls through a single worker thread, so issuing them concurrently mostly re-serializes there.

## Existing features

- Term change on a class row does not re-extract (`components/class-row.tsx:82`). Confirmed.
- Bulk re-extraction is unreachable from the UI (`lib/store.ts:132`). Confirmed.
- Paste sheet re-runs extraction with the corrected term (`components/paste-sheet.tsx:31`). Confirmed, keep.
- Re-read diff preserves edits and reports what changed (`lib/merge.ts:53`). Confirmed, keep.

## New features

- Share the link from the finished screen (`components/export-step.tsx:171`). Confirmed.
- Class name from syllabus text (`lib/course-name.ts:20`). Confirmed.
- Show what was read and what was skipped (`lib/extract.ts:66`). Confirmed.
- Every date on a line, not just the first (`lib/extract.ts:64`). Confirmed.
- Term detected from the syllabus text (`components/class-row.tsx:9`). Confirmed.
- Date ranges as multi-day events (`lib/extract.ts:68`). Confirmed.

## Changed since last review

Everything the second review listed as not working was fixed: the collapsed semicolon escape and the test that locked it in, the unnamed class dropped at export, the upload gate that needed only one named class, the blank added row counted then discarded, and the review table that overflowed on phones. Its three confirmed proposals shipped too — the source line as the event description, the phone-first import route with a platform-picked default tab, and the clash callout on Export — along with the recurring weekly meeting it had downgraded. The inline-script CSP allowance stands as the recorded decision it was.

Its open question about pathological input in the extraction regexes is now answered: they are bounded, and no ReDoS shape is present. New this round: the term control that silently does nothing, the reload that wiped saved work (fixed in the working tree today), the phone clipping at narrow widths (also fixed today), the unreachable bulk re-extraction, and the extraction gaps around multiple dates per line, date ranges, and term detection.

## Open questions

- Whether Google Calendar on Android imports a multi-event file opened from Files on current versions. Carried from the last review; still unverified and still not testable from here.
- Word document conversion has still never been tried with a real file in a browser, and the share button and PWA install have never been exercised on a real phone. The browser pass this session used the sample and the desktop share path only.
- Whether the OCR path's accuracy on a real camera photo of a printed syllabus is good enough to keep the promise the landing page makes about photos. Nothing in the repo measures it.
- The code and performance lens did not reach `app/opengraph-image.tsx`, `public/sw.js`, or the smaller components; the new-features lens did not reach the grade calculator or the landing copy. First-five-seconds polish, which the owner named as friction, was therefore judged from the browser pass rather than by a lens.

## Evidence run

- `npm run lint --if-present`: ran, clean, `scratchpad/evidence/lint.txt`
- `npx --no-install tsc --noEmit`: ran, clean, `scratchpad/evidence/typecheck.txt`
- `npm audit`: ran, zero vulnerabilities, `scratchpad/evidence/audit.txt`
- size (`find … | xargs wc -l`): ran, `scratchpad/evidence/size.txt`
- `npm test`, `npm run build`: not part of the default rows, but both were run earlier in this session against the working tree and passed (suite green, build all-static).

## Run stats

Elapsed: about ten minutes, from 16:36 to 16:46. Subagents dispatched: four lens agents — code and performance, security, and existing features on sonnet, new features on the default model — and one verifier on the default model. Every lens reported an Unexamined list; none reported hitting the time cap. The verifier reached every finding.
