# Rewrites the text in a picture's speech bubble: the bubble's inside is found by a flood from a seed point, its old
# text painted over with the bubble's own colour, and the new text written in a hand-drawn font, as large as fits.
# usage: python3 -I tools/baloncuk.py <in> <out> <seed x> <seed y> "<new text>" <font file>
# The seed is a point of the bubble's background (not on its text), in the picture's own pixels.
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

FONT = sys.argv[6]  # a hand-drawn font, e.g. Patrick Hand (npm pack @fontsource/patrick-hand → files/patrick-hand-latin-400-normal.woff)
src, out, sx, sy, text = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
im0 = Image.open(src).convert('RGB')
W, H = im0.size
# small pictures are worked on four times larger, so the new text is smooth
S = 4 if W < 600 else 1
F = W * S / 256   # the working picture's scale against a 256 px one: outline and margins grow with it
im = im0.resize((W * S, H * S), Image.LANCZOS)
a = np.asarray(im).astype(int)
seed = (sy * S, sx * S)
bg = a[seed[0] - 2:seed[0] + 3, seed[1] - 2:seed[1] + 3].reshape(-1, 3).mean(0)
near = np.abs(a - bg).sum(2) < 60
lab, _ = ndimage.label(near)
comp = lab == lab[seed]
if comp[0].any() or comp[-1].any() or comp[:, 0].any() or comp[:, -1].any():
    sys.exit('bubble leaks to the border: ' + src)
inside = ndimage.binary_fill_holes(comp)
# keep clear of the outline
inner = ndimage.binary_erosion(inside, iterations=max(1, round(3 * F)))
holes = inside & ~comp
lum = a.mean(2)
ink = holes & (lum < bg.mean() - 60)
if ink.sum() > 20:
    px = a[ink]
    l = px.mean(1)
    colour = tuple(int(c) for c in np.median(px[l <= np.percentile(l, 25)], 0))
else:
    colour = (40, 50, 70)
# paint the inside with the bubble's colour (a slight erosion keeps the outline untouched)
paint = ndimage.binary_erosion(inside, iterations=max(1, round(F)))
b = a.copy()
b[paint] = bg
canvas = Image.fromarray(b.astype('uint8'))

# the largest size at which the text (on one, two or three lines) fits inside the bubble
ys, xs = np.nonzero(inner)
dist = ndimage.distance_transform_edt(inner)
cy, cx = ndimage.center_of_mass(inner)
words = text.split()
def layouts():
    yield [text]
    for i in range(1, len(words)):
        yield [' '.join(words[:i]), ' '.join(words[i:])]
    for i in range(1, len(words)):
        for j in range(i + 1, len(words)):
            yield [' '.join(words[:i]), ' '.join(words[i:j]), ' '.join(words[j:])]
best = None
for size in range(int(H * S * 0.24), 6 * S, -1):
    font = ImageFont.truetype(FONT, size)
    for lines in layouts():
        gap = int(size * 0.02)
        boxes = [font.getbbox(l) for l in lines]
        lh = size * 0.95
        tw = max(bx[2] - bx[0] for bx in boxes)
        th = lh * len(lines)
        x0, y0 = cx - tw / 2, cy - th / 2
        corners = [(x0, y0 + lh * 0.25), (x0 + tw, y0 + lh * 0.25), (x0, y0 + th), (x0 + tw, y0 + th), (cx, y0 + lh * 0.2), (cx, y0 + th)]
        ok = all(0 <= int(y) < inner.shape[0] and 0 <= int(x) < inner.shape[1] and inner[int(y), int(x)] for x, y in corners)
        if ok:
            best = (size, lines, font, lh, x0, y0)
            break
    if best:
        break
if not best:
    sys.exit('text does not fit: ' + src)
size, lines, font, lh, x0, y0 = best
d = ImageDraw.Draw(canvas)
for n, line in enumerate(lines):
    bx = font.getbbox(line)
    w = bx[2] - bx[0]
    d.text((cx - w / 2 - bx[0], y0 + n * lh - size * 0.05), line, font=font, fill=colour, stroke_width=max(1, size // 60), stroke_fill=colour)
canvas = canvas.resize((W, H), Image.LANCZOS)
canvas.save(out)
print(out, 'size', size // S, 'lines', lines, 'colour', colour)
