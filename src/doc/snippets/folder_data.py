# Any image folder dataset:  folder/<class_name>/*.jpg   (horses vs camels, most Kaggle sets)
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
