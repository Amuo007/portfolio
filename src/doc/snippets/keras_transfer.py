# Keras transfer learning on a folder dataset (HW06 Part A / HW03 in Keras), with HW06 metrics.
# Needs the Metrics block for get_metrics / plot_confusion / plot_roc.
import numpy as np
import tensorflow as tf
import keras
import matplotlib.pyplot as plt

# ---------------- SETTINGS: change these ----------------
TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"
BASE = "ResNet50"         # "ResNet50", "VGG16", "MobileNetV2", "EfficientNetB0"
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10
LR = 1e-3
HEAD = "sigmoid"          # "sigmoid" = 1 output + BCE,  "softmax" = N outputs + CCE (one-hot labels)
FINE_TUNE = False         # False = base frozen (only the new head learns), True = everything learns
AUGMENT = True
# --------------------------------------------------------

PREPROCESS = {"ResNet50": keras.applications.resnet50.preprocess_input,
              "VGG16": keras.applications.vgg16.preprocess_input,
              "MobileNetV2": keras.applications.mobilenet_v2.preprocess_input,
              "EfficientNetB0": keras.applications.efficientnet.preprocess_input}[BASE]
label_mode = "binary" if HEAD == "sigmoid" else "categorical"   # categorical = one-hot labels

train_ds, val_ds = keras.utils.image_dataset_from_directory(
    TRAIN_DIR, validation_split=0.2, subset="both", seed=42,
    image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE, label_mode=label_mode)
test_ds = keras.utils.image_dataset_from_directory(
    TEST_DIR, image_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE, label_mode=label_mode, shuffle=False)
class_names = train_ds.class_names
print("Classes:", class_names)

base = getattr(keras.applications, BASE)(weights="imagenet", include_top=False,
                                         input_shape=(IMG_SIZE, IMG_SIZE, 3), pooling="avg")
base.trainable = FINE_TUNE

inputs = keras.Input((IMG_SIZE, IMG_SIZE, 3))
x = inputs
if AUGMENT:                                       # these layers only act during training
    x = keras.layers.RandomFlip("horizontal")(x)
    x = keras.layers.RandomRotation(0.1)(x)
x = PREPROCESS(x)
x = base(x, training=False)                       # keeps BatchNorm statistics fixed
x = keras.layers.Dropout(0.25)(x)
if HEAD == "sigmoid":
    outputs = keras.layers.Dense(1, activation="sigmoid")(x)
    loss = "binary_crossentropy"
else:
    outputs = keras.layers.Dense(len(class_names), activation="softmax")(x)
    loss = "categorical_crossentropy"
model = keras.Model(inputs, outputs)
model.compile(optimizer=keras.optimizers.Adam(LR if not FINE_TUNE else LR / 10), loss=loss, metrics=["accuracy"])
model.summary(show_trainable=True)

history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS,
                    callbacks=[keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)])

h = history.history
fig, ax = plt.subplots(1, 2, figsize=(11, 4))
for i, key in enumerate(["loss", "accuracy"]):
    ax[i].plot(h[key], "o-", label="train")
    ax[i].plot(h["val_" + key], "o--", label="validation")
    ax[i].set_title(key)
    ax[i].set_xlabel("Epoch")
    ax[i].legend()
plt.show()

# Test-set metrics (labels back to 0/1 integers, P(class 1) for ROC)
probs = model.predict(test_ds)
y_true = np.concatenate([y.numpy() for _, y in test_ds])
if HEAD == "sigmoid":
    y_prob, y_true = probs.ravel(), y_true.ravel().astype(int)
    y_pred = (y_prob >= 0.5).astype(int)
else:
    y_true, y_pred = y_true.argmax(1), probs.argmax(1)
    y_prob = probs[:, 1] if len(class_names) == 2 else None
get_metrics(list(y_true), list(y_pred), y_prob, class_names)
plot_confusion(y_true, y_pred, class_names)
if y_prob is not None:
    plot_roc(y_true, y_prob)
