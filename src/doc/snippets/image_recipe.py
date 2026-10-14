# HW01 Part A + B in one go. Needs the "Image functions" block above.
IMAGE_PATH = "cat.png"   # your image file (same folder as the notebook)
T = 127                  # threshold value: pixels above T become white (255), the rest black (0)

# a) load (BGR -> RGB) and show
img = load_image(IMAGE_PATH)
show(img, "Task a: Original image")

# b) pixels, height, width, channels
image_info(img)

# c) the three color channels
R, G, B = split_channels(img)
show_grid([R, G, B], ["Channel R", "Channel G", "Channel B"], cols=3)

# d) unnormalized histograms of R, G, B
for channel, name in [(R, "R"), (G, "G"), (B, "B")]:
    plot_histogram(channel, f"Task d: Channel {name} histogram")

# e) grayscale
gray = to_gray(img)
show(gray, "Task e: Grayscale")

# f) gray image info (2-D, so 1 channel; same number of pixels)
image_info(gray)

# g) grayscale histogram
plot_histogram(gray, "Task g: Grayscale histogram")

# Part B a) binary threshold
binary = threshold(gray, T)
show(binary, f"Binary threshold (T={T})")

# Part B b) histogram of the thresholded image: only two spikes, 0 and 255
h = histogram(binary)
print("Black pixels (0):", int(h[0]), "| White pixels (255):", int(h[255]), "| Total:", int(h.sum()))
plot_histogram(binary, "Thresholded image histogram")

# Numbers to back up your written answers
for name, ch in [("R", R), ("G", G), ("B", B), ("Gray", gray)]:
    print(f"{name:5} mean={ch.mean():6.2f}  median={np.median(ch):5.1f}  peak at {int(np.argmax(histogram(ch)))}")
