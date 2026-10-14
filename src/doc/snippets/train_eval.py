# One training loop for every PyTorch model (CNN from scratch or pretrained).
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
