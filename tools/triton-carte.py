# Retouche de la carte de Triton (Voyager 2) : efface le quadrillage à 30° et remplace l'aplat gris de l'hémisphère nord,
# jamais photographié, par une teinte neutre tirée des bords (sans inventer de relief).
# Usage : python3 tools/triton-carte.py source.jpg textures/triton.jpg
import sys, numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = a.shape
# 1) quadrillage (tous les 30°) : on remplace ±2 px par l'interpolation des pixels voisins
for k in range(13):
    x = int(round(k * W / 12)) % W
    for dx in range(-2, 3):
        xi = (x + dx) % W; l = (x - 4) % W; r = (x + 4) % W; t = (dx + 4) / 8
        a[:, xi] = a[:, l] * (1 - t) + a[:, r] * t
for k in range(1, 6):
    y = int(round(k * H / 6))
    for dy in range(-2, 3):
        yi = y + dy; t = (dy + 4) / 8
        a[yi] = a[y - 4] * (1 - t) + a[y + 4] * t
# 2) zone jamais photographiée (gris uni 157) : teinte neutre tirée des bords photographiés, plus sombre et douce
gray = (np.abs(a - 157).max(axis=2) < 4)
gray = np.asarray(Image.fromarray((gray * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) > 128   # sans les pixels isolés
known = ~gray
meanc = a[known].mean(axis=0)
# couleur de bord : moyenne, colonne par colonne, des 60 premières lignes photographiées sous la limite
edge = np.zeros((W, 3), np.float32); lim = np.zeros(W, int)
for x in range(W):
    col = gray[:, x]; ys = np.where(~col)[0]
    y0 = ys[0] if len(ys) else H; lim[x] = y0
    band = a[y0:y0 + 60, x] if y0 < H else meanc[None]
    edge[x] = band.mean(axis=0) if len(band) else meanc
k = np.ones(481) / 481
edge = np.stack([np.convolve(np.r_[edge[-240:, c], edge[:, c], edge[:240, c]], k, 'valid') for c in range(3)], 1)
lims = np.convolve(np.r_[lim[-240:], lim, lim[:240]].astype(float), np.ones(481)/481, 'valid')
fill = np.zeros_like(a)
yy = np.arange(H)[:, None]
for c in range(3):
    base = edge[None, :, c] * .55 + meanc[c] * .45                 # vers la teinte moyenne de Triton
    fade = np.clip((lims[None, :] - yy) / 260.0, 0, 1)                # plus on s'éloigne de la limite, plus c'est neutre et sombre
    fill[..., c] = base * (1 - .25 * fade) + meanc[c] * .0
# léger grain pour éviter l'aplat, sans inventer de relief
rng = np.random.default_rng(3); fill += rng.normal(0, 2.0, fill.shape[:2])[..., None]
out = np.where(gray[..., None], fill, a)
# couture adoucie sur 18 px de part et d'autre de la limite
m = Image.fromarray((gray * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
m = np.asarray(m).astype(np.float32)[..., None] / 255
out = a * (1 - m) + fill * m
out = np.where(gray[..., None] & (m > .98), fill, out)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=90)
print('ok', meanc)
