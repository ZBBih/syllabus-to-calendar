"""
Cut the illustration into its five pieces so the hero can animate them separately.

Clipping one flat image into regions was guesswork and got it wrong: the tilted paper reaches
further right than it looks, so its top corner ended up in the band meant for the flying dates.
Connected components do not guess. Every pixel of shadow is handed to whichever piece is nearest,
so each slice carries its own shadow and no shadow is drawn twice.
"""
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out_dir = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA'))
alpha = im[:, :, 3] / 255.0
h, w = alpha.shape

core = alpha > 0.6
lab, n = ndimage.label(core)
areas = np.bincount(lab.ravel())
keep = [i for i in range(1, n + 1) if areas[i] >= 400]

# Specks too small to be a piece, torn edges of the paper mostly, are cleared before the nearest
# search so they get handed to a real piece rather than quietly dropped out of the artwork.
lab[~np.isin(lab, keep)] = 0

# Hand every remaining pixel, which is shadow and soft edges, to the piece it is closest to.
_, (iy, ix) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
owner = lab[iy, ix]

pieces = []
for i in keep:
    ys, xs = np.nonzero(lab == i)
    pieces.append({'label': int(i), 'cx': float(xs.mean()), 'cy': float(ys.mean()), 'area': int(areas[i])})

# Name them by where they sit: the two big shapes are the paper and the calendar, the three small
# ones are the dates in flight, ordered left to right so they can be staggered along their arc.
big = sorted([p for p in pieces if p['area'] > 50000], key=lambda p: p['cx'])
small = sorted([p for p in pieces if p['area'] <= 50000], key=lambda p: p['cx'])
names = {big[0]['label']: 'document', big[1]['label']: 'calendar'}
for k, p in enumerate(small):
    names[p['label']] = f'card{k + 1}'

manifest = {}
for label, name in names.items():
    mask = (owner == label) & (alpha > 0)
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cut = im[y0:y1, x0:x1].copy()
    cut[:, :, 3] = np.where(mask[y0:y1, x0:x1], cut[:, :, 3], 0)
    Image.fromarray(cut, 'RGBA').save(f'{out_dir}/{name}.png')
    manifest[name] = {
        'left': round(100 * x0 / w, 3),
        'top': round(100 * y0 / h, 3),
        'width': round(100 * (x1 - x0) / w, 3),
        'height': round(100 * (y1 - y0) / h, 3),
        'px': [int(x1 - x0), int(y1 - y0)],
    }

print(json.dumps(manifest, indent=2, sort_keys=True))
