# HW06: BCE + sigmoid vs CCE + softmax, frozen vs full fine-tuning, with all binary metrics.
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
    print(f"\n========== {name}")
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
