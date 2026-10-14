# Metrics and plots: confusion matrix, accuracy, precision, recall, specificity, F1, ROC/AUC.
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
        plt.title(f"P: {class_names[preds[i]]}\nA: {class_names[labels[i]]}", color="green" if ok else "red")
        plt.axis("off")
    plt.tight_layout()
    plt.show()


def results_table(results):
    """results = {"Model name": metrics_dict, ...} -> one row per model, sorted best first."""
    table = pd.DataFrame(results).T.round(4)
    return table.sort_values(table.columns[0], ascending=False)
