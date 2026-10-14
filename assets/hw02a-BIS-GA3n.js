const t="hw02a",o="HW02 Part A",i="Show an image (environment check)",n="HW2-A.ipynb",c="image",e=[{t:"code",s:`import cv2

import matplotlib.pyplot as plt`,o:"Matplotlib is building the font cache; this may take a moment."},{t:"code",s:'img = cv2.imread("cat.png")'},{t:"code",s:`# Convert OpenCV's BGR format to RGB

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`},{t:"code",s:`# Display image

plt.imshow(img_rgb)
plt.axis("off")
plt.show()`,fig:!0}],s={id:t,title:o,desc:i,file:n,topic:c,cells:e};export{e as cells,s as default,i as desc,n as file,t as id,o as title,c as topic};
