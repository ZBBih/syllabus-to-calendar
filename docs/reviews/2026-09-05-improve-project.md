# Syllabus to Calendar improvement review

Date: 2026-09-05
Reviewed by: improve-project skill
Prior review: none

## State of the project

A browser-only Next.js 15 app that turns pasted or uploaded syllabi into one downloadable `.ics` file, with an import walkthrough for Google, Apple, and Outlook. It was rebuilt from scratch today after the original local copy was lost; the GitHub repo held only an empty README. Nine commits on main, pushed, working tree clean. Stack is TypeScript, React 19, Tailwind v4, chrono-node for dates, pdf.js and mammoth for file conversion, Vitest for unit tests over `lib/`. Lint, typecheck, and production build are green; the PDF upload, extraction, and download paths were verified in a real browser. Not yet deployed. The spec's stated v1 non-goals were recurring class meetings, image OCR, LMS integration, sharing links, and AI parsing.

## Who it is for and what they need

College students at the start of a semester, loading three to six syllabi in one sitting so every deadline lands in their phone calendar without retyping. Nobody gets stuck yet because nobody but the owner has tried it: the app is not shared or deployed. Deploy target is unset; Vercel is the natural fit. What would make a student recommend it is still unknown; the owner's framing is that it should just work with real syllabi and be easy to hand to a friend.

Not flagged by design:
- No AI and no API key; extraction is rule-based only.
- One combined `.ics` for all classes; events are all-day unless a time is found in the text.

Left open by the owner, so proposals may touch them: browser-only storage with no accounts, no image OCR, no recurring class meetings.

## Working well and worth keeping

- **The ICS builder implements RFC 5545 line folding at 75 octets, field escaping, all-day versus timed events, and a day-before alarm on every event** (`lib/ics.ts:18`) This is the feature students depend on most, and a spec-correct file is what makes import work across Google, Apple, and Outlook. Verified: verifier confirmed.
- **All course and event text renders through JSX text interpolation with no raw HTML anywhere** (`components/review-table.tsx:65`) Syllabus text sometimes carries instructor names and emails; this is the app's main defense against that content rendering as markup. Verified: verifier confirmed.
- **pdf.js and mammoth load only through dynamic import inside the conversion functions** (`lib/convert.ts:27`) The initial bundle stays at 122 kB for the paste and text-file path, which matters on phones. Verified: verifier confirmed.
- **Conversion failures map to specific, actionable messages** (`lib/convert.ts:8`) An unsupported extension is named with the accepted types, and a scanned PDF is told apart from a bad file, so a student knows whether to switch files or paste. Verified: verifier confirmed.
- **Class list, text, and events persist to localStorage and rehydrate on reload** (`lib/store.ts:90`) A student interrupted mid-session picks up without re-uploading. Verified: verifier confirmed.
- **Low-confidence rows are flagged amber with a reason, and editing the title clears the flag** (`components/review-table.tsx:68`) Rule-based extraction will misfire; this in-place review is what lets a student trust the file. Verified: verifier confirmed.
- **Fonts load through next/font with self-hosting and no layout shift** (`app/layout.tsx:5`) First impression on a shared link. Verified: verifier confirmed.
- **ICS escaping is the correct minimal boundary for a client-only export** (`lib/ics.ts:22`) Any future sharing feature must keep it. Verified: verifier confirmed.

## Not working and why

- **A second click of "Find dates" replaces the whole event list and silently discards manual edits, added rows, and unchecked boxes** (`components/course-card.tsx:29`) Students paste more text or fix a typo and re-run, then lose their corrections without warning. Verified: verifier confirmed.
- **Storage write failures are swallowed with no user-facing message** (`lib/store.ts:97`) In private browsing or a full quota, edits vanish on reload with no hint to download first. Verified: verifier confirmed.
- **Each class card needs its own "Find dates" click; there is no extract-all** (`app/page.tsx:38`) The typical session is three to six syllabi, so the same step repeats every time. Verified: verifier confirmed. See also the Workflow change below, which removes the click entirely.
- **Next is pinned a major behind, and npm audit reports two postcss advisories fixed only by Next 16** (`package.json:15`) Build-time only for a static site, so real exposure is low, but it should be cleared before a public deploy rather than ignored. Raised by two lenses. Verified: command output in `evidence/audit.txt`.

## Worth adding and why

- **Cheap win:** **Multi-file drop that creates one class per file** (`components/file-drop.tsx:39`) The drop zone reads only the first file and the input lacks `multiple`; reusing `fileToText` with the existing add and update reducer actions turns five drop-and-add cycles into one gesture. Raised by two lenses. Verified: verifier confirmed the gap.
- **Workflow change:** **Auto-run extraction when a file converts, and prefill the class name from the file name** (`components/course-card.tsx:99`) The drop handler already receives the file name and ignores it, and extraction is a pure synchronous call, so "upload, type name, click Find dates" collapses to "drop file, glance at name". Verified: verifier confirmed the gap.
- **Bigger bet:** **A "Send to my calendar" button using the Web Share API to hand the `.ics` straight to the phone's calendar** (`components/download-panel.tsx:41`) Today the only phone path is a desktop import walkthrough plus AirDrop or email to yourself. The ICS string already exists in memory; sharing it as a file lets a friend who opens the link on a phone finish in one tap, which is the moment that makes the app worth recommending. Verified: verifier confirmed the gap.
- **A combined by-date preview above the download button** (`components/review-table.tsx`) With five classes there is no cross-class view to spot duplicates or wrong-year dates before importing; the download panel already receives every course. Verified: verifier confirmed the gap.
- **Component tests for the UI gating logic** (`components/course-card.tsx`) Vitest covers only `lib/`, while the download gating and extraction trigger live in components with no test. Verified: verifier confirmed.
- **An upload size cap before parsing** (`lib/convert.ts:41`) A huge or malformed file freezes only the uploader's own tab, but a one-line guard is cheap before sharing. Verified: verifier confirmed.
- **Shape validation when reading localStorage** (`lib/store.ts:88`) A corrupted saved state crashes or misrenders instead of resetting cleanly. Verified: verifier confirmed.
- **Security headers once deployed** (`next.config.ts:4`) Little payoff for a static, no-backend page today; worth adding at deploy time. Verified: verifier confirmed.

