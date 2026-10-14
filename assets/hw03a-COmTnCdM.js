const a="hw03a",e="HW03 Part A",t="Horses vs camels input pipeline (PyTorch)",s="HW03-Report-PartA-Amrinder-Singh.ipynb",n="transfer",i=[{t:"code",s:"%pip install kagglehub",o:`Requirement already satisfied: kagglehub in /opt/anaconda3/lib/python3.11/site-packages (1.0.2)
Requirement already satisfied: kagglesdk<1.0,>=0.1.22 in /opt/anaconda3/lib/python3.11/site-packages (from kagglehub) (0.1.37)
Requirement already satisfied: packaging in /opt/anaconda3/lib/python3.11/site-packages (from kagglehub) (26.3)
Requirement already satisfied: pyyaml in /opt/anaconda3/lib/python3.11/site-packages (from kagglehub) (6.0.1)
Requirement already satisfied: requests in /opt/anaconda3/lib/python3.11/site-packages (from kagglehub) (2.32.5)
Requirement already satisfied: tqdm in /opt/anaconda3/lib/python3.11/site-packages (from kagglehub) (4.67.1)
Requirement already satisfied: protobuf in /opt/anaconda3/lib/python3.11/site-packages (from kagglesdk<1.0,>=0.1.22->kagglehub) (3.20.3)
Requirement already satisfied: charset_normalizer<4,>=2 in /opt/anaconda3/lib/python3.11/site-packages (from requests->kagglehub) (2.0.4)
Requirement already satisfied: idna<4,>=2.5 in /opt/anaconda3/lib/python3.11/site-packages (from requests->kagglehub) (3.19)
Requirement already satisfied: urllib3<3,>=1.21.1 in /opt/anaconda3/lib/python3.11/site-packages (from requests->kagglehub) (2.0.7)
Requirement already satisfied: certifi>=2017.4.17 in /opt/anaconda3/lib/python3.11/site-packages (from requests->kagglehub) (2025.11.12)
Note: you may need to restart the kernel to use updated packages.`},{t:"code",s:`import kagglehub
path = kagglehub.dataset_download("akrsnv/horses-and-camels")
print("Path to dataset files:", path)`,o:"Path to dataset files: /Users/amrindersingh/.cache/kagglehub/datasets/akrsnv/horses-and-camels/versions/2"},{t:"code",s:`import torch
import os
from torchvision import datasets, transforms
from torch.utils.data import DataLoader`},{t:"code",s:`transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])`},{t:"code",s:`train_path = os.path.join(path, "train")

test_path = os.path.join(path, "test")

print(test_path)`,o:"/Users/amrindersingh/.cache/kagglehub/datasets/akrsnv/horses-and-camels/versions/2/test"},{t:"code",s:`train_dataset = datasets.ImageFolder(
    root=train_path,
    transform=transform
)`},{t:"code",s:`test_dataset = datasets.ImageFolder(
    root=test_path,
    transform=transform
)`},{t:"code",s:'print("Classes:", train_dataset.classes)',o:"Classes: ['camel', 'horse']"},{t:"code",s:`print("Training images:", len(train_dataset))
print("Testing images:", len(test_dataset))`,o:`Training images: 360
Testing images: 40`},{t:"code",s:`train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True
)
test_loader = DataLoader(
    test_dataset,
    batch_size=32,
    shuffle=False
)`},{t:"code",s:`images, labels = next(iter(train_loader))

print("Image batch shape:", images.shape)

print("Label batch shape:", labels.shape)

print("Labels:", labels)`,o:`Image batch shape: torch.Size([32, 3, 224, 224])
Label batch shape: torch.Size([32])
Labels: tensor([1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
        1, 1, 0, 0, 0, 1, 1, 1])`},{t:"code",s:"import matplotlib.pyplot as plt"},{t:"code",s:`fig, axes = plt.subplots(2, 4, figsize=(8, 4))

for i, ax in enumerate(axes.flat):
    image = images[i]

    print(f"Image {i}: {image.shape}")

    # Convert [C, H, W] -> [H, W, C] only for matplotlib
    image = image.permute(1, 2, 0)

    ax.imshow(image)
    ax.set_title(train_dataset.classes[labels[i].item()])
    ax.set_aspect("equal")
    ax.axis("off")

plt.subplots_adjust(wspace=0.3, hspace=0.3)
plt.show()`,o:`Image 0: torch.Size([3, 224, 224])
Image 1: torch.Size([3, 224, 224])
Image 2: torch.Size([3, 224, 224])
Image 3: torch.Size([3, 224, 224])
Image 4: torch.Size([3, 224, 224])
Image 5: torch.Size([3, 224, 224])
Image 6: torch.Size([3, 224, 224])
Image 7: torch.Size([3, 224, 224])`,fig:!0}],o={id:a,title:e,desc:t,file:s,topic:n,cells:i};export{i as cells,o as default,t as desc,s as file,a as id,e as title,n as topic};
