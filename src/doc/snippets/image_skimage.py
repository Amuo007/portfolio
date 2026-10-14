# Same jobs with scikit-image (skimage). Use if the task says "scikit-image".
# skimage reads RGB directly and often works with values 0..1 instead of 0..255.
import numpy as np
import matplotlib.pyplot as plt
from skimage import io, color, filters, feature, exposure, transform, util

img = io.imread("cat.png")                 # RGB (some PNGs have a 4th alpha channel)
if img.ndim == 3 and img.shape[2] == 4:
    img = color.rgba2rgb(img)              # drop transparency -> 3 channels
gray = color.rgb2gray(img)                 # 2-D, values 0.0 .. 1.0

T = filters.threshold_otsu(gray)           # best threshold, picked automatically
binary = gray > T                          # True/False image

edges = feature.canny(gray, sigma=2)       # bigger sigma -> fewer, smoother edges
sobel = filters.sobel(gray)                # edge strength
equalized = exposure.equalize_hist(gray)   # more contrast
small = transform.resize(img, (128, 128))  # (height, width)
gray_255 = util.img_as_ubyte(gray)         # back to 0..255 integers

hist, bins = exposure.histogram(gray_255)  # pixel counts per value
plt.plot(bins, hist)
plt.title(f"Gray histogram (Otsu T = {T:.2f} on a 0-1 scale)")
plt.show()

fig, ax = plt.subplots(1, 4, figsize=(16, 4))
for a, im, title in zip(ax, [gray, binary, edges, equalized], ["gray", "Otsu binary", "Canny edges", "equalized"]):
    a.imshow(im, cmap="gray")
    a.set_title(title)
    a.axis("off")
plt.show()