## Code health

- Storage write failures swallowed silently (`lib/store.ts:97`). Confirmed.
- No component tests; Vitest includes only `lib/` (`components/course-card.tsx`). Confirmed.
- Next pinned a major behind with open postcss advisories (`package.json:15`). Confirmed by `evidence/audit.txt`.
- `extractEvents` runs parse, title cleanup, confidence, and dedupe in one body (`lib/extract.ts:40`). Downgraded: helpers are already factored out and the loop reads linearly; "no decomposition" overstates it.

## Security

- No upload size cap before parsing (`lib/convert.ts:41`). Confirmed.
- No security headers configured (`next.config.ts:4`). Confirmed; low payoff until deployed.
- localStorage parsed with only an array check (`lib/store.ts:88`). Confirmed.
- ICS escaping is the right boundary for a client-only export (`lib/ics.ts:22`). Confirmed, keep.
- `escapeIcs` applied to SUMMARY and alarm DESCRIPTION (`lib/ics.ts:66`). Downgraded: UID is written unescaped from an internally generated id, so "every text field" overstates it; no injection path.
- JSX text rendering only, no raw HTML (`components/review-table.tsx:65`). Confirmed, keep.
- Audit advisories via Next 15 (`package.json`). Merged into the code-health entry above; raised by two lenses.

## Performance

- Sequential per-page awaits in `pdfToText` (`lib/convert.ts:31`). Downgraded: pdf.js does the page work in a worker and syllabi are a handful of pages, so wall-clock gain is marginal.
- Dynamic import of pdf.js and mammoth keeps them out of the initial bundle (`lib/convert.ts:27`). Confirmed, keep.
- Fonts via next/font (`app/layout.tsx:5`). Confirmed, keep.

## Existing features

- Re-running "Find dates" discards review edits (`components/course-card.tsx:29`). Confirmed.
- Drop zone takes only the first file, extras ignored silently (`components/file-drop.tsx:41`). Confirmed; merged into the Cheap win.
- Per-card "Find dates" with no extract-all (`app/page.tsx:38`). Confirmed.
- ICS builder is spec-correct (`lib/ics.ts:18`). Confirmed, keep.
- Actionable conversion errors (`lib/convert.ts:8`). Confirmed, keep.
- localStorage persistence (`lib/store.ts:90`). Confirmed, keep.
- Amber low-confidence flags (`components/review-table.tsx:68`). Confirmed, keep.

## New features

- Multi-file drop (`components/file-drop.tsx:39`). Confirmed.
- Auto-extract on convert plus name prefill from file name (`components/course-card.tsx:99`). Confirmed.
- Web Share "Send to my calendar" (`components/download-panel.tsx:41`). Confirmed.
- Combined by-date preview (`components/review-table.tsx`). Confirmed.
- "Try a sample syllabus" demo button (`app/page.tsx:26`). Downgraded: the gap is real, but the need is inferred from "easy to hand to a friend" rather than stated in the brief.
- Reminder-lead control, all-day default kept (`lib/ics.ts:88`). Downgraded: the alarm is hardcoded to one day before, but the brief never mentions reminders.

## Open questions

- Word (.docx) conversion has been exercised only by its code path, never with a real document in a browser. No lens opened it either.
- The extraction regexes were not reviewed for pathological input; the security lens listed `lib/extract.ts` as unexamined.
- No lens or evidence row measured how extraction fares on real multi-column PDF syllabi; the fixtures are hand-written lines.
- What would make a student recommend it is unknown until the app is deployed and handed to one. The Bigger bet is the best guess at that moment.
- The owner said accounts "could" be added. Nothing here needs them; the Web Share path avoids them entirely.

## Evidence run

- `npm run lint --if-present`: ran, clean, `scratchpad/evidence/lint.txt`
- `npx --no-install tsc --noEmit`: ran, clean, `scratchpad/evidence/typecheck.txt`
- `npm audit`: ran, exit 1 with two advisories, `scratchpad/evidence/audit.txt`
- size (`find ... | wc -l`): ran, `scratchpad/evidence/size.txt`
- `npm test`, `npm run build`: skipped, slow rows, default run

## Run stats

Elapsed: about seven minutes from 20:11 to 20:18. Subagents dispatched: four lens agents (code-and-performance, security, existing-features on sonnet; new-features on the default model) and one verifier on the default model. No lens agent reported hitting the file-open or time cap; the verifier reached every finding.
