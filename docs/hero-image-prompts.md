# Hero image: three prompts to compare

Generate a still, send me the file, and I animate it in the browser. Nothing here needs to be a video.

## Specs that apply to all three

**Aspect ratio: 4:3, landscape.** Render at **1600 × 1200**. The hero art sits in a column about 470 pixels wide on a laptop and goes full width above the text on a phone, so 4:3 fills both without cropping. Square also works if the tool will not do 4:3; anything wider than 16:10 will look like a letterbox slot on mobile.

**Background: transparent PNG.** This matters more than it sounds. The page has a light theme on warm off-white `#FBFAF7` and a dark theme on near-black `#121310`, and the same file has to sit on both. If the tool cannot do transparency, generate two versions, one on each background, and I will swap them by theme.

**Palette.** Jade green `#0D7A5C` as the lead, deeper jade `#085D46` for shadow, off-white `#FBFAF7` for paper. Optional accents, sparingly: gold `#F5B841`, coral `#EF6F4C`, blue `#3D8BD8`. Avoid any other greens and avoid pure black.

**Composition.** Syllabus or document on the left, calendar on the right, movement between them. Keep the middle third relatively uncluttered so the animated elements I overlay have somewhere to travel. Leave a little breathing room at all four edges; nothing important within about 8% of any edge.

**Negatives for every prompt:** no text, no lettering, no numbers, no logos, no watermark, no UI chrome, no browser window, no hands, no faces, no clutter, no drop-shadow on the outer edge, not photorealistic stock photography, no gradient mesh background.

---

## Prompt 1 — Flat editorial vector

Matches the site exactly: serif headings, flat colour, no gloss. Safest of the three, and the one that will look most like it was made for this page rather than dropped onto it.

> Flat vector illustration, editorial style, on a fully transparent background. On the left, a single sheet of paper standing upright, off-white `#FBFAF7` with a thin warm grey outline and a few abstract horizontal bars suggesting lines of text, one bar in jade green. On the right, a clean monthly calendar with a jade green `#0D7A5C` header bar, two small rings on top, and a grid of rounded square cells, four of the cells filled solid jade. Between them, three small rounded rectangular cards floating in a gentle upward arc from the paper toward the calendar, each card jade green with two pale bars inside. Limited palette of jade green `#0D7A5C`, deep jade `#085D46`, off-white `#FBFAF7` and warm grey. Geometric, generous rounded corners, uniform line weight, no gradients, no texture, no shading. Calm and precise, like a magazine spot illustration. Transparent background, 4:3 landscape.

---

## Prompt 2 — Soft 3D render

The current app-landing-page look: matte clay shapes, soft studio light, gentle depth. More produced than Prompt 1, and it will read as more expensive. The risk is that it dates faster and matches the flat serif page less exactly.

> Soft 3D render, matte clay material, isolated on a fully transparent background. A cream-white document sheet on the left, slightly tilted, with subtly embossed horizontal lines across it. On the right, a chunky rounded calendar block in jade green `#0D7A5C` with a lighter face, two small cylindrical rings on top, and a recessed grid of squares with four squares raised and glowing softly. Floating between them, three small rounded jade green tiles caught mid-flight in a rising arc, with a faint motion trail. Soft even studio lighting from the upper left, gentle contact shadows, shallow depth of field. Palette limited to jade green `#0D7A5C`, deep jade `#085D46`, cream `#FBFAF7` and one small gold `#F5B841` accent. Rounded, tactile, friendly, no sharp edges. Transparent background, 4:3 landscape.

---

## Prompt 3 — Cut paper collage

The most distinctive of the three and the least likely to look generated. Layered paper with real edges and shadows, the kind of thing a design studio would commission. Highest risk: it is the furthest from the rest of the page, so it either elevates everything or sits apart from it.

> Cut paper collage, layered construction paper with visible fibrous torn edges and soft realistic drop shadows between layers, isolated on a fully transparent background. On the left, a sheet of cream paper `#FBFAF7` with narrow strips of grey paper laid across it as lines of text. On the right, a calendar built from layered paper: a jade green `#0D7A5C` header strip, a cream body, and a grid of small paper squares, four of them jade green and sitting slightly proud of the surface. Arcing between the two, three small jade paper rectangles suspended mid-air, each casting its own small shadow. Warm, handmade, tactile, with genuine paper grain. Palette restricted to jade green `#0D7A5C`, deep jade `#085D46`, cream `#FBFAF7` and warm grey, with a single gold `#F5B841` paper accent. Overhead flat lighting. Transparent background, 4:3 landscape.

---

## What I do with the file

Drop the PNG in `public/` and tell me which one. I replace the body of `components/hero-art.tsx`, which nothing else on the landing page reaches into, and animate the still with:

- a slow settle on load, the image easing up into place
- a light sweep passing across it once
- the three flying cards and the filling calendar cells drawn as an SVG layer on top, so those keep moving even though the base is a flat image
- a barely-there float so the section is never completely dead

If you send layers as separate transparent PNGs, paper and calendar and cards apart, I can move them independently and it will look considerably better than a single flat image. Worth asking the tool for if it offers it.
