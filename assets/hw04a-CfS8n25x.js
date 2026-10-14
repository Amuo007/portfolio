const n="hw04a",e="HW04 Part A",t="MNIST: base CNN from scratch (PyTorch)",o="HW04-ICA – Part A.ipynb",r="cnn",s=[{t:"md",s:`# HW04-ICA – Part A
## Detecting Handwritten Digits with CNNs using PyTorch

**Name:** Amrinder Singh  
**Dataset:** MNIST`},{t:"md",s:"# Imports"},{t:"code",s:`import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms`},{t:"code",s:'print("PyTorch version:", torch.__version__)',o:"PyTorch version: 2.7.0.dev20250127"},{t:"code",s:"transform = transforms.ToTensor()"},{t:"code",s:`train_data = datasets.MNIST(
    root="./data",
    train=True,
    download=True,
    transform=transform
)

test_data = datasets.MNIST(
    root="./data",
    train=False,
    download=True,
    transform=transform
)`},{t:"code",s:`train_loader = DataLoader(train_data, batch_size=64, shuffle=True)
test_loader = DataLoader(test_data, batch_size=64, shuffle=False)`},{t:"code",s:`# CNN model for classifying MNIST handwritten digits
class CNN(nn.Module):
    def __init__(self):
        super().__init__()

        # Convolution layer: 1 grayscale input channel, 16 filters, 3x3 kernel
        self.conv = nn.Conv2d(1, 16, kernel_size=3)

        # Max pooling reduces the size of the feature maps using a 2x2 window
        self.pool = nn.MaxPool2d(2)

        # Randomly disables 25% of neurons during training to reduce overfitting
        self.dropout = nn.Dropout(0.25)

        # Fully connected output layer for the 10 digit classes (0-9)
        self.fc = nn.Linear(16 * 13 * 13, 10)

    def forward(self, x):
        # Pass the images through the convolution layer
        x = self.conv(x)

        # Apply ReLU activation
        x = torch.relu(x)

        # Reduce feature map size
        x = self.pool(x)

        # Convert feature maps into one long vector
        x = torch.flatten(x, 1)

        # Apply dropout
        x = self.dropout(x)

        # Produce scores for the 10 classes
        x = self.fc(x)

        return x`},{t:"code",s:`model = CNN()

print(model)`,o:`CNN(
  (conv): Conv2d(1, 16, kernel_size=(3, 3), stride=(1, 1))
  (pool): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
  (dropout): Dropout(p=0.25, inplace=False)
  (fc): Linear(in_features=2704, out_features=10, bias=True)
)`},{t:"code",s:`criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.Adam(model.parameters(), lr=0.001)`},{t:"code",s:`epochs = 5

for epoch in range(epochs):
    model.train()

    for images, labels in train_loader:
        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch + 1}/{epochs}, Loss: {loss.item():.4f}")`,o:`Epoch 1/5, Loss: 0.2329
Epoch 2/5, Loss: 0.0566
Epoch 3/5, Loss: 0.0901
Epoch 4/5, Loss: 0.2192
Epoch 5/5, Loss: 0.0091`},{t:"code",s:`model.eval()

correct = 0
total = 0

with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)

        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)
        correct += (predicted == labels).sum().item()

accuracy = 100 * correct / total

print(f"Test Accuracy: {accuracy:.2f}%")`,o:"Test Accuracy: 98.20%"},{t:"code",s:"import matplotlib.pyplot as plt"},{t:"code",s:`images, labels = next(iter(test_loader))

outputs = model(images)
_, predicted = torch.max(outputs, 1)

fig, axes = plt.subplots(1, 5, figsize=(10, 2))

for i in range(5):
    axes[i].imshow(images[i].squeeze(), cmap="gray")
    axes[i].set_title(f"Predicted: {predicted[i].item()}\\nActual: {labels[i].item()}")
    axes[i].axis("off")

plt.show()`,fig:!0}],a={id:n,title:e,desc:t,file:o,topic:"cnn",cells:s};export{s as cells,a as default,t as desc,o as file,n as id,e as title,r as topic};
