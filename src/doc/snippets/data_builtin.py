# Built-in datasets (download automatically): MNIST, FashionMNIST, CIFAR10.
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
