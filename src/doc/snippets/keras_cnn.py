# HW04 in Keras: CNN from scratch on MNIST / Fashion-MNIST / CIFAR-10. Needs the Metrics block.
import numpy as np
import keras
import matplotlib.pyplot as plt

# ---------------- SETTINGS: change these ----------------
DATASET = "mnist"          # "mnist", "fashion_mnist", "cifar10"
EPOCHS = 10
BATCH_SIZE = 32
FILTERS = [16, 32]         # one conv layer per number
ACTIVATION = "relu"
DROPOUT = 0.5
# --------------------------------------------------------

(x_train, y_train), (x_test, y_test) = getattr(keras.datasets, DATASET).load_data()
if x_train.ndim == 3:                       # gray images: add the channel axis -> (N, 28, 28, 1)
    x_train, x_test = x_train[..., None], x_test[..., None]
x_train, x_test = x_train / 255.0, x_test / 255.0          # pixel values 0..1
y_train, y_test = y_train.ravel(), y_test.ravel()
num_classes = int(y_train.max()) + 1

model = keras.Sequential([keras.Input(x_train.shape[1:])])
for f in FILTERS:
    model.add(keras.layers.Conv2D(f, 3, padding="same", activation=ACTIVATION))
    model.add(keras.layers.MaxPooling2D(2))
model.add(keras.layers.Flatten())
model.add(keras.layers.Dropout(DROPOUT))
model.add(keras.layers.Dense(num_classes, activation="softmax"))
model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.summary()

history = model.fit(x_train, y_train, validation_split=0.1, epochs=EPOCHS, batch_size=BATCH_SIZE)
loss, acc = model.evaluate(x_test, y_test, verbose=0)
print(f"Test accuracy: {acc:.2%}")

y_pred = model.predict(x_test, verbose=0).argmax(1)
plot_confusion(y_test, y_pred, [str(i) for i in range(num_classes)])
