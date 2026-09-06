"""
Split the calendar's marked days out of the artwork, so the hero can fill them in one by one.

The render has four days already coloured in. That is the right final picture but the wrong
starting one: the whole point of the animation is that a date leaves the syllabus and *then* the
calendar changes. So the four squares come out as sprites and the holes they leave are patched
with a plain day copied from the same row, which keeps the paper grain and the grid's tilt
because it is the same row of the same photograph.

The grid is fitted from the four known squares rather than measured by eye (residuals under a
pixel), which is what makes "the plain day three columns over" a coordinate rather than a guess.
"""
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out_dir = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(float)
h, w = im.shape[:2]

# The coloured days: green, opaque, and mid-tone, which no other part of the picture is.
rgb, alpha = im[:, :, :3], im[:, :, 3]
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
green = (alpha > 200) & (g > r + 25) & (g > b + 15) & (g > 55) & (g < 175)
lab, n = ndimage.label(green)
sizes = ndimage.sum(green, lab, range(1, n + 1))
# The header band and the back cover are green too, and both are bigger than a day.
days = [i + 1 for i, s in enumerate(sizes) if 1500 < s < 3200]
all_boxes = ndimage.find_objects(lab)
boxes = [all_boxes[d - 1] for d in days]
centres = [((s[1].start + s[1].stop) / 2, (s[0].start + s[0].stop) / 2) for s in boxes]
if len(centres) != 4:
    sys.exit(f'expected four marked days, found {len(centres)}')

# Which row and column each one is, read off the picture once and fixed here.
CELLS = [(4, 0), (1, 1), (3, 2), (5, 3)]
order = sorted(range(4), key=lambda i: centres[i][1])
by_cell = {CELLS[k]: order[k] for k in range(4)}

# Fit centre = origin + col * across + row * down, so any day has a coordinate.
A = np.array([[1, c, r_] for c, r_ in CELLS], float)
fit = {}
for k, axis in ((0, 'x'), (1, 'y')):
    target = np.array([centres[by_cell[cell]][k] for cell in CELLS])
    fit[axis], *_ = np.linalg.lstsq(A, target, rcond=None)
    resid = np.abs(A @ fit[axis] - target).max()
    print(f'{axis} fit residual {resid:.2f}px')


def centre_of(col, row):
    return (
        fit['x'][0] + fit['x'][1] * col + fit['x'][2] * row,
        fit['y'][0] + fit['y'][1] * col + fit['y'][2] * row,
    )


# Patch each coloured day with a plain one from the same row.
DONOR = {(4, 0): 2, (1, 1): 3, (3, 2): 1, (5, 3): 3}
base = im.copy()
# The grid is regular, so a donor patch brings its neighbours' edges with it in the same places
# the target's are: the patch can safely run past the day itself, which it has to, because the
# colour bleeds a few pixels further than the mask that found it.
PAD = 40
yy, xx = np.mgrid[-PAD:PAD + 1, -PAD:PAD + 1]
d = np.maximum(np.abs(yy), np.abs(xx))
blend = np.clip((PAD - d) / 6.0, 0, 1)[..., None]
for cell, donor_col in DONOR.items():
    tx, ty = (int(round(v)) for v in centre_of(*cell))
    sx, sy = (int(round(v)) for v in centre_of(donor_col, cell[1]))
    dst = (slice(ty - PAD, ty + PAD + 1), slice(tx - PAD, tx + PAD + 1))
    patch = im[sy - PAD:sy + PAD + 1, sx - PAD:sx + PAD + 1]
    base[dst] = patch * blend + base[dst] * (1 - blend)

Image.fromarray(base.round().astype(np.uint8)).save(f'{out_dir}/calendar.png')

# Each coloured day as its own sprite, edges softened by a pixel so it does not look cut out.
soft = ndimage.gaussian_filter(green.astype(float), 0.8)
out = []
for cell in CELLS:
    i = by_cell[cell]
    sl = boxes[i]
    y0, y1 = sl[0].start - 2, sl[0].stop + 2
    x0, x1 = sl[1].start - 2, sl[1].stop + 2
    sprite = im[y0:y1, x0:x1].copy()
    sprite[:, :, 3] = np.clip(soft[y0:y1, x0:x1], 0, 1) * 255
    name = f'day{CELLS.index(cell) + 1}'
    Image.fromarray(sprite.round().astype(np.uint8)).save(f'{out_dir}/{name}.png')
    out.append({'id': name, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})

print(json.dumps(out, indent=2))
