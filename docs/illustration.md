# The illustration

The syllabus on the left, three dates crossing the middle, the calendar on the right filling in
as they arrive. It is the product in one line, which is why the same drawing serves the landing
hero, the classes screen, the export payoff, the 404 and the link preview: the smaller spots
crop to one half rather than needing art of their own.

It is drawn, not shipped as a picture. `lib/art.ts` holds the geometry, `components/art.tsx`
draws it, and every colour is a token, so it changes with the theme without a second copy of
anything, stays sharp at any size, weighs a couple of kilobytes inside the HTML, and comes apart
for animation without any slicing.

## Why not the render

A generated cut-paper render was built out fully first and is in git history. It looked good on
its own and wrong on the page, and the work of finding out why is worth recording so it is not
repeated:

- The render arrived with the checkerboard baked in as pixels rather than as transparency, so it
  had to be recovered by fitting the grid (its period was 23.19px, not a round number),
  rebuilding the backdrop, and solving for how much each pixel was dimmed.
- Animating it meant cutting it into pieces. Clipping guessed regions got it wrong, because the
  tilted paper reached further right than it looked, so a connected-component slicer was needed.
- The calendar's marked days were coloured in from the first frame, which left nothing for a
  flying date to cause, so they had to be lifted out and their holes patched.
- Its cream was `#f8f4e9` against a page of `#fbfaf7`, and it had no dark version, which put two
  glaring near-white blocks on a near-black screen. Toning it onto the palette meant sorting
  pixels by material and inverting lightness, and then handling the two things that breaks:
  shadows becoming halos, and the paper's own shading becoming light rims.

All of that worked, and none of it fixed the actual problem. A photograph of textured paper with
real drop shadows cannot sit on a flat, crisp interface, however carefully its colours are
matched. The style was the mismatch, not the palette.

## The animation

The sheet arrives, the calendar arrives, and then the three dates fly the distance from the
syllabus to their places, one after another, each arrival colouring in a day. The travel and the
fill are the whole point: a shape that fades in where it already sits reads as a picture
loading, while a date that leaves one object and changes another reads as the product working.

A fourth day fills at the end, so the calendar keeps going for a beat rather than stopping dead
with the animation. The fill delays are each date's delay plus its flight, so the two cannot
drift apart unnoticed.

It plays once and settles, because a loop beside a call to action competes with it, and it is
off entirely under `prefers-reduced-motion`.
