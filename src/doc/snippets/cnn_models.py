# CNN models. BaseCNN / DeepCNN are exactly the HW04 models. make_cnn builds any size from settings.
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
    """Build a CNN from settings. Every number in `channels` adds one block:
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
