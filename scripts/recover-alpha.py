"""
Recover real transparency from a render whose checkerboard was baked in as pixels.

The generator flattened the transparency indicator into the image, so the file arrives with a
grey grid behind the artwork and no alpha channel. The grid is perfectly periodic, which is what
makes this recoverable: fit the grid, reconstruct the backdrop under every pixel, then for
anything that is only a dimmed version of that backdrop, solve for how dim. Pure grid goes to
fully transparent, and the soft drop shadows keep their softness instead of turning into grey
blobs with a checker pattern inside them.

The period is not an integer (about 23.19 px here), so it is fitted from the sub-pixel crossings
of the square wave along four clean rows and columns. Assuming a round number drifts the model
out of phase across the frame and leaves the grid opaque at the far edge.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst, out_w = sys.argv[1], sys.argv[2], int(sys.argv[3])

rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float64)
h, w, _ = rgb.shape
grey = rgb[:, :, 0]

LIGHT, DARK = 254.0, 232.0
MID = (LIGHT + DARK) / 2


def fit(line):
    """Sub-pixel crossings of a square wave, then least-squares period and phase."""
    b = line > MID
    idx = np.flatnonzero(np.diff(b.astype(np.int8)) != 0)
    if len(idx) < 8:
        return None
    x = idx + (MID - line[idx]) / (line[idx + 1] - line[idx])
    n = np.arange(len(x))
    (cell, phase), *_ = np.linalg.lstsq(np.vstack([n, np.ones_like(n)]).T, x, rcond=None)
    return cell, phase


def axis_fit(lines):
    fits = [f for f in (fit(l) for l in lines) if f is not None]
    if not fits:
        raise SystemExit('could not find the checkerboard; is it really baked in?')
    return float(np.mean([f[0] for f in fits])), float(np.mean([f[1] for f in fits]))


cell_x, phase_x = axis_fit([grey[2], grey[5], grey[h - 3], grey[h - 6]])
cell_y, phase_y = axis_fit([grey[:, 2], grey[:, 5], grey[:, w - 3], grey[:, w - 6]])


def even_fraction(n, cell, phase, samples=8):
    """How much of each pixel falls in an even-numbered cell, so boundaries stay anti-aliased."""
    offsets = (np.arange(samples) + 0.5) / samples
    pos = np.arange(n)[:, None] + offsets[None, :]
    return (np.floor((pos - phase) / cell) % 2 == 0).mean(axis=1)


ex = even_fraction(w, cell_x, phase_x)
ey = even_fraction(h, cell_y, phase_y)
# A checkerboard is light where the two parities agree.
same = ey[:, None] * ex[None, :] + (1 - ey)[:, None] * (1 - ex)[None, :]
corner_light = grey[2, 2] > MID
frac_light = same if corner_light else 1 - same
backdrop = DARK + (LIGHT - DARK) * frac_light
B = np.repeat(backdrop[:, :, None], 3, axis=2)

# Least-squares scalar k with P ~= k * B, and how badly that single factor fits all three channels.
k = (rgb * B).sum(axis=2) / (B * B).sum(axis=2)
residual = np.sqrt(((rgb - k[:, :, None] * B) ** 2).sum(axis=2))

looks_like_backdrop = (residual < 8.0) & (k <= 1.04)

# Only outside the artwork: keep the part of that mask which reaches the border.
labels, _ = ndimage.label(looks_like_backdrop)
border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
border = border[border != 0]
outside = np.isin(labels, border)

# The one or two pixel lines where cells meet do not fit the model, so they survive as thin
# opaque islands of white inside the empty region: a faint dashed grid, invisible on a pale page
# and obvious on a dark one. Anything the model called artwork but which is too small to be
# artwork is background after all.
inside_labels, _ = ndimage.label(~outside)
areas = np.bincount(inside_labels.ravel())
tiny = np.flatnonzero(areas < 3000)
tiny = tiny[tiny != 0]
outside |= np.isin(inside_labels, tiny)

alpha = np.where(outside, np.clip(1.0 - k, 0.0, 1.0), 1.0)

# At a cell boundary the backdrop is a blend of both greys, so k there is unreliable and leaves
# a faint dashed grid that only shows against a dark page. Those boundaries are one or two pixels
# wide and the shadows around them are smooth, so a small median over the background region wipes
# the dashes out and leaves the shadow gradients alone.
smoothed = ndimage.median_filter(alpha, size=5)
alpha = np.where(outside, smoothed, alpha)
alpha[alpha < 0.02] = 0.0  # compression noise in the flat grid

# Shadows read as neutral dark. The grid itself is fully clear, so its colour never shows.
out = np.where(outside[:, :, None], 0.0, rgb)

rgba = np.dstack([out, alpha * 255.0]).clip(0, 255).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA').resize((out_w, round(out_w * h / w)), Image.LANCZOS)
img.save(dst)

a = np.asarray(img)[:, :, 3] / 255
print(
    f'{dst}  {img.size[0]}x{img.size[1]}  cell {cell_x:.3f}x{cell_y:.3f}  '
    f'opaque {(a > 0.98).mean():.1%}  shadow {((a > 0.02) & (a <= 0.98)).mean():.1%}  clear {(a <= 0.02).mean():.1%}'
)
