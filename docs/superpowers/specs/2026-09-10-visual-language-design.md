# Syllabify visual language: design

Date: 2026-09-10
Status: **SUPERSEDED 2026-09-11.** Mocked up, rejected on sight; see `2026-09-11-visual-language-design.md`.
Origin: `docs/reviews/2026-09-10-improve-project.md`, then a look at the built result.

## Why

The app works. The owner's words after using it: it "works functionally, just the look and feel
feels not that good to me". Looking at all four screens confirmed five specific faults:

- The hero artwork is a flat document glyph and a flat calendar glyph, floating with a canyon of
  dead space between them and nothing connecting them. It reads as clipart, and it is the
  weakest element on the page.
- The headline is forced into four lines by hard breaks, stranding "semester," on its own line.
- The How-it-works trio says in clipart what the extraction demo, directly above it, proves for
  real. Adding the demo created that redundancy.
- "Add my syllabi" appears three times and the sample is offered three times. The page nags.
- Every screen is a centred stack of identical bordered cards with wide empty bands between
  them, so the whole thing reads thin and templated.

## Decisions taken

Three decisions, each chosen by the owner over the alternatives named beside them.

1. **Register: sharp and precise, like a good dev tool.** Tight type, higher density, quiet
   neutrals, monospace for anything that is data, crisp small controls. Chosen over an editorial
   print register and over a warm hand-made one. The stated risk was accepted: this register can
   read cold to a nineteen-year-old, so warmth has to come from the writing, which is already
   good, rather than from the styling.
2. **Type: keep the serif, but only for big moments.** Instrument Serif survives for page titles
   and the hero and nothing else. Everything below is a tight grotesk with monospace data.
   Chosen over dropping the serif entirely (purest, but loses the one thing that stops the page
   looking like every other grey deployment dashboard) and over swapping in a new display face.
   **One serif moment per screen, never two.**
3. **Hero: the demo panel is the picture.** The extraction demo moves up beside the headline.
   The clipart illustration is deleted. Chosen over type-alone and over redrawing the artwork as
   a technical line diagram.

The scope follows from the register: this touches every screen, not only the landing page.

## Foundations

`app/globals.css` carries all of this. Nothing here changes what any component does.

**A real monospace.** Geist Mono joins the Geist already loaded through `next/font`, exposed as
`--font-mono`. It becomes the face for every date, time, count, file name and build stamp. The
demo panel already does this; the change makes it the rule everywhere. Data should look like
data.

**Neutralise the ground.** The palette today is warm cream (`--paper: #fbfaf7`) and warm grey,
which is the opposite of the register chosen. Paper, elevated, sunk, foreground, muted and both
line tokens move to near-neutral, cooler and quieter, in both themes. **The green and the amber
keep their exact current values.** Those two carry all the meaning in the product — green for
safe or finished, amber for a row the parser is unsure about — and they gain force from a calmer
ground rather than needing to change.

**A type scale as tokens**, replacing today's mix of hand-written classes (`h-display`, `h1`,
`lede`, `eyebrow`) and ad-hoc Tailwind sizes. Six steps: display (serif), section, subsection,
body, small, micro. Tighter letter spacing on the grotesk. Body settles at 15px with a 1.5 line
height.

**Corners and motion.** Radius drops from `0.875rem` to `0.375rem`. The glow behind the primary
button goes, and so does the hover lift. Precision does not bounce. The existing 200ms
fade-and-lift stays as the only motion, and every new class is added to the reduced-motion block.

**Cards become panels.** One hairline, no shadow, and an uppercase micro label in a header strip
with a rule beneath it. Inside a panel, rows are separated by hairlines rather than each being
its own bordered box. This is the single biggest visual change and the demo panel is already the
prototype for it.

## Screens

**Landing** (`components/landing.tsx`). Headline, one sentence, one button, with the demo panel
beside it at desktop and below it at phone width. `components/how-it-works.tsx` is deleted from
the page: it repeats what the panel proves. The three proof points become one ruled row rather
than three cards. The comparison table loses its surrounding box and keeps its rules. One
closing call to action instead of three. Section spacing moves onto one rhythm instead of the
current ad-hoc `mt-16` and `mt-20` bands.

**Upload** (`components/upload-step.tsx`, `components/file-drop.tsx`). Narrows to a readable
column instead of stretching the full width with a short drop zone floating in it. The zone
becomes a panel with a mono hint line naming the accepted types. The two explainer cards become
a ruled two-column block.

**Review** (`components/review-step.tsx`, `review-table.tsx`, `class-row.tsx`). The biggest win
available. Dates and times go mono and align in a column. Rows are separated by hairlines. The
amber fill becomes a small mono tag, so an uncertain row reads as flagged rather than
highlighted. The All / None / Needs check controls become one small segmented control.

**Export** (`components/export-step.tsx`). The tinted panel loses its tint. The count becomes the
largest mono number on the screen. The import guides keep their tabs, on a hairline.

**Header and stepper** (`components/app-shell` equivalent, `components/stepper.tsx`). Shorter,
with mono step numbers and a hairline underneath.

## Constraints

- **Phone first for density.** Tap targets stay at 44px, type never goes below 14px, and the
  review rows stay as cards. The laptop view tightens; the phone view does not. This was flagged
  to the owner as the one open trade and is settled this way unless he says otherwise.
- **Contrast is the real risk.** Moving the ground and quieting the lines can push muted text
  under the accessibility floor. Every token pair gets checked against WCAG AA in both themes,
  and a failing pair does not ship.
- **Both themes move together.** Every colour stays a token, so light and dark cannot drift.
- **Behaviour does not change.** This is a styling change. No feature is added, removed or
  rewired. All 359 tests are behavioural and should survive; any that assert on rendered text
  near styling get fixed rather than weakened.

## Open

- Whether to keep `components/how-it-works.tsx` in the tree after removing it from the landing
  page, or delete the file outright.
- Whether the hero headline keeps its hard line breaks at all once the type scale lands.

## Next step

Turn this into an implementation plan with the writing-plans skill, then execute. Nothing in
this document has been built.
