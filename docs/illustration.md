# The illustration

One cut-paper render, in four places, animated in three parts.

## What it is

`public/art/paper.png`, 1200 x 896, transparent. A torn paper syllabus on the left, three
cut-out dates in flight across the middle, a paper calendar on the right.

Three styles were generated and compared live on the page before this one was chosen: cut paper,
soft 3D clay, and flat vector. The other two are in git history at `2a93217`. Cut paper won
because it is the only one of the three that does not read as generated.

## Recovering the transparency

The generator flattened the transparency indicator into the pixels, so all three files arrived
with a grey checkerboard painted behind the artwork and no alpha channel at all. Dropped onto
the page as they were, the hero would have shown a grid.

`scripts/recover-alpha.py` undoes that. The grid is perfectly periodic, which is what makes it
recoverable:

1. **Fit the grid.** The period is not a round number, about 23.19 px here, so it is measured
   from the sub-pixel crossings of the square wave along four clean rows and columns. Assuming
   23 drifts the model out of phase across the frame and leaves the grid opaque at the far edge.
2. **Rebuild the backdrop** under every pixel, anti-aliased at the cell boundaries.
3. **Solve for dimming.** For each pixel find the single factor `k` where `pixel ≈ k × backdrop`.
   Where one factor explains all three channels, the pixel is backdrop or a shadow over it, and
   its alpha is `1 − k`. This is what keeps the soft drop shadows soft instead of turning them
   into grey blobs with a checker pattern inside.
4. **Restrict it to the outside** by keeping only the part of that mask which reaches the border,
   so pale artwork is never punched through.
5. **Clean the seams.** The one or two pixel lines where cells meet do not fit the model and
   survive as thin opaque islands: a faint dashed grid, invisible on a pale page and obvious on
   a dark one. Anything the model called artwork but which is too small to be artwork is
   background after all, and a small median over the background region takes the rest.

It needs numpy, scipy and Pillow, and it is not part of the build. Run it once per new render:

```bash
python3 scripts/recover-alpha.py <source.png> public/art/paper.png 1200
python3 scripts/recover-alpha.py <source.png> app/og-art.png 560
```

If a future render comes back with real transparency, skip all of this and just resize it.

## Where it appears

| Spot | What it shows |
| --- | --- |
| Landing hero | The whole picture, in three animated parts |
| Export success | The calendar half, with the tick badge over its corner |
| Classes screen, before anything is dropped | The document half |
| 404 | The document half |
| Link preview | The whole picture, beside the headline |

The smaller spots crop rather than needing art of their own. `ArtCrop` squares off either half
using the focus points in `lib/art.ts`.

## Cutting it into moving parts

A flat picture cannot be animated in pieces until it is in pieces. The first attempt clipped one
image into three guessed regions and got it wrong: the paper is tilted, so it reaches further
right than it looks, and its top corner landed in the band meant for the flying dates.

`scripts/slice-art.py` does not guess. It finds the pieces as connected components in the alpha
channel, hands every pixel of shadow to whichever piece is nearest, and writes each one out with
its box as a percentage of the frame. Specks too small to be a piece, torn edges of the paper
mostly, are folded into their neighbour rather than dropped. Compositing the five slices back at
their recorded positions reproduces the original with a maximum per-pixel difference of zero.

```bash
python3 scripts/slice-art.py public/art/paper.png public/art/parts
```

It prints the geometry as JSON; paste that into `ART_PIECES` in `lib/art.ts`. Tests check that
every piece stays inside the frame, that they run paper, dates left to right, then calendar, and
that no slice is stretched into a box of a different shape than the slice itself.

## How the hero moves

The paper slides in, the three cut-out dates fly across one after another, the calendar lands,
and a single pass of light closes it. That is the order the product works in and the order the
picture reads. Afterwards only the dates keep moving, a few pixels on a slow cycle, which is
enough that the section does not read as a screenshot without competing with the button beside
it. All of it is off under `prefers-reduced-motion`.

## Weight

Everything is served through `next/image`, which re-encodes and sizes per device. The whole hero,
all five slices, comes to roughly 80 KB of WebP at the size it is drawn; the cropped halves reuse
the single full-frame file. The link preview embeds its own 560 px copy and the display font from
`app/`, because that renderer has no network at build time.
