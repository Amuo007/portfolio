# HW05: what does each filter look for? Start from a gray noise image and change the PIXELS
# (gradient ascent) so one filter fires as strongly as possible. Model weights never change.
import numpy as np
import tensorflow as tf
import keras
import matplotlib.pyplot as plt

# ---------------- SETTINGS: change these ----------------
MODEL_NAME = "VGG16"      # "VGG16", "VGG19", "ResNet50V2", "ResNet50", "MobileNetV2"...
LAYERS = ["block1_conv1", "block2_conv1", "block3_conv1", "block4_conv1", "block5_conv1"]
N_FILTERS = 8             # first 8 filters of every layer
IMG_SIZE = 128            # size of the generated image
STEPS = 30                # gradient ascent steps (more = clearer pattern, slower)
STEP_SIZE = 10.0          # how much the pixels change per step (the "learning rate")
# --------------------------------------------------------

model = getattr(keras.applications, MODEL_NAME)(weights="imagenet", include_top=False)
conv_names = [l.name for l in model.layers if isinstance(l, keras.layers.Conv2D)]
print("Conv layers you can pick:", conv_names)
# VGG16 names: conv1_1 = block1_conv1, conv2_1 = block2_conv1, ..., conv5_1 = block5_conv1


def filter_pattern(layer_name, filter_index, size=IMG_SIZE, steps=STEPS, step_size=STEP_SIZE):
    """Image that maximizes the mean activation of one filter. Returns RGB in [0, 1]."""
    extractor = keras.Model(inputs=model.inputs, outputs=model.get_layer(layer_name).output)
    img = tf.random.uniform((1, size, size, 3), minval=0.4, maxval=0.6)    # gray-ish noise
    for _ in range(steps):
        with tf.GradientTape() as tape:
            tape.watch(img)
            activation = extractor(img)
            loss = tf.reduce_mean(activation[:, 2:-2, 2:-2, filter_index])  # ignore border pixels
        grads = tf.math.l2_normalize(tape.gradient(loss, img))              # same-size steps
        img = img + step_size * grads                                        # ASCENT: go uphill
    x = img[0].numpy()
    x = (x - x.mean()) / (x.std() + 1e-5) * 0.15 + 0.5                       # spread values for display
    return np.clip(x, 0, 1)


def show_filters(layer_name, n=N_FILTERS):
    cols = 4
    plt.figure(figsize=(3 * cols, 3 * ((n + cols - 1) // cols)))
    for i in range(n):
        plt.subplot((n + cols - 1) // cols, cols, i + 1)
        plt.imshow(filter_pattern(layer_name, i))
        plt.title(f"Filter {i + 1}")
        plt.axis("off")
    plt.suptitle(layer_name)
    plt.tight_layout()
    plt.show()


for layer_name in LAYERS:
    show_filters(layer_name)
