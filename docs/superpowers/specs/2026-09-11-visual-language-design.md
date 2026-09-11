# Syllabify visual language: design (revised)

Date: 2026-09-11
Status: **approved from a mockup, not yet built.**
Supersedes: `2026-09-10-visual-language-design.md`, whose "dev-tool register" was mocked up on
2026-09-11 and rejected on sight. That document stays in the tree as the record of the road not
taken.
Mockup: https://claude.ai/code/artifact/427399d1-20a7-4c8b-9365-f3da2d993e8e (one artboard: the
landing page, then the review step).

## What was learned from the first mockup

The 09-10 spec was built as drawn: cool neutral ground, mono for all data, hairline panels,
6px corners, no glow. Rendered, it was a competent grey dashboard. The hero was small, the
illustration tiny, and mono everywhere made the page read as a terminal. The owner's verdict
was immediate and negative. The fault was the register decision itself, not the execution:
a product for nineteen-year-olds should not look like a deploy log.

## Decisions taken

Three directions were offered as one-line sketches (big and warm; bold colour block; notebook).
The owner chose a mix of the first two with one element of the third, and approved the built
mockup of that mix.

1. **Ground: warm paper, kept.** `--paper #fbfaf7`, warm greys, warm hairlines. The existing
   palette is right; the 09-10 move to cool neutrals is dropped entirely.
2. **Hero: one solid green block.** The hero is a full-width rounded block (28px radius) filled
   with `--accent`, containing a white serif headline at roughly 78px, the closing phrase in
   amber italic (`--joy-2`), a pale green lede, a white primary button and a ghost secondary
   button, and the illustration at full size on the right. The clipart is not deleted; it is
   promoted. It is the picture.
3. **Joy colours carry the dates.** The three dates in flight and the filled calendar days use
   `--joy-2` amber, `--joy-3` coral and `--joy-4` blue (plus green). The demo panel repeats
   this with a small coloured square per found row. This is the notebook direction's one
   contribution and the thing that stops the page reading as corporate.
4. **Serif for every heading, not only the hero.** Section titles are Instrument Serif at
   40–48px; proof-card titles are serif at 26px. The 09-10 rule of one serif moment per screen
   is reversed. Body stays Geist. Mono stays for dates, times and the syllabus text only.
5. **Corners get rounder, not sharper.** Cards 16px, blocks 28px, buttons 12px. The primary
   button on the closing block keeps its soft green glow.

## Landing page, top to bottom

- Header: mark, serif wordmark at 26px, a quiet "Free forever" and the theme control.
- Hero block, as in decision 2. The animation is kept and re-inked: the sheet lines grow in,
  the three dates fly across on the dashed white arrows and land, the days fill in the joy
  colours, once, then hold. Reduced motion shows the finished frame.
- "Watch it read one", serif, centred, with the demo panel as a white card: syllabus text left
  in mono, found rows right with a colour square, mono date, title, time, and the existing amber
  "check" pill. The two "also read" cards stay beneath.
- Proof: three tinted cards (`--accent-soft`, `--warn-soft`, a coral tint) each with a solid
  icon square, serif title and one sentence.
- "What makes this different": serif heading, comparison table in a white card with a sunk
  header strip, ✕ and ✓ marks.
- Closing: a soft green block (`--accent-soft`, 28px radius) with a serif "Ready when you
  are", one line, one large primary button. The "How it works" trio and the middle call to
  action are removed: the page has one primary action at the top and one at the bottom.

## Review step

Warm paper, serif h1 at 56px, class tabs with a solid green active state and rounded corners.
The list is a white card with a sunk header strip holding the count and the All / None /
Needs check segmented control. Dates and times are mono and aligned. A flagged row keeps a
pale amber fill, with the reason in amber below the title. Rows are separated by hairlines.
Nothing about the behaviour changes.

## Upload and export steps

Not mocked. They follow the same vocabulary: serif titles, white 16px cards on paper, the
drop zone as a card, the export count in mono as the largest number on the screen. If either
screen needs a decision the mockup does not settle, it gets its own artboard first.

## Constraints (unchanged from 09-10)

- Phone first. Tap targets 44px, type never below 14px, review rows stay as stacked cards.
  The hero block stacks headline over illustration at phone width.
- Every colour pair is checked against WCAG AA in both themes. White on `--accent` and the
  amber italic on green both need checking in the dark theme, where `--accent` is lighter.
- Both themes move together through tokens. The dark theme's hero block uses the dark
  `--accent-soft` or a deep green rather than the light accent, to be settled in the plan.
- Behaviour does not change. The 359 tests should survive; tests asserting on rendered text
  near styling get fixed rather than weakened.

## Open

- Dark-theme hero block colour.
- Whether `components/how-it-works.tsx` is deleted or left in the tree.

## Next step

Implementation plan with the writing-plans skill, then execute against the mockup.
