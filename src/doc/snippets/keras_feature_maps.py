# What a layer outputs for a REAL photo (feature maps / activations). Needs `model` from above.
import numpy as np
import keras
import matplotlib.pyplot as plt

IMAGE_PATH = "cat.png"
LAYER = "block1_conv1"
N_MAPS = 8

img = keras.utils.load_img(IMAGE_PATH, target_size=(224, 224))
x = keras.applications.vgg16.preprocess_input(   # VGG16 color scaling; other models: their own preprocess_input
    np.expand_dims(keras.utils.img_to_array(img), 0))
extractor = keras.Model(inputs=model.inputs, outputs=model.get_layer(LAYER).output)
maps = extractor(x)[0].numpy()                     # shape (height, width, filters)
print("Feature map shape:", maps.shape)

plt.figure(figsize=(12, 6))
for i in range(N_MAPS):
    plt.subplot(2, 4, i + 1)
    plt.imshow(maps[:, :, i], cmap="viridis")      # bright = this filter found its pattern here
    plt.title(f"Map {i + 1}")
    plt.axis("off")
plt.suptitle(f"{LAYER} feature maps")
plt.tight_layout()
plt.show()
