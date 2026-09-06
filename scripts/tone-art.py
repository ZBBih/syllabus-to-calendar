"""
Bring the render into the site's palette, and give it a dark-mode twin.

The artwork was generated, not designed to a spec, so its colours are its own: a cream that is
warmer and yellower than the page it sits on, and no dark version at all, which left two glaring
near-white blocks on a near-black screen.

Rather than filter the whole picture, which drags every colour along with it, the pixels are
sorted into the three materials the render actually uses -- paper and printing (neutral), the
marked days and the header (green), the pin (gold) -- and each is mapped onto the token it
corresponds to. Neutrals in dark mode are inverted in lightness rather than darkened, so a mark
that is darker than the sheet in daylight is lighter than it at night, which is how the rest of
the interface behaves.

Shadows live in the alpha channel, so softening them is a matter of scaling it, not of repainting
anything.

Writes WebP in both themes. The hero picks one with a CSS background, so a visitor downloads the
set for the theme they are in and not the other.

Reads the untouched renders from art/, which is deliberately not under public/: only the toned
WebP is ever served, so shipping the originals would be a megabyte and a half nobody downloads.
"""
import sys
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/art/toned'
SRC = ['paper.png'] + [f'parts/{n}.png' for n in
                       ('document', 'card1', 'card2', 'card3', 'calendar', 'day1', 'day2', 'day3', 'day4')]

# What the render uses, measured off it.
ART_CREAM = np.array([248, 244, 233], float)
ART_GREEN = np.array([31, 124, 90], float)
ART_GOLD = np.array([224, 169, 47], float)

# What the site uses. globals.css is the source of these.
LIGHT = {'paper': [251, 250, 247], 'green': [13, 122, 92], 'gold': [245, 184, 65]}
DARK = {'paper': [26, 28, 24], 'green': [79, 199, 157], 'gold': [245, 198, 95]}

LUM = np.array([0.2126, 0.7152, 0.0722])


def luminance(rgb):
    return rgb @ LUM


def tone(im, theme):
    rgb = im[:, :, :3].astype(float)
    alpha = im[:, :, 3].astype(float)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Partial alpha means one of two very different things. A dark pixel there is shadow, which
    # is not paper and must not be inverted with it, or every shape gains a pale halo. A bright
    # one is the anti-aliased edge of the artwork itself, and must be inverted, or every shape
    # keeps a cream fringe that only shows up against a dark page.
    lit = luminance(rgb / 255) > 0.55
    art = (alpha >= 250) | ((alpha > 0) & lit)
    shadow = (alpha > 0) & ~art

    green = ((g - np.maximum(r, b)) > 15) & art
    gold = (~green) & (r > g) & (g > b) & ((r - b) > 30) & art
    neutral = art & ~(green | gold)

    out = rgb.copy()
    target = LIGHT if theme == 'light' else DARK

    if theme == 'light':
        # A white balance: the cream becomes the page's paper and everything neutral comes with it.
        out[neutral] = rgb[neutral] * (np.array(target['paper']) / ART_CREAM)
    else:
        # Lightness inverted, not dimmed, so printing stays legible against its own sheet.
        lum = luminance(rgb[neutral] / 255)
        # Inverting outright turns the paper's own shading into light rims along every cut edge,
        # because a shadow is dark and everything dark comes out bright. So only the range the
        # material occupies is inverted -- the sheet lands near --elev, its printing near
        # --line-strong -- and below that the curve falls away again, which keeps a shadow a
        # shadow. The two halves meet at the same value, so there is no visible step.
        KNEE = 0.65
        flipped = np.where(
            lum >= KNEE,
            0.1 + 0.62 * (1 - lum),
            (0.1 + 0.62 * (1 - KNEE)) * np.power(np.clip(lum / KNEE, 0, 1), 2.2),
        )
        flipped = np.clip(flipped, 0, 1)
        tint = np.array(target['paper'], float)
        tint = tint / luminance(tint / 255) / 255
        out[neutral] = np.clip(flipped[:, None] * tint * 255, 0, 255)

    out[green] = rgb[green] * (np.array(target['green']) / ART_GREEN)
    out[gold] = rgb[gold] * (np.array(target['gold']) / ART_GOLD)

    # Softer shadows in daylight; at night a dark shadow on a dark page is only mud. The
    # artwork's own edges keep their alpha, or every shape would come out a little thinner.
    soft = np.where(shadow, alpha * (0.72 if theme == 'light' else 0.4), alpha)

    return np.dstack([np.clip(out, 0, 255), soft]).round().astype(np.uint8)


for rel in SRC:
    im = np.asarray(Image.open(f'art/{rel}').convert('RGBA'))
    stem = rel.replace('parts/', '').replace('.png', '')
    for theme in ('light', 'dark'):
        path = f'{OUT}/{stem}-{theme}.webp'
        Image.fromarray(tone(im, theme)).save(path, quality=86, method=6)
        print(path)
