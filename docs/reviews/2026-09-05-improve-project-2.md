# Syllabify improvement review

Date: 2026-09-05 (second review)
Reviewed by: improve-project skill
Prior review: docs/reviews/2026-09-05-improve-project.md

## State of the project

Syllabify is live at https://syllabus-to-calendar-ten.vercel.app. Since the morning review the app was rebranded, upgraded to Next 16 and React 19.2, and rebuilt as a guided three-step flow: Upload, Review, Export. Upload takes many files at once and turns each into a class row with a name guessed from the file name. Review has one tab per class with bulk select, a needs-check filter, and an edit-text sheet that re-runs extraction without losing edits. Export offers a reminder lead, a Web Share button on phones, a combined download, and per-class downloads. It is installable as a PWA, has a two-way theme switch seeded from the system, an amber calendar icon, a link-preview image, and a custom 404. Lint, typecheck, and the audit are clean; the suite holds fifty-two tests. Nineteen commits landed today and the tree is clean.

## Who it is for and what they need

College students at the start of a semester, loading three to six syllabi in one sitting so every deadline lands in their phone calendar without retyping. Nobody has opened the live link yet, so real friction is unknown; the owner intends to text it to friends who will open it on a phone.

Not flagged by design:
- No AI and no API key; extraction is rule-based.
- One combined `.ics`; events are all-day unless a time is found.
- Two-way Light/Dark switch seeded from the system setting; no third "System" option.
- Browser-only with localStorage; no accounts, nothing uploaded.

## Working well and worth keeping

- **Re-running extraction never deletes or resets reviewed rows; new results merge by original date and title** (`lib/merge.ts:14`) Students re-paste corrected text often, and this keeps their fixes. Raised by two lenses. Verified: verifier confirmed.
- **Storage failures surface as a persistent banner telling the student to download before leaving** (`app/page.tsx:47`) Private browsing or a full quota no longer loses work silently. Verified: verifier confirmed.
- **Send to my calendar falls back to a download on any non-cancel error and always confirms what happened** (`components/export-step.tsx:62`) The export step never dead-ends. Verified: verifier confirmed.
- **Conversion errors are file-specific and one bad file does not block the rest of a batch** (`lib/convert.ts:8`) A scanned PDF among six uploads costs one row, not the session. Verified: verifier confirmed.
- **Uploads are gated by an extension and MIME allow-list and a size cap before parsing** (`lib/convert.ts:65`) Bounds untrusted files before expensive client work. Verified: verifier confirmed.
- **Persisted state is strictly shape-checked before it is trusted** (`lib/store.ts:173`) A corrupted or hand-edited save resets cleanly instead of crashing. Verified: verifier confirmed.
- **Every catch path either shows the user a message or falls back safely** (`lib/store.ts:186`) The banner and per-file error list depend on this discipline. Verified: verifier confirmed.
- **Security headers are complete for a public static site** (`next.config.ts:20`) Frame-ancestors none, nosniff, referrer policy, permissions policy. Verified: verifier confirmed.
- **The service worker caches only the same-origin shell and static assets; user data never enters Cache Storage** (`public/sw.js:17`) Offline support without leaking syllabus text. Verified: verifier confirmed.
- **Per-line date parsing is bounded by the term window filter** (`lib/extract.ts:72`) Keeps the core loop cheap at syllabus scale. Verified: verifier confirmed.

## Not working and why

- **Semicolons are not escaped in the calendar file** (`lib/ics.ts:39`) The escape uses the string `'\;'`, which JavaScript reads as a bare semicolon. A title like "Room 204; bring laptop" can shift text into a new property and corrupt that event in strict calendar clients. Verified: verifier ran a one-line check and read the source bytes.
- **The escaping test locks the bug in** (`lib/ics.test.ts:40`) The expected string carries the same collapsed escape, so the suite passes while the output is wrong. Verified: verifier confirmed.
- **A class with dates but no name shows as "Unnamed" in Review, then vanishes at Export with no warning** (`components/export-step.tsx:55`) A student who fixed that class's dates loses every one of them. Verified: verifier confirmed.
- **The Upload gate only requires one named class** (`components/upload-step.tsx:65`) Several unnamed classes with real dates pass through, which is how the previous finding happens. Verified: verifier confirmed.
- **A manually added row with a blank date or title is counted as included, then dropped at export with no indicator** (`lib/export.ts:5`) The student sees the count go up and never learns the row was discarded. Verified: verifier confirmed.
- **The review table always overflows sideways on a phone** (`components/review-table.tsx:38`) Five columns with a minimum title width force horizontal scrolling on the screen students use most. Verified: verifier confirmed.
- **The Content Security Policy allows inline scripts in production** (`next.config.ts:5`) Needed today for the theme script that prevents a flash of the wrong theme. Low real risk since nothing renders syllabus text as HTML. Verified: verifier confirmed. Decision 2026-09-05: left as is. Next.js injects its own inline scripts on every page, so a hash for the theme script is not enough, and a per-request nonce needs middleware that turns the static page into a server render on every hit. The owner chose to keep the static build.

## Worth adding and why

