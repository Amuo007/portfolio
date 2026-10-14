const e="hw01b",t="HW01 Part B",a="Binary threshold, its histogram, commentary answers",n="HW01_PartB_Amrinder_Singh.ipynb",s="image",i=[{t:"md",s:`# HW01 - Part B

Course: Physical Computing | Image: cat.png | This part covers binary thresholding, its histogram, and the commentary questions.`},{t:"code",s:`import cv2
import numpy as np
import matplotlib.pyplot as plt
%matplotlib inline

img = cv2.imread("cat.png")
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
R, G, B = cv2.split(img_rgb)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

pixels = gray.shape[0] * gray.shape[1]
print("Grayscale image ready:", gray.shape, "-", pixels, "pixels")`,o:"Grayscale image ready: (658, 990) - 651420 pixels"},{t:"md",s:`## Task h - Binary Threshold

Apply a binary threshold of 127 to the grayscale image, converting each pixel to either black (0) or white (255).`},{t:"code",s:`T = 127
_, thresh = cv2.threshold(gray, T, 255, cv2.THRESH_BINARY)

print("Values left in the image:", np.unique(thresh))   # only 0 and 255

plt.figure()
plt.title("Task h: Binary Threshold Result")
plt.imshow(thresh, cmap="gray")
plt.show()`,o:"Values left in the image: [  0 255]",fig:!0},{t:"md",s:`## Task i - Thresholded Image Histogram

Calculate and display the histogram of the thresholded image, which has pixel values only at 0 and 255.`},{t:"code",s:`thresh_hist = cv2.calcHist([thresh], [0], None, [256], [0, 256]).flatten()

black = int(thresh_hist[0])
white = int(thresh_hist[255])
print("Black pixels (0)  :", black)
print("White pixels (255):", white)
print("Total             :", black + white, "which matches the", pixels, "pixels")

plt.figure()
plt.title("Task i: Binary Threshold Image Histogram")
plt.xlabel("Bins")
plt.ylabel("# of Pixels")
plt.plot(thresh_hist)
plt.xlim([0, 256])
plt.show()`,o:`Black pixels (0)  : 469430
White pixels (255): 181990
Total             : 651420 which matches the 651420 pixels`,fig:!0},{t:"code",s:`for name, ch in [("R", R), ("G", G), ("B", B), ("Gray", gray)]:
    h = cv2.calcHist([ch], [0], None, [256], [0, 256]).flatten()
    print(f"{name:5} mean={ch.mean():6.2f}  median={np.median(ch):5.1f}  peak at bin {int(np.argmax(h))}")

gray_hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
print("\\nBins used by grayscale image  :", int((gray_hist > 0).sum()), "out of 256")
print("Bins used by threshold image  :", int((thresh_hist > 0).sum()), "out of 256")
print("\\nGray bins 0 to 127   add up to:", int(gray_hist[:128].sum()), "= my black pixels")
print("Gray bins 128 to 255 add up to:", int(gray_hist[128:].sum()), "= my white pixels")`,o:`R     mean= 93.91  median= 84.0  peak at bin 23
G     mean= 94.05  median= 82.0  peak at bin 24
B     mean= 86.51  median= 74.0  peak at bin 20
Gray  mean= 93.13  median= 82.0  peak at bin 23
Bins used by grayscale image  : 256 out of 256
Bins used by threshold image  : 2 out of 256
Gray bins 0 to 127   add up to: 469430 = my black pixels
Gray bins 128 to 255 add up to: 181990 = my white pixels`},{t:"md",s:`### i) What are the differences you observe in the histograms for the different color channels?

The three histograms have similar shapes, but the blue channel is shifted toward darker values. Red and green have higher average intensities, which suggests the image has a warmer tone.`},{t:"md",s:`### ii) Is converting an image to grayscale the same as isolating a color channel?

No. Isolating a color channel uses only one channel (R, G, or B), while grayscale combines all three channels using different weights to represent brightness.`},{t:"md",s:`### iii) What are the differences between the grayscale and thresholded histograms?

The grayscale histogram has pixel values spread across 0–255, so it shows many different shades of gray. The thresholded histogram only has two spikes at 0 and 255 because every pixel becomes either black or white. The total number of pixels stays the same, but thresholding removes the different shades and loses some image detail.`}],h={id:e,title:t,desc:a,file:n,topic:s,cells:i};export{i as cells,h as default,a as desc,n as file,e as id,t as title,s as topic};
