import{r as T,c as ve,g as Oe,j as e,R as De,a as He}from"./client-CrwQxxwm.js";const Y=[{id:"home",title:"Start here",group:"Guide"},{id:"setup",title:"Setup & downloads",group:"Guide"},{id:"transfer",nav:"Transfer learning",tag:"HW03",title:"Transfer learning",hw:"HW03",group:"Topics",likely:"most",why:"torch + torchvision + kaggle: pretrained ResNet50 on a Kaggle folder dataset"},{id:"binary",nav:"Binary metrics",tag:"HW06",title:"Binary metrics: BCE vs CCE",hw:"HW06 B",group:"Topics",likely:"most",why:"scikit-learn + seaborn: confusion matrix, precision, recall, specificity, ROC/AUC"},{id:"cnn",nav:"CNN from scratch",tag:"HW04",title:"CNN from scratch",hw:"HW04",group:"Topics",likely:"high",why:"torch: build a CNN for MNIST-style data, change layers / batch size / activation"},{id:"augment",nav:"Data augmentation",tag:"new",title:"Data augmentation",hw:"new: albumentations",group:"Topics",likely:"high",why:"albumentations is in the list but no homework used it: a likely add-on"},{id:"keras",nav:"Keras",tag:"HW05",title:"Keras: filters & transfer",hw:"HW05 · HW06 A",group:"Topics",likely:"mid",why:"tensorflow + keras: VGG16 filter visualization, Keras transfer learning"},{id:"images",nav:"Image basics",tag:"HW01",title:"Image basics (OpenCV)",hw:"HW01 · HW02 A",group:"Topics",likely:"mid",why:"opencv + scikit-image: channels, histograms, grayscale, threshold"},{id:"llm",nav:"LLM & LangChain",tag:"HW07",title:"LLM & LangChain",hw:"HW02 B · Harness · HW07",group:"Topics",likely:"low",why:"LangChain/Ollama are not in the list (requests is): kept just in case"},{id:"notebooks",title:"Original notebooks",group:"Reference"},{id:"fixes",title:"Fix errors fast",group:"Reference"},{id:"glossary",title:"Glossary",group:"Reference"}],D=(s,n)=>`#/${s}${n?"/"+n:""}`,Ee=T.createContext("home");async function Ge(s){try{return await navigator.clipboard.writeText(s),!0}catch{const n=document.createElement("textarea");n.value=s,n.style.position="fixed",n.style.opacity="0",document.body.appendChild(n),n.select();const t=document.execCommand("copy");return n.remove(),t}}const Be=`# Data augmentation with albumentations: random changes to TRAINING images so the model
# sees more variety (less overfitting). Validation/test images are only resized + normalized.
import numpy as np
import albumentations as A
import matplotlib.pyplot as plt
from albumentations.pytorch import ToTensorV2
from PIL import Image


def albu_train(size=224, strength="medium", imagenet=True):
    """strength: "light", "medium" or "strong". Each transform runs with probability p."""
    aug = [A.HorizontalFlip(p=0.5)]
    if strength in ("medium", "strong"):
        aug += [A.Affine(scale=(0.9, 1.1), translate_percent=(-0.05, 0.05), rotate=(-15, 15), p=0.7),
                A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5)]
    if strength == "strong":
        aug += [A.HueSaturationValue(p=0.3), A.GaussianBlur(blur_limit=(3, 5), p=0.2),
                A.CoarseDropout(num_holes_range=(1, 6), hole_height_range=(0.05, 0.15),
                                hole_width_range=(0.05, 0.15), p=0.3)]
    norm = [A.Normalize()] if imagenet else [A.Normalize(mean=0, std=1)]   # ImageNet colors, or 0..1
    return A.Compose([A.Resize(size, size), *aug, *norm, ToTensorV2()])


def albu_eval(size=224, imagenet=True):
    norm = [A.Normalize()] if imagenet else [A.Normalize(mean=0, std=1)]
    return A.Compose([A.Resize(size, size), *norm, ToTensorV2()])


class Albu:
    """Lets an albumentations pipeline be used anywhere a torchvision transform is expected
    (ImageFolder, load_folder_data, predict_image)."""
    def __init__(self, pipeline):
        self.pipeline = pipeline

    def __call__(self, img):
        return self.pipeline(image=np.array(img.convert("RGB")))["image"]


def show_augmented(image_path, pipeline, n=8):
    """Same photo, n random augmentations: check the changes still look realistic."""
    img = np.array(Image.open(image_path).convert("RGB"))
    show_pipe = A.Compose([t for t in pipeline.transforms if not isinstance(t, (A.Normalize, ToTensorV2))])
    cols = 4
    plt.figure(figsize=(3 * cols, 3 * ((n + cols - 1) // cols)))
    for i in range(n):
        plt.subplot((n + cols - 1) // cols, cols, i + 1)
        plt.imshow(show_pipe(image=img)["image"])
        plt.axis("off")
    plt.suptitle("Random augmentations of one image")
    plt.tight_layout()
    plt.show()
`,We=`# Train the same model with and without augmentation and compare.
# Needs blocks: Train & evaluate, Metrics, Folder data, Pretrained model, Augmentation.
from pathlib import Path

import kagglehub

# ---------------- SETTINGS: change these ----------------
KAGGLE_SLUG = "akrsnv/horses-and-camels"
DATA_DIR = "dataset"
MODEL_NAME = "resnet18"     # a ResNet (the script fine-tunes its "layer4")
IMG_SIZE = 224
EPOCHS = 5
LR = 1e-4
STRENGTH = "medium"     # "light", "medium", "strong"
# --------------------------------------------------------

if not Path(DATA_DIR).exists():
    kagglehub.dataset_download(KAGGLE_SLUG, output_dir=DATA_DIR)
train_dir, test_dir = find_dir(DATA_DIR, "train"), find_dir(DATA_DIR, "test")

sample = next(Path(train_dir).rglob("*.jp*g"), None) or next(Path(train_dir).rglob("*.png"))
show_augmented(sample, albu_train(IMG_SIZE, STRENGTH))

results = {}
for use_aug in (False, True):
    name = f"augmentation {'ON (' + STRENGTH + ')' if use_aug else 'OFF'}"
    print(f"\\n========== {name}")
    train_tf = Albu(albu_train(IMG_SIZE, STRENGTH)) if use_aug else Albu(albu_eval(IMG_SIZE))
    train_loader, val_loader, test_loader, classes = load_folder_data(
        train_dir, test_dir, size=IMG_SIZE, train_transform=train_tf, eval_transform=Albu(albu_eval(IMG_SIZE)))
    set_seed(42)
    model = pretrained_model(MODEL_NAME, num_classes=len(classes), freeze=True, train_layers=("layer4",))
    history = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=LR)
    plot_history(history, name)
    r = evaluate(model, test_loader)
    results[name] = {**get_metrics(r["y_true"], r["y_pred"], r["y_prob"], classes),
                     "Train-val acc gap": history["train_acc"][-1] - history["val_acc"][-1]}

print(results_table(results))
print("Smaller train-val gap with augmentation = less overfitting.")
`,qe=`# HW06: BCE + sigmoid vs CCE + softmax, frozen vs full fine-tuning, with all binary metrics.
# Needs blocks: Train & evaluate, Metrics, Folder data, Pretrained model.
from pathlib import Path

import kagglehub
import pandas as pd

# ---------------- SETTINGS: change these ----------------
KAGGLE_SLUG = "akrsnv/horses-and-camels"
DATA_DIR = "dataset"
MODEL_NAME = "resnet50"
BATCH_SIZE = 32
EPOCHS = 15             # same for every model ("identical hyperparameters")
LR = 3e-4
VAL_PER_CLASS = 20      # HW06: take 20 images per class out of train for validation
MODELS = {              # name -> (head, freeze)
    "Model 1: BCE frozen": ("sigmoid", True),
    "Model 2: CCE frozen": ("softmax", True),
    "Model 3a: BCE full": ("sigmoid", False),
    "Model 3b: CCE full": ("softmax", False),
}
# --------------------------------------------------------

if not Path(DATA_DIR).exists():
    kagglehub.dataset_download(KAGGLE_SLUG, output_dir=DATA_DIR)
train_loader, val_loader, test_loader, classes = load_folder_data(
    find_dir(DATA_DIR, "train"), find_dir(DATA_DIR, "test"), batch_size=BATCH_SIZE, val_split=VAL_PER_CLASS)
print("Positive class (1) =", classes[1], "| Negative class (0) =", classes[0])

results, histories = {}, {}
for name, (head, freeze) in MODELS.items():
    print(f"\\n========== {name}")
    set_seed(42)                                                   # fresh ImageNet weights every time
    model = pretrained_model(MODEL_NAME, num_classes=2, freeze=freeze, head=head)
    histories[name] = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=LR)
    plot_history(histories[name], f"{name}: learning curve")

    r = evaluate(model, test_loader)
    results[name] = get_metrics(r["y_true"], r["y_pred"], r["y_prob"])
    plot_confusion(r["y_true"], r["y_pred"], classes, f"{name}: confusion matrix")
    plot_roc(r["y_true"], r["y_prob"], f"{name}: ROC")

print(results_table(results))

for name, h in histories.items():                                 # all validation curves on one plot
    plt.plot(range(1, len(h["val_loss"]) + 1), h["val_loss"], "o-", label=name)
plt.xlabel("Epoch")
plt.ylabel("Validation loss")
plt.legend()
plt.title("Convergence and stability")
plt.show()
`,Ue=`# HW04 Part B experiments: more layers, other batch sizes, other activations -> one table.
# Needs the same blocks as the CNN recipe. Each row trains a fresh model.
import pandas as pd

DATASET = "MNIST"
EPOCHS = 3              # keep small: every experiment trains a new model
BASE = dict(channels=(16,), batch_size=32, activation="relu")   # the starting model

EXPERIMENTS = {
    "base (1 conv)":     {},
    "2 conv layers":     {"channels": (16, 32)},
    "3 conv layers":     {"channels": (16, 32, 64)},
    "batch 64":          {"batch_size": 64},
    "batch 128":         {"batch_size": 128},
    "batch 256":         {"batch_size": 256},
    "tanh":              {"activation": "tanh"},
    "leaky_relu":        {"activation": "leaky_relu"},
    "sigmoid":           {"activation": "sigmoid"},
}

rows, loaders = [], {}
for name, change in EXPERIMENTS.items():
    cfg = {**BASE, **change}
    print(f"\\n===== {name}: {cfg}")
    if cfg["batch_size"] not in loaders:                         # reuse loaders for the same batch size
        loaders[cfg["batch_size"]] = load_builtin(DATASET, batch_size=cfg["batch_size"])
    train_loader, val_loader, test_loader, classes, shape = loaders[cfg["batch_size"]]

    set_seed(42)
    model = make_cnn(shape[0], len(classes), shape[1], channels=cfg["channels"],
                     activation=cfg["activation"], dropout=0.5)
    history = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=1e-3)
    r = evaluate(model, test_loader)
    rows.append({"Experiment": name, "Test accuracy": r["accuracy"], "Best val accuracy": max(history["val_acc"]),
                 "Seconds per epoch": sum(history["seconds"]) / len(history["seconds"]),
                 "Parameters": sum(p.numel() for p in model.parameters())})

table = pd.DataFrame(rows).set_index("Experiment").round(4)
print(table)
table["Test accuracy"].plot.barh(title="Test accuracy per experiment", xlim=(table["Test accuracy"].min() - 0.01, 1))
plt.show()
`,Ve=`# CNN models. BaseCNN / DeepCNN are exactly the HW04 models. make_cnn builds any size from settings.
import torch
from torch import nn


class BaseCNN(nn.Module):
    """HW04 Part A: Conv -> ReLU -> MaxPool -> Flatten -> Dropout -> Fully connected."""
    def __init__(self, in_channels=1, num_classes=10, img_size=28, dropout=0.5):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, 16, kernel_size=3)     # 28x28 -> 26x26 (no padding)
        self.pool = nn.MaxPool2d(2)                              # 26x26 -> 13x13
        self.dropout = nn.Dropout(dropout)
        side = (img_size - 2) // 2
        self.fc = nn.Linear(16 * side * side, num_classes)       # 16 * 13 * 13 = 2704 for MNIST

    def forward(self, x):
        x = self.pool(torch.relu(self.conv(x)))
        x = torch.flatten(x, 1)
        return self.fc(self.dropout(x))


class DeepCNN(nn.Module):
    """HW04 Part B: two Conv layers (padding=1 keeps the size; each pool halves it)."""
    def __init__(self, in_channels=1, num_classes=10, img_size=28, dropout=0.5):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout(dropout)
        side = img_size // 4                                     # 28 -> 14 -> 7
        self.fc = nn.Linear(32 * side * side, num_classes)       # 32 * 7 * 7 = 1568

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = torch.flatten(x, 1)
        return self.fc(self.dropout(x))


ACTIVATIONS = {"relu": nn.ReLU, "leaky_relu": nn.LeakyReLU, "elu": nn.ELU,
               "gelu": nn.GELU, "tanh": nn.Tanh, "sigmoid": nn.Sigmoid}


def make_cnn(in_channels=1, num_classes=10, img_size=28, channels=(16, 32), kernel_size=3,
             padding=1, activation="relu", dropout=0.5, hidden=0, batchnorm=False):
    """Build a CNN from settings. Every number in \`channels\` adds one block:
    Conv (kernel_size) -> [BatchNorm] -> activation -> MaxPool 2x2 (halves height and width).
    Then Flatten -> [Linear(hidden) -> activation] -> Dropout -> Linear(num_classes).
    The flatten size is computed for you, so any image size works."""
    act = ACTIVATIONS[activation]
    layers, c = [], in_channels
    for out in channels:
        layers.append(nn.Conv2d(c, out, kernel_size, padding=padding))
        if batchnorm:
            layers.append(nn.BatchNorm2d(out))
        layers += [act(), nn.MaxPool2d(2)]
        c = out
    features = nn.Sequential(*layers)

    with torch.no_grad():                                        # push a fake image through to get the size
        n = features(torch.zeros(1, in_channels, img_size, img_size)).numel()

    head = [nn.Flatten()]
    if hidden:
        head += [nn.Linear(n, hidden), act()]
        n = hidden
    head += [nn.Dropout(dropout), nn.Linear(n, num_classes)]
    return nn.Sequential(features, *head)
`,$e=`# HW04: CNN from scratch. Needs blocks: Train & evaluate, Metrics, Built-in data, CNN models.
# ---------------- SETTINGS: change these ----------------
DATASET = "MNIST"       # "MNIST", "FashionMNIST" or "CIFAR10"
VAL_FRACTION = 0.1      # 10% of the training images are used for validation
BATCH_SIZE = 32         # images per weight update (try 64, 128, 256)
EPOCHS = 10             # full passes over the training images
LR = 0.001              # learning rate: size of each learning step
OPTIMIZER = "adam"      # "adam" or "sgd"
DROPOUT = 0.5           # fraction of neurons switched off during training
ACTIVATION = "relu"     # "relu", "leaky_relu", "elu", "gelu", "tanh", "sigmoid"
CHANNELS = (16, 32)     # one number per conv layer: (16,) = 1 layer, (16, 32, 64) = 3 layers
# --------------------------------------------------------

set_seed(42)
train_loader, val_loader, test_loader, classes, shape = load_builtin(
    DATASET, val_fraction=VAL_FRACTION, batch_size=BATCH_SIZE)

model = make_cnn(in_channels=shape[0], num_classes=len(classes), img_size=shape[1],
                 channels=CHANNELS, activation=ACTIVATION, dropout=DROPOUT)
# model = BaseCNN(in_channels=shape[0], num_classes=len(classes), img_size=shape[1])  # exact HW04 Part A model
print(model)
count_params(model)

history = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=LR, optimizer=OPTIMIZER)
plot_history(history, f"{DATASET} CNN")

r = evaluate(model, test_loader)
print(f"\\nTest accuracy: {r['accuracy']:.2%}")
get_metrics(r["y_true"], r["y_pred"], class_names=classes)
plot_confusion(r["y_true"], r["y_pred"], classes, f"{DATASET} confusion matrix")
show_mistakes(r["y_true"], r["y_pred"], classes)
show_predictions(model, test_loader, classes, n=8, imagenet=False)
`,Ke=`# Built-in datasets (download automatically): MNIST, FashionMNIST, CIFAR10.
import os
import torch
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms


def load_builtin(name="MNIST", root="~/datasets", val_fraction=0.1, batch_size=32, seed=42, train_transform=None):
    """name: "MNIST" (handwritten digits 28x28 gray), "FashionMNIST" (clothes 28x28 gray),
    "CIFAR10" (10 objects 32x32 color). val_fraction=0.1 -> 10% of training images become validation.
    train_transform: optional augmentation for training images only.
    Returns train_loader, val_loader, test_loader, class_names, input_shape (C, H, W)."""
    root = os.path.expanduser(root)            # one shared folder -> download only once
    data_class = getattr(datasets, name)
    plain = transforms.ToTensor()                                   # image -> numbers 0..1, shape [C, H, W]
    full_train = data_class(root, train=True, download=True, transform=train_transform or plain)
    full_plain = data_class(root, train=True, download=True, transform=plain)
    test = data_class(root, train=False, download=True, transform=plain)

    n_val = int(len(full_train) * val_fraction)
    order = torch.randperm(len(full_train), generator=torch.Generator().manual_seed(seed)).tolist()
    train = Subset(full_train, order[n_val:])
    val = Subset(full_plain, order[:n_val])                         # validation never augmented

    shape = tuple(full_plain[0][0].shape)
    print(f"{name}: train {len(train)} | val {len(val)} | test {len(test)} | image shape {shape}")
    return (DataLoader(train, batch_size=batch_size, shuffle=True),
            DataLoader(val, batch_size=batch_size),
            DataLoader(test, batch_size=batch_size),
            list(full_train.classes), shape)
`,Ze=`# Any image folder dataset:  folder/<class_name>/*.jpg   (horses vs camels, most Kaggle sets)
from pathlib import Path

import numpy as np
import torch
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms
from sklearn.model_selection import train_test_split

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def find_dir(root, name="train"):
    """Find a sub-folder by name anywhere under root (Kaggle zips often nest folders)."""
    root = Path(root)
    if (root / name).is_dir():
        return root / name
    for p in sorted(root.rglob("*")):
        if p.is_dir() and p.name.lower() == name.lower():
            return p
    return None


def get_transforms(size=224, imagenet=True, augment=False):
    """(train_transform, eval_transform). imagenet=True scales colors the way pretrained models expect.
    augment=True adds random flips/rotations/color changes to TRAINING images only."""
    norm = [transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)] if imagenet else []
    aug = [transforms.RandomHorizontalFlip(), transforms.RandomRotation(15),
           transforms.ColorJitter(0.2, 0.2, 0.2)] if augment else []
    train_tf = transforms.Compose([transforms.Resize((size, size)), *aug, transforms.ToTensor(), *norm])
    eval_tf = transforms.Compose([transforms.Resize((size, size)), transforms.ToTensor(), *norm])
    return train_tf, eval_tf


def _split(targets, idx, n, seed):
    """Stratified split of idx: n = fraction (0.2) or images per class (int, e.g. 20)."""
    labels = np.array(targets)[idx]
    if isinstance(n, int):
        rng = np.random.default_rng(seed)
        picked = np.concatenate([rng.choice(idx[labels == c], n, replace=False) for c in np.unique(labels)])
        return np.setdiff1d(idx, picked), picked
    return train_test_split(idx, test_size=n, random_state=seed, stratify=labels)


def load_folder_data(train_dir, test_dir=None, size=224, batch_size=32, val_split=0.2, test_split=0.2,
                     augment=False, imagenet=True, train_transform=None, eval_transform=None, seed=42):
    """train_dir/<class>/*.jpg (and the same layout for test_dir).
    val_split: 0.2 = 20% of train for validation, or an int = that many images PER CLASS (HW06: 20).
    No test_dir? test_split of the images become the test set (also stratified = same class balance).
    Returns train_loader, val_loader, test_loader, class_names."""
    default_train, default_eval = get_transforms(size, imagenet, augment)
    train_tf, eval_tf = train_transform or default_train, eval_transform or default_eval
    full_train = datasets.ImageFolder(train_dir, transform=train_tf)
    full_eval = datasets.ImageFolder(train_dir, transform=eval_tf)   # same images, no augmentation

    idx = np.arange(len(full_train))
    if test_dir:
        test_ds = datasets.ImageFolder(test_dir, transform=eval_tf)
        assert test_ds.class_to_idx == full_train.class_to_idx, "train/test class folders differ"
    else:
        idx, test_idx = _split(full_train.targets, idx, test_split, seed)
        test_ds = Subset(full_eval, test_idx)
    train_idx, val_idx = _split(full_train.targets, idx, val_split, seed)

    g = torch.Generator().manual_seed(seed)
    train_loader = DataLoader(Subset(full_train, train_idx), batch_size=batch_size, shuffle=True, generator=g)
    val_loader = DataLoader(Subset(full_eval, val_idx), batch_size=batch_size)
    test_loader = DataLoader(test_ds, batch_size=batch_size)

    counts = lambda ids: np.bincount(np.array(full_train.targets)[ids], minlength=len(full_train.classes))
    test_counts = np.bincount(test_ds.targets if test_dir else np.array(full_train.targets)[test_idx],
                              minlength=len(full_train.classes))
    print("Classes:", full_train.class_to_idx)
    for name, c in [("train", counts(train_idx)), ("val", counts(val_idx)), ("test", test_counts)]:
        print(f"  {name:5}: {int(c.sum()):5} images  per class {c.tolist()}")
    return train_loader, val_loader, test_loader, full_train.classes


def to_display(img_tensor, imagenet=True):
    """Tensor [C,H,W] -> picture for plt.imshow (undoes the ImageNet color scaling)."""
    img = img_tensor.detach().cpu()
    if imagenet and img.shape[0] == 3:
        img = img * torch.tensor(IMAGENET_STD)[:, None, None] + torch.tensor(IMAGENET_MEAN)[:, None, None]
    img = img.clamp(0, 1).permute(1, 2, 0).numpy()
    return img.squeeze(-1) if img.shape[-1] == 1 else img


def show_batch(loader, class_names, n=8, imagenet=True):
    """Show n images from a loader with their labels."""
    images, labels = next(iter(loader))
    print("Batch shape [batch, channels, height, width]:", tuple(images.shape))
    n = min(n, len(images))
    cols = min(n, 4)
    rows = (n + cols - 1) // cols
    plt.figure(figsize=(3 * cols, 3 * rows))
    for i in range(n):
        plt.subplot(rows, cols, i + 1)
        img = to_display(images[i], imagenet)
        plt.imshow(img, cmap="gray" if img.ndim == 2 else None)
        plt.title(class_names[labels[i].item()])
        plt.axis("off")
    plt.tight_layout()
    plt.show()
`,Ye=`# Image basics with OpenCV + Matplotlib (HW01). Every function works on RGB or gray images.
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
`,Xe=`# HW01 Part A + B in one go. Needs the "Image functions" block above.
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
`,Je=`# Same jobs with scikit-image (skimage). Use if the task says "scikit-image".
# skimage reads RGB directly and often works with values 0..1 instead of 0..255.
import numpy as np
import matplotlib.pyplot as plt
from skimage import io, color, filters, feature, exposure, transform, util

img = io.imread("cat.png")                 # RGB (some PNGs have a 4th alpha channel)
if img.ndim == 3 and img.shape[2] == 4:
    img = color.rgba2rgb(img)              # drop transparency -> 3 channels
gray = color.rgb2gray(img)                 # 2-D, values 0.0 .. 1.0

T = filters.threshold_otsu(gray)           # best threshold, picked automatically
binary = gray > T                          # True/False image

edges = feature.canny(gray, sigma=2)       # bigger sigma -> fewer, smoother edges
sobel = filters.sobel(gray)                # edge strength
equalized = exposure.equalize_hist(gray)   # more contrast
small = transform.resize(img, (128, 128))  # (height, width)
gray_255 = util.img_as_ubyte(gray)         # back to 0..255 integers

hist, bins = exposure.histogram(gray_255)  # pixel counts per value
plt.plot(bins, hist)
plt.title(f"Gray histogram (Otsu T = {T:.2f} on a 0-1 scale)")
plt.show()

fig, ax = plt.subplots(1, 4, figsize=(16, 4))
for a, im, title in zip(ax, [gray, binary, edges, equalized], ["gray", "Otsu binary", "Canny edges", "equalized"]):
    a.imshow(im, cmap="gray")
    a.set_title(title)
    a.axis("off")
plt.show()
`,Qe=`# Download a Kaggle dataset. Public datasets need NO login with options 1 and 2.
# The "slug" is the part of the Kaggle URL after /datasets/  ->  owner/dataset-name
SLUG = "akrsnv/horses-and-camels"
OUT_DIR = "dataset"

# Option 1: kagglehub (pip install kagglehub)  - what the homeworks used
import kagglehub

path = kagglehub.dataset_download(SLUG, output_dir=OUT_DIR)
print("Downloaded to:", path)

# Option 2: kaggle command line (the "kaggle" package is in the exam install list).
# In Jupyter, put ! in front:
#   !kaggle datasets download akrsnv/horses-and-camels -p dataset --unzip
#
# Option 3: browser -> dataset page -> Download -> unzip into a folder named "dataset".

# See what is inside (you need to know where "train" and "test" are)
from pathlib import Path

for p in sorted(Path(OUT_DIR).rglob("*")):
    if p.is_dir():
        print(p, "->", len(list(p.glob("*"))), "items")
`,et=`# HW04 in Keras: CNN from scratch on MNIST / Fashion-MNIST / CIFAR-10. Needs the Metrics block.
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
`,tt=`# What a layer outputs for a REAL photo (feature maps / activations). Needs \`model\` from above.
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
`,nt=`# HW05: what does each filter look for? Start from a gray noise image and change the PIXELS
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
`,st=`# Keras transfer learning on a folder dataset (HW06 Part A / HW03 in Keras), with HW06 metrics.
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
`,at=`# HW07: chatbot with vision (LLaVA), camera, web search, short + long memory.
# pip install langchain-core langchain-ollama langchain-community langchain-huggingface sentence-transformers faiss-cpu ddgs
# Needs blocks: LangChain basics, Intent router.   ollama pull mistral  +  ollama pull llava
import base64
import mimetypes
import shutil
from collections import deque
from datetime import datetime
from pathlib import Path

import cv2
from langchain_core.messages import HumanMessage, AIMessage


# ---------- vision ----------
def ask_about_image(vlm, image_path, question="Describe this image."):
    path = Path(image_path).expanduser()
    if not path.is_file():
        return f"Image not found: {image_path}"
    mime = mimetypes.guess_type(str(path))[0] or "image/jpeg"
    b64 = base64.b64encode(path.read_bytes()).decode()
    msg = HumanMessage(content=[{"type": "text", "text": question},
                                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}])
    return str(vlm.invoke([msg]).content).strip()


def capture_camera(path="camera_capture.jpg", camera_index=0):
    """One webcam photo -> saved file path (None if there is no camera / no permission)."""
    cam = cv2.VideoCapture(camera_index)
    ok, frame = cam.read() if cam.isOpened() else (False, None)
    cam.release()
    if not ok:
        return None
    cv2.imwrite(path, frame)
    return path


# ---------- web search (DuckDuckGo, no API key) ----------
def web_search(query, max_results=5):
    try:
        from ddgs import DDGS
        return [{"title": r.get("title", ""), "url": r.get("href", ""), "snippet": r.get("body", "")}
                for r in DDGS().text(query, max_results=max_results)]
    except Exception as error:
        print("[web] search failed:", error)
        return []


# ---------- memory ----------
class ShortMemory:
    """Last N question/answer turns of this session (forgotten on restart)."""
    def __init__(self, turns=5):
        self.turns = deque(maxlen=turns)

    def add(self, question, answer):
        self.turns.append((question, answer))

    def messages(self):
        out = []
        for q, a in self.turns:
            out += [HumanMessage(content=q), AIMessage(content=a)]
        return out

    def clear(self):
        self.turns.clear()


class LongMemory:
    """Facts saved in a FAISS vector store on disk (survives restarts). Search by MEANING."""
    def __init__(self, path="faiss_memory", model_name="sentence-transformers/all-MiniLM-L6-v2"):
        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings
        self.FAISS, self.path = FAISS, path
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.db = (FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
                   if Path(path).exists() else None)   # only load an index you created yourself

    def add(self, text):
        meta = {"time": datetime.now().isoformat()}
        if self.db is None:
            self.db = self.FAISS.from_texts([text], self.embeddings, metadatas=[meta])
        else:
            self.db.add_texts([text], metadatas=[meta])
        self.db.save_local(self.path)

    def search(self, query, k=3):
        return [] if self.db is None else [d.page_content for d in self.db.similarity_search(query, k=k)]

    def clear(self):
        self.db = None
        shutil.rmtree(self.path, ignore_errors=True)


# ---------- the chatbot ----------
llm = get_llm("mistral")
vlm = get_llm("llava")
short_memory = ShortMemory(turns=5)
long_memory = LongMemory("faiss_memory")


def chatbot(question, image_path=None):
    """Route by intent, use tools/memory, answer, remember the turn."""
    intent = classify_intent(llm, question, has_image=image_path is not None)
    print("[intent]", intent)

    if intent == "image_analysis":
        answer = ask_about_image(vlm, image_path, question) if image_path else "Please attach an image."
    elif intent == "camera_request":
        path = capture_camera()
        answer = ask_about_image(vlm, path, question) if path else "Camera not available."
    elif intent == "ask_time":
        answer = datetime.now().astimezone().strftime("It is %I:%M %p on %A, %B %d, %Y.")
    elif intent == "memory_write":
        long_memory.add(question)
        answer = "Got it, I'll remember that."
    else:                                   # chat, memory_read, web_search
        context = ""
        memories = long_memory.search(question)
        if memories:
            context += "Saved memories:\\n" + "\\n".join(memories) + "\\n\\n"
        if intent == "web_search":
            results = web_search(question)
            context += "Web results:\\n" + "\\n".join(f"- {r['title']} ({r['url']}): {r['snippet']}" for r in results)
        answer = ask(llm, f"{context}\\nQuestion: {question}",
                     system=system_prompt("Use the context if relevant. Cite URLs when using web results."),
                     history=short_memory.messages())

    short_memory.add(question, answer)
    print("Assistant:", answer)
    return answer


chatbot("Remember that my favorite movie is Avengers: Endgame.")
chatbot("What is my favorite movie?")
chatbot("What is the current date and time?")
`,rt=`# HW-Harness: the LLM sorts each message into an intent, then a router calls the right tool.
# Needs the LangChain basics block (get_llm). Includes accuracy + confusion matrix of the classifier.
import re
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, ConfusionMatrixDisplay

INTENTS = {                                   # name -> description the LLM reads (edit freely)
    "chat": "General conversation or knowledge questions.",
    "ask_time": "Asking for the current date or time.",
    "memory_write": "Asking to remember or save information.",
    "memory_read": "Asking to recall information saved earlier.",
    "web_search": "Needs recent, live or online information (news, weather, prices).",
    "camera_request": "Asking to use the webcam or take a picture.",
    "image_analysis": "Asking about an attached image.",
}


def classify_intent(llm, message, intents=INTENTS, default="chat", has_image=False):
    """LLM picks exactly one intent name. Rule shortcuts first (fast and reliable)."""
    if has_image:
        return "image_analysis"
    if re.match(r"\\s*(remember|save|note)\\b", message, re.I):
        return "memory_write"
    rules = "\\n".join(f"- {name}: {desc}" for name, desc in intents.items())
    prompt = (f"Classify the user message into exactly one intent.\\n\\nIntents:\\n{rules}\\n\\n"
              f"User message: {message}\\n\\nReturn ONLY the intent name.")
    reply = str(llm.invoke(prompt).content).strip().lower()
    for name in sorted(intents, key=len, reverse=True):      # accept "Intent: ask_time." etc.
        if re.search(rf"\\b{re.escape(name)}\\b", reply):
            return name
    return default


def evaluate_intents(classify, test_data, labels=None):
    """classify: message -> intent.  test_data: [(message, expected_intent), ...]."""
    y_true = [label for _, label in test_data]
    y_pred = [classify(message) for message, _ in test_data]
    acc = accuracy_score(y_true, y_pred)
    print(f"Accuracy: {acc:.2%}")
    for (message, expected), got in zip(test_data, y_pred):
        if expected != got:
            print(f"  '{message}' -> expected {expected}, got {got}")
    labels = labels or sorted(set(y_true) | set(y_pred))
    ConfusionMatrixDisplay.from_predictions(y_true, y_pred, labels=labels, xticks_rotation=45,
                                            cmap="Blues", colorbar=False)
    plt.title("Intent confusion matrix")
    plt.tight_layout()
    plt.show()
    return acc


llm = get_llm("mistral")
test_data = [
    ("Hello!", "chat"), ("Explain neural networks", "chat"),
    ("What time is it?", "ask_time"), ("What's today's date?", "ask_time"),
    ("Remember my name is John", "memory_write"), ("Save my favorite food as pizza", "memory_write"),
    ("What is my name?", "memory_read"), ("Recall my favorite food", "memory_read"),
    ("Search the internet for AI news", "web_search"), ("Google the weather forecast", "web_search"),
    ("Turn on my webcam", "camera_request"), ("Take a picture with my camera", "camera_request"),
]
evaluate_intents(lambda m: classify_intent(llm, m), test_data, labels=list(INTENTS))
`,it=`# LangChain + Ollama basics (HW02 Part B, HW-Harness).
# pip install langchain-core langchain-ollama      then: ollama pull mistral
import json
import re
from datetime import datetime

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage


def get_llm(model="mistral", temperature=0, base_url="http://localhost:11434"):
    """temperature 0 = same answer every time (best for classifying); higher = more creative."""
    return ChatOllama(model=model, temperature=temperature, base_url=base_url)


def system_prompt(extra=""):
    """Hidden instructions + today's date/time (the model can't know it otherwise)."""
    now = datetime.now().astimezone()
    return (f"You are a helpful AI assistant.\\nCurrent date and time: {now:%A, %Y-%m-%d %H:%M %Z}\\n"
            f"Answer clearly and concisely. Never invent facts or sources.\\n{extra}")


def ask(llm, question, system=None, history=None):
    """One question -> answer text. history = earlier messages (e.g. ShortMemory().messages())."""
    messages = [SystemMessage(content=system or system_prompt())]
    messages += list(history or [])
    messages.append(HumanMessage(content=question))
    return str(llm.invoke(messages).content).strip()


def parse_json(text, default=None):
    """Pull the first {...} or [...] out of model text. Returns default if none parses."""
    match = re.search(r"\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\]", str(text))
    if not match:
        return default
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return default


def ask_json(llm, prompt, default=None):
    """Ask for JSON and get a Python dict/list back."""
    return parse_json(ask(llm, prompt + "\\n\\nReturn ONLY valid JSON, no other text."), default)


llm = get_llm("mistral")
print(ask(llm, "What is the current time?"))     # correct now: the time is in the system prompt
`,ot=`# Talk to a local Ollama model with ONLY \`requests\` (no LangChain needed - requests is in the exam list).
# Ollama must be running (open the Ollama app, or \`ollama serve\`) and the model pulled (\`ollama pull mistral\`).
import base64
import json
import re
from datetime import datetime

import requests

OLLAMA = "http://localhost:11434"
MODEL = "mistral"          # any model from \`ollama list\`; vision needs "llava"


def ask(prompt, system=None, model=MODEL, history=None, temperature=0):
    """One question -> answer text. history = earlier [{"role": ..., "content": ...}] messages."""
    messages = ([{"role": "system", "content": system}] if system else []) + list(history or [])
    messages.append({"role": "user", "content": prompt})
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "messages": messages, "stream": False,
                                                 "options": {"temperature": temperature}}, timeout=300)
    r.raise_for_status()
    return r.json()["message"]["content"].strip()


def ask_json(prompt, model=MODEL, default=None):
    """Ask for JSON and get a Python dict/list back (format="json" forces valid JSON)."""
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "format": "json", "stream": False,
                                                 "messages": [{"role": "user", "content": prompt}]}, timeout=300)
    text = r.json()["message"]["content"]
    match = re.search(r"\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\]", text)
    try:
        return json.loads(match.group()) if match else default
    except json.JSONDecodeError:
        return default


def ask_image(image_path, question="Describe this image.", model="llava"):
    """Send a picture to a vision model (llava)."""
    b64 = base64.b64encode(open(image_path, "rb").read()).decode()
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "stream": False, "messages": [
        {"role": "user", "content": question, "images": [b64]}]}, timeout=300)
    return r.json()["message"]["content"].strip()


def system_prompt():
    """The model can't know today's date: put it in the (hidden) system prompt."""
    return f"You are a helpful assistant. Current date and time: {datetime.now().astimezone():%A %Y-%m-%d %H:%M %Z}."


print(ask("What time is it?", system=system_prompt()))
print(ask_json('What should I remember from: "Remember my favorite color is blue"? '
               'Answer as JSON like {"key": "favorite food", "value": "pizza"}'))
`,lt=`# Tools = Python functions the LLM may call (HW02 Part B fix: the model can't read a clock).
from datetime import datetime

from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage


@tool
def get_current_time() -> str:
    """Returns the current local date and time."""     # the LLM reads this docstring to decide
    return datetime.now().astimezone().strftime("%Y-%m-%d %I:%M:%S %p %Z")


@tool
def add_numbers(a: float, b: float) -> float:
    """Adds two numbers and returns the sum."""
    return a + b


def run_with_tools(llm, question, tools, max_rounds=3):
    """Let the LLM call tools until it can answer. Returns the final answer text.
    Needs a tool-capable model in Ollama: mistral, llama3.1, qwen2.5."""
    llm_tools = llm.bind_tools(tools)
    by_name = {t.name: t for t in tools}
    messages = [HumanMessage(content=question)]
    for _ in range(max_rounds):
        reply = llm_tools.invoke(messages)
        messages.append(reply)
        if not reply.tool_calls:                         # no tool needed -> final answer
            return str(reply.content)
        for call in reply.tool_calls:                    # run each tool the model asked for
            result = by_name[call["name"]].invoke(call["args"])
            print(f"[tool] {call['name']}({call['args']}) -> {result}")
            messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    return str(llm.invoke(messages).content)


llm = ChatOllama(model="mistral", temperature=0)
print(run_with_tools(llm, "What time is it right now?", [get_current_time, add_numbers]))
`,ct=`# Metrics and plots: confusion matrix, accuracy, precision, recall, specificity, F1, ROC/AUC.
# Works with the output of evaluate() (PyTorch) or with any y_true / y_pred lists (Keras too).
import numpy as np
import pandas as pd
pd.set_option("display.max_columns", 30)
pd.set_option("display.width", 220)
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
                             confusion_matrix, roc_curve, roc_auc_score, classification_report)


def get_metrics(y_true, y_pred, y_prob=None, class_names=None):
    """2 classes (0 = negative, 1 = positive): accuracy, precision, sensitivity (recall),
    specificity, F1, AUC (AUC needs y_prob = probability of class 1).
    More classes: accuracy + macro averages (the average over classes)."""
    if len(set(y_true) | set(y_pred)) <= 2 and (class_names is None or len(class_names) == 2):
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        m = {
            "Accuracy": (tp + tn) / (tp + tn + fp + fn),
            "Precision": tp / (tp + fp) if tp + fp else 0.0,
            "Sensitivity (Recall)": tp / (tp + fn) if tp + fn else 0.0,
            "Specificity": tn / (tn + fp) if tn + fp else 0.0,
            "F1": 2 * tp / (2 * tp + fp + fn) if tp else 0.0,
        }
        if y_prob is not None:
            m["AUC"] = roc_auc_score(y_true, y_prob)
        print(f"TP={tp} TN={tn} FP={fp} FN={fn}")
    else:
        m = {
            "Accuracy": accuracy_score(y_true, y_pred),
            "Precision (macro)": precision_score(y_true, y_pred, average="macro", zero_division=0),
            "Recall (macro)": recall_score(y_true, y_pred, average="macro", zero_division=0),
            "F1 (macro)": f1_score(y_true, y_pred, average="macro", zero_division=0),
        }
        print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))
    for k, v in m.items():
        print(f"{k:22} {v:.4f}")
    return {k: float(v) for k, v in m.items()}


def plot_confusion(y_true, y_pred, class_names, title="Confusion matrix"):
    """Rows = actual class, columns = predicted class. The diagonal = correct answers."""
    cm = confusion_matrix(y_true, y_pred, labels=range(len(class_names)))
    size = max(4, 0.6 * len(class_names) + 2)
    plt.figure(figsize=(size + 1, size))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                xticklabels=class_names, yticklabels=class_names)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title(title)
    plt.tight_layout()
    plt.show()
    return cm


def plot_roc(y_true, y_prob, title="ROC curve"):
    """True positive rate vs false positive rate at every threshold. AUC: 1 = perfect, 0.5 = guessing."""
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    plt.figure(figsize=(5, 5))
    plt.plot(fpr, tpr, label=f"AUC = {auc:.3f}")
    plt.plot([0, 1], [0, 1], "--", color="gray", label="random guess")
    plt.xlabel("False positive rate (1 - specificity)")
    plt.ylabel("True positive rate (sensitivity)")
    plt.title(title)
    plt.legend()
    plt.show()
    return auc


def show_mistakes(y_true, y_pred, class_names):
    """Count each kind of mistake, e.g. 'camel predicted as horse: 2'."""
    cm = confusion_matrix(y_true, y_pred, labels=range(len(class_names)))
    print(f"Correct: {np.trace(cm)}/{cm.sum()}")
    for i, actual in enumerate(class_names):
        for j, pred in enumerate(class_names):
            if i != j and cm[i, j]:
                print(f"  {actual} predicted as {pred}: {cm[i, j]}")


def show_predictions(model, loader, class_names, n=8, imagenet=True, device="cpu"):
    """Grid of test images with predicted (P) vs actual (A) label. Red title = wrong."""
    import torch
    model.to(device).eval()
    images, labels = next(iter(loader))
    with torch.no_grad():
        out = model(images.to(device)).cpu()
    preds = to_probs(model, out).argmax(1)
    n = min(n, len(images))
    cols = min(n, 4)
    rows = (n + cols - 1) // cols
    plt.figure(figsize=(3 * cols, 3.3 * rows))
    for i in range(n):
        img = images[i]
        if imagenet and img.shape[0] == 3:                  # undo ImageNet normalization for display
            img = img * torch.tensor([0.229, 0.224, 0.225])[:, None, None] + torch.tensor([0.485, 0.456, 0.406])[:, None, None]
        img = img.clamp(0, 1).permute(1, 2, 0).numpy().squeeze()
        plt.subplot(rows, cols, i + 1)
        plt.imshow(img, cmap="gray" if img.ndim == 2 else None)
        ok = preds[i] == labels[i]
        plt.title(f"P: {class_names[preds[i]]}\\nA: {class_names[labels[i]]}", color="green" if ok else "red")
        plt.axis("off")
    plt.tight_layout()
    plt.show()


def results_table(results):
    """results = {"Model name": metrics_dict, ...} -> one row per model, sorted best first."""
    table = pd.DataFrame(results).T.round(4)
    return table.sort_values(table.columns[0], ascending=False)
`,dt=`# Pretrained ImageNet model with a new last layer (transfer learning, HW03 / HW06).
from torch import nn
from torchvision import models


def pretrained_model(name="resnet50", num_classes=2, freeze=True, train_layers=(), head="logits"):
    """name: "resnet18", "resnet50", "vgg16", "mobilenet_v2", "efficientnet_b0", "densenet121", "vit_b_16"...
    freeze=True  -> only the new last layer learns, plus any blocks in train_layers, e.g. ("layer4",)
    freeze=False -> every layer learns (full fine-tuning).
    head: "logits"  -> num_classes raw scores (loss does sigmoid/softmax inside, most stable)
          "sigmoid" -> 1 output + Sigmoid  (binary cross-entropy, HW06 Model 1)
          "softmax" -> num_classes outputs + Softmax (categorical cross-entropy, HW06 Model 2)"""
    model = getattr(models, name)(weights="DEFAULT")              # DEFAULT = best ImageNet weights

    if freeze:
        for p in model.parameters():
            p.requires_grad = False
        for layer in train_layers:
            for p in model.get_submodule(layer).parameters():
                p.requires_grad = True

    def new_head(in_features):
        if head == "sigmoid":
            return nn.Sequential(nn.Linear(in_features, 1), nn.Sigmoid())
        if head == "softmax":
            return nn.Sequential(nn.Linear(in_features, num_classes), nn.Softmax(dim=1))
        return nn.Linear(in_features, num_classes)

    if hasattr(model, "fc"):                                      # ResNet family
        model.fc = new_head(model.fc.in_features)
    elif hasattr(model, "heads"):                                 # Vision Transformer
        model.heads.head = new_head(model.heads.head.in_features)
    elif isinstance(model.classifier, nn.Linear):                 # DenseNet
        model.classifier = new_head(model.classifier.in_features)
    else:                                                         # VGG, MobileNet, EfficientNet
        model.classifier[-1] = new_head(model.classifier[-1].in_features)

    model.head_type = head                                        # train_model reads this to pick the loss
    return model


def show_layers(model):
    """Top-level blocks and whether each one learns (Trainable), is locked (Frozen), or both (Partly)."""
    for name, block in model.named_children():
        params = list(block.parameters())
        if params:
            n = sum(p.numel() for p in params)
            t = sum(p.numel() for p in params if p.requires_grad)
            status = "Trainable" if t == n else ("Frozen" if t == 0 else f"Partly ({t:,} learn)")
            print(f"{name:12} {n:>12,} params  {status}")
`,ht=`# Run this first. It checks every library and picks the fastest device.
import importlib

# import name -> pip name (they are not always the same)
LIBS = {
    "numpy": "numpy", "pandas": "pandas", "matplotlib": "matplotlib", "seaborn": "seaborn",
    "sklearn": "scikit-learn", "PIL": "pillow", "cv2": "opencv-python", "skimage": "scikit-image",
    "tqdm": "tqdm", "requests": "requests", "torch": "torch", "torchvision": "torchvision",
    "tensorflow": "tensorflow", "keras": "keras", "albumentations": "albumentations",
}
for name, pip_name in LIBS.items():
    try:
        module = importlib.import_module(name)
        print(f"OK       {name:15} {getattr(module, '__version__', '')}")
    except Exception as error:
        print(f"MISSING  {name:15} fix: pip install {pip_name}   ({type(error).__name__})")

import torch

DEVICE = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
print("\\nDevice:", DEVICE, "(mps = Apple GPU, cuda = NVIDIA GPU, cpu = no GPU)")
`,mt=`# One training loop for every PyTorch model (CNN from scratch or pretrained).
# The loss is picked for you from the model's last layer:
#   1 output  + sigmoid  -> binary cross-entropy (BCE)
#   N outputs + softmax  -> categorical cross-entropy (CCE) with one-hot labels
#   raw scores (logits)  -> the same losses, with sigmoid/softmax done inside the loss
import copy
import random
import time

import numpy as np
import torch
import matplotlib.pyplot as plt
from torch import nn
from torch.nn import functional as F
from PIL import Image

DEVICE = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")


def set_seed(seed=42):
    """Same random numbers every run -> repeatable results."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def _head(model):
    return getattr(model, "head_type", "logits")


def compute_loss(model, out, y):
    head = _head(model)
    if head == "sigmoid":                                   # out = P(class 1), shape [batch, 1]
        return F.binary_cross_entropy(out.squeeze(1), y.float())
    if head == "softmax":                                   # out = probabilities, rows add up to 1
        one_hot = F.one_hot(y, out.shape[1]).float()        # e.g. camel = [1, 0], horse = [0, 1]
        return -(one_hot * torch.log(out + 1e-7)).sum(dim=1).mean()
    if out.shape[1] == 1:
        return F.binary_cross_entropy_with_logits(out.squeeze(1), y.float())
    return F.cross_entropy(out, y)


def to_probs(model, out):
    """Model output -> probability of every class, shape [batch, classes]."""
    if out.shape[1] == 1:
        p = out if _head(model) == "sigmoid" else torch.sigmoid(out)
        return torch.cat([1 - p, p], dim=1)
    return out if _head(model) == "softmax" else torch.softmax(out, dim=1)


def _train_mode(model):
    # Frozen BatchNorm layers stay in eval mode so their saved statistics don't change.
    model.train()
    for m in model.modules():
        if isinstance(m, nn.modules.batchnorm._BatchNorm) and not any(p.requires_grad for p in m.parameters()):
            m.eval()


def evaluate(model, loader, device=DEVICE):
    """Test a model (no learning). Returns a dict:
    loss, accuracy, y_true, y_pred, probs (N x classes), y_prob (P(class 1), only for 2 classes)."""
    model.to(device).eval()
    total_loss, y_true, y_pred, probs = 0.0, [], [], []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            total_loss += compute_loss(model, out, y).item() * len(y)
            p = to_probs(model, out)
            y_true += y.cpu().tolist()
            y_pred += p.argmax(1).cpu().tolist()
            probs.append(p.cpu())
    probs = torch.cat(probs).numpy()
    return {
        "loss": total_loss / len(y_true),
        "accuracy": float(np.mean(np.array(y_true) == np.array(y_pred))),
        "y_true": y_true,
        "y_pred": y_pred,
        "probs": probs,
        "y_prob": probs[:, 1] if probs.shape[1] == 2 else None,
    }


def train_model(model, train_loader, val_loader=None, epochs=5, lr=1e-3, optimizer="adam",
                weight_decay=0.0, patience=None, save_path=None, device=DEVICE):
    """Train, check validation after every epoch, and keep the best epoch's weights.
    optimizer: "adam" or "sgd".  patience: stop early after this many epochs with no
    validation improvement (None = never stop early).
    Returns history: train_loss, train_acc, val_loss, val_acc, seconds (one value per epoch)."""
    model.to(device)
    params = [p for p in model.parameters() if p.requires_grad]     # frozen layers are skipped
    if optimizer == "sgd":
        opt = torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=weight_decay)
    else:
        opt = torch.optim.Adam(params, lr=lr, weight_decay=weight_decay)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "seconds": []}
    best_key, best_state, bad_epochs = None, None, 0

    for epoch in range(1, epochs + 1):
        start = time.perf_counter()
        _train_mode(model)
        loss_sum, correct, seen = 0.0, 0, 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = compute_loss(model, out, y)
            opt.zero_grad()
            loss.backward()
            opt.step()
            loss_sum += loss.item() * len(y)
            correct += (to_probs(model, out).argmax(1) == y).sum().item()
            seen += len(y)

        history["train_loss"].append(loss_sum / seen)
        history["train_acc"].append(correct / seen)
        msg = f"Epoch {epoch}/{epochs} | train loss {loss_sum / seen:.4f} acc {correct / seen:.2%}"

        if val_loader is not None:
            r = evaluate(model, val_loader, device)
            history["val_loss"].append(r["loss"])
            history["val_acc"].append(r["accuracy"])
            msg += f" | val loss {r['loss']:.4f} acc {r['accuracy']:.2%}"
            key = (r["accuracy"], -r["loss"])               # best = higher accuracy, then lower loss
            if best_key is None or key > best_key:
                best_key, best_state, bad_epochs = key, copy.deepcopy(model.state_dict()), 0
                msg += "  <- best"
            else:
                bad_epochs += 1

        history["seconds"].append(time.perf_counter() - start)
        print(msg + f" | {history['seconds'][-1]:.1f}s")
        if patience and bad_epochs >= patience:
            print(f"Early stop: no improvement for {patience} epochs.")
            break

    if best_state is not None:
        model.load_state_dict(best_state)                   # go back to the best epoch
        print(f"Restored best epoch: val acc {best_key[0]:.2%}")
    if save_path:
        torch.save(model.state_dict(), save_path)
    return history


def plot_history(history, title=""):
    """Loss and accuracy curves (train vs validation). Gap growing = overfitting."""
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    ax[0].plot(epochs, history["train_loss"], "o-", label="train")
    ax[1].plot(epochs, history["train_acc"], "o-", label="train")
    if history["val_loss"]:
        ax[0].plot(epochs, history["val_loss"], "o--", label="validation")
        ax[1].plot(epochs, history["val_acc"], "o--", label="validation")
    ax[0].set_title("Loss (lower is better)")
    ax[1].set_title("Accuracy (higher is better)")
    for a in ax:
        a.set_xlabel("Epoch")
        a.legend()
        a.grid(alpha=0.3)
    fig.suptitle(title)
    plt.tight_layout()
    plt.show()


def predict_image(model, path, transform, class_names, device=DEVICE):
    """Classify one image file. transform = the eval transform used for the test set."""
    model.to(device).eval()
    x = transform(Image.open(path).convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        p = to_probs(model, model(x))[0]
    i = int(p.argmax())
    print(f"{path}: {class_names[i]} ({p[i]:.1%} sure)")
    return class_names[i], float(p[i])


def count_params(model):
    """Total and trainable (learning) parameter counts."""
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total params: {total:,} | Trainable: {trainable:,}")
    return total, trainable
`,pt=`# HW03: transfer learning on a folder dataset + compare which layers to fine-tune.
# Needs blocks: Train & evaluate, Metrics, Folder data, Pretrained model.
from pathlib import Path

import kagglehub
import pandas as pd

# ---------------- SETTINGS: change these ----------------
KAGGLE_SLUG = "akrsnv/horses-and-camels"   # or set DATA_DIR to a folder you already have
DATA_DIR = "dataset"
MODEL_NAME = "resnet50"     # "resnet18" is ~3x faster if time is short
IMG_SIZE = 224              # pretrained ImageNet models expect 224 x 224
BATCH_SIZE = 16
EPOCHS = 5
LR = 1e-4                   # small steps: we only adjust weights that are already good
VAL_SPLIT = 0.2             # 20% of train -> validation (or an int like 20 = 20 images per class)
AUGMENT = False             # True = random flips/rotations on training images
CONFIGS = {                 # name -> blocks that learn (rest frozen). ResNet names; VGG16: ("features.28",)
    "A: layer4 + fc": ("layer4",),
    "B: layer3 + layer4 + fc": ("layer3", "layer4"),
}
# --------------------------------------------------------

if not Path(DATA_DIR).exists():
    kagglehub.dataset_download(KAGGLE_SLUG, output_dir=DATA_DIR)
train_dir, test_dir = find_dir(DATA_DIR, "train"), find_dir(DATA_DIR, "test")
train_loader, val_loader, test_loader, classes = load_folder_data(
    train_dir or DATA_DIR, test_dir, size=IMG_SIZE, batch_size=BATCH_SIZE, val_split=VAL_SPLIT, augment=AUGMENT)
show_batch(train_loader, classes)

results, histories, models_ = {}, {}, {}
for name, layers in CONFIGS.items():
    print(f"\\n========== Configuration {name}")
    set_seed(42)
    model = pretrained_model(MODEL_NAME, num_classes=len(classes), freeze=True, train_layers=layers)
    show_layers(model)
    _, trainable = count_params(model)
    histories[name] = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=LR)
    r = evaluate(model, test_loader)
    results[name] = {**get_metrics(r["y_true"], r["y_pred"], r["y_prob"], classes),
                     "Best val acc": max(histories[name]["val_acc"]), "Trainable params": trainable,
                     "Minutes": sum(histories[name]["seconds"]) / 60}
    plot_history(histories[name], name)
    plot_confusion(r["y_true"], r["y_pred"], classes, f"{name} (test)")
    models_[name] = model

table = results_table(results)
print(table)
best = max(results, key=lambda n: (results[n]["Best val acc"], -results[n]["Trainable params"]))
print("\\nSelected configuration (by validation accuracy, then fewer parameters):", best)
`,ut=`# Run ONCE before the exam (internet needed; CIFAR10 alone can take 30+ min). Everything is saved on disk,
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
`,gt=Object.assign({"./snippets/augment.py":Be,"./snippets/augment_recipe.py":We,"./snippets/binary_recipe.py":qe,"./snippets/cnn_experiments.py":Ue,"./snippets/cnn_models.py":Ve,"./snippets/cnn_recipe.py":$e,"./snippets/data_builtin.py":Ke,"./snippets/folder_data.py":Ze,"./snippets/image_basics.py":Ye,"./snippets/image_recipe.py":Xe,"./snippets/image_skimage.py":Je,"./snippets/kaggle_download.py":Qe,"./snippets/keras_cnn.py":et,"./snippets/keras_feature_maps.py":tt,"./snippets/keras_filters.py":nt,"./snippets/keras_transfer.py":st,"./snippets/llm_chatbot.py":at,"./snippets/llm_intents.py":rt,"./snippets/llm_langchain.py":it,"./snippets/llm_requests.py":ot,"./snippets/llm_tools.py":lt,"./snippets/metrics.py":ct,"./snippets/pretrained.py":dt,"./snippets/setup_check.py":ht,"./snippets/train_eval.py":mt,"./snippets/transfer_recipe.py":pt,"./snippets/warmup.py":ut}),ft=s=>gt[`./snippets/${s}.py`],$={setup_check:{title:"Check libraries + device",page:"setup"},kaggle_download:{title:"Download a Kaggle dataset",page:"setup"},warmup:{title:"Pre-download everything (run before the exam)",page:"setup"},image_basics:{title:"Image functions (OpenCV)",page:"images"},image_recipe:{title:"HW01 tasks a-i",page:"images"},image_skimage:{title:"Same with scikit-image",page:"images"},train_eval:{title:"Train & evaluate (PyTorch)",page:"cnn"},metrics:{title:"Metrics & plots",page:"binary"},data_builtin:{title:"Built-in datasets (MNIST, FashionMNIST, CIFAR10)",page:"cnn"},cnn_models:{title:"CNN models",page:"cnn"},cnn_recipe:{title:"Train a CNN (settings)",page:"cnn"},cnn_experiments:{title:"Experiments: layers, batch sizes, activations",page:"cnn"},folder_data:{title:"Folder dataset (ImageFolder)",page:"transfer"},pretrained:{title:"Pretrained model + new head",page:"transfer"},transfer_recipe:{title:"Compare fine-tuning configurations (settings)",page:"transfer"},binary_recipe:{title:"BCE vs CCE, frozen vs full (settings)",page:"binary"},augment:{title:"Augmentation functions (albumentations)",page:"augment"},augment_recipe:{title:"With vs without augmentation (settings)",page:"augment"},keras_filters:{title:"Filter visualization (settings)",page:"keras"},keras_feature_maps:{title:"Feature maps of a real image",page:"keras"},keras_transfer:{title:"Keras transfer learning + metrics (settings)",page:"keras"},keras_cnn:{title:"Keras CNN on MNIST (settings)",page:"keras"},llm_requests:{title:"Ollama with only requests",page:"llm"},llm_langchain:{title:"LangChain basics",page:"llm"},llm_tools:{title:"Tools (function calling)",page:"llm"},llm_intents:{title:"Intent router + accuracy",page:"llm"},llm_chatbot:{title:"Full chatbot (memory, web, vision)",page:"llm"}};for(const[s,n]of Object.entries($))n.id=s,n.code=(ft(s)||`# missing snippet ${s}`).trimEnd()+`
`,n.lines=n.code.split(`
`).length-1;const ue={image:{title:"Image basics (HW01)",blocks:["image_basics","image_recipe"]},cnn:{title:"CNN from scratch (HW04)",blocks:["train_eval","metrics","data_builtin","cnn_models","cnn_recipe"]},cnn_exp:{title:"CNN experiments (HW04 Part B)",blocks:["train_eval","metrics","data_builtin","cnn_models","cnn_experiments"]},transfer:{title:"Transfer learning (HW03)",blocks:["train_eval","metrics","folder_data","pretrained","transfer_recipe"]},binary:{title:"Binary metrics, BCE vs CCE (HW06)",blocks:["train_eval","metrics","folder_data","pretrained","binary_recipe"]},augment:{title:"Augmentation (albumentations)",blocks:["train_eval","metrics","folder_data","pretrained","augment","augment_recipe"]},keras_filters:{title:"Filter visualization (HW05)",blocks:["keras_filters","keras_feature_maps"]},keras_transfer:{title:"Keras transfer learning (HW06 in Keras)",blocks:["metrics","keras_transfer"]},keras_cnn:{title:"Keras CNN (HW04 in Keras)",blocks:["metrics","keras_cnn"]},llm_harness:{title:"Intent router (HW-Harness)",blocks:["llm_langchain","llm_intents"]},llm_chatbot:{title:"Chatbot (HW07)",blocks:["llm_langchain","llm_intents","llm_chatbot"]}};function Ce(s){const n=ue[s];return n.blocks.map((t,o)=>`# ===== [${o+1}/${n.blocks.length}] ${$[t].title} =====
${$[t].code}`).join(`

`)}function _t(s){return Ce(s).split(`
`).length}function Ie(s,n){const t=r=>r.replace(/\n+$/,"").split(`
`).map((b,x,v)=>x<v.length-1?b+`
`:b),o={cells:n.map(r=>r.type==="md"?{cell_type:"markdown",metadata:{},source:t(r.text)}:{cell_type:"code",metadata:{},execution_count:null,outputs:[],source:t(r.text)}),metadata:{kernelspec:{display_name:"Python 3",language:"python",name:"python3"},language_info:{name:"python"}},nbformat:4,nbformat_minor:5},c=new Blob([JSON.stringify(o,null,1)],{type:"application/x-ipynb+json"}),l=URL.createObjectURL(c),u=document.createElement("a");u.href=l,u.download=s,document.body.appendChild(u),u.click(),u.remove(),setTimeout(()=>URL.revokeObjectURL(l),1e3)}function yt(s){const n=ue[s],t=[{type:"md",text:`# ${n.title}
Run the cells top to bottom. Change only the SETTINGS in the last cell.`}];n.blocks.forEach((o,c)=>{t.push({type:"md",text:`## ${c+1}. ${$[o].title}`}),t.push({type:"code",text:$[o].code})}),Ie(`${s}.ipynb`,t)}const ge={accuracy:["Accuracy","Out of all predictions, the fraction that were right. (TP + TN) / everything. Misleading when one class is much bigger than the other."],activation:["Activation function","A small math step after each layer that decides how strongly a neuron 'fires'. Without it the whole network could only learn straight-line rules. Examples: ReLU, sigmoid, tanh."],adam:["Adam","The most common optimizer. It adjusts the learning step size for every weight automatically, so it usually works well without tuning."],albumentations:["albumentations","A Python library for image augmentation: flips, rotations, brightness changes, blur, crops, etc. Fast, and works with PyTorch through ToTensorV2."],auc:["AUC","Area Under the ROC Curve. One number for how well the model ranks positives above negatives: 1.0 = perfect, 0.5 = coin flip."],augmentation:["Data augmentation","Making extra training images by randomly changing the ones you have (flip, rotate, brighten...). The model sees more variety, so it memorizes less and generalizes better. Only done on TRAINING images."],backbone:["Base model (backbone)","The big pretrained part of a network (e.g. ResNet50 without its last layer). It turns an image into useful features; you add your own small classifier on top."],batch:["Batch","A small group of images processed together before the weights are updated once. batch_size=32 means 32 images per update."],batchnorm:["Batch normalization","A layer that re-scales the numbers flowing through the network to a steady range, which makes training faster and more stable. It keeps running averages that should not change when the layer is frozen."],bce:["Binary cross-entropy (BCE)","The loss for yes/no problems with ONE output (a probability from sigmoid). Small when the predicted probability is close to the true 0 or 1."],bgr:["BGR","OpenCV stores color as Blue-Green-Red, the reverse of the usual RGB. Convert with cv2.cvtColor(img, cv2.COLOR_BGR2RGB) before showing it, or the colors look wrong (blue-ish)."],binary:["Binary classification","Choosing between exactly two classes, e.g. camel vs horse. Class 1 is called 'positive', class 0 'negative'."],channel:["Channel","One layer of numbers in an image. Color images have 3 (red, green, blue); grayscale has 1. Inside a CNN, each filter makes its own channel."],checkpoint:["Checkpoint","A saved copy of the model's weights (a .pt or .keras file) so you can reload the best version later."],cce:["Categorical cross-entropy (CCE)","The loss for picking ONE class out of several, using softmax outputs and one-hot labels. Small when the true class gets a high probability."],classifier:["Classifier (head)","The last layer(s) that turn features into class scores. In transfer learning you replace the original 1,000-class head with your own (e.g. 2 classes)."],cnn:["CNN (convolutional neural network)","A neural network for images. Small filters slide over the picture to find patterns (edges, textures, shapes), layer after layer."],confusion:["Confusion matrix","A table of actual class (rows) vs predicted class (columns). The diagonal holds the correct answers; everything else shows which classes get mixed up."],convergence:["Convergence","When the loss stops going down much, training has 'converged' - more epochs will not help a lot."],conv:["Convolution layer (Conv2D)","A layer of small filters (e.g. 3x3) that slide across the image and respond to a pattern wherever it appears."],cuda:["CUDA / MPS / CPU","Where the math runs. cuda = NVIDIA GPU, mps = Apple Silicon GPU (your Mac), cpu = normal processor (slowest)."],dataloader:["DataLoader","PyTorch helper that serves the dataset in shuffled batches during training."],dense:["Dense / Linear / Fully connected layer","A layer where every input connects to every output. Keras calls it Dense, PyTorch calls it Linear (nn.Linear)."],dropout:["Dropout","During training, randomly switch off a fraction of neurons (0.5 = half) each step, so the network cannot depend on any single one. Reduces overfitting. Turned off automatically when testing."],embedding:["Embedding","A list of numbers that represents the MEANING of a text (or image). Similar meanings give similar numbers, so you can search by meaning."],epoch:["Epoch","One full pass over all training images. 10 epochs = the model sees every training image 10 times."],f1:["F1 score","One number that balances precision and recall (their harmonic mean). High only when both are high."],faiss:["FAISS / vector store","A database that stores embeddings and finds the most similar ones fast. Used as long-term memory for a chatbot."],featuremap:["Feature map (activation)","The output image of one filter: bright where the filter found its pattern, dark elsewhere."],filter:["Filter (kernel)","A tiny grid of learned weights (e.g. 3x3) that slides over the image. Each filter learns to detect one pattern."],finetune:["Fine-tuning","Unfreezing some (or all) pretrained layers and training them a little with a small learning rate, so they adapt to your data."],flatten:["Flatten","Turns the 3-D stack of feature maps into one long list of numbers so a Linear/Dense layer can read it."],freeze:["Freeze","Lock a layer's weights so they do not change during training (requires_grad=False in PyTorch, trainable=False in Keras)."],gradient:["Gradient","For every weight (or pixel): which direction, and how much, to change it to make the loss go down (or the activation go up)."],ascent:["Gradient ascent","Changing the INPUT IMAGE step by step in the direction that makes a filter fire more. Used to visualize what a filter looks for. The model weights stay fixed."],descent:["Gradient descent","How networks learn: nudge every weight a little in the direction that lowers the loss, repeat many times."],grayscale:["Grayscale","A one-channel image where each pixel is brightness 0 (black) to 255 (white). Made from a weighted mix of R, G and B."],histogram:["Histogram","A count of how many pixels have each value 0-255. 'Unnormalized' means raw counts (not percentages)."],hyperparameter:["Hyperparameter","A setting YOU choose before training (epochs, batch size, learning rate, dropout...). The model learns the weights; you pick the hyperparameters."],imagefolder:["ImageFolder","PyTorch dataset that reads images from folder/class_name/picture.jpg. The folder names become the class names (alphabetical: camel = 0, horse = 1)."],imagenet:["ImageNet","A huge dataset (1.28 million photos, 1,000 classes) used to pretrain models like ResNet50 and VGG16."],inference:["Inference","Using a trained model to make predictions (no learning). model.eval() + torch.no_grad()."],intent:["Intent","What the user wants (ask the time, save a memory, search the web...). A chatbot classifies the intent first, then routes to the right tool."],kaggle:["Kaggle","A website with free datasets and competitions. A dataset's 'slug' is owner/name from its URL, e.g. akrsnv/horses-and-camels."],keras:["Keras / TensorFlow","Google's deep learning library. Keras is the easy high-level part: model.compile(), model.fit(), model.evaluate()."],curve:["Learning curve","Plot of loss (or accuracy) per epoch for training and validation. Shows if the model is learning, overfitting or underfitting."],lr:["Learning rate (LR)","How big each learning step is. Too high: loss jumps around or explodes. Too low: learns very slowly. Typical: 1e-3 from scratch, 1e-4 for fine-tuning."],llm:["LLM","Large language model: a text model like Mistral that predicts the next words. It knows nothing after its training cutoff and cannot see the clock unless you give it tools."],llava:["LLaVA (VLM)","A vision-language model: it reads an image + a question and answers in text. Run locally with Ollama."],logits:["Logits","The raw scores a network outputs before sigmoid/softmax turns them into probabilities. Can be any number, negative too."],loss:["Loss","One number for how wrong the model is. Training tries to make it smaller. Lower = better."],maxpool:["Max pooling","Shrinks a feature map by keeping only the biggest value in each small window (2x2 halves height and width). Cuts computation and makes the model care less about exact position."],mnist:["MNIST","70,000 tiny (28x28) grayscale images of handwritten digits 0-9: 60,000 for training, 10,000 for testing."],normalize:["Normalization","Rescaling pixel values to a standard range. Pretrained ImageNet models expect each color channel shifted by mean [0.485, 0.456, 0.406] and divided by std [0.229, 0.224, 0.225]."],onehot:["One-hot encoding","Writing a class as a list with a single 1: camel = [1, 0], horse = [0, 1]. Used with softmax + categorical cross-entropy."],ollama:["Ollama","An app that runs LLMs on your own computer and answers requests at http://localhost:11434."],optimizer:["Optimizer","The rule that updates the weights from the gradients. Adam is the usual choice; SGD is simpler and sometimes generalizes better."],overfit:["Overfitting","The model memorizes the training images instead of learning general rules: training accuracy keeps rising while validation gets worse. Fix: augmentation, dropout, fewer epochs, freeze more layers."],padding:["Padding","Adding a border of zeros around the image before a convolution so the output keeps the same size (padding=1 for a 3x3 filter)."],params:["Parameters (weights)","The numbers the model learns. 'Trainable' parameters change during training; frozen ones don't."],pixel:["Pixel","One dot of the image. In 8-bit images each pixel value is 0 to 255 per channel."],precision:["Precision","Of everything the model CALLED positive, how much really was positive. TP / (TP + FP). High precision = few false alarms."],pretrained:["Pretrained model","A model already trained on a big dataset (ImageNet). Its early layers already detect edges, textures and shapes, which you reuse."],pytorch:["PyTorch","Meta's deep learning library (import torch). You write the training loop yourself; torchvision adds image datasets and pretrained models."],recall:["Sensitivity (Recall)","Of all REAL positives, how many the model found. TP / (TP + FN). High recall = few misses."],relu:["ReLU","The most common activation: negative numbers become 0, positive numbers stay. Simple and fast."],resnet:["ResNet50","A 50-layer CNN with 'skip connections' (shortcuts that help very deep networks train). In PyTorch its blocks are conv1, layer1-layer4, and fc (the head)."],roc:["ROC curve","Try every threshold from 1 down to 0; at each one plot true positive rate (sensitivity) vs false positive rate (1 - specificity). The closer it hugs the top-left corner, the better."],seed:["Random seed","A starting number for randomness. Same seed = same shuffles and same starting weights = repeatable results."],sigmoid:["Sigmoid","Squashes any number into 0..1, read as a probability. Used with ONE output for binary problems (or for multi-label problems)."],softmax:["Softmax","Turns several scores into probabilities that add up to 1. Used when each image belongs to exactly ONE of several classes."],specificity:["Specificity","Of all REAL negatives, how many the model correctly called negative. TN / (TN + FP)."],stratified:["Stratified split","Splitting data so every part keeps the same class balance (e.g. 50% camels / 50% horses in train, validation and test)."],stride:["Stride","How many pixels a filter jumps each step. Stride 2 halves the output size."],systemprompt:["System prompt","Hidden instructions sent to the LLM before the user's message (role, rules, today's date)."],temperature:["Temperature","LLM randomness. 0 = always the same, most likely answer (best for classifying). Higher = more creative and varied."],tensor:["Tensor","PyTorch's array of numbers (like a NumPy array that can live on the GPU). Image batches have shape [batch, channels, height, width]."],testset:["Test set","Images kept aside until the very end to measure final performance. Never used to train or to choose settings."],threshold:["Threshold","A cut-off value. Image thresholding: pixels above T become white (255), the rest black (0). Classification: probability above 0.5 = class 1."],tool:["Tool (function calling)","A normal Python function the LLM is allowed to ask you to run (e.g. get_current_time). The docstring tells the model when to use it."],trainset:["Training set","The images the model actually learns from."],transfer:["Transfer learning","Reusing a model trained on a big dataset (ImageNet) for your own smaller task, by replacing and training its last layer(s). Works well with little data."],transform:["Transform","A step applied to every image as it is loaded: resize, convert to tensor, normalize, augment."],underfit:["Underfitting","The model has not learned enough: both training and validation loss are still high or still dropping. Fix: more epochs, higher learning rate, bigger model, unfreeze more."],validation:["Validation set","Images held out from training and checked after every epoch. Used to pick the best epoch/settings and spot overfitting, without touching the test set."],vgg:["VGG16","A 16-layer CNN made of simple 3x3 conv blocks (block1_conv1 ... block5_conv3). Popular for filter visualization because its layers are easy to name."],vlm:["VLM","Vision-language model: takes an image and text, answers in text (LLaVA)."]},se=[{id:"hw01a",title:"HW01 Part A",desc:"OpenCV image basics: load, size, channels, histograms, grayscale",file:"HW01_PartA_Amrinder_Singh.ipynb",topic:"image",n:16},{id:"hw01b",title:"HW01 Part B",desc:"Binary threshold, its histogram, commentary answers",file:"HW01_PartB_Amrinder_Singh.ipynb",topic:"image",n:10},{id:"hw02a",title:"HW02 Part A",desc:"Show an image (environment check)",file:"HW2-A.ipynb",topic:"image",n:4},{id:"hw02b",title:"HW02 Part B",desc:"LangChain + Ollama: ask Mistral the time, fix it with a tool",file:"HW-2B.ipynb",topic:"llm",n:10},{id:"hw03a",title:"HW03 Part A",desc:"Horses vs camels input pipeline (PyTorch)",file:"HW03-Report-PartA-Amrinder-Singh.ipynb",topic:"transfer",n:13},{id:"hw03b",title:"HW03 Part B",desc:"ResNet50 transfer learning: two freezing configurations compared",file:"Report-PartB-Amrinder-Singh.ipynb",topic:"transfer",n:71},{id:"hw04a",title:"HW04 Part A",desc:"MNIST: base CNN from scratch (PyTorch)",file:"HW04-ICA – Part A.ipynb",topic:"cnn",n:14},{id:"hw04b",title:"HW04 Part B",desc:"MNIST: train 10 epochs, confusion matrix, deeper CNN",file:"HW04-ICA – Part B.ipynb",topic:"cnn",n:15},{id:"hw05b",title:"HW05 Part B",desc:"VGG16: visualize what filters learn (Keras)",file:"HW05-PartB-Report-Singh.ipynb",topic:"keras",n:33},{id:"hw06a",title:"HW06 Part A",desc:"Keras ResNet50 base model",file:"HW-6PART-A.ipynb",topic:"keras",n:4},{id:"hw06b",title:"HW06 Part B",desc:"BCE vs CCE, frozen vs full fine-tuning, binary metrics",file:"HW06_PartB.ipynb",topic:"binary",n:39},{id:"harness",title:"HW Harness",desc:"Intent router with Mistral + LLaVA, classifier accuracy",file:"HW-Harness.ipynb",topic:"llm",n:33},{id:"hw07",title:"HW07",desc:"Chatbot: memory (FAISS), web search, camera, LLaVA",file:"HW7.ipynb",topic:"llm",n:45}],xt=Object.freeze(Object.defineProperty({__proto__:null,default:se},Symbol.toStringTag,{value:"Module"})),bt=[["Confusion matrix","binary","block-metrics","plot_confusion heatmap seaborn"],["Precision, recall, sensitivity, specificity, F1","binary","formulas","metrics formula TP TN FP FN"],["ROC curve and AUC","binary","block-metrics","plot_roc roc_auc_score"],["Learning curve: overfitting or underfitting?","binary","curves","loss vs epochs discuss well-trained"],["Sigmoid + BCE vs softmax + CCE","binary","settings","head one-hot single output two outputs"],["Freeze layers / fine-tune layer4","transfer","layers","requires_grad train_layers unfreeze"],["Layer names for VGG16, MobileNet, EfficientNet","transfer","layers","features classifier"],["Use a different Kaggle dataset","transfer","settings","KAGGLE_SLUG download"],["Dataset without train/test folders","transfer","settings","split test_split"],["Shape math / flatten size","cnn","shapes","mat1 mat2 2704 1568 padding"],["Batch size experiment","cnn","block-cnn_experiments","64 128 256"],["More conv layers / activation functions","cnn","block-cnn_experiments","tanh relu sigmoid deeper"],["Epoch vs batch","cnn","theory","difference"],["Max pooling purpose","cnn","theory","pool"],["Validation set purpose","cnn","theory","why validation"],["Data augmentation with albumentations","augment","blocks","flip rotate brightness"],["albumentations transform names (v2)","augment","cheatsheet","Affine RandomResizedCrop GaussNoise CoarseDropout"],["Visualize VGG16 filters","keras","filters","gradient ascent block1_conv1"],["Feature maps of a real image","keras","block-keras_feature_maps","activations"],["PyTorch vs Keras translation","keras","translate","Dense Linear fit"],["Histogram of R G B channels","images","block-image_basics","calcHist"],["Binary threshold / Otsu","images","block-image_basics","threshold 127"],["Grayscale vs one channel","images","theory","weights"],["Ask Ollama without LangChain","llm","requests","requests api chat"],["LLM tool for the current time","llm","block-llm_tools","@tool get_current_time"],["Intent classification accuracy","llm","block-llm_intents","router harness"],["Chatbot memory FAISS web search LLaVA","llm","block-llm_chatbot","HW07"],["Create the exam environment","setup","env","conda pip install"],["Pre-download datasets and weights","setup","block-warmup","CIFAR slow"],["Save / load a model","cnn","block-train_eval","torch.save load_state_dict"],["Predict a single image","cnn","block-train_eval","predict_image"],["Early stopping","cnn","block-train_eval","patience"]];function vt(){const s=[];for(const n of Y)s.push({type:"Page",title:n.title,sub:n.hw||n.group,text:n.why||"",to:[n.id]});for(const[n,t,o,c]of bt)s.push({type:"Task",title:n,sub:Y.find(l=>l.id===t).title,text:c,to:[t,o]});for(const n of Object.values($)){s.push({type:"Code block",title:n.title,sub:Y.find(t=>t.id===n.page).title,text:n.id,to:[n.page,"block-"+n.id]});for(const t of n.code.matchAll(/^(?:def|class) (\w+)\s*\(([^)]*)\)?/gm))t[1].startsWith("_")||s.push({type:"Function",title:`${t[1]}(${t[2].length>40?t[2].slice(0,40)+"…":t[2]})`,sub:n.title,text:t[1],to:[n.page,"block-"+n.id]});for(const t of n.code.matchAll(/^([A-Z][A-Z_]{2,}) = (.+?)(?:\s+#\s*(.*))?$/gm))s.push({type:"Setting",title:t[1],sub:t[3]||n.title,text:t[2],to:[n.page,"block-"+n.id]})}for(const[n,[t,o]]of Object.entries(ge))s.push({type:"Word",title:t,sub:o,text:"",to:["glossary",n]});for(const n of se)s.push({type:"Notebook",title:n.title,sub:n.desc,text:n.file,to:["notebooks",n.id]});return s}let we;const wt={Task:0,Page:1,Function:2,Setting:3,"Code block":4,Word:5,Notebook:6};function jt(s,n=40){we||=vt();const t=s.toLowerCase().split(/\s+/).filter(Boolean);if(!t.length)return[];const o=[];for(const c of we){const l=c.title.toLowerCase(),u=`${l} ${(c.sub||"").toLowerCase()} ${c.text.toLowerCase()}`;let r=0,b=!0;for(const x of t)if(l.startsWith(x))r+=6;else if(l.includes(x))r+=4;else if(u.includes(x))r+=1;else{b=!1;break}b&&o.push({...c,score:r-wt[c.type]*.3})}return o.sort((c,l)=>l.score-c.score).slice(0,n)}var he={exports:{}},je;function kt(){return je||(je=1,(function(s){var n=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:{};/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */var t=(function(o){var c=/(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,l=0,u={},r={manual:o.Prism&&o.Prism.manual,disableWorkerMessageHandler:o.Prism&&o.Prism.disableWorkerMessageHandler,util:{encode:function i(a){return a instanceof b?new b(a.type,i(a.content),a.alias):Array.isArray(a)?a.map(i):a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(i){return Object.prototype.toString.call(i).slice(8,-1)},objId:function(i){return i.__id||Object.defineProperty(i,"__id",{value:++l}),i.__id},clone:function i(a,d){d=d||{};var m,p;switch(r.util.type(a)){case"Object":if(p=r.util.objId(a),d[p])return d[p];m={},d[p]=m;for(var _ in a)a.hasOwnProperty(_)&&(m[_]=i(a[_],d));return m;case"Array":return p=r.util.objId(a),d[p]?d[p]:(m=[],d[p]=m,a.forEach(function(k,f){m[f]=i(k,d)}),m);default:return a}},getLanguage:function(i){for(;i;){var a=c.exec(i.className);if(a)return a[1].toLowerCase();i=i.parentElement}return"none"},setLanguage:function(i,a){i.className=i.className.replace(RegExp(c,"gi"),""),i.classList.add("language-"+a)},currentScript:function(){if(typeof document>"u")return null;if(document.currentScript&&document.currentScript.tagName==="SCRIPT")return document.currentScript;try{throw new Error}catch(m){var i=(/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(m.stack)||[])[1];if(i){var a=document.getElementsByTagName("script");for(var d in a)if(a[d].src==i)return a[d]}return null}},isActive:function(i,a,d){for(var m="no-"+a;i;){var p=i.classList;if(p.contains(a))return!0;if(p.contains(m))return!1;i=i.parentElement}return!!d}},languages:{plain:u,plaintext:u,text:u,txt:u,extend:function(i,a){var d=r.util.clone(r.languages[i]);for(var m in a)d[m]=a[m];return d},insertBefore:function(i,a,d,m){m=m||r.languages;var p=m[i],_={};for(var k in p)if(p.hasOwnProperty(k)){if(k==a)for(var f in d)d.hasOwnProperty(f)&&(_[f]=d[f]);d.hasOwnProperty(k)||(_[k]=p[k])}var C=m[i];return m[i]=_,r.languages.DFS(r.languages,function(M,K){K===C&&M!=i&&(this[M]=_)}),_},DFS:function i(a,d,m,p){p=p||{};var _=r.util.objId;for(var k in a)if(a.hasOwnProperty(k)){d.call(a,k,a[k],m||k);var f=a[k],C=r.util.type(f);C==="Object"&&!p[_(f)]?(p[_(f)]=!0,i(f,d,null,p)):C==="Array"&&!p[_(f)]&&(p[_(f)]=!0,i(f,d,k,p))}}},plugins:{},highlightAll:function(i,a){r.highlightAllUnder(document,i,a)},highlightAllUnder:function(i,a,d){var m={callback:d,container:i,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};r.hooks.run("before-highlightall",m),m.elements=Array.prototype.slice.apply(m.container.querySelectorAll(m.selector)),r.hooks.run("before-all-elements-highlight",m);for(var p=0,_;_=m.elements[p++];)r.highlightElement(_,a===!0,m.callback)},highlightElement:function(i,a,d){var m=r.util.getLanguage(i),p=r.languages[m];r.util.setLanguage(i,m);var _=i.parentElement;_&&_.nodeName.toLowerCase()==="pre"&&r.util.setLanguage(_,m);var k=i.textContent,f={element:i,language:m,grammar:p,code:k};function C(K){f.highlightedCode=K,r.hooks.run("before-insert",f),f.element.innerHTML=f.highlightedCode,r.hooks.run("after-highlight",f),r.hooks.run("complete",f),d&&d.call(f.element)}if(r.hooks.run("before-sanity-check",f),_=f.element.parentElement,_&&_.nodeName.toLowerCase()==="pre"&&!_.hasAttribute("tabindex")&&_.setAttribute("tabindex","0"),!f.code){r.hooks.run("complete",f),d&&d.call(f.element);return}if(r.hooks.run("before-highlight",f),!f.grammar){C(r.util.encode(f.code));return}if(a&&o.Worker){var M=new Worker(r.filename);M.onmessage=function(K){C(K.data)},M.postMessage(JSON.stringify({language:f.language,code:f.code,immediateClose:!0}))}else C(r.highlight(f.code,f.grammar,f.language))},highlight:function(i,a,d){var m={code:i,grammar:a,language:d};if(r.hooks.run("before-tokenize",m),!m.grammar)throw new Error('The language "'+m.language+'" has no grammar.');return m.tokens=r.tokenize(m.code,m.grammar),r.hooks.run("after-tokenize",m),b.stringify(r.util.encode(m.tokens),m.language)},tokenize:function(i,a){var d=a.rest;if(d){for(var m in d)a[m]=d[m];delete a.rest}var p=new E;return j(p,p.head,i),v(i,p,a,p.head,0),O(p)},hooks:{all:{},add:function(i,a){var d=r.hooks.all;d[i]=d[i]||[],d[i].push(a)},run:function(i,a){var d=r.hooks.all[i];if(!(!d||!d.length))for(var m=0,p;p=d[m++];)p(a)}},Token:b};o.Prism=r;function b(i,a,d,m){this.type=i,this.content=a,this.alias=d,this.length=(m||"").length|0}b.stringify=function i(a,d){if(typeof a=="string")return a;if(Array.isArray(a)){var m="";return a.forEach(function(C){m+=i(C,d)}),m}var p={type:a.type,content:i(a.content,d),tag:"span",classes:["token",a.type],attributes:{},language:d},_=a.alias;_&&(Array.isArray(_)?Array.prototype.push.apply(p.classes,_):p.classes.push(_)),r.hooks.run("wrap",p);var k="";for(var f in p.attributes)k+=" "+f+'="'+(p.attributes[f]||"").replace(/"/g,"&quot;")+'"';return"<"+p.tag+' class="'+p.classes.join(" ")+'"'+k+">"+p.content+"</"+p.tag+">"};function x(i,a,d,m){i.lastIndex=a;var p=i.exec(d);if(p&&m&&p[1]){var _=p[1].length;p.index+=_,p[0]=p[0].slice(_)}return p}function v(i,a,d,m,p,_){for(var k in d)if(!(!d.hasOwnProperty(k)||!d[k])){var f=d[k];f=Array.isArray(f)?f:[f];for(var C=0;C<f.length;++C){if(_&&_.cause==k+","+C)return;var M=f[C],K=M.inside,_e=!!M.lookbehind,ye=!!M.greedy,Le=M.alias;if(ye&&!M.pattern.global){var Pe=M.pattern.toString().match(/[imsuy]*$/)[0];M.pattern=RegExp(M.pattern.source,Pe+"g")}for(var xe=M.pattern||M,z=m.next,V=p;z!==a.tail&&!(_&&V>=_.reach);V+=z.value.length,z=z.next){var ee=z.value;if(a.length>i.length)return;if(!(ee instanceof b)){var ae=1,B;if(ye){if(B=x(xe,V,i,_e),!B||B.index>=i.length)break;var re=B.index,Me=B.index+B[0].length,Z=V;for(Z+=z.value.length;re>=Z;)z=z.next,Z+=z.value.length;if(Z-=z.value.length,V=Z,z.value instanceof b)continue;for(var ne=z;ne!==a.tail&&(Z<Me||typeof ne.value=="string");ne=ne.next)ae++,Z+=ne.value.length;ae--,ee=i.slice(V,Z),B.index-=V}else if(B=x(xe,0,ee,_e),!B)continue;var re=B.index,ie=B[0],le=ee.slice(0,re),be=ee.slice(re+ie.length),ce=V+ee.length;_&&ce>_.reach&&(_.reach=ce);var oe=z.prev;le&&(oe=j(a,oe,le),V+=le.length),F(a,oe,ae);var ze=new b(k,K?r.tokenize(ie,K):ie,Le,ie);if(z=j(a,oe,ze),be&&j(a,z,be),ae>1){var de={cause:k+","+C,reach:ce};v(i,a,d,z.prev,V,de),_&&de.reach>_.reach&&(_.reach=de.reach)}}}}}}function E(){var i={value:null,prev:null,next:null},a={value:null,prev:i,next:null};i.next=a,this.head=i,this.tail=a,this.length=0}function j(i,a,d){var m=a.next,p={value:d,prev:a,next:m};return a.next=p,m.prev=p,i.length++,p}function F(i,a,d){for(var m=a.next,p=0;p<d&&m!==i.tail;p++)m=m.next;a.next=m,m.prev=a,i.length-=p}function O(i){for(var a=[],d=i.head.next;d!==i.tail;)a.push(d.value),d=d.next;return a}if(!o.document)return o.addEventListener&&(r.disableWorkerMessageHandler||o.addEventListener("message",function(i){var a=JSON.parse(i.data),d=a.language,m=a.code,p=a.immediateClose;o.postMessage(r.highlight(m,r.languages[d],d)),p&&o.close()},!1)),r;var R=r.util.currentScript();R&&(r.filename=R.src,R.hasAttribute("data-manual")&&(r.manual=!0));function S(){r.manual||r.highlightAll()}if(!r.manual){var P=document.readyState;P==="loading"||P==="interactive"&&R&&R.defer?document.addEventListener("DOMContentLoaded",S):window.requestAnimationFrame?window.requestAnimationFrame(S):window.setTimeout(S,16)}return r})(n);s.exports&&(s.exports=t),typeof ve<"u"&&(ve.Prism=t),t.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\s\S])*?-->/,greedy:!0},prolog:{pattern:/<\?[\s\S]+?\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\[]*\[)[\s\S]+(?=\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|'[^']*'/,greedy:!0},punctuation:/^<!|>$|[[\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\s<>'"]+/}},cdata:{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,greedy:!0},tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},{pattern:/^(\s*)["']|["']$/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:[{pattern:/&[\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\da-f]{1,8};/i]},t.languages.markup.tag.inside["attr-value"].inside.entity=t.languages.markup.entity,t.languages.markup.doctype.inside["internal-subset"].inside=t.languages.markup,t.hooks.add("wrap",function(o){o.type==="entity"&&(o.attributes.title=o.content.replace(/&amp;/,"&"))}),Object.defineProperty(t.languages.markup.tag,"addInlined",{value:function(c,l){var u={};u["language-"+l]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:t.languages[l]},u.cdata=/^<!\[CDATA\[|\]\]>$/i;var r={"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:u}};r["language-"+l]={pattern:/[\s\S]+/,inside:t.languages[l]};var b={};b[c]={pattern:RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g,function(){return c}),"i"),lookbehind:!0,greedy:!0,inside:r},t.languages.insertBefore("markup","cdata",b)}}),Object.defineProperty(t.languages.markup.tag,"addAttribute",{value:function(o,c){t.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(/(^|["'\s])/.source+"(?:"+o+")"+/\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,"i"),lookbehind:!0,inside:{"attr-name":/^[^\s=]+/,"attr-value":{pattern:/=[\s\S]+/,inside:{value:{pattern:/(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,lookbehind:!0,alias:[c,"language-"+c],inside:t.languages[c]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}}}})}}),t.languages.html=t.languages.markup,t.languages.mathml=t.languages.markup,t.languages.svg=t.languages.markup,t.languages.xml=t.languages.extend("markup",{}),t.languages.ssml=t.languages.xml,t.languages.atom=t.languages.xml,t.languages.rss=t.languages.xml,(function(o){var c=/(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;o.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:RegExp("@[\\w-](?:"+/[^;{\s"']|\s+(?!\s)/.source+"|"+c.source+")*?"+/(?:;|(?=\s*\{))/.source),inside:{rule:/^@[\w-]+/,"selector-function-argument":{pattern:/(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\w-])(?:and|not|only|or)(?![\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\burl\\((?:"+c.source+"|"+/(?:[^\\\r\n()"']|\\[\s\S])*/.source+")\\)","i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\(|\)$/,string:{pattern:RegExp("^"+c.source+"$"),alias:"url"}}},selector:{pattern:RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|`+c.source+")*(?=\\s*\\{)"),lookbehind:!0},string:{pattern:c,greedy:!0},property:{pattern:/(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,lookbehind:!0},important:/!important\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,lookbehind:!0},punctuation:/[(){};:,]/},o.languages.css.atrule.inside.rest=o.languages.css;var l=o.languages.markup;l&&(l.tag.addInlined("style","css"),l.tag.addAttribute("style","css"))})(t),t.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,boolean:/\b(?:false|true)\b/,function:/\b\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,punctuation:/[{}[\];(),.:]/},t.languages.javascript=t.languages.extend("clike",{"class-name":[t.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\})\s*)catch\b/,lookbehind:!0},{pattern:/(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],function:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,number:{pattern:RegExp(/(^|[^\w$])/.source+"(?:"+(/NaN|Infinity/.source+"|"+/0[bB][01]+(?:_[01]+)*n?/.source+"|"+/0[oO][0-7]+(?:_[0-7]+)*n?/.source+"|"+/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source+"|"+/\d+(?:_\d+)*n/.source+"|"+/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source)+")"+/(?![\w$])/.source),lookbehind:!0},operator:/--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/}),t.languages.javascript["class-name"][0].pattern=/(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/,t.languages.insertBefore("javascript","keyword",{regex:{pattern:RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source+/\//.source+"(?:"+/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source+"|"+/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source+")"+/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source),lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\/)[\s\S]+(?=\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:t.languages.regex},"regex-delimiter":/^\/|\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,lookbehind:!0,inside:t.languages.javascript},{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,lookbehind:!0,inside:t.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,lookbehind:!0,inside:t.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,lookbehind:!0,inside:t.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),t.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:t.languages.javascript}},string:/[\s\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),t.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,lookbehind:!0,alias:"property"}}),t.languages.markup&&(t.languages.markup.tag.addInlined("script","javascript"),t.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,"javascript")),t.languages.js=t.languages.javascript,(function(){if(typeof t>"u"||typeof document>"u")return;Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector);var o="Loading…",c=function(R,S){return"✖ Error "+R+" while fetching file: "+S},l="✖ Error: File does not exist or is empty",u={js:"javascript",py:"python",rb:"ruby",ps1:"powershell",psm1:"powershell",sh:"bash",bat:"batch",h:"c",tex:"latex"},r="data-src-status",b="loading",x="loaded",v="failed",E="pre[data-src]:not(["+r+'="'+x+'"]):not(['+r+'="'+b+'"])';function j(R,S,P){var i=new XMLHttpRequest;i.open("GET",R,!0),i.onreadystatechange=function(){i.readyState==4&&(i.status<400&&i.responseText?S(i.responseText):i.status>=400?P(c(i.status,i.statusText)):P(l))},i.send(null)}function F(R){var S=/^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(R||"");if(S){var P=Number(S[1]),i=S[2],a=S[3];return i?a?[P,Number(a)]:[P,void 0]:[P,P]}}t.hooks.add("before-highlightall",function(R){R.selector+=", "+E}),t.hooks.add("before-sanity-check",function(R){var S=R.element;if(S.matches(E)){R.code="",S.setAttribute(r,b);var P=S.appendChild(document.createElement("CODE"));P.textContent=o;var i=S.getAttribute("data-src"),a=R.language;if(a==="none"){var d=(/\.(\w+)$/.exec(i)||[,"none"])[1];a=u[d]||d}t.util.setLanguage(P,a),t.util.setLanguage(S,a);var m=t.plugins.autoloader;m&&m.loadLanguages(a),j(i,function(p){S.setAttribute(r,x);var _=F(S.getAttribute("data-range"));if(_){var k=p.split(/\r\n?|\n/g),f=_[0],C=_[1]==null?k.length:_[1];f<0&&(f+=k.length),f=Math.max(0,Math.min(f-1,k.length)),C<0&&(C+=k.length),C=Math.max(0,Math.min(C,k.length)),p=k.slice(f,C).join(`
`),S.hasAttribute("data-start")||S.setAttribute("data-start",String(f+1))}P.textContent=p,t.highlightElement(P)},function(p){S.setAttribute(r,v),P.textContent=p})}}),t.plugins.fileHighlight={highlight:function(S){for(var P=(S||document).querySelectorAll(E),i=0,a;a=P[i++];)t.highlightElement(a)}};var O=!1;t.fileHighlight=function(){O||(console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead."),O=!0),t.plugins.fileHighlight.highlight.apply(this,arguments)}})()})(he)),he.exports}var Tt=kt();const me=Oe(Tt);var ke={},Te;function Nt(){return Te||(Te=1,Prism.languages.python={comment:{pattern:/(^|[^\\])#.*/,lookbehind:!0,greedy:!0},"string-interpolation":{pattern:/(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=\}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,greedy:!0},function:{pattern:/((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,lookbehind:!0},"class-name":{pattern:/(\bclass\s+)\w+/i,lookbehind:!0},decorator:{pattern:/(^[\t ]*)@\w+(?:\.\w+)*/m,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\./}},keyword:/\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,builtin:/\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,boolean:/\b(?:False|None|True)\b/,number:/\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,operator:/[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python),ke}Nt();(function(s){var n="\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b",t={pattern:/(^(["']?)\w+\2)[ \t]+\S.*/,lookbehind:!0,alias:"punctuation",inside:null},o={bash:t,environment:{pattern:RegExp("\\$"+n),alias:"constant"},variable:[{pattern:/\$?\(\([\s\S]+?\)\)/,greedy:!0,inside:{variable:[{pattern:/(^\$\(\([\s\S]+)\)\)/,lookbehind:!0},/^\$\(\(/],number:/\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,operator:/--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,punctuation:/\(\(?|\)\)?|,|;/}},{pattern:/\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,greedy:!0,inside:{variable:/^\$\(|^`|\)$|`$/}},{pattern:/\$\{[^}]+\}/,greedy:!0,inside:{operator:/:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,punctuation:/[\[\]]/,environment:{pattern:RegExp("(\\{)"+n),lookbehind:!0,alias:"constant"}}},/\$(?:\w+|[#?*!@$])/],entity:/\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/};s.languages.bash={shebang:{pattern:/^#!\s*\/.*/,alias:"important"},comment:{pattern:/(^|[^"{\\$])#.*/,lookbehind:!0},"function-name":[{pattern:/(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,lookbehind:!0,alias:"function"},{pattern:/\b[\w-]+(?=\s*\(\s*\)\s*\{)/,alias:"function"}],"for-or-select":{pattern:/(\b(?:for|select)\s+)\w+(?=\s+in\s)/,alias:"variable",lookbehind:!0},"assign-left":{pattern:/(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,inside:{environment:{pattern:RegExp("(^|[\\s;|&]|[<>]\\()"+n),lookbehind:!0,alias:"constant"}},alias:"variable",lookbehind:!0},parameter:{pattern:/(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,alias:"variable",lookbehind:!0},string:[{pattern:/((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,lookbehind:!0,greedy:!0,inside:o},{pattern:/((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,lookbehind:!0,greedy:!0,inside:{bash:t}},{pattern:/(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,lookbehind:!0,greedy:!0,inside:o},{pattern:/(^|[^$\\])'[^']*'/,lookbehind:!0,greedy:!0},{pattern:/\$'(?:[^'\\]|\\[\s\S])*'/,greedy:!0,inside:{entity:o.entity}}],environment:{pattern:RegExp("\\$?"+n),alias:"constant"},variable:o.variable,function:{pattern:/(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,lookbehind:!0},keyword:{pattern:/(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,lookbehind:!0},builtin:{pattern:/(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,lookbehind:!0,alias:"class-name"},boolean:{pattern:/(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,lookbehind:!0},"file-descriptor":{pattern:/\B&\d\b/,alias:"important"},operator:{pattern:/\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,inside:{"file-descriptor":{pattern:/^\d/,alias:"important"}}},punctuation:/\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,number:{pattern:/(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,lookbehind:!0}},t.inside=s.languages.bash;for(var c=["comment","function-name","for-or-select","assign-left","parameter","string","environment","function","keyword","builtin","boolean","file-descriptor","operator","punctuation","number"],l=o.variable[1].inside,u=0;u<c.length;u++)l[c[u]]=s.languages.bash[c[u]];s.languages.sh=s.languages.bash,s.languages.shell=s.languages.bash})(Prism);function fe({text:s,label:n="Copy",className:t="",title:o}){const[c,l]=T.useState(!1),u=async r=>{r.stopPropagation();const b=typeof s=="function"?s():s;await Ge(b)&&(l(!0),setTimeout(()=>l(!1),1400))};return e.jsx("button",{type:"button",className:`btn ${t} ${c?"is-done":""}`,onClick:u,title:o||n,children:c?"Copied ✓":n})}function X({code:s,lang:n="python",title:t,maxLines:o=30,note:c}){const l=s.replace(/\n+$/,""),u=l.split(`
`).length,r=u>o+6,[b,x]=T.useState(!r),v=T.useMemo(()=>{const E=me.languages[n]||me.languages.python;return me.highlight(l,E,n)},[l,n]);return e.jsxs("div",{className:"code",children:[e.jsxs("div",{className:"code-head",children:[e.jsx("span",{className:"code-title",children:t||(n==="bash"?"terminal":"python")}),e.jsxs("span",{className:"code-meta",children:[u," lines"]}),e.jsx(fe,{text:l+`
`,label:"Copy",className:"btn-code"})]}),c&&e.jsx("div",{className:"code-note",children:c}),e.jsx("pre",{className:`code-pre ${b?"":"is-collapsed"}`,style:b?void 0:{maxHeight:`${o*1.6}em`},children:e.jsx("code",{className:`language-${n}`,dangerouslySetInnerHTML:{__html:v}})}),r&&e.jsx("button",{type:"button",className:"code-more",onClick:()=>x(!b),children:b?"Show less":`Show all ${u} lines (Copy always copies everything)`})]})}function A({id:s,title:n,maxLines:t,note:o}){const c=$[s];return e.jsx(X,{code:c.code,title:n||c.title,maxLines:t,note:o})}function h({k:s,children:n}){const t=ge[s],o=T.useRef(null),[c,l]=T.useState(!1),[u,r]=T.useState(!1);return T.useEffect(()=>{if(!c)return;const b=o.current?.getBoundingClientRect();b&&r(b.left+320>window.innerWidth);const x=v=>!o.current?.contains(v.target)&&l(!1);return document.addEventListener("pointerdown",x),()=>document.removeEventListener("pointerdown",x)},[c]),t?e.jsxs("span",{ref:o,className:"term",tabIndex:0,onMouseEnter:()=>l(!0),onMouseLeave:()=>l(!1),onFocus:()=>l(!0),onBlur:()=>l(!1),onClick:()=>l(!0),children:[n||t[0],c&&e.jsxs("span",{className:`term-pop ${u?"is-right":""}`,role:"tooltip",children:[e.jsx("strong",{children:t[0]}),t[1]]})]}):e.jsx(e.Fragment,{children:n})}function U({type:s="tip",title:n,children:t}){const o={tip:"✓",warn:"!",info:"i",exam:"★"};return e.jsxs("div",{className:`callout callout-${s}`,children:[e.jsx("span",{className:"callout-icon","aria-hidden":"true",children:o[s]}),e.jsxs("div",{children:[n&&e.jsx("div",{className:"callout-title",children:n}),e.jsx("div",{className:"callout-body",children:t})]})]})}function I({head:s,rows:n,className:t=""}){return e.jsx("div",{className:"table-wrap",children:e.jsxs("table",{className:t,children:[s&&e.jsx("thead",{children:e.jsx("tr",{children:s.map((o,c)=>e.jsx("th",{children:o},c))})}),e.jsx("tbody",{children:n.map((o,c)=>e.jsx("tr",{children:o.map((l,u)=>e.jsx("td",{children:l},u))},c))})]})})}function Q({rows:s}){return e.jsx(I,{className:"settings",head:["Setting","What it means (plain English)","Try"],rows:s.map(([n,t,o])=>[e.jsx("code",{children:n},"n"),t,o])})}function W({rows:s}){return e.jsx(I,{className:"fns",head:["Function","What it does","Gives back"],rows:s.map(([n,t,o])=>[e.jsx("code",{children:n},"c"),t,o])})}function q({id:s,children:n}){const t=ue[s];return e.jsxs("div",{className:"recipe",children:[e.jsxs("div",{className:"recipe-top",children:[e.jsxs("div",{children:[e.jsx("div",{className:"recipe-kicker",children:"Full working script · tested"}),e.jsx("div",{className:"recipe-title",children:t.title}),e.jsxs("div",{className:"recipe-sub",children:[t.blocks.length," blocks · ",_t(s)," lines · paste into one cell or download the notebook"]})]}),e.jsxs("div",{className:"recipe-actions",children:[e.jsx(fe,{text:()=>Ce(s),label:"Copy full script",className:"btn-primary"}),e.jsx("button",{type:"button",className:"btn",onClick:()=>yt(s),children:"Download .ipynb"})]})]}),e.jsx("ol",{className:"recipe-blocks",children:t.blocks.map(o=>e.jsx("li",{children:e.jsx("a",{href:D($[o].page,"block-"+o),children:$[o].title})},o))}),n&&e.jsx("div",{className:"recipe-extra",children:n})]})}function g({id:s,children:n}){const t=T.useContext(Ee);return e.jsxs("h2",{id:s,className:"h2",children:[e.jsx("a",{className:"anchor",href:D(t,s),"aria-hidden":"true",children:"#"}),n]})}function w({q:s,children:n}){return e.jsxs("div",{className:"qa",children:[e.jsx("div",{className:"qa-q",children:s}),e.jsx("div",{className:"qa-a",children:n})]})}const At={most:["Most likely","b-most"],high:["Likely","b-high"],mid:["Possible","b-mid"],low:["Unlikely","b-low"]};function Fe({level:s}){const[n,t]=At[s];return e.jsx("span",{className:`badge ${t}`,children:n})}function G({kicker:s,title:n,likely:t,children:o}){return e.jsxs("header",{className:"page-head",children:[s&&e.jsx("div",{className:"page-kicker",children:s}),e.jsxs("h1",{children:[n," ",t&&e.jsx(Fe,{level:t})]}),o&&e.jsx("p",{className:"lead",children:o})]})}function J({rows:s}){return e.jsx(I,{className:"ifs",head:["If the task says…","Do this"],rows:s})}function N({id:s,title:n,children:t}){return e.jsxs("section",{className:"block-sec",id:"block-"+s,children:[e.jsx("h3",{className:"h3",children:n||$[s].title}),t]})}const L=({to:s,sub:n,children:t})=>e.jsx("a",{href:D(s,n),children:t});function St(){const s=Y.filter(n=>n.likely);return e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:"Physical Computing · code docs",title:"Start here",children:"Every homework turned into tested copy-paste code. Find the task, copy the full script, change the settings at the top, run."}),e.jsxs(U,{type:"info",title:"How to read this site",children:["Hover (or tap) any ",e.jsx(h,{k:"epoch",children:"dotted word"})," for a plain-English meaning. Press"," ",e.jsx("kbd",{children:"⌘"})," ",e.jsx("kbd",{children:"K"})," (Mac) or ",e.jsx("kbd",{children:"Ctrl"})," ",e.jsx("kbd",{children:"K"})," to search everything: pages, functions, settings, words."]}),e.jsx(g,{id:"plan",children:"40-minute game plan"}),e.jsxs("ol",{className:"steps",children:[e.jsxs("li",{children:[e.jsx("b",{children:"0–3 min · Match the task."}),' Use the table below or the "Most likely" list. Open that page.']}),e.jsxs("li",{children:[e.jsx("b",{children:"3–6 min · Get the code."})," Click ",e.jsx("i",{children:"Copy full script"})," (paste into one Jupyter cell) or"," ",e.jsx("i",{children:"Download .ipynb"})," (cells already split). Run once with ",e.jsx("code",{children:"EPOCHS = 1"})," to check it works."]}),e.jsxs("li",{children:[e.jsx("b",{children:"6–25 min · Change the SETTINGS block, then run for real."})," Only the lines between the dashed comment lines need edits: dataset, model, epochs, head, etc."]}),e.jsxs("li",{children:[e.jsx("b",{children:"25–35 min · Results + answers."}),' Plots and metrics print automatically. Written questions? Each page ends with ready answers ("Theory answers").']}),e.jsxs("li",{children:[e.jsx("b",{children:"35–40 min · Save + submit."})," File → Save, then export as PDF/HTML if asked."]})]}),e.jsx(g,{id:"likely",children:"What will probably be asked"}),e.jsxs("p",{children:["The professor said to pre-install"," ",e.jsx("code",{children:"numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations"}),". Reading that list:"]}),e.jsx("div",{className:"cards",children:s.map((n,t)=>e.jsxs("a",{className:"card",href:D(n.id),children:[e.jsxs("div",{className:"card-top",children:[e.jsx("span",{className:"card-rank",children:t+1}),e.jsx(Fe,{level:n.likely})]}),e.jsx("div",{className:"card-title",children:n.title}),e.jsx("div",{className:"card-hw",children:n.hw}),e.jsx("div",{className:"card-why",children:n.why})]},n.id))}),e.jsx(I,{head:["Library in the list","What it points to","Page"],rows:[[e.jsx("code",{children:"torch, torchvision"}),"PyTorch CNNs and pretrained models (HW03, HW04, HW06)",e.jsx(L,{to:"transfer",children:"Transfer"})],[e.jsx("code",{children:"kaggle"}),"Downloading a Kaggle dataset: horses vs camels again, or a new one",e.jsx(L,{to:"setup",sub:"kaggle",children:"Setup"})],[e.jsx("code",{children:"scikit-learn, seaborn"}),"Train/val split, confusion matrix, precision, recall, ROC/AUC (HW06)",e.jsx(L,{to:"binary",children:"Metrics"})],[e.jsx("code",{children:"albumentations"}),"Data augmentation. No homework used it, so it is the most likely new twist",e.jsx(L,{to:"augment",children:"Augmentation"})],[e.jsx("code",{children:"tensorflow, keras"}),"Keras models: filter visualization (HW05), Keras ResNet50 (HW06 A)",e.jsx(L,{to:"keras",children:"Keras"})],[e.jsx("code",{children:"opencv-python, scikit-image, pillow"}),"Loading and processing images (HW01)",e.jsx(L,{to:"images",children:"Images"})],[e.jsx("code",{children:"pandas, tqdm, matplotlib"}),"Results tables, progress bars, plots (used everywhere)","—"],[e.jsx("code",{children:"requests"}),"Download a file/image from a URL, or call Ollama's web API without LangChain",e.jsx(L,{to:"llm",sub:"requests",children:"LLM"})],[e.jsx("code",{children:"torchaudio"}),"Part of the standard PyTorch install line; audio work is unlikely","—"],[e.jsx("span",{className:"muted",children:"not listed: langchain, ollama, faiss"}),"The LLM homeworks (HW02 B, Harness, HW07) are unlikely, but covered just in case",e.jsx(L,{to:"llm",children:"LLM"})]]}),e.jsx(g,{id:"quick",children:"If the task says… → do this"}),e.jsxs("p",{className:"muted",children:["Variables in ",e.jsx("code",{children:"CAPS"})," are in the SETTINGS block at the top of each script."]}),e.jsx(J,{rows:[["Use another Kaggle dataset",e.jsxs(e.Fragment,{children:["Change ",e.jsx("code",{children:"KAGGLE_SLUG"})," (the ",e.jsx("code",{children:"owner/name"})," part of the URL). No test folder? It is split off automatically. ",e.jsx(L,{to:"transfer",sub:"settings",children:"→"})]})],["Use VGG16 / ResNet18 / MobileNet / EfficientNet",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'MODEL_NAME = "vgg16"'}),". Layer names differ per model: ",e.jsx(L,{to:"transfer",sub:"layers",children:"see the table"}),"."]})],["Freeze everything except the last layer",e.jsx(e.Fragment,{children:e.jsx("code",{children:"freeze=True, train_layers=()"})})],["Unfreeze / fine-tune the top block",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'train_layers=("layer4",)'})," (ResNet) or ",e.jsx("code",{children:'("features.28",)'})," (VGG16)"]})],["Train the full model",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"freeze=False"})," with a small ",e.jsx("code",{children:"LR = 1e-4"})]})],["Single output + sigmoid + binary cross-entropy",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'head="sigmoid"'})," ",e.jsx(L,{to:"binary",children:"→"})]})],["Two outputs + softmax + categorical cross-entropy (one-hot)",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'head="softmax"'})," ",e.jsx(L,{to:"binary",children:"→"})]})],["Report precision / recall / specificity / F1 / AUC",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"get_metrics(y_true, y_pred, y_prob)"})," ",e.jsx(L,{to:"binary",sub:"block-metrics",children:"→"})]})],["Plot confusion matrix / ROC curve",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"plot_confusion(...)"}),", ",e.jsx("code",{children:"plot_roc(...)"})]})],["Learning curve + say if over/underfitted",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"plot_history(history)"}),", then ",e.jsx(L,{to:"binary",sub:"curves",children:"read it like this"})]})],["Validation = 20 images per class / 10% / 20%",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"VAL_SPLIT = 20"})," (int = per class) or ",e.jsx("code",{children:"0.1"})," / ",e.jsx("code",{children:"0.2"})," (fraction)"]})],["Add data augmentation",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"AUGMENT = True"})," (quick) or the albumentations block ",e.jsx(L,{to:"augment",children:"→"})]})],["Change batch size / epochs / learning rate / optimizer",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"BATCH_SIZE"}),", ",e.jsx("code",{children:"EPOCHS"}),", ",e.jsx("code",{children:"LR"}),", ",e.jsx("code",{children:'OPTIMIZER = "sgd"'})]})],["Add more conv layers",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"CHANNELS = (16, 32, 64)"})," ",e.jsx(L,{to:"cnn",children:"→"})]})],["Try other activation functions",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'ACTIVATION = "tanh"'})," (or leaky_relu, elu, gelu, sigmoid)"]})],["Use Fashion-MNIST or CIFAR-10",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'DATASET = "FashionMNIST"'})," / ",e.jsx("code",{children:'"CIFAR10"'})," (CIFAR downloads slowly: ",e.jsx(L,{to:"setup",sub:"warmup",children:"pre-download"}),")"]})],["Stop early when validation stops improving",e.jsx(e.Fragment,{children:e.jsx("code",{children:"train_model(..., patience=3)"})})],["Save / load the model",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'torch.save(model.state_dict(), "m.pt")'})," · ",e.jsx("code",{children:'model.load_state_dict(torch.load("m.pt"))'})]})],["Predict one image file",e.jsx(e.Fragment,{children:e.jsx("code",{children:'predict_image(model, "photo.jpg", eval_tf, classes)'})})],["Visualize filters of another layer/model",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"LAYERS"}),", ",e.jsx("code",{children:"MODEL_NAME"})," in the Keras filter block ",e.jsx(L,{to:"keras",children:"→"})]})],["Do it in Keras instead of PyTorch",e.jsx(L,{to:"keras",children:"Keras page"})],["Histogram / grayscale / threshold / Otsu",e.jsx(L,{to:"images",children:"Image basics"})],["More than 2 classes","Nothing to change: the class count comes from the folders; metrics switch to per-class averages"],["Compare models in a table",e.jsx(e.Fragment,{children:e.jsx("code",{children:"results_table(results)"})})],["It is too slow",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'MODEL_NAME = "resnet18"'}),", ",e.jsx("code",{children:"EPOCHS = 3"}),", ",e.jsx("code",{children:"IMG_SIZE = 160"}),"; check Device says ",e.jsx("code",{children:"mps"})]})]]}),e.jsx(g,{id:"pages",children:"All pages"}),e.jsx("div",{className:"cards cards-small",children:Y.filter(n=>n.id!=="home").map(n=>e.jsxs("a",{className:"card",href:D(n.id),children:[e.jsx("div",{className:"card-title",children:n.title}),e.jsx("div",{className:"card-hw",children:n.hw||n.group})]},n.id))})]})}const Et=`conda create -n exam python=3.12 -y
conda activate exam
pip install numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations
pip install jupyter ipykernel kagglehub
python -m ipykernel install --user --name exam --display-name "Python (exam)"
jupyter notebook`,Ct=`python3.12 -m venv ~/exam-env          # or: uv venv --python 3.12 ~/exam-env
source ~/exam-env/bin/activate
pip install numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations jupyter ipykernel kagglehub`;function It(){return e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:"Do this before the exam",title:"Setup & downloads",children:"A fresh environment with the professor's exact list, then download every dataset and model once so nothing big downloads during the 40 minutes."}),e.jsxs(U,{type:"warn",title:"Your current Anaconda base environment is broken for this",children:["In ",e.jsx("code",{children:"/opt/anaconda3"})," NumPy was upgraded to 2.x, and TensorFlow, pandas, scikit-learn and seaborn now fail to import there. Make the new environment below instead of using ",e.jsx("code",{children:"base"}),"."]}),e.jsx(g,{id:"checklist",children:"Checklist"}),e.jsxs("ol",{className:"steps",children:[e.jsxs("li",{children:[e.jsx("b",{children:"Create the environment"})," (below, ~5 min). Python 3.12 works with every package. This exact list was installed and tested."]}),e.jsxs("li",{children:[e.jsx("b",{children:"Run the check cell."})," Every line should say OK and the Device should be ",e.jsx("code",{children:"mps"}),"."]}),e.jsxs("li",{children:[e.jsx("b",{children:"Run the warm-up cell"})," once, the day before (CIFAR-10 alone can take 30+ minutes). It downloads MNIST, Fashion-MNIST, CIFAR-10, horses vs camels and the pretrained weights."]}),e.jsxs("li",{children:[e.jsx("b",{children:"Start Ollama"})," only if you want the LLM page to work (",e.jsx("code",{children:"ollama pull mistral"}),", ",e.jsx("code",{children:"ollama pull llava"}),")."]}),e.jsx("li",{children:e.jsx("b",{children:"Bookmark this site."})})]}),e.jsx(g,{id:"env",children:"Create the environment"}),e.jsx("p",{children:"Conda (what you used for the homeworks):"}),e.jsx(X,{code:Et,lang:"bash",title:"terminal"}),e.jsx("p",{children:"Or without conda:"}),e.jsx(X,{code:Ct,lang:"bash",title:"terminal"}),e.jsxs(U,{type:"tip",children:[e.jsx("code",{children:"kagglehub"}),", ",e.jsx("code",{children:"jupyter"})," and ",e.jsx("code",{children:"ipykernel"})," are not in the professor's list but the homeworks need them. Inside a notebook you can always install a missing package with"," ",e.jsx("code",{children:"%pip install name"}),", then restart the kernel."]}),e.jsxs(N,{id:"setup_check",children:[e.jsxs("p",{children:["Run first. It prints every library version and picks the fastest ",e.jsx(h,{k:"cuda",children:"device"}),"."]}),e.jsx(A,{id:"setup_check"})]}),e.jsxs(N,{id:"warmup",children:[e.jsxs("p",{children:["Pre-downloads everything into ",e.jsx("code",{children:"~/datasets"}),", ",e.jsx("code",{children:"~/.cache/torch"})," and ",e.jsx("code",{children:"~/.keras"}),". CIFAR-10 comes from a very slow university server (over 30 minutes for half the file in testing), so do this before the exam."]}),e.jsx(A,{id:"warmup"})]}),e.jsx(g,{id:"kaggle",children:"Kaggle datasets"}),e.jsxs("p",{children:["Public datasets download with no login. The ",e.jsx(h,{k:"kaggle",children:"slug"})," is the"," ",e.jsx("code",{children:"owner/name"})," part of the URL: kaggle.com/datasets/",e.jsx("b",{children:"akrsnv/horses-and-camels"}),"."]}),e.jsx(N,{id:"kaggle_download",children:e.jsx(A,{id:"kaggle_download"})}),e.jsx(I,{head:["Way","Command","Notes"],rows:[["kagglehub (Python)",e.jsx("code",{children:'kagglehub.dataset_download(slug, output_dir="dataset")'}),"Used in HW03 and HW06. Needs pip install kagglehub."],["kaggle (terminal)",e.jsx("code",{children:"!kaggle datasets download owner/name -p dataset --unzip"}),"In the exam list. Works without login for public data (tested)."],["Browser","Download button on the dataset page","Unzip into a folder named dataset next to the notebook."],["Private dataset / competition",e.jsx("code",{children:"kaggle auth login"}),"Only then is a login needed."]]}),e.jsx(g,{id:"jupyter",children:"Jupyter in 30 seconds"}),e.jsx(I,{head:["Action","How"],rows:[["Run a cell",e.jsxs(e.Fragment,{children:[e.jsx("kbd",{children:"Shift"})," + ",e.jsx("kbd",{children:"Enter"})]})],["New cell below",e.jsxs(e.Fragment,{children:[e.jsx("kbd",{children:"Esc"})," then ",e.jsx("kbd",{children:"B"})]})],["Split a big cell",e.jsxs(e.Fragment,{children:[e.jsx("kbd",{children:"Ctrl"})," + ",e.jsx("kbd",{children:"Shift"})," + ",e.jsx("kbd",{children:"-"})," at the cursor (JupyterLab)"]})],["Install a package",e.jsx("code",{children:"%pip install albumentations"})],["Run a terminal command",e.jsx("code",{children:"!ls dataset"})],["Something is weird","Kernel → Restart & Run All"],["Pick the exam environment","Kernel → Change kernel → Python (exam)"],["Export","File → Save and Export Notebook As → HTML / PDF"]]})]})}const Ft="modulepreload",Rt=function(s){return"/portfolio/"+s},Ne={},H=function(n,t,o){let c=Promise.resolve();if(t&&t.length>0){let b=function(x){return Promise.all(x.map(v=>Promise.resolve(v).then(E=>({status:"fulfilled",value:E}),E=>({status:"rejected",reason:E}))))};document.getElementsByTagName("link");const u=document.querySelector("meta[property=csp-nonce]"),r=u?.nonce||u?.getAttribute("nonce");c=b(t.map(x=>{if(x=Rt(x),x in Ne)return;Ne[x]=!0;const v=x.endsWith(".css"),E=v?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${x}"]${E}`))return;const j=document.createElement("link");if(j.rel=v?"stylesheet":Ft,v||(j.as="script"),j.crossOrigin="",j.href=x,r&&j.setAttribute("nonce",r),document.head.appendChild(j),v)return new Promise((F,O)=>{j.addEventListener("load",F),j.addEventListener("error",()=>O(new Error(`Unable to preload CSS for ${x}`)))})}))}function l(u){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=u,window.dispatchEvent(r),!r.defaultPrevented)throw u}return c.then(u=>{for(const r of u||[])r.status==="rejected"&&l(r.reason);return n().catch(l)})},Lt=Object.assign({"../data/notebooks/harness.json":()=>H(()=>import("./harness-D2gDt8Nh.js"),[]),"../data/notebooks/hw01a.json":()=>H(()=>import("./hw01a-vM1CjDCO.js"),[]),"../data/notebooks/hw01b.json":()=>H(()=>import("./hw01b-Bv18WpZm.js"),[]),"../data/notebooks/hw02a.json":()=>H(()=>import("./hw02a-BIS-GA3n.js"),[]),"../data/notebooks/hw02b.json":()=>H(()=>import("./hw02b-8Td0kWoZ.js"),[]),"../data/notebooks/hw03a.json":()=>H(()=>import("./hw03a-COmTnCdM.js"),[]),"../data/notebooks/hw03b.json":()=>H(()=>import("./hw03b-B9C1oGjZ.js"),[]),"../data/notebooks/hw04a.json":()=>H(()=>import("./hw04a-CfS8n25x.js"),[]),"../data/notebooks/hw04b.json":()=>H(()=>import("./hw04b-COhEXOpI.js"),[]),"../data/notebooks/hw05b.json":()=>H(()=>import("./hw05b-CkSZVcZl.js"),[]),"../data/notebooks/hw06a.json":()=>H(()=>import("./hw06a-CWDvrDCg.js"),[]),"../data/notebooks/hw06b.json":()=>H(()=>import("./hw06b-C9bgzcJK.js"),[]),"../data/notebooks/hw07.json":()=>H(()=>import("./hw07-DP88za8k.js"),[]),"../data/notebooks/index.json":()=>H(()=>Promise.resolve().then(()=>xt),void 0)}),Pt=s=>Lt[`../data/notebooks/${s}.json`]().then(n=>n.default),Ae={image:"images",llm:"llm",transfer:"transfer",cnn:"cnn",keras:"keras",binary:"binary"};function pe(s){return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((t,o)=>t.startsWith("`")&&t.endsWith("`")?e.jsx("code",{children:t.slice(1,-1)},o):t.startsWith("**")&&t.endsWith("**")?e.jsx("strong",{children:t.slice(2,-2)},o):e.jsx(T.Fragment,{children:t},o))}function Mt({text:s}){const n=[];let t=[];const o=()=>{t.length&&n.push(e.jsx("ul",{children:t.map((c,l)=>e.jsx("li",{children:pe(c)},l))},n.length)),t=[]};return s.split(`
`).forEach(c=>{const l=c.trim(),u=l.match(/^(#{1,6})\s+(.*)$/);if(u){o();const r=`h${Math.min(u[1].length+2,6)}`;n.push(e.jsx(r,{className:"md-h",children:pe(u[2])},n.length))}else/^[-*•]\s+/.test(l)?t.push(l.replace(/^[-*•]\s+/,"")):l?(o(),n.push(e.jsx("p",{children:pe(l)},n.length))):o()}),o(),e.jsx("div",{className:"md",children:n})}function te({topic:s}){const n=se.filter(t=>t.topic===s);return n.length?e.jsxs(e.Fragment,{children:[e.jsx(g,{id:"originals",children:"Your original notebooks"}),e.jsx("p",{className:"muted",children:"Exactly as submitted, every cell copyable, downloadable as a clean .ipynb."}),e.jsx("div",{className:"cards cards-small",children:n.map(t=>e.jsxs("a",{className:"card",href:D("notebooks",t.id),children:[e.jsx("div",{className:"card-title",children:t.title}),e.jsx("div",{className:"card-why",children:t.desc}),e.jsxs("div",{className:"card-hw",children:[t.n," cells · ",t.file]})]},t.id))})]}):null}function zt({id:s}){const n=se.find(x=>x.id===s),[t,o]=T.useState(null),c=!!n;if(T.useEffect(()=>{o(null),c&&Pt(s).then(o)},[s,c]),!n)return e.jsxs("p",{children:["Notebook not found. ",e.jsx("a",{href:D("notebooks"),children:"All notebooks"})]});const l=t?t.cells.filter(x=>x.t==="code"):[],u=()=>l.map(x=>x.s).join(`

`),r=()=>Ie(n.file.replace(/\s+/g,"_"),t.cells.map(x=>({type:x.t==="md"?"md":"code",text:x.s})));let b=0;return e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:e.jsx("a",{href:D("notebooks"),children:"← All notebooks"}),title:n.title,children:n.desc}),e.jsxs("div",{className:"nb-bar",children:[e.jsxs("span",{className:"muted",children:[n.file," · ",n.n," cells",Ae[n.topic]&&e.jsxs(e.Fragment,{children:[" · cleaned-up version on the ",e.jsx("a",{href:D(Ae[n.topic]),children:"topic page"})]})]}),e.jsxs("span",{className:"nb-actions",children:[t&&e.jsx(fe,{text:u,label:`Copy all ${l.length} code cells`,className:"btn-primary"}),t&&e.jsx("button",{type:"button",className:"btn",onClick:r,children:"Download .ipynb"})]})]}),!t&&e.jsx("p",{className:"muted",children:"Loading…"}),t&&t.cells.map((x,v)=>x.t==="md"?e.jsx(Mt,{text:x.s},v):e.jsxs("div",{className:"nb-cell",children:[e.jsx(X,{code:x.s,title:`In [${++b}]`,maxLines:40}),(x.o||x.fig)&&e.jsxs("div",{className:"nb-out",children:[x.o&&e.jsx("pre",{children:x.o}),x.fig&&e.jsx("div",{className:"nb-fig",children:"[plot / image output]"})]})]},v))]})}function Ot({sub:s}){return s?e.jsx(zt,{id:s}):e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:"Reference",title:"Original notebooks",children:"Your homework notebooks exactly as submitted (outputs shortened, plots marked). Use these when you want the original code line for line; use the topic pages for the cleaned-up, plug-and-play versions."}),e.jsxs(U,{type:"tip",children:["Each notebook can be downloaded as a clean ",e.jsx("code",{children:".ipynb"})," (no outputs) and run again."]}),e.jsx("div",{className:"nb-list",children:se.map(n=>e.jsxs("a",{className:"nb-row",href:D("notebooks",n.id),children:[e.jsx("span",{className:"nb-title",children:n.title}),e.jsx("span",{className:"nb-desc",children:n.desc}),e.jsxs("span",{className:"nb-n",children:[n.n," cells"]})]},n.id))})]})}function Dt(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW03 · horses vs camels",title:"Transfer learning",likely:"most",children:["Take a ",e.jsx(h,{k:"pretrained",children:"pretrained"})," ResNet50, swap its last layer for your classes,"," ",e.jsx(h,{k:"freeze",children:"freeze"})," most of it, and train the rest on a Kaggle folder dataset."]}),e.jsx(q,{id:"transfer"}),e.jsx(g,{id:"settings",children:"Settings (top of the last block)"}),e.jsx(Q,{rows:[["KAGGLE_SLUG",e.jsxs(e.Fragment,{children:["Which Kaggle dataset to download (",e.jsx("code",{children:"owner/name"})," from the URL)."]}),e.jsx("code",{children:'"akrsnv/horses-and-camels"'})],["DATA_DIR","Folder the data goes into. If it already exists, nothing is downloaded.",e.jsx("code",{children:'"dataset"'})],["MODEL_NAME",e.jsxs(e.Fragment,{children:["Which pretrained ",e.jsx(h,{k:"backbone",children:"base model"}),". Smaller = faster."]}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"resnet18"'})," (fast), ",e.jsx("code",{children:'"resnet50"'}),", ",e.jsx("code",{children:'"vgg16"'})]})],["IMG_SIZE","Images are resized to this square. ImageNet models were trained at 224.","224 (160 if slow)"],["BATCH_SIZE",e.jsxs(e.Fragment,{children:["Images per weight update (",e.jsx(h,{k:"batch",children:"batch"}),")."]}),"16, 32"],["EPOCHS",e.jsxs(e.Fragment,{children:["Full passes over the training images (",e.jsx(h,{k:"epoch",children:"epochs"}),")."]}),"1 to test, 5–15 for real"],["LR",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"lr",children:"Learning rate"}),". Small, because pretrained weights are already good."]}),"1e-4 (fine-tune), 1e-3 (head only)"],["VAL_SPLIT",e.jsxs(e.Fragment,{children:["How much of train becomes the ",e.jsx(h,{k:"validation",children:"validation set"}),". A fraction, or an int = images per class."]}),"0.2, 0.1, 20"],["AUGMENT",e.jsxs(e.Fragment,{children:["Random flips/rotations/colors on training images (",e.jsx(h,{k:"augmentation",children:"augmentation"}),")."]}),"False / True"],["CONFIGS","Name → which blocks learn. Everything else stays frozen. One model is trained per entry.",e.jsx("code",{children:'{"A": ("layer4",)}'})]]}),e.jsxs(U,{type:"tip",title:"Dataset without train/test folders?",children:["Many Kaggle sets are just ",e.jsx("code",{children:"class_a/"}),", ",e.jsx("code",{children:"class_b/"}),". Then ",e.jsx("code",{children:"find_dir"})," returns ",e.jsx("code",{children:"None"}),", the whole folder is used, and ",e.jsx("code",{children:"test_split=0.2"})," carves out a ",e.jsx(h,{k:"stratified",children:"stratified"})," test set. Look inside first: ",e.jsx("code",{children:"!ls dataset"}),"."]}),e.jsx(g,{id:"layers",children:"What can be frozen (layer names)"}),e.jsxs("p",{children:[e.jsx("code",{children:"train_layers"})," takes block names. Everything not listed stays frozen; the new head always learns."]}),e.jsx(I,{head:["Model","Blocks (input → output)","Fine-tune the top"],rows:[[e.jsx("code",{children:"resnet18/50"}),e.jsx(e.Fragment,{children:e.jsx("code",{children:"conv1 bn1 layer1 layer2 layer3 layer4 fc"})}),e.jsx("code",{children:'("layer4",)'})],[e.jsx("code",{children:"vgg16"}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"features.0 … features.28"})," (13 conv layers), ",e.jsx("code",{children:"classifier"})]}),e.jsx("code",{children:'("features.24", "features.26", "features.28")'})],[e.jsx("code",{children:"mobilenet_v2"}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"features.0 … features.18"}),", ",e.jsx("code",{children:"classifier"})]}),e.jsx("code",{children:'("features.17", "features.18")'})],[e.jsx("code",{children:"efficientnet_b0"}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"features.0 … features.8"}),", ",e.jsx("code",{children:"classifier"})]}),e.jsx("code",{children:'("features.7", "features.8")'})]]}),e.jsxs("p",{className:"muted",children:[e.jsx("code",{children:"show_layers(model)"})," prints every block as Frozen / Trainable / Partly; ",e.jsx("code",{children:"count_params(model)"})," prints how many weights learn."]}),e.jsx(g,{id:"blocks",children:"Building blocks"}),e.jsxs(N,{id:"folder_data",children:[e.jsx(W,{rows:[['find_dir(root, "train")',"Finds a sub-folder by name anywhere inside (Kaggle zips nest folders).","path or None"],["get_transforms(size, imagenet, augment)",e.jsxs(e.Fragment,{children:["Resize → tensor → ImageNet ",e.jsx(h,{k:"normalize",children:"normalization"})," (+ augmentation for train)."]}),"(train_tf, eval_tf)"],["load_folder_data(train_dir, test_dir, size, batch_size, val_split, test_split, augment)","Loads the folders, makes balanced train/val/test splits, prints counts per class.","train, val, test loaders, class_names"],["show_batch(loader, class_names)","Shows 8 images with their labels (sanity check).","—"]]}),e.jsx(A,{id:"folder_data"})]}),e.jsxs(N,{id:"pretrained",children:[e.jsx(W,{rows:[["pretrained_model(name, num_classes, freeze, train_layers, head)",e.jsxs(e.Fragment,{children:["ImageNet weights + new ",e.jsx(h,{k:"classifier",children:"head"}),'. head = "logits", "sigmoid" or "softmax".']}),"model"],["show_layers(model)","Which blocks are Frozen / Trainable / Partly.","—"]]}),e.jsx(A,{id:"pretrained"})]}),e.jsx(N,{id:"train_eval",children:e.jsxs("p",{children:["Same training block as the ",e.jsx("a",{href:D("cnn","block-train_eval"),children:"CNN page"})," (one loop for every PyTorch model)."]})}),e.jsx(N,{id:"transfer_recipe",children:e.jsx(A,{id:"transfer_recipe"})}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Only train the new last layer (feature extraction)",e.jsxs("code",{children:["CONFIGS = ",'{"head only": ()}']})],["Compare 3 configurations",e.jsx(e.Fragment,{children:e.jsx("code",{children:'{"head": (), "layer4": ("layer4",), "layer3+4": ("layer3", "layer4")}'})})],["Full fine-tuning",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"pretrained_model(MODEL_NAME, len(classes), freeze=False)"})," and ",e.jsx("code",{children:"LR = 1e-5"})," to ",e.jsx("code",{children:"1e-4"})]})],["3+ classes","Nothing changes: num_classes = len(classes) from the folder names"],["Use the model's own preprocessing (as in HW03)",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"tf = models.ResNet50_Weights.DEFAULT.transforms()"}),", pass ",e.jsx("code",{children:"train_transform=tf, eval_transform=tf"})]})],["Test on a photo from the internet",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"requests.get(url).content"})," → save as ",e.jsx("code",{children:"x.jpg"})," → ",e.jsx("code",{children:'predict_image(model, "x.jpg", get_transforms()[1], classes)'})]})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsx(w,{q:"What is transfer learning?",children:"Reusing a network trained on a huge dataset (ImageNet: 1.28 M images, 1,000 classes) for a new, smaller task. Its early layers already detect edges, textures and shapes, so we only replace and train the last layer(s). It needs far less data and time than training from scratch."}),e.jsxs(w,{q:"What is fine-tuning, and how is it different from feature extraction?",children:["Feature extraction: the whole base is frozen and only the new classifier learns. Fine-tuning: also unfreeze the top blocks (e.g. ",e.jsx("code",{children:"layer4"}),") and train them together with the new head using a small learning rate, so the high-level features adapt to horses/camels."]}),e.jsx(w,{q:"Why a small learning rate?",children:"The pretrained weights are already good. Big steps would destroy what they learned on ImageNet."}),e.jsxs(w,{q:"Why freeze the early layers?",children:["Early layers learn general things (edges, colors) that are useful for any image. Freezing them keeps that knowledge, trains faster, and reduces ",e.jsx(h,{k:"overfit",children:"overfitting"})," when there are few images (here 288)."]}),e.jsx(w,{q:"How do you choose the best configuration?",children:"By validation accuracy (then validation loss, then fewer trainable parameters), never by the test set. The test set is only used once at the end for the final number. In HW03, configuration B (layer3 + layer4 + fc) won: 98.61% validation, 95.00% test."}),e.jsx(w,{q:"How do you check for overfitting?",children:"Training accuracy much higher than validation accuracy (a growing gap in the learning curve), or validation loss rising while training loss keeps falling."}),e.jsx(te,{topic:"transfer"})]})}function Ht(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW06 Part B · horses vs camels",title:"Binary metrics: BCE vs CCE",likely:"most",children:["Train ResNet50 four ways (",e.jsx(h,{k:"sigmoid",children:"sigmoid"})," + ",e.jsx(h,{k:"bce",children:"BCE"})," or"," ",e.jsx(h,{k:"softmax",children:"softmax"})," + ",e.jsx(h,{k:"cce",children:"CCE"}),", frozen or full) and report every metric."]}),e.jsx(q,{id:"binary"}),e.jsx(g,{id:"settings",children:"Settings"}),e.jsx(Q,{rows:[["MODEL_NAME","Pretrained base model.",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"resnet50"'}),", ",e.jsx("code",{children:'"resnet18"'})," (3x faster)"]})],["BATCH_SIZE","Images per update.","32"],["EPOCHS","Same for every model, so the comparison is fair. ~4 min total for 15 epochs on your Mac.","15 (3 to test)"],["LR","Learning rate, same for all models.","3e-4"],["VAL_PER_CLASS","Images per class moved from train to validation (HW06 says 20).","20"],["MODELS",e.jsxs(e.Fragment,{children:["Name → (",e.jsx("code",{children:"head"}),", ",e.jsx("code",{children:"freeze"}),'). head "sigmoid" = 1 output, "softmax" = 2 outputs with ',e.jsx(h,{k:"onehot",children:"one-hot"})," labels. freeze True = only the head learns."]}),e.jsx("code",{children:'("sigmoid", True)'})]]}),e.jsxs(U,{type:"info",title:"How the loss is chosen",children:[e.jsx("code",{children:'pretrained_model(..., head="sigmoid")'})," puts ",e.jsx("code",{children:"Linear(2048, 1) + Sigmoid"})," on top and"," ",e.jsx("code",{children:"train_model"})," uses binary cross-entropy. ",e.jsx("code",{children:'head="softmax"'})," puts"," ",e.jsx("code",{children:"Linear(2048, 2) + Softmax"})," and uses categorical cross-entropy with one-hot labels, exactly like the homework asks. Each model starts from fresh ImageNet weights."]}),e.jsxs(N,{id:"metrics",children:[e.jsx(W,{rows:[["get_metrics(y_true, y_pred, y_prob)","Prints TP/TN/FP/FN, accuracy, precision, sensitivity, specificity, F1, AUC. 3+ classes: macro averages + per-class report.","dict"],["plot_confusion(y_true, y_pred, class_names)",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"confusion",children:"Confusion matrix"})," heatmap (seaborn)."]}),"matrix"],["plot_roc(y_true, y_prob)",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"roc",children:"ROC curve"})," with the ",e.jsx(h,{k:"auc",children:"AUC"})," in the legend."]}),"AUC"],["show_mistakes(y_true, y_pred, class_names)",'"camel predicted as horse: 3"',"—"],["show_predictions(model, loader, class_names)","Test images with predicted vs actual label (red = wrong).","—"],["results_table(results)","{model name: metrics} → one table, best first.","DataFrame"]]}),e.jsxs("p",{children:["The inputs come from ",e.jsx("code",{children:"r = evaluate(model, test_loader)"}),": ",e.jsx("code",{children:'r["y_true"]'}),", ",e.jsx("code",{children:'r["y_pred"]'}),","," ",e.jsx("code",{children:'r["y_prob"]'})," (probability of class 1)."]}),e.jsx(A,{id:"metrics"})]}),e.jsx(N,{id:"binary_recipe",children:e.jsx(A,{id:"binary_recipe"})}),e.jsx(g,{id:"formulas",children:"Metric cheat sheet"}),e.jsxs("p",{children:["Folders are sorted alphabetically: ",e.jsx("b",{children:"camel = 0 (negative)"}),", ",e.jsx("b",{children:"horse = 1 (positive)"}),"."]}),e.jsx(I,{head:["","Predicted camel","Predicted horse"],rows:[[e.jsx("b",{children:"Actual camel"}),"TN (true negative)","FP (false positive, false alarm)"],[e.jsx("b",{children:"Actual horse"}),"FN (false negative, a miss)","TP (true positive)"]]}),e.jsx(I,{head:["Metric","Formula","Plain English"],rows:[[e.jsx(h,{k:"accuracy",children:"Accuracy"}),e.jsx("code",{children:"(TP + TN) / all"}),"How many predictions were right."],[e.jsx(h,{k:"precision",children:"Precision"}),e.jsx("code",{children:"TP / (TP + FP)"}),"When it says horse, how often is it a horse?"],[e.jsx(h,{k:"recall",children:"Sensitivity (recall)"}),e.jsx("code",{children:"TP / (TP + FN)"}),"Of all horses, how many did it find?"],[e.jsx(h,{k:"specificity",children:"Specificity"}),e.jsx("code",{children:"TN / (TN + FP)"}),"Of all camels, how many did it call camel?"],[e.jsx(h,{k:"f1",children:"F1"}),e.jsx("code",{children:"2·TP / (2·TP + FP + FN)"}),"Balance of precision and recall."],[e.jsx(h,{k:"auc",children:"AUC"}),"area under ROC","1 = perfect ranking, 0.5 = guessing."]]}),e.jsx(g,{id:"curves",children:"Reading a learning curve"}),e.jsx(I,{head:["What you see","Verdict","Say this"],rows:[["Train and validation loss both still falling at the last epoch",e.jsx(h,{k:"underfit",children:"Underfitted"}),"Not converged yet; more epochs (or a higher learning rate) would help."],["Train loss near 0, validation loss rising or jumping",e.jsx(h,{k:"overfit",children:"Overfitted"}),"It memorizes the training images; use augmentation, fewer epochs, freeze more, or early stopping."],["Both flatten out low and close together","Well-trained",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"convergence",children:"Converged"})," with a small train-validation gap."]})],["Validation curve zig-zags","Unstable","Learning rate too high or too few validation images (each image = 2.5% of 40)."]]}),e.jsx(g,{id:"compare",children:"Comparison paragraph (your HW06 results)"}),e.jsx(I,{head:["Model","Accuracy","Precision","Sensitivity","Specificity","AUC"],rows:[["BCE frozen","0.950","0.909","1.000","0.900","1.000"],["CCE frozen","0.975","0.952","1.000","0.950","1.000"],["BCE full","0.900","0.833","1.000","0.800","0.983"],["CCE full","0.950","0.950","0.950","0.950","0.997"]]}),e.jsx(w,{q:"BCE vs CCE (frozen, only the classifier trains)",children:"Both trained smoothly and stayed close (stable, no overfitting). CCE converged faster: its loss was lower at every epoch (validation 0.15 vs 0.32 at epoch 15) and it was slightly better on test (0.975 vs 0.95). For two classes the math is almost the same; with softmax both output weights update together, so with the same learning rate the prediction moves about twice as fast. BCE mostly needed more epochs."}),e.jsx(w,{q:"BCE vs CCE (full fine-tuning)",children:"Both reached almost zero training loss in 2–3 epochs (fast convergence), but validation loss jumped around (less stable) because 23.5 M weights were trained on 320 images. BCE overfitted more (0.90 accuracy, 4 camels called horses); CCE did better (0.95, AUC 0.997). A smaller learning rate or early stopping would help."}),e.jsx(w,{q:"Overall",children:"Frozen training was slower but smooth and gave the best model (CCE frozen, 0.975). Full fine-tuning was fast but unstable and overfits with little data. The test set has 40 images, so one image = 2.5%."}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Change the decision threshold (e.g. 0.3)",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'y_pred = (r["y_prob"] >= 0.3).astype(int)'})," then ",e.jsx("code",{children:'get_metrics(r["y_true"], y_pred, r["y_prob"])'})]})],["Make horse the negative class","Rename the folders so horse sorts first, or swap: y = 1 - y"],["Only two of the four models","Delete lines from MODELS"],["Report the metrics as a table",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"print(results_table(results))"})," (already at the end)"]})],["Metrics by hand with sklearn",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"precision_score, recall_score, f1_score, roc_auc_score"})," (imported in the block)"]})],["Do it in Keras",e.jsx("a",{href:"#/keras/block-keras_transfer",children:"Keras transfer block"})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsx(w,{q:"What is a confusion matrix?",children:"A table comparing true labels (rows) with predicted labels (columns). For 2 classes it holds TP, TN, FP and FN, so it shows which kind of mistakes the model makes, not just how many."}),e.jsx(w,{q:"What is accuracy and how is it measured?",children:"The fraction of all predictions that are correct: (TP + TN) / (TP + TN + FP + FN)."}),e.jsx(w,{q:"What is precision and how is it measured?",children:"Of everything predicted positive, the fraction that really is positive: TP / (TP + FP)."}),e.jsx(w,{q:"What is sensitivity and how is it measured?",children:"Also called recall or true positive rate. Of all actual positives, the fraction the model found: TP / (TP + FN)."}),e.jsx(w,{q:"What is specificity and how is it measured?",children:"Of all actual negatives, the fraction correctly predicted negative: TN / (TN + FP)."}),e.jsx(w,{q:"What is an ROC curve and how is it computed?",children:"It plots the true positive rate (sensitivity) against the false positive rate (1 − specificity). Take the predicted probabilities, try every threshold from 1 down to 0, and compute TPR and FPR at each one; every threshold is one point. The area under it (AUC) is 1 for a perfect model and 0.5 for random guessing."}),e.jsx(w,{q:"When to use softmax vs sigmoid in the last layer?",children:"Softmax when each input belongs to exactly one of several classes (outputs add up to 1). Sigmoid for binary problems with one output, or multi-label problems where an input can have several classes at once. For two classes both give the same answer; one sigmoid output is simpler."}),e.jsx(te,{topic:"binary"})]})}function Gt(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW04 · MNIST",title:"CNN from scratch",likely:"high",children:["Build a small ",e.jsx(h,{k:"cnn",children:"CNN"})," in PyTorch, train it on ",e.jsx(h,{k:"mnist",children:"MNIST"})," (or Fashion-MNIST / CIFAR-10), then compare more layers, batch sizes and activations."]}),e.jsx(q,{id:"cnn"}),e.jsx(q,{id:"cnn_exp"}),e.jsx(g,{id:"settings",children:"Settings"}),e.jsx(Q,{rows:[["DATASET","Which built-in dataset. Downloads automatically into ~/datasets.",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"MNIST"'}),", ",e.jsx("code",{children:'"FashionMNIST"'}),", ",e.jsx("code",{children:'"CIFAR10"'})]})],["VAL_FRACTION",e.jsxs(e.Fragment,{children:["Part of the 60,000 training images held out as ",e.jsx(h,{k:"validation",children:"validation"}),". HW04 B: 10%."]}),"0.1"],["BATCH_SIZE",e.jsxs(e.Fragment,{children:["Images per weight update (",e.jsx(h,{k:"batch",children:"batch"}),"). HW04 B: 32."]}),"32, 64, 128, 256"],["EPOCHS",e.jsxs(e.Fragment,{children:["Full passes over the training data (",e.jsx(h,{k:"epoch",children:"epochs"}),"). HW04 B: 10."]}),"10 (1 to test)"],["LR",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"lr",children:"Learning rate"}),"."]}),"0.001"],["OPTIMIZER",e.jsxs(e.Fragment,{children:["Weight-update rule (",e.jsx(h,{k:"optimizer",children:"optimizer"}),"). HW04 B: Adam."]}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"adam"'}),", ",e.jsx("code",{children:'"sgd"'})]})],["DROPOUT",e.jsxs(e.Fragment,{children:["Fraction of neurons switched off while training (",e.jsx(h,{k:"dropout",children:"dropout"}),"). HW04 B: 0.5."]}),"0.25, 0.5"],["ACTIVATION",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"activation",children:"Activation function"})," after each conv layer. HW04 B: relu."]}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"relu"'}),", ",e.jsx("code",{children:'"tanh"'}),", ",e.jsx("code",{children:'"leaky_relu"'}),", ",e.jsx("code",{children:'"elu"'}),", ",e.jsx("code",{children:'"gelu"'}),", ",e.jsx("code",{children:'"sigmoid"'})]})],["CHANNELS",e.jsxs(e.Fragment,{children:["One number per ",e.jsx(h,{k:"conv",children:"conv layer"})," = how many ",e.jsx(h,{k:"filter",children:"filters"})," it has."]}),e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"(16,)"})," 1 layer, ",e.jsx("code",{children:"(16, 32)"})," 2, ",e.jsx("code",{children:"(16, 32, 64)"})," 3"]})]]}),e.jsxs(U,{type:"tip",title:"Want the exact homework model?",children:["Swap the ",e.jsx("code",{children:"make_cnn(...)"})," line for ",e.jsx("code",{children:"BaseCNN(...)"})," (Part A: Conv → MaxPool → Flatten → Dropout → FC) or"," ",e.jsx("code",{children:"DeepCNN(...)"})," (Part B: two conv layers). Both are in the CNN models block."]}),e.jsx(g,{id:"shapes",children:"Shape math (why 16 × 13 × 13)"}),e.jsxs("p",{children:["Conv output size = ",e.jsx("code",{children:"(input − kernel + 2·padding) / stride + 1"}),". A 2×2"," ",e.jsx(h,{k:"maxpool",children:"max pool"})," halves it (rounding down)."]}),e.jsx(I,{head:["Layer","BaseCNN (no padding)","DeepCNN / make_cnn (padding=1)"],rows:[["Input","1 × 28 × 28","1 × 28 × 28"],["Conv 3×3, 16 filters","16 × 26 × 26","16 × 28 × 28"],["MaxPool 2×2","16 × 13 × 13","16 × 14 × 14"],["Conv 3×3, 32 filters","—","32 × 14 × 14"],["MaxPool 2×2","—","32 × 7 × 7"],[e.jsx(h,{k:"flatten",children:"Flatten"}),"2,704 numbers","1,568 numbers"],[e.jsx(h,{k:"dense",children:"Linear"}),"2704 → 10","1568 → 10"]]}),e.jsxs("p",{className:"muted",children:[e.jsx("code",{children:"make_cnn"}),' computes the flatten size itself, so the error "mat1 and mat2 shapes cannot be multiplied" cannot happen.']}),e.jsx(g,{id:"blocks",children:"Building blocks"}),e.jsxs(N,{id:"train_eval",children:[e.jsx(W,{rows:[["set_seed(42)",e.jsxs(e.Fragment,{children:["Same ",e.jsx(h,{k:"seed",children:"randomness"})," every run."]}),"—"],["train_model(model, train_loader, val_loader, epochs, lr, optimizer, patience)","Trains, checks validation every epoch, keeps the best epoch's weights. patience = early stopping.","history dict"],["evaluate(model, loader)","Loss + accuracy + all predictions, no learning.","dict: loss, accuracy, y_true, y_pred, y_prob"],["plot_history(history, title)",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"curve",children:"Learning curves"}),": loss and accuracy, train vs validation."]}),"—"],["predict_image(model, path, transform, class_names)","Classifies one image file.","(label, confidence)"],["count_params(model)",e.jsxs(e.Fragment,{children:["Total and trainable ",e.jsx(h,{k:"params",children:"parameters"}),"."]}),"(total, trainable)"]]}),e.jsxs("p",{children:["The loss is picked automatically: 1 output → binary cross-entropy, several outputs → cross-entropy. Runs on the"," ",e.jsx(h,{k:"cuda",children:"Apple GPU (mps)"})," when available."]}),e.jsx(A,{id:"train_eval"})]}),e.jsxs(N,{id:"data_builtin",children:[e.jsx(W,{rows:[["load_builtin(name, val_fraction, batch_size)","Downloads MNIST / FashionMNIST / CIFAR10, splits off validation.","train, val, test loaders, class_names, shape (C, H, W)"]]}),e.jsx(A,{id:"data_builtin"})]}),e.jsxs(N,{id:"cnn_models",children:[e.jsx(W,{rows:[["BaseCNN(in_channels, num_classes, img_size)","HW04 Part A model exactly.","model"],["DeepCNN(in_channels, num_classes, img_size)","HW04 Part B deeper model exactly.","model"],["make_cnn(in_channels, num_classes, img_size, channels, activation, dropout, hidden, batchnorm)",e.jsxs(e.Fragment,{children:["Any depth from settings. ",e.jsx("code",{children:"batchnorm=True"})," adds ",e.jsx(h,{k:"batchnorm",children:"batch normalization"}),"."]}),"model"]]}),e.jsx(A,{id:"cnn_models"})]}),e.jsx(N,{id:"cnn_recipe",children:e.jsx(A,{id:"cnn_recipe"})}),e.jsxs(N,{id:"cnn_experiments",children:[e.jsxs("p",{children:["Trains one fresh model per row and prints a comparison table. Add or delete rows in ",e.jsx("code",{children:"EXPERIMENTS"}),"."]}),e.jsx(A,{id:"cnn_experiments"}),e.jsx("p",{children:"Results from a test run (MNIST, 1 epoch each, Apple GPU):"}),e.jsx(I,{head:["Experiment","Test accuracy","Seconds / epoch"],rows:[["base (1 conv, batch 32, relu)","95.5%","6.3"],["2 conv layers","97.7%","6.3"],["3 conv layers","98.0%","7.0"],["batch 64","94.4%","3.3"],["batch 128","93.3%","2.6"],["batch 256","92.1%","2.1"],["tanh","93.6%","4.8"],["leaky_relu","95.3%","4.6"],["sigmoid","89.7%","4.6"]]}),e.jsx("p",{className:"muted",children:"Your full 10-epoch homework runs: base CNN 98.13%, deep CNN 99.06%."})]}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Train for 10 epochs with 10% validation, batch 32, Adam, dropout 0.5, relu","These are already the defaults"],["Report confusion matrix + test accuracy","Already printed at the end of the CNN script"],["Add a hidden fully connected layer",e.jsx("code",{children:"make_cnn(..., hidden=128)"})],["Add batch normalization",e.jsx("code",{children:"make_cnn(..., batchnorm=True)"})],["Use 5×5 filters",e.jsx("code",{children:"make_cnn(..., kernel_size=5, padding=2)"})],["Augment MNIST",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"load_builtin(..., train_transform=transforms.Compose([transforms.RandomRotation(10), transforms.ToTensor()]))"})," (no flips: a flipped 6 is not a 6)"]})],["Plot accuracy vs batch size",e.jsx("code",{children:'table["Test accuracy"].plot.bar()'})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsx(w,{q:"What is the difference between an epoch and a batch?",children:"A batch is a small group of images (e.g. 32) used for one weight update. An epoch is one full pass over all training images, i.e. many batches: 54,000 / 32 ≈ 1,688 updates per epoch."}),e.jsx(w,{q:"How does batch size affect training time and performance?",children:"Bigger batches use the GPU better, so each epoch is faster (2.1 s at 256 vs 6.3 s at 32 above), but there are fewer weight updates per epoch, so after the same number of epochs accuracy is lower (92.1% vs 95.5%) and more epochs or a higher learning rate are needed. Small batches give noisier updates, which often generalize a bit better, but they are slower and use less memory per step."}),e.jsx(w,{q:"What is the purpose of the max pooling layer?",children:"It shrinks each feature map by keeping the strongest value in each 2×2 window. That cuts computation and parameters, keeps the most important signal, and makes the network less sensitive to small shifts of the digit."}),e.jsx(w,{q:"What is the purpose of a validation set?",children:"To check the model on images it never trained on after every epoch, so you can pick the best epoch/settings and spot overfitting, without touching the test set (which must stay unseen until the final evaluation)."}),e.jsx(w,{q:"Observations: more layers, activations",children:"More conv layers increased accuracy (95.5% → 98.0% after 1 epoch; 98.13% → 99.06% after 10) because deeper layers combine edges into strokes and shapes. ReLU and Leaky ReLU learned fastest; tanh was slower; sigmoid was worst because its gradients become very small (vanishing gradients), so learning is slow."}),e.jsxs(w,{q:"What does dropout do?",children:["It randomly switches off a fraction of neurons in each training step, so the network cannot rely on any single neuron. That reduces overfitting. It is automatically turned off by ",e.jsx("code",{children:"model.eval()"})," when testing."]}),e.jsx(te,{topic:"cnn"})]})}const Bt=`# In ANY folder-dataset script (transfer / binary), replace the load_folder_data(...) call with:
train_loader, val_loader, test_loader, classes = load_folder_data(
    train_dir, test_dir, size=224,
    train_transform=Albu(albu_train(224, "medium")),   # random changes, training only
    eval_transform=Albu(albu_eval(224)))               # validation/test: resize + normalize only`,Wt=`# torchvision only (no albumentations): just switch it on
train_loader, val_loader, test_loader, classes = load_folder_data(train_dir, test_dir, augment=True)

# or write your own list:
from torchvision import transforms
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),   # random zoom/crop
    transforms.RandomHorizontalFlip(),                     # mirror left-right (p=0.5)
    transforms.RandomRotation(15),                         # rotate up to +-15 degrees
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # lighting changes
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])`,qt=`# Keras: layers that only act during model.fit()
augment = keras.Sequential([
    keras.layers.RandomFlip("horizontal"),
    keras.layers.RandomRotation(0.1),      # 0.1 = up to 10% of a full turn (36 degrees)
    keras.layers.RandomZoom(0.1),
    keras.layers.RandomContrast(0.2),
])
x = augment(inputs)                        # put right after keras.Input(...)`;function Ut(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"albumentations · not in any homework yet",title:"Data augmentation",likely:"high",children:[e.jsx(h,{k:"augmentation",children:"Augmentation"})," randomly changes each training image every epoch (flip, rotate, brighten…), so a small dataset looks bigger and the model ",e.jsx(h,{k:"overfit",children:"overfits"})," less."]}),e.jsxs(U,{type:"exam",title:"Why this page exists",children:[e.jsx(h,{k:"albumentations",children:"albumentations"}),` is in the professor's install list, but none of the homeworks used it. The likely twist: "train the horses vs camels model with augmentation and compare."`]}),e.jsx(q,{id:"augment"}),e.jsx(g,{id:"rules",children:"Three rules"}),e.jsxs("ol",{className:"steps",children:[e.jsxs("li",{children:[e.jsx("b",{children:"Only training images."})," Validation and test images are just resized + normalized, otherwise the scores are not comparable."]}),e.jsxs("li",{children:[e.jsx("b",{children:"Changes must keep the label true."}),' A flipped horse is still a horse. A flipped "6" can look like a "9": no flips for digits.']}),e.jsxs("li",{children:[e.jsx("b",{children:"Normalize and ToTensorV2 go last"})," in an albumentations pipeline."]})]}),e.jsx(g,{id:"settings",children:"Settings"}),e.jsx(Q,{rows:[["STRENGTH","How aggressive the random changes are.",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"light"'})," flip only · ",e.jsx("code",{children:'"medium"'})," + move/zoom/rotate/brightness · ",e.jsx("code",{children:'"strong"'})," + color, blur, cut-out holes"]})],["MODEL_NAME","Pretrained model (layer4 must exist, so a ResNet).",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"resnet18"'}),", ",e.jsx("code",{children:'"resnet50"'})]})],["EPOCHS","Augmented models usually need a few more epochs.","5–10"],["p (in each transform)","Probability that this change is applied to an image.","0.2–0.7"],["rotate=(-15, 15)","Random rotation range in degrees.","(-10, 10) to (-30, 30)"],["brightness_limit=0.2","Up to ±20% brighter/darker.","0.1–0.3"]]}),e.jsx(g,{id:"blocks",children:"Building blocks"}),e.jsxs(N,{id:"augment",children:[e.jsx(W,{rows:[["albu_train(size, strength)","Training pipeline: resize + random changes + normalize + tensor.","A.Compose"],["albu_eval(size)","Validation/test pipeline: resize + normalize + tensor.","A.Compose"],["Albu(pipeline)","Wrapper so an albumentations pipeline works in ImageFolder / load_folder_data / predict_image.","transform"],["show_augmented(image_path, pipeline)","One photo, 8 random versions (check they still look real).","—"]]}),e.jsx(A,{id:"augment"})]}),e.jsxs(N,{id:"augment_recipe",children:[e.jsx(A,{id:"augment_recipe"}),e.jsx("p",{className:"muted",children:"Test run (resnet18, 2 epochs): augmentation OFF 92.5% test accuracy, ON (strong) 95.0%, and the train-validation gap shrank. Expect small differences with 40 test images."})]}),e.jsx(g,{id:"plug",children:"Plug augmentation into other scripts"}),e.jsx(X,{code:Bt,title:"albumentations in the transfer / binary scripts"}),e.jsx(X,{code:Wt,title:"torchvision version"}),e.jsx(X,{code:qt,title:"Keras version"}),e.jsx(g,{id:"cheatsheet",children:"albumentations cheat sheet (version 2.x names)"}),e.jsx(I,{head:["Transform","What it does","Example"],rows:[[e.jsx("code",{children:"A.HorizontalFlip(p=0.5)"}),"Mirror left-right","almost always safe for photos"],[e.jsx("code",{children:"A.VerticalFlip(p=0.5)"}),"Upside down","only for top-down images (cells, satellite)"],[e.jsx("code",{children:"A.Rotate(limit=15)"}),"Rotate up to ±15°",""],[e.jsx("code",{children:"A.Affine(scale=(0.9, 1.1), translate_percent=(-0.05, 0.05), rotate=(-15, 15))"}),"Zoom, shift and rotate in one","replaces the old ShiftScaleRotate"],[e.jsx("code",{children:"A.RandomResizedCrop(size=(224, 224), scale=(0.8, 1.0))"}),"Random crop then resize",e.jsxs(e.Fragment,{children:["v2 uses ",e.jsx("code",{children:"size="}),", not height/width"]})],[e.jsx("code",{children:"A.RandomBrightnessContrast(0.2, 0.2)"}),"Lighting changes",""],[e.jsx("code",{children:"A.HueSaturationValue()"}),"Color shifts",""],[e.jsx("code",{children:"A.GaussianBlur(blur_limit=(3, 5))"}),"Blur",""],[e.jsx("code",{children:"A.GaussNoise(std_range=(0.02, 0.1))"}),"Grainy noise",e.jsxs(e.Fragment,{children:["v2 uses ",e.jsx("code",{children:"std_range"})]})],[e.jsx("code",{children:"A.CoarseDropout(num_holes_range=(1, 6), hole_height_range=(0.05, 0.15), hole_width_range=(0.05, 0.15))"}),"Black rectangles (forces looking at the whole object)","v2 argument names"],[e.jsx("code",{children:"A.Resize(224, 224)"}),"Fixed size","always first"],[e.jsx("code",{children:"A.Normalize()"}),"ImageNet mean/std scaling","second to last"],[e.jsx("code",{children:"ToTensorV2()"}),"numpy H×W×C → torch C×H×W","always last"]]}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Use albumentations on MNIST",e.jsxs(e.Fragment,{children:["Gray images: ",e.jsx("code",{children:"A.Compose([A.Rotate(limit=10), A.Normalize(mean=0, std=1), ToTensorV2()])"})," and convert with ",e.jsx("code",{children:"np.array(img)"})," (no ",e.jsx("code",{children:'.convert("RGB")'}),")"]})],["Show augmented images in a grid",e.jsx("code",{children:'show_augmented("dataset/train/horse/xxx.jpg", albu_train(224, "strong"))'})],["Different augmentations per experiment",e.jsxs(e.Fragment,{children:["Loop over ",e.jsx("code",{children:'["light", "medium", "strong"]'})," and call ",e.jsx("code",{children:"albu_train(224, s)"})]})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsx(w,{q:"What is data augmentation and why use it?",children:"Creating new training examples by applying random, label-preserving changes (flips, rotations, crops, color changes) to the existing images. The model sees more variety, so it learns the object instead of memorizing exact pixels: less overfitting and better accuracy on new images, especially with small datasets."}),e.jsx(w,{q:"Why not augment the validation and test sets?",children:"They must measure performance on real, unchanged images, and stay the same every epoch so results are comparable."}),e.jsx(w,{q:"What is the effect on the learning curve?",children:"Training accuracy rises more slowly (the task is harder) and the gap between training and validation shrinks. It may need a few more epochs to converge."})]})}function Vt(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW05 · HW06 Part A",title:"Keras: filters & transfer",likely:"mid",children:[e.jsx(h,{k:"keras",children:"TensorFlow/Keras"})," versions: see what ",e.jsx(h,{k:"vgg",children:"VGG16"}),"'s"," ",e.jsx(h,{k:"filter",children:"filters"})," look for, plus Keras transfer learning and a Keras CNN."]}),e.jsx(q,{id:"keras_filters"}),e.jsx(g,{id:"filters",children:"Filter visualization (HW05)"}),e.jsxs("p",{children:["Start from a gray noise image, then repeatedly change its ",e.jsx("b",{children:"pixels"})," in the direction that makes one filter fire more (",e.jsx(h,{k:"ascent",children:"gradient ascent"}),"). The final image shows the pattern that filter detects. The model's weights never change."]}),e.jsx(Q,{rows:[["MODEL_NAME","Any keras.applications model.",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"VGG16"'}),", ",e.jsx("code",{children:'"ResNet50V2"'})," (the in-class ICA), ",e.jsx("code",{children:'"VGG19"'})]})],["LAYERS","Layers to visualize. The block prints every conv layer name.",e.jsx("code",{children:'["block1_conv1", …, "block5_conv1"]'})],["N_FILTERS","Filters per layer (the first N).","8"],["IMG_SIZE","Size of the generated image.","128"],["STEPS","Gradient-ascent steps. More = clearer, slower.","30"],["STEP_SIZE",'How far the pixels move per step (the "learning rate" here).',"10.0"]]}),e.jsx(I,{head:["Homework name","Keras layer name"],rows:[["conv1_1","block1_conv1"],["conv2_1","block2_conv1"],["conv3_1","block3_conv1"],["conv4_1","block4_conv1"],["conv5_1","block5_conv1"]]}),e.jsx(N,{id:"keras_filters",children:e.jsx(A,{id:"keras_filters"})}),e.jsxs(U,{type:"tip",title:"The in-class ICA version (ResNet50V2, middle layer)",children:[e.jsx("code",{children:'MODEL_NAME = "ResNet50V2"'}),", ",e.jsx("code",{children:'LAYERS = ["conv3_block4_out"]'}),". Tested."]}),e.jsxs(N,{id:"keras_feature_maps",children:[e.jsxs("p",{children:["The other view: feed a real photo and show each filter's output (",e.jsx(h,{k:"featuremap",children:"feature map"}),"). Run after the filter block (it reuses ",e.jsx("code",{children:"model"}),")."]}),e.jsx(A,{id:"keras_feature_maps"})]}),e.jsx(g,{id:"transfer",children:"Keras transfer learning (HW06 in Keras)"}),e.jsx(q,{id:"keras_transfer"}),e.jsx(Q,{rows:[["TRAIN_DIR / TEST_DIR","Folders with one sub-folder per class.",e.jsx("code",{children:'"dataset/train"'})],["BASE","Pretrained base.",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"ResNet50"'}),", ",e.jsx("code",{children:'"VGG16"'}),", ",e.jsx("code",{children:'"MobileNetV2"'}),", ",e.jsx("code",{children:'"EfficientNetB0"'})]})],["HEAD",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'"sigmoid"'})," = Dense(1) + ",e.jsx(h,{k:"bce",children:"BCE"}),"; ",e.jsx("code",{children:'"softmax"'})," = Dense(N) + ",e.jsx(h,{k:"cce",children:"CCE"})," with one-hot labels."]}),""],["FINE_TUNE","False: base frozen. True: everything learns (learning rate is divided by 10 automatically).","False / True"],["AUGMENT","Random flip + rotation layers (training only).","True"],["EPOCHS","Early stopping (patience 3) keeps the best epoch.","10"]]}),e.jsxs(N,{id:"keras_transfer",children:[e.jsxs("p",{children:["Needs the ",e.jsx("a",{href:"#/binary/block-metrics",children:"Metrics block"})," first (for get_metrics, plot_confusion, plot_roc)."]}),e.jsx(A,{id:"keras_transfer"})]}),e.jsx(g,{id:"cnn",children:"Keras CNN from scratch (HW04 in Keras)"}),e.jsx(q,{id:"keras_cnn"}),e.jsx(N,{id:"keras_cnn",children:e.jsx(A,{id:"keras_cnn"})}),e.jsx(g,{id:"translate",children:"PyTorch ↔ Keras"}),e.jsx(I,{head:["Idea","PyTorch","Keras"],rows:[["Fully connected layer",e.jsx("code",{children:"nn.Linear(2048, 1)"}),e.jsx("code",{children:"layers.Dense(1)"})],["Freeze",e.jsx("code",{children:"p.requires_grad = False"}),e.jsx("code",{children:"base.trainable = False"})],["Train","write the loop (train_model)",e.jsx("code",{children:"model.fit(train_ds, validation_data=val_ds, epochs=10)"})],["Test",e.jsx("code",{children:"evaluate(model, loader)"}),e.jsx("code",{children:"model.evaluate(test_ds)"})],["Predict",e.jsx("code",{children:"model(x)"}),e.jsx("code",{children:"model.predict(x)"})],["Image shape","[batch, channels, height, width]","[batch, height, width, channels]"],["Load folders",e.jsx("code",{children:"datasets.ImageFolder"}),e.jsx("code",{children:"keras.utils.image_dataset_from_directory"})],["Pretrained model",e.jsx("code",{children:'models.resnet50(weights="DEFAULT")'}),e.jsx("code",{children:'keras.applications.ResNet50(weights="imagenet", include_top=False)'})],["Save",e.jsx("code",{children:'torch.save(model.state_dict(), "m.pt")'}),e.jsx("code",{children:'model.save("m.keras")'})]]}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Visualize the LAST conv of each block",e.jsx("code",{children:'LAYERS = ["block1_conv2", "block2_conv2", "block3_conv3", "block4_conv3", "block5_conv3"]'})],["16 filters instead of 8",e.jsx("code",{children:"N_FILTERS = 16"})],["Show the whole model / output shapes",e.jsx("code",{children:"model.summary()"})],["Keras ResNet50 base only (HW06 A)",e.jsx("code",{children:'keras.applications.ResNet50(weights="imagenet", include_top=False, input_shape=(224, 224, 3))'})],["Unfreeze only the last N layers",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"base.trainable = True"})," then ",e.jsx("code",{children:"for l in base.layers[:-20]: l.trainable = False"}),", recompile"]})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsx(w,{q:"What do you notice in the different filters? (HW05)",children:"Filters become more complex the deeper the layer. block1 filters are plain colors and simple edges at different angles; block2–3 combine them into textures and repeated lines; block4–5 show complicated, abstract patterns that look like parts of objects."}),e.jsx(w,{q:"What kind of information does each filter learn?",children:"Early layers: edges, colors, lines (general for any image). Middle layers: textures, curves, simple shapes. Deep layers: combinations of those, close to object parts. The network builds a hierarchy: edges/colors → textures/shapes → complex abstract features."}),e.jsx(w,{q:"How does the visualization algorithm work? (the ICA steps)",children:`1) Load a pretrained CNN without its classification top. 2) Pick a layer and build a feature extractor that outputs it. 3) Pick a filter. 4) Start from a random noise image. 5) Feed it through and take the filter's mean activation as the "loss". 6) Compute the gradient of that activation with respect to the input pixels. 7) Normalize it and add it to the image (gradient ascent). 8) Repeat ~30 times. 9) Show the image: it is the pattern that filter responds to most.`}),e.jsx(te,{topic:"keras"})]})}function $t(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW01 · HW02 Part A",title:"Image basics (OpenCV)",likely:"mid",children:["Load an image, count ",e.jsx(h,{k:"pixel",children:"pixels"}),", split color ",e.jsx(h,{k:"channel",children:"channels"}),", plot"," ",e.jsx(h,{k:"histogram",children:"histograms"}),", convert to ",e.jsx(h,{k:"grayscale",children:"grayscale"}),", and"," ",e.jsx(h,{k:"threshold",children:"threshold"}),"."]}),e.jsx(q,{id:"image"}),e.jsxs(U,{type:"warn",title:"The one trap",children:[e.jsx("code",{children:"cv2.imread"})," gives ",e.jsx(h,{k:"bgr",children:"BGR"}),", not RGB. Always convert before plotting (",e.jsx("code",{children:"load_image"})," does it for you), otherwise the cat looks blue."]}),e.jsx(g,{id:"settings",children:"Settings"}),e.jsx(Q,{rows:[["IMAGE_PATH","Image file next to the notebook.",e.jsx("code",{children:'"cat.png"'})],["T","Threshold: pixels above T turn white (255), the rest black (0).",'127; or threshold(gray, mode="otsu") to pick it automatically']]}),e.jsxs(N,{id:"image_basics",children:[e.jsx(W,{rows:[["load_image(path)","Reads the file and converts BGR → RGB.","H × W × 3 array"],["show(img, title) / show_grid(images, titles)","Display one / several images (gray detected automatically).","—"],["image_info(img)","Height, width, channels, pixel count.","dict"],["split_channels(img)","Separate R, G, B (each a 2-D gray image).","R, G, B"],["to_gray(img)","RGB → grayscale (0.299 R + 0.587 G + 0.114 B).","H × W array"],["histogram(channel) / plot_histogram(img)","Unnormalized counts for values 0..255 (one line per channel for RGB).","256 counts"],["threshold(gray, T, mode)",e.jsx(e.Fragment,{children:'mode: "binary", "inverse", "otsu" (auto T), "adaptive" (per area).'}),"0/255 image"],["resize, blur, equalize, canny_edges","Resize, Gaussian blur (odd k), histogram equalization (more contrast), edge map.","image"]]}),e.jsx(A,{id:"image_basics"})]}),e.jsxs(N,{id:"image_recipe",children:[e.jsx("p",{children:"Every HW01 task (a–g, then Part B a–b) in order, with the numbers needed for the written answers."}),e.jsx(A,{id:"image_recipe"})]}),e.jsxs(N,{id:"image_skimage",children:[e.jsx("p",{children:"scikit-image is in the install list. It reads RGB directly (no BGR problem) and works with values 0–1."}),e.jsx(A,{id:"image_skimage"})]}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Normalized histogram (percentages)",e.jsx("code",{children:"h = histogram(gray); h = h / h.sum()"})],["All 3 channel histograms in one plot",e.jsx("code",{children:"plot_histogram(img)"})],["Inverse threshold",e.jsx("code",{children:'threshold(gray, 127, mode="inverse")'})],["Automatic threshold",e.jsx("code",{children:'threshold(gray, mode="otsu")'})],["Load an image from a URL",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'import requests; open("x.jpg", "wb").write(requests.get(url).content)'})," then ",e.jsx("code",{children:'load_image("x.jpg")'})]})],["Save a result",e.jsx("code",{children:'cv2.imwrite("out.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))'})],["Crop",e.jsx("code",{children:"img[y1:y2, x1:x2]"})]]}),e.jsx(g,{id:"theory",children:"Theory answers (HW01 Part B)"}),e.jsx(w,{q:"What differences do you see in the histograms of the color channels?",children:"The three shapes are similar (same scene), but blue is shifted toward darker values (mean 86.5 vs ~94 for red and green). Red and green are brighter, so the image has a warm tone. All three peak in the dark range (~20–24)."}),e.jsx(w,{q:"Is converting to grayscale the same as isolating a color channel? Why?",children:"No. One channel keeps only red, green or blue. Grayscale combines all three with weights that match human brightness perception (0.299 R + 0.587 G + 0.114 B). Both give a 1-channel image, but with different values."}),e.jsx(w,{q:"Differences between the grayscale and thresholded histograms?",children:"The grayscale histogram is spread over all 256 values (many shades). The thresholded one has only two spikes, at 0 and 255, because every pixel became black or white. The total pixel count is the same (651,420): gray bins 0–127 add up to the black pixels (469,430) and bins 128–255 to the white ones (181,990). Thresholding throws away the shading detail."}),e.jsx(te,{topic:"image"})]})}const Kt=`pip install langchain-core langchain-ollama                     # HW02 B, Harness
pip install langchain-community langchain-huggingface sentence-transformers faiss-cpu ddgs   # + HW07
ollama pull mistral
ollama pull llava`;function Zt(){return e.jsxs(e.Fragment,{children:[e.jsxs(G,{kicker:"HW02 Part B · HW-Harness · HW07",title:"LLM & LangChain",likely:"low",children:["Local ",e.jsx(h,{k:"llm",children:"LLMs"})," through ",e.jsx(h,{k:"ollama",children:"Ollama"}),": ask questions, give the model"," ",e.jsx(h,{k:"tool",children:"tools"}),", route by ",e.jsx(h,{k:"intent",children:"intent"}),", add memory, web search and vision."]}),e.jsxs(U,{type:"info",title:"Why this is marked unlikely",children:["LangChain, Ollama and FAISS are not in the exam install list. ",e.jsx("code",{children:"requests"})," is, and it can talk to Ollama directly, so that version comes first."]}),e.jsx(g,{id:"install",children:"Install + start"}),e.jsx(X,{code:Kt,lang:"bash",title:"terminal"}),e.jsxs("p",{className:"muted",children:["Ollama must be running (open the app, or ",e.jsx("code",{children:"ollama serve"}),"). Check: ",e.jsx("code",{children:"ollama list"}),"."]}),e.jsx(g,{id:"requests",children:"No LangChain: only requests"}),e.jsxs(N,{id:"llm_requests",children:[e.jsx(W,{rows:[["ask(prompt, system, model, history)","One question → answer text.","string"],["ask_json(prompt)","Forces JSON output and returns a Python dict.","dict / list"],["ask_image(path, question)",e.jsxs(e.Fragment,{children:["Image + question to ",e.jsx(h,{k:"llava",children:"LLaVA"}),"."]}),"string"],["system_prompt()",e.jsxs(e.Fragment,{children:["A ",e.jsx(h,{k:"systemprompt",children:"system prompt"})," with today's date and time."]}),"string"]]}),e.jsx(A,{id:"llm_requests"})]}),e.jsx(g,{id:"langchain",children:"LangChain versions"}),e.jsxs(N,{id:"llm_langchain",children:[e.jsx(W,{rows:[["get_llm(model, temperature)",e.jsxs(e.Fragment,{children:["ChatOllama client. ",e.jsx(h,{k:"temperature",children:"temperature"})," 0 = repeatable."]}),"LLM"],["ask(llm, question, system, history)","Question → answer (system prompt includes the time).","string"],["parse_json(text) / ask_json(llm, prompt)","Pull JSON out of a reply.","dict / list"]]}),e.jsx(A,{id:"llm_langchain"})]}),e.jsxs(N,{id:"llm_tools",children:[e.jsxs("p",{children:["HW02 B: Mistral can't know the time. Fix: a tool. ",e.jsx("code",{children:"@tool"})," + a docstring is all it takes."]}),e.jsx(A,{id:"llm_tools"})]}),e.jsx(q,{id:"llm_harness"}),e.jsxs(N,{id:"llm_intents",children:[e.jsx("p",{children:`The original Harness notebook scored 20% because Mistral's replies ("Intent: ask_time.") never matched exactly, so everything fell back to chat. This version searches the reply for an intent name and handles "remember…" and images by rule first: 91.7% on the same test set.`}),e.jsx(A,{id:"llm_intents"})]}),e.jsx(q,{id:"llm_chatbot"}),e.jsxs(N,{id:"llm_chatbot",children:[e.jsx(W,{rows:[["ShortMemory(turns=5)","Last 5 question/answer turns (forgotten on restart).",".add, .messages, .clear"],["LongMemory(path)",e.jsxs(e.Fragment,{children:[e.jsx(h,{k:"faiss",children:"FAISS"})," vector store on disk, searched by meaning (",e.jsx(h,{k:"embedding",children:"embeddings"}),")."]}),".add, .search, .clear"],["web_search(query)","DuckDuckGo results, no API key.","[{title, url, snippet}]"],["capture_camera()","One webcam photo (macOS asks for permission).","path or None"],["chatbot(question, image_path)","Intent → tool/memory/web → answer → remember.","string"]]}),e.jsx(A,{id:"llm_chatbot"})]}),e.jsx(g,{id:"bugs",children:"Bugs in the original notebooks"}),e.jsx(I,{head:["Notebook","Problem","Fix"],rows:[["HW02 Part B, cell 9",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:"llm_with_tools"})," is used but never defined in the saved notebook."]}),e.jsx("code",{children:'llm_with_tools = ChatOllama(model="mistral").bind_tools([get_current_time])'})],["HW-Harness, Basic Tools",e.jsxs(e.Fragment,{children:[e.jsxs("code",{children:["memory = ",'{""}']})," is a set, so ",e.jsx("code",{children:"memory[key] = value"})," crashes."]}),e.jsxs("code",{children:["memory = ","{}"]})],["HW-Harness, classify_intent",'Exact-match check: any extra word → "chat" (20% accuracy).',"Use the Intent router block"]]}),e.jsx(g,{id:"ifs",children:"Variations"}),e.jsx(J,{rows:[["Use a different model",e.jsxs(e.Fragment,{children:[e.jsx("code",{children:'get_llm("qwen2.5:14b")'})," or ",e.jsx("code",{children:'MODEL = "llama3.2:1b"'})," (anything in ",e.jsx("code",{children:"ollama list"}),")"]})],["Add a new intent","Add a line to INTENTS, then an elif branch in chatbot()"],["Add a new tool",e.jsxs(e.Fragment,{children:["Write a function with ",e.jsx("code",{children:"@tool"})," and a docstring; pass it in the tools list"]})],["Remember more turns",e.jsx("code",{children:"ShortMemory(turns=10)"})],["More memories per answer",e.jsx("code",{children:"long_memory.search(question, k=5)"})]]}),e.jsx(g,{id:"theory",children:"Theory answers"}),e.jsxs(w,{q:"Why did Mistral give a wrong answer about the time? How do you fix it?",children:["An LLM only knows its training data; it has no clock or internet. Fix: give it the information. Either put the current date/time into the system prompt, or provide a tool (a function with a description of what it does, its arguments and what it returns) that the model can ask to call, e.g. ",e.jsx("code",{children:"get_current_time()"})," via LangChain tools or MCP."]}),e.jsx(w,{q:"What is intent classification and why use it?",children:"Deciding what the user wants (chat, time, save/read memory, web search, camera, image) before answering, so a router can call the right tool. Measure it like any classifier: accuracy and a confusion matrix on labeled test messages."}),e.jsx(w,{q:"Short-term vs long-term memory?",children:"Short-term: the last few turns, sent with every request, lost on restart. Long-term: facts stored as embeddings in a vector store (FAISS) on disk, searched by meaning and reloaded after a restart."}),e.jsx(w,{q:"When should the chatbot search the web?",children:`When the question needs current or changing information beyond the model's knowledge cutoff (news, prices, weather, "latest", years after the cutoff), and saved memory cannot answer it.`}),e.jsx(te,{topic:"llm"})]})}const y=({children:s})=>e.jsx("code",{children:s});function Yt(){return e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:"Reference",title:"Fix errors fast",children:"Find the error text on the left (⌘F / Ctrl+F), apply the fix on the right."}),e.jsx(g,{id:"python",children:"Python / Jupyter"}),e.jsx(I,{head:["Error","Fix"],rows:[[e.jsx(y,{children:"ModuleNotFoundError: No module named 'x'"}),e.jsxs(e.Fragment,{children:[e.jsx(y,{children:"%pip install x"})," then Kernel → Restart. Names differ: cv2 → opencv-python, sklearn → scikit-learn, skimage → scikit-image, PIL → pillow"]})],[e.jsx(y,{children:"NameError: name 'train_model' is not defined"}),"A block was not run. Run the cells top to bottom (or paste the full script)."],[e.jsx(y,{children:"numpy.core.multiarray failed to import / _ARRAY_API not found"}),"Mixed NumPy versions (your old base env). Use the new exam environment."],[e.jsx(y,{children:"FileNotFoundError"}),e.jsxs(e.Fragment,{children:["Wrong folder. Check with ",e.jsx(y,{children:"!ls"})," / ",e.jsx(y,{children:"!ls dataset"}),"; paths are relative to the notebook"]})],["Kernel dies / restarts","Out of memory: smaller BATCH_SIZE, IMG_SIZE 160, resnet18."]]}),e.jsx(g,{id:"torch",children:"PyTorch"}),e.jsx(I,{head:["Error","Fix"],rows:[[e.jsx(y,{children:"mat1 and mat2 shapes cannot be multiplied (64x3136 and 2704x10)"}),e.jsxs(e.Fragment,{children:["The Linear layer size is wrong. Use ",e.jsx(y,{children:"make_cnn"})," (computes it) or set Linear input = channels × H × W after the last pool (the first number in the message)"]})],[e.jsx(y,{children:"Expected 4-dimensional input ... got 3-dimensional"}),e.jsxs(e.Fragment,{children:["Single image: add a batch dimension with ",e.jsx(y,{children:"x.unsqueeze(0)"})]})],[e.jsx(y,{children:"Given groups=1, weight of size [16, 1, 3, 3], expected input to have 1 channels, but got 3"}),e.jsxs(e.Fragment,{children:["in_channels mismatch: use ",e.jsx(y,{children:"shape[0]"})," from load_builtin (CIFAR10 = 3, MNIST = 1)"]})],[e.jsx(y,{children:"Expected all tensors to be on the same device"}),e.jsxs(e.Fragment,{children:["Move both: ",e.jsx(y,{children:"x, y = x.to(DEVICE), y.to(DEVICE)"})," and ",e.jsx(y,{children:"model.to(DEVICE)"})]})],[e.jsx(y,{children:"Target 2 is out of bounds"}),"num_classes too small: use num_classes=len(classes)."],[e.jsx(y,{children:"Using a target size that is different to the input size"}),e.jsxs(e.Fragment,{children:["BCE with 1 output needs ",e.jsx(y,{children:"out.squeeze(1)"})," and float labels (train_model handles this)"]})],[e.jsx(y,{children:"The operator ... is not currently implemented for the MPS device"}),e.jsxs(e.Fragment,{children:["Run this first: ",e.jsx(y,{children:'import os; os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"'}),", or use ",e.jsx(y,{children:'DEVICE = "cpu"'})]})],["Accuracy stuck at 50% (2 classes)","Learning rate too high (try 1e-4) or labels wrong; check show_batch."],["Loss is nan","Learning rate too high; lower it 10x."],["Everything is trainable when it should be frozen",e.jsxs(e.Fragment,{children:["Check ",e.jsx(y,{children:"show_layers(model)"})," and ",e.jsx(y,{children:"count_params(model)"}),"; use freeze=True"]})],["Very slow",e.jsxs(e.Fragment,{children:["Device should print ",e.jsx(y,{children:"mps"}),"; use resnet18, fewer epochs, smaller IMG_SIZE"]})]]}),e.jsx(g,{id:"keras",children:"TensorFlow / Keras"}),e.jsx(I,{head:["Error","Fix"],rows:[[e.jsx(y,{children:"Input 0 of layer ... is incompatible: expected shape=(None, 224, 224, 3), found (None, 256, 256, 3)"}),e.jsxs(e.Fragment,{children:["Use the same IMG_SIZE in ",e.jsx(y,{children:"image_dataset_from_directory(image_size=...)"})," and the model"]})],[e.jsx(y,{children:"No such layer: conv1_1"}),e.jsxs(e.Fragment,{children:["Keras names are ",e.jsx(y,{children:"block1_conv1"}),"; print ",e.jsx(y,{children:"[l.name for l in model.layers]"})]})],[e.jsx(y,{children:"logits and labels must have the same shape ((None, 1) vs (None, 2))"}),e.jsxs(e.Fragment,{children:["sigmoid head needs ",e.jsx(y,{children:'label_mode="binary"'}),"; softmax head needs ",e.jsx(y,{children:'label_mode="categorical"'})]})],["Accuracy stays ~0.5 with a frozen base",e.jsxs(e.Fragment,{children:["Wrong preprocessing: use the model's own ",e.jsx(y,{children:"preprocess_input"})," (the block does)"]})]]}),e.jsx(g,{id:"data",children:"Data, Kaggle, images"}),e.jsx(I,{head:["Error","Fix"],rows:[[e.jsx(y,{children:"Couldn't find any class folder in ..."}),e.jsxs(e.Fragment,{children:["ImageFolder needs ",e.jsx(y,{children:"folder/class_name/image.jpg"}),". Point it one level deeper (use ",e.jsx(y,{children:"find_dir"}),")"]})],[e.jsx(y,{children:"AssertionError: train/test class folders differ"}),"Train and test have different class folder names; fix or merge."],["Kaggle asks to log in",e.jsxs(e.Fragment,{children:["Public data: use kagglehub or ",e.jsx(y,{children:"kaggle datasets download owner/name"}),". Private: ",e.jsx(y,{children:"kaggle auth login"})]})],["CIFAR-10 download takes forever","Its server is very slow (30+ min in testing). Run the warm-up cell before the exam, or use MNIST / FashionMNIST."],["Image looks blue",e.jsxs(e.Fragment,{children:["OpenCV is BGR: ",e.jsx(y,{children:"cv2.cvtColor(img, cv2.COLOR_BGR2RGB)"})]})],[e.jsx(y,{children:"cv2.imread returned None"}),"Wrong file name/path (OpenCV doesn't raise an error itself)."],["albumentations: unexpected keyword argument",e.jsxs(e.Fragment,{children:["Version 2 renamed things: ",e.jsx(y,{children:"RandomResizedCrop(size=(224, 224))"}),", ",e.jsx(y,{children:"GaussNoise(std_range=...)"}),", ",e.jsx(y,{children:"Affine"})," instead of ShiftScaleRotate"]})]]}),e.jsx(g,{id:"llm",children:"Ollama / LangChain"}),e.jsx(I,{head:["Error","Fix"],rows:[[e.jsx(y,{children:"Connection refused localhost:11434"}),e.jsxs(e.Fragment,{children:["Ollama is not running: open the app or ",e.jsx(y,{children:"ollama serve"})]})],[e.jsx(y,{children:'model "mistral" not found'}),e.jsx(y,{children:"ollama pull mistral"})],[e.jsx(y,{children:"does not support tools"}),"Use a tool-capable model: mistral, llama3.1, qwen2.5."],["Camera unavailable","macOS: System Settings → Privacy → Camera → allow your terminal/Jupyter app, then restart it."]]})]})}function Xt({sub:s}){const[n,t]=T.useState(""),o=Object.entries(ge).sort((l,u)=>l[1][0].localeCompare(u[1][0])),c=o.filter(([,[l,u]])=>(l+" "+u).toLowerCase().includes(n.toLowerCase()));return T.useEffect(()=>{s&&document.getElementById("g-"+s)?.classList.add("is-flash")},[s]),e.jsxs(e.Fragment,{children:[e.jsx(G,{kicker:"Reference",title:"Glossary",children:"Every technical word on this site in plain English. The same text appears when you hover a dotted word."}),e.jsx("input",{className:"filter",type:"search",placeholder:`Filter ${o.length} words…`,value:n,onChange:l=>t(l.target.value),"aria-label":"Filter glossary"}),e.jsx("dl",{className:"glossary",children:c.map(([l,[u,r]])=>e.jsxs("div",{id:"g-"+l,className:"g-item",children:[e.jsx("dt",{children:u}),e.jsx("dd",{children:r})]},l))}),!c.length&&e.jsx("p",{className:"muted",children:"No match."})]})}const Re={home:St,setup:It,transfer:Dt,binary:Ht,cnn:Gt,augment:Ut,keras:Vt,images:$t,llm:Zt,notebooks:Ot,fixes:Yt,glossary:Xt};function Se(){const[s,...n]=location.hash.replace(/^#\/?/,"").split("/");return{page:Re[s]?s:"home",sub:decodeURIComponent(n.join("/"))||""}}function Jt(s){try{return localStorage.getItem(s)}catch{return null}}function Qt(s,n){try{localStorage.setItem(s,n)}catch{}}function en(){const s=()=>window.matchMedia?.("(prefers-color-scheme: dark)").matches,[n,t]=T.useState(()=>Jt("doc-theme")||(s()?"dark":"light"));return T.useEffect(()=>{document.documentElement.dataset.theme=n},[n]),[n,()=>{const c=n==="dark"?"light":"dark";Qt("doc-theme",c),t(c)}]}function tn({open:s,onClose:n}){const[t,o]=T.useState(""),[c,l]=T.useState(0),u=T.useRef(null),r=jt(t);if(T.useEffect(()=>{s&&(o(""),l(0),setTimeout(()=>u.current?.focus(),0))},[s]),!s)return null;const b=v=>{location.hash=D(v.to[0],v.to[1]),n()},x=v=>{v.key==="ArrowDown"?(v.preventDefault(),l(E=>Math.min(E+1,r.length-1))):v.key==="ArrowUp"?(v.preventDefault(),l(E=>Math.max(E-1,0))):v.key==="Enter"&&r[c]?b(r[c]):v.key==="Escape"&&n()};return e.jsx("div",{className:"search-backdrop",onMouseDown:n,children:e.jsxs("div",{className:"search",onMouseDown:v=>v.stopPropagation(),role:"dialog","aria-label":"Search",children:[e.jsx("input",{ref:u,value:t,onChange:v=>{o(v.target.value),l(0)},onKeyDown:x,placeholder:"Search tasks, functions, settings, words…  (try: confusion, freeze, batch size)","aria-label":"Search"}),e.jsxs("div",{className:"search-results",children:[t&&!r.length&&e.jsxs("div",{className:"search-empty",children:['No results for "',t,'"']}),!t&&e.jsx("div",{className:"search-empty",children:'Type a task ("roc curve"), a function ("train_model"), a setting ("EPOCHS") or a word ("dropout").'}),r.map((v,E)=>e.jsxs("button",{type:"button",className:`search-item ${E===c?"is-active":""}`,onMouseMove:()=>E!==c&&l(E),onClick:()=>b(v),children:[e.jsx("span",{className:"search-type",children:v.type}),e.jsx("span",{className:"search-title",children:v.title}),e.jsx("span",{className:"search-sub",children:v.sub})]},E))]}),e.jsxs("div",{className:"search-foot",children:[e.jsxs("span",{children:[e.jsx("kbd",{children:"↑"})," ",e.jsx("kbd",{children:"↓"})," move"]}),e.jsxs("span",{children:[e.jsx("kbd",{children:"Enter"})," open"]}),e.jsxs("span",{children:[e.jsx("kbd",{children:"Esc"})," close"]})]})]})})}function nn({route:s}){const[n,t]=T.useState([]),[o,c]=T.useState("");return T.useEffect(()=>{const l=setTimeout(()=>{const u=[...document.querySelectorAll(".content h2[id]")];t(u.map(r=>({id:r.id,text:r.textContent.replace(/^#/,"")})))},50);return()=>clearTimeout(l)},[s.page,s.sub]),T.useEffect(()=>{if(!n.length)return;const l=()=>{let u=n[0]?.id;for(const r of n){const b=document.getElementById(r.id);b&&b.getBoundingClientRect().top<120&&(u=r.id)}c(u)};return l(),window.addEventListener("scroll",l,{passive:!0}),()=>window.removeEventListener("scroll",l)},[n]),n.length<2?e.jsx("aside",{className:"toc"}):e.jsxs("aside",{className:"toc",children:[e.jsx("div",{className:"toc-label",children:"On this page"}),n.map(l=>e.jsx("a",{href:D(s.page,l.id),className:l.id===o?"is-current":"",children:l.text},l.id))]})}function sn(){const[s,n]=T.useState(Se),[t,o]=T.useState(!1),[c,l]=T.useState(!1),[u,r]=en();T.useEffect(()=>{const j=()=>n(Se());return window.addEventListener("hashchange",j),()=>window.removeEventListener("hashchange",j)},[]),T.useEffect(()=>{l(!1);const j=Y.find(O=>O.id===s.page);document.title=`${j?.title||"Docs"} · Code Docs`;const F=setTimeout(()=>{const O=s.sub,R=O&&(document.getElementById(O)||document.getElementById("block-"+O)||document.getElementById("g-"+O));R?R.scrollIntoView({block:"start"}):window.scrollTo(0,0)},30);return()=>clearTimeout(F)},[s.page,s.sub]);const b=T.useCallback(j=>{const F=/INPUT|TEXTAREA/.test(document.activeElement?.tagName);(j.metaKey||j.ctrlKey)&&j.key.toLowerCase()==="k"?(j.preventDefault(),o(O=>!O)):j.key==="/"&&!F&&(j.preventDefault(),o(!0))},[]);T.useEffect(()=>(window.addEventListener("keydown",b),()=>window.removeEventListener("keydown",b)),[b]);const x=Re[s.page],v=[...new Set(Y.map(j=>j.group))],E=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);return e.jsxs("div",{className:`doc ${c?"nav-open":""}`,children:[e.jsxs("header",{className:"topbar",children:[e.jsx("button",{type:"button",className:"icon-btn nav-toggle",onClick:()=>l(!c),"aria-label":"Menu",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",children:e.jsx("path",{d:"M4 7h16M4 12h16M4 17h16"})})}),e.jsxs("a",{className:"brand",href:D("home"),children:[e.jsx("span",{className:"brand-mark","aria-hidden":"true",children:"{ }"}),e.jsx("span",{className:"brand-name",children:"Code Docs"}),e.jsx("span",{className:"brand-sub",children:"Physical Computing"})]}),e.jsxs("button",{type:"button",className:"search-btn",onClick:()=>o(!0),children:[e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",children:[e.jsx("circle",{cx:"11",cy:"11",r:"7"}),e.jsx("path",{d:"m20 20-3.5-3.5"})]}),e.jsx("span",{children:"Search"}),e.jsxs("kbd",{children:[E?"⌘":"Ctrl"," K"]})]}),e.jsx("button",{type:"button",className:"icon-btn",onClick:r,"aria-label":"Toggle dark mode",title:"Toggle dark mode",children:u==="dark"?e.jsxs("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"4.5"}),e.jsx("path",{d:"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"})]}):e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"})})})]}),e.jsxs("nav",{className:"sidebar","aria-label":"Pages",children:[v.map(j=>e.jsxs("div",{className:"nav-group",children:[e.jsx("div",{className:"nav-label",children:j==="Topics"?"Topics · most likely first":j}),Y.filter(F=>F.group===j).map(F=>e.jsxs("a",{href:D(F.id),className:`nav-item ${s.page===F.id?"is-active":""}`,children:[F.likely&&e.jsx("span",{className:`dot d-${F.likely}`,"aria-hidden":"true"}),e.jsx("span",{className:"nav-title",children:F.nav||F.title}),F.tag&&e.jsx("span",{className:"nav-hw",children:F.tag})]},F.id))]},j)),e.jsxs("div",{className:"nav-legend",children:[e.jsxs("span",{children:[e.jsx("i",{className:"dot d-most"})," most likely"]}),e.jsxs("span",{children:[e.jsx("i",{className:"dot d-high"})," likely"]}),e.jsxs("span",{children:[e.jsx("i",{className:"dot d-mid"})," possible"]}),e.jsxs("span",{children:[e.jsx("i",{className:"dot d-low"})," unlikely"]})]})]}),e.jsx("div",{className:"scrim",onClick:()=>l(!1)}),e.jsxs("main",{className:"content",children:[e.jsx(Ee.Provider,{value:s.page,children:e.jsx(x,{sub:s.sub},s.page+(s.page==="notebooks"?s.sub:""))}),e.jsx("footer",{className:"foot",children:"Code from the course notebooks · every script tested in the exam environment (Python 3.12, torch 2.14, TF 2.21, albumentations 2.0)"})]}),e.jsx(nn,{route:s}),e.jsx(tn,{open:t,onClose:()=>o(!1)})]})}De.createRoot(document.getElementById("root")).render(e.jsx(He.StrictMode,{children:e.jsx(sn,{})}));
