const t="hw01a",e="HW01 Part A",n="OpenCV image basics: load, size, channels, histograms, grayscale",a="HW01_PartA_Amrinder_Singh.ipynb",i="image",s=[{t:"md",s:"Course: Physical Computing | Image: cat.png | Tasks a–g completed using OpenCV and Matplotlib in Jupyter Notebook."},{t:"code",s:`import cv2
import numpy as np
import matplotlib.pyplot as plt
%matplotlib inline

print("OpenCV version:", cv2.__version__)`,o:"OpenCV version: 4.12.0"},{t:"md",s:`## Task a - Load and Display the Image

Load the image with OpenCV, convert it from BGR to RGB, and display it with Matplotlib.`},{t:"code",s:`img = cv2.imread("cat.png")              # OpenCV loads it as BGR
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)   # convert to RGB for plotting

plt.figure()
plt.title("Task a: Original Image")
plt.imshow(img_rgb)
plt.show()`,fig:!0},{t:"md",s:`## Task b - Image Size

Get the image height, width, channels, and calculate the total number of pixels.`},{t:"code",s:`height, width, channels = img_rgb.shape
pixels = height * width

print("Task b: Number of Pixels =", pixels)
print(f"Task b: Height={height} Width={width} Channels={channels}")`,o:`Task b: Number of Pixels = 651420
Task b: Height=658 Width=990 Channels=3`},{t:"md",s:`## Task c - RGB Channels

Split the image into red, green, and blue channels and display each channel separately.`},{t:"code",s:`R, G, B = cv2.split(img_rgb)

for channel, name in [(R, "R"), (G, "G"), (B, "B")]:
    plt.figure()
    plt.title(f"Task c: Channel {name}")
    plt.imshow(channel, cmap="gray")
    plt.show()`,fig:!0},{t:"md",s:`## Task d - RGB Histograms

Calculate and display the pixel counts for each intensity (0–255) for the red, green, and blue channels.`},{t:"code",s:`for channel, name in [(R, "R"), (G, "G"), (B, "B")]:
    hist = cv2.calcHist([channel], [0], None, [256], [0, 256])

    plt.figure()
    plt.title(f"Task d: Channel {name} Histogram")
    plt.xlabel("Bins")
    plt.ylabel("# of Pixels")
    plt.plot(hist)
    plt.xlim([0, 256])
    plt.show()`,fig:!0},{t:"md",s:`## Task e - Grayscale Image

Convert the original image from BGR to grayscale and display it with Matplotlib.`},{t:"code",s:`gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

plt.figure()
plt.title("Task e: Grayscale Image")
plt.imshow(gray, cmap="gray")
plt.show()`,fig:!0},{t:"md",s:"## Task f - Number of pixels, height, width and channels of the grayscale imageGrayscale is only 2D so the shape gives me 2 values, not 3. That means it has 1 channel.The pixel count stays the same as the color image."},{t:"code",s:`gray_height, gray_width = gray.shape     # only 2 values because it is 2D
gray_channels = 1
gray_pixels = gray_height * gray_width

print("Task f: Number of Pixels =", gray_pixels)
print(f"Task f: Height={gray_height} Width={gray_width} Channels={gray_channels}")`,o:`Task f: Number of Pixels = 651420
Task f: Height=658 Width=990 Channels=1`},{t:"md",s:`## Task g - Grayscale Histogram

Calculate and display the pixel counts for each grayscale intensity from 0 to 255.`},{t:"code",s:`gray_hist = cv2.calcHist([gray], [0], None, [256], [0, 256])

plt.figure()
plt.title("Task g: Grayscale Image Histogram")
plt.xlabel("Bins")
plt.ylabel("# of Pixels")
plt.plot(gray_hist)
plt.xlim([0, 256])
plt.show()`,fig:!0}],l={id:t,title:e,desc:n,file:a,topic:i,cells:s};export{s as cells,l as default,n as desc,a as file,t as id,e as title,i as topic};
