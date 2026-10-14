const n="hw04b",e="HW04 Part B",o="MNIST: train 10 epochs, confusion matrix, deeper CNN",t="HW04-ICA – Part B.ipynb",r="cnn",a=[{t:"md",s:`# HW04-ICA – Part B
## Detecting Handwritten Digits with CNNs using PyTorch

**Name:** Amrinder Singh  
**Dataset:** MNIST`},{t:"md",s:"# Imports"},{t:"code",s:`import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt`},{t:"code",s:`transform = transforms.ToTensor()

full_train_data = datasets.MNIST(
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
)`},{t:"code",s:`train_data, val_data = random_split(
    full_train_data,
    [54000, 6000],
    generator=torch.Generator().manual_seed(42)
)

print("Training:", len(train_data))
print("Validation:", len(val_data))
print("Testing:", len(test_data))`,o:`Training: 54000
Validation: 6000
Testing: 10000`},{t:"code",s:`train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32, shuffle=False)
test_loader = DataLoader(test_data, batch_size=32, shuffle=False)`},{t:"code",s:`class BaseCNN(nn.Module):
    def __init__(self):
        super().__init__()

        self.conv = nn.Conv2d(1, 16, kernel_size=3)
        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(16 * 13 * 13, 10)

    def forward(self, x):
        x = self.conv(x)
        x = torch.relu(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        return x

model = BaseCNN()
print(model)`,o:`BaseCNN(
  (conv): Conv2d(1, 16, kernel_size=(3, 3), stride=(1, 1))
  (pool): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
  (dropout): Dropout(p=0.5, inplace=False)
  (fc): Linear(in_features=2704, out_features=10, bias=True)
)`},{t:"code",s:`criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)`},{t:"code",s:`epochs = 10

for epoch in range(epochs):

    # Training
    model.train()

    for images, labels in train_loader:
        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

    # Validation
    model.eval()

    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    val_accuracy = 100 * correct / total

    print(
        f"Epoch {epoch+1}/{epochs}, "
        f"Loss: {loss.item():.4f}, "
        f"Validation Accuracy: {val_accuracy:.2f}%"
    )`,o:`Epoch 1/10, Loss: 0.0632, Validation Accuracy: 95.97%
Epoch 2/10, Loss: 0.2651, Validation Accuracy: 96.95%
Epoch 3/10, Loss: 0.0170, Validation Accuracy: 97.45%
Epoch 4/10, Loss: 0.0823, Validation Accuracy: 97.47%
Epoch 5/10, Loss: 0.0262, Validation Accuracy: 97.70%
Epoch 6/10, Loss: 0.2602, Validation Accuracy: 97.68%
Epoch 7/10, Loss: 0.0033, Validation Accuracy: 98.13%
Epoch 8/10, Loss: 0.0128, Validation Accuracy: 98.12%
Epoch 9/10, Loss: 0.0034, Validation Accuracy: 98.05%
Epoch 10/10, Loss: 0.1176, Validation Accuracy: 98.02%`},{t:"code",s:`model.eval()

correct = 0
total = 0

all_labels = []
all_predictions = []

with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)
        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)
        correct += (predicted == labels).sum().item()

        all_labels.extend(labels.numpy())
        all_predictions.extend(predicted.numpy())

accuracy = 100 * correct / total

print(f"Base CNN Test Accuracy: {accuracy:.2f}%")`,o:"Base CNN Test Accuracy: 98.13%"},{t:"code",s:`cm = confusion_matrix(all_labels, all_predictions)

plt.figure(figsize=(8, 6))
plt.imshow(cm)
plt.colorbar()

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Base CNN Confusion Matrix")

plt.xticks(range(10))
plt.yticks(range(10))

for i in range(10):
    for j in range(10):
        plt.text(j, i, cm[i, j], ha="center", va="center")

plt.show()`,fig:!0},{t:"code",s:`class DeepCNN(nn.Module):
    def __init__(self):
        super().__init__()

        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)

        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout(0.5)

        self.fc = nn.Linear(32 * 7 * 7, 10)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = self.pool(x)

        x = torch.relu(self.conv2(x))
        x = self.pool(x)

        x = torch.flatten(x, 1)
        x = self.dropout(x)

        x = self.fc(x)

        return x

deep_model = DeepCNN()
print(deep_model)`,o:`DeepCNN(
  (conv1): Conv2d(1, 16, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
  (conv2): Conv2d(16, 32, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
  (pool): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
  (dropout): Dropout(p=0.5, inplace=False)
  (fc): Linear(in_features=1568, out_features=10, bias=True)
)`},{t:"code",s:`criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(deep_model.parameters(), lr=0.001)

epochs = 10

for epoch in range(epochs):

    deep_model.train()

    for images, labels in train_loader:
        optimizer.zero_grad()

        outputs = deep_model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

    # Validation
    deep_model.eval()

    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            outputs = deep_model(images)
            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    val_accuracy = 100 * correct / total

    print(
        f"Epoch {epoch+1}/{epochs}, "
        f"Loss: {loss.item():.4f}, "
        f"Validation Accuracy: {val_accuracy:.2f}%"
    )`,o:`Epoch 1/10, Loss: 0.1198, Validation Accuracy: 96.68%
Epoch 2/10, Loss: 0.2829, Validation Accuracy: 97.97%
Epoch 3/10, Loss: 0.0492, Validation Accuracy: 98.18%
Epoch 4/10, Loss: 0.0126, Validation Accuracy: 98.52%
Epoch 5/10, Loss: 0.0064, Validation Accuracy: 98.58%
Epoch 6/10, Loss: 0.0101, Validation Accuracy: 98.68%
Epoch 7/10, Loss: 0.1339, Validation Accuracy: 98.72%
Epoch 8/10, Loss: 0.0632, Validation Accuracy: 98.73%
Epoch 9/10, Loss: 0.0329, Validation Accuracy: 98.82%
Epoch 10/10, Loss: 0.4969, Validation Accuracy: 98.87%`},{t:"code",s:`deep_model.eval()

correct = 0
total = 0

deep_labels = []
deep_predictions = []

with torch.no_grad():
    for images, labels in test_loader:
        outputs = deep_model(images)
        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)
        correct += (predicted == labels).sum().item()

        deep_labels.extend(labels.numpy())
        deep_predictions.extend(predicted.numpy())

deep_accuracy = 100 * correct / total

print(f"Deep CNN Test Accuracy: {deep_accuracy:.2f}%")`,o:"Deep CNN Test Accuracy: 99.06%"},{t:"code",s:`cm_deep = confusion_matrix(deep_labels, deep_predictions)

plt.figure(figsize=(8, 6))
plt.imshow(cm_deep)
plt.colorbar()

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Deep CNN Confusion Matrix")

plt.xticks(range(10))
plt.yticks(range(10))

for i in range(10):
    for j in range(10):
        plt.text(j, i, cm_deep[i, j], ha="center", va="center")

plt.show()`,fig:!0}],s={id:n,title:e,desc:o,file:t,topic:"cnn",cells:a};export{a as cells,s as default,o as desc,t as file,n as id,e as title,r as topic};
