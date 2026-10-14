# Run ONCE before the exam (internet needed; CIFAR10 alone can take 30+ min). Everything is saved on disk,
# so during the exam nothing big has to download. Safe to re-run: finished items are skipped.
import os

root = os.path.expanduser("~/datasets")          # load_builtin() reads from this same folder

# 1) PyTorch datasets (CIFAR10 comes from a slow server - this is the long one)
from torchvision import datasets, models
for name in ["MNIST", "FashionMNIST", "CIFAR10"]:
    for train in (True, False):
        getattr(datasets, name)(root, train=train, download=True)
    print("ok dataset", name)

# 2) PyTorch pretrained weights (saved in ~/.cache/torch)
for m in ["resnet18", "resnet50", "mobilenet_v2", "efficientnet_b0"]:   # add "vgg16" (528 MB) if you want it
    getattr(models, m)(weights="DEFAULT")
    print("ok torch model", m)

# 3) Keras weights + datasets (saved in ~/.keras)
import keras
for m in ["VGG16", "ResNet50", "ResNet50V2", "MobileNetV2"]:
    getattr(keras.applications, m)(weights="imagenet", include_top=False)
    print("ok keras model", m)
for d in ["mnist", "fashion_mnist", "cifar10"]:
    getattr(keras.datasets, d).load_data()
    print("ok keras dataset", d)

# 4) Horses vs camels (pip install kagglehub)
import kagglehub
print(kagglehub.dataset_download("akrsnv/horses-and-camels", output_dir=os.path.join(root, "horses-and-camels")))
