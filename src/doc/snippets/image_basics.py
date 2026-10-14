# Image basics with OpenCV + Matplotlib (HW01). Every function works on RGB or gray images.
import cv2
import numpy as np
import matplotlib.pyplot as plt


def load_image(path):
    """Read an image file as RGB. (OpenCV reads BGR = blue first, so we flip it.)"""
    img = cv2.imread(str(path))
    if img is None:
        raise FileNotFoundError(f"Could not read {path} - check the file name and folder")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def show(img, title=""):
    """Display one image. 2-D (gray) images are shown in gray automatically."""
    plt.figure()
    plt.imshow(img, cmap="gray" if img.ndim == 2 else None)
    plt.title(title)
    plt.axis("off")
    plt.show()


def show_grid(images, titles=None, cols=4):
    """Display several images side by side."""
    rows = (len(images) + cols - 1) // cols
    plt.figure(figsize=(3.5 * cols, 3.5 * rows))
    for i, img in enumerate(images):
        plt.subplot(rows, cols, i + 1)
        plt.imshow(img, cmap="gray" if img.ndim == 2 else None)
        plt.title(titles[i] if titles else "")
        plt.axis("off")
    plt.tight_layout()
    plt.show()


def image_info(img):
    """Height, width, channels and number of pixels."""
    height, width = img.shape[:2]
    channels = 1 if img.ndim == 2 else img.shape[2]
    info = {"height": height, "width": width, "channels": channels, "pixels": height * width}
    print(info)
    return info


def split_channels(img_rgb):
    """Returns the R, G, B channels as three gray (2-D) images."""
    return cv2.split(img_rgb)


def to_gray(img_rgb):
    """RGB -> grayscale. A weighted mix: 0.299 R + 0.587 G + 0.114 B (not one channel)."""
    return cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)


def histogram(channel):
    """Unnormalized histogram: how many pixels have each value 0..255 (256 numbers)."""
    return cv2.calcHist([channel], [0], None, [256], [0, 256]).flatten()


def plot_histogram(img, title="Histogram"):
    """Plot pixel counts for each value 0-255. RGB images get one line per channel."""
    plt.figure()
    if img.ndim == 2:
        plt.plot(histogram(img), color="black")
    else:
        for i, color in enumerate(["red", "green", "blue"]):
            plt.plot(histogram(img[:, :, i]), color=color, label=color)
        plt.legend()
    plt.title(title)
    plt.xlabel("Pixel value (bins)")
    plt.ylabel("# of pixels")
    plt.xlim([0, 256])
    plt.show()


def threshold(gray, T=127, mode="binary"):
    """Black/white image. mode: "binary" (above T -> 255), "inverse", "otsu" (picks T itself),
    "adaptive" (a different T for each small area - good for uneven lighting)."""
    if mode == "adaptive":
        return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    flag = {"binary": cv2.THRESH_BINARY, "inverse": cv2.THRESH_BINARY_INV,
            "otsu": cv2.THRESH_BINARY + cv2.THRESH_OTSU}[mode]
    used_T, binary = cv2.threshold(gray, T, 255, flag)
    print("Threshold used:", used_T, "| values left:", np.unique(binary))
    return binary


def resize(img, width, height):
    return cv2.resize(img, (width, height))


def blur(img, k=5):
    """Gaussian blur with a k x k window (k must be odd). Removes noise, softens edges."""
    return cv2.GaussianBlur(img, (k, k), 0)


def equalize(gray):
    """Histogram equalization: spreads pixel values over 0-255 -> more contrast."""
    return cv2.equalizeHist(gray)


def canny_edges(gray, low=100, high=200):
    """Edge map (white = edge). Lower thresholds -> more edges."""
    return cv2.Canny(gray, low, high)
