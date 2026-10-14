# HW03: transfer learning on a folder dataset + compare which layers to fine-tune.
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
    print(f"\n========== Configuration {name}")
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
print("\nSelected configuration (by validation accuracy, then fewer parameters):", best)