- **Cheap win:** **Carry the original syllabus line into each event as its description** (`lib/extract.ts:90`) Extraction already holds the full line and only keeps the trimmed title; the calendar builder writes no event description. Tapping an event on the phone would show "Problem set 3 due 11:59pm via Gradescope" without opening the PDF. Verified: verifier confirmed the gap.
- **Workflow change:** **A phone-first Google Calendar route and a platform-picked default guide tab** (`components/export-step.tsx:11`) Step one of the Google guide sends a phone user to a computer, and the tab defaults to Google even on an iPhone. Friends receiving the link on Android read "open on a computer" and stop. Verified: verifier confirmed the gap.
- **Bigger bet:** **Weekly class meetings as recurring events with a location** (`lib/ics.ts`) A weekday-pattern regex on the syllabus header plus one recurrence rule per class would put the whole semester on the calendar, which is the line a student repeats to friends. Downgraded: the brief asks for deadlines and the original spec deferred recurring meetings, so this is a judgment call rather than a stated need.
- **A clash callout on the Export step** (`components/date-preview.tsx:12`) The by-date list already computes days with several deadlines but hides it behind a disclosure on Review. Showing "3 days with 2+ things due" where the student decides adds judgment without new parsing. Verified: verifier confirmed the gap.
- **Component tests for the export step, file drop, and paste sheet** (`components/export-step.tsx:61`) The only code that produces the final file has no test while its siblings do. Downgraded: real gap, but coverage is not a need the brief names.

## Code health

- No export-step test (`components/export-step.tsx:61`). Downgraded: real gap, not a brief need.
- No file-drop or paste-sheet test (`components/file-drop.tsx:21`). Downgraded: same.
- Store file mixes types, reducer, defaults, and persistence (`lib/store.ts:1`). Downgraded: one cohesive state module; splitting is taste.
- Every catch path surfaces or falls back (`lib/store.ts:186`). Confirmed, keep.
- Merge rule small and tested (`lib/merge.ts:14`). Confirmed, keep. Raised by two lenses.

## Security

- Semicolon escape collapsed to a bare semicolon (`lib/ics.ts:39`). Confirmed.
- Test asserts the wrong escape (`lib/ics.test.ts:40`). Confirmed.
- Inline scripts allowed in production CSP (`next.config.ts:5`). Confirmed.
- Strict sanitize on load (`lib/store.ts:173`). Confirmed, keep.
- Upload allow-list and size cap (`lib/convert.ts:65`). Confirmed, keep.
- Header set complete (`next.config.ts:20`). Confirmed, keep.
- Service worker scope safe (`public/sw.js:17`). Confirmed, keep.

## Performance

- Files converted one after another in the drop handler (`components/file-drop.tsx:27`). Downgraded: the loop drives the "Reading 2 of 5" progress message and pdf.js runs one worker, so parallelising gains little and loses feedback.
- No table virtualization (`components/review-table.tsx:22`). Downgraded: only matters for pathological pastes, not three to six syllabi.
- Per-line parsing bounded by the term window (`lib/extract.ts:72`). Confirmed, keep.

## Existing features

- Unnamed class dropped at export (`components/export-step.tsx:55`). Confirmed.
- Blank added rows dropped without indicator (`lib/export.ts:5`). Confirmed.
- Review table overflows on phones (`components/review-table.tsx:38`). Confirmed.
- Upload gate needs only one named class (`components/upload-step.tsx:65`). Confirmed.
- Merge never deletes (`lib/merge.ts:14`). Confirmed, keep.
- Storage banner (`app/page.tsx:47`). Confirmed, keep.
- Share fallback and confirmation (`components/export-step.tsx:62`). Confirmed, keep.
- File-specific errors, batch continues (`lib/convert.ts:8`). Confirmed, keep.

## New features

- Event description from the source line (`lib/extract.ts:90`). Confirmed.
- Phone-first Google route and platform default tab (`components/export-step.tsx:11`). Confirmed.
- Recurring class meetings (`lib/ics.ts`). Downgraded: not a stated need, deferred by the original spec.
- Clash callout on Export (`components/date-preview.tsx:12`). Confirmed.

## Changed since last review

Every item from the morning review was built: multi-file drop, auto-extract with name prefill, Web Share, edit-preserving re-run, storage warning, saved-state validation, upload cap, reminder select, by-date preview, component tests, security headers, sample syllabus, and the Next 16 upgrade that cleared both audit advisories. Beyond that list, the app gained the guided flow, per-class export, bulk review actions, PWA support, and the identity work. New this round: the semicolon escaping defect, the unnamed-class export gap, the blank-row export gap, the phone table overflow, and the production inline-script allowance.

## Open questions

- Whether Google Calendar on Android imports a multi-event file opened from Files on current versions; the new-features lens rated its phone-route proposal medium confidence for this reason.
- The extraction regexes were not reviewed for pathological input; the security lens listed it as unexamined again.
- Word document conversion still has not been tried with a real file in a browser.
- The share button and PWA install have not been exercised on a real phone.

## Evidence run

- `npm run lint --if-present`: ran, clean, `scratchpad/evidence2/lint.txt`
- `npx --no-install tsc --noEmit`: ran, clean, `scratchpad/evidence2/typecheck.txt`
- `npm audit`: ran, zero vulnerabilities, `scratchpad/evidence2/audit.txt`
- size (`find ... | wc -l`): ran, `scratchpad/evidence2/size.txt`
- `npm test`, `npm run build`: skipped, slow rows, default run

## Run stats

Elapsed: about sixteen minutes from 21:10 to 21:26. Subagents dispatched: four lens agents (code-and-performance, security, existing-features on sonnet; new-features on the default model) and one verifier on the default model. The code lens reported reaching its time budget; the verifier reached every finding.
