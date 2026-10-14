# Train the same model with and without augmentation and compare.
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
    print(f"\n========== {name}")
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
