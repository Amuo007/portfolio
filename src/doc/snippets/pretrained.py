# Pretrained ImageNet model with a new last layer (transfer learning, HW03 / HW06).
from torch import nn
from torchvision import models


def pretrained_model(name="resnet50", num_classes=2, freeze=True, train_layers=(), head="logits"):
    """name: "resnet18", "resnet50", "vgg16", "mobilenet_v2", "efficientnet_b0", "densenet121", "vit_b_16"...
    freeze=True  -> only the new last layer learns, plus any blocks in train_layers, e.g. ("layer4",)
    freeze=False -> every layer learns (full fine-tuning).
    head: "logits"  -> num_classes raw scores (loss does sigmoid/softmax inside, most stable)
          "sigmoid" -> 1 output + Sigmoid  (binary cross-entropy, HW06 Model 1)
          "softmax" -> num_classes outputs + Softmax (categorical cross-entropy, HW06 Model 2)"""
    model = getattr(models, name)(weights="DEFAULT")              # DEFAULT = best ImageNet weights

    if freeze:
        for p in model.parameters():
            p.requires_grad = False
        for layer in train_layers:
            for p in model.get_submodule(layer).parameters():
                p.requires_grad = True

    def new_head(in_features):
        if head == "sigmoid":
            return nn.Sequential(nn.Linear(in_features, 1), nn.Sigmoid())
        if head == "softmax":
            return nn.Sequential(nn.Linear(in_features, num_classes), nn.Softmax(dim=1))
        return nn.Linear(in_features, num_classes)

    if hasattr(model, "fc"):                                      # ResNet family
        model.fc = new_head(model.fc.in_features)
    elif hasattr(model, "heads"):                                 # Vision Transformer
        model.heads.head = new_head(model.heads.head.in_features)
    elif isinstance(model.classifier, nn.Linear):                 # DenseNet
        model.classifier = new_head(model.classifier.in_features)
    else:                                                         # VGG, MobileNet, EfficientNet
        model.classifier[-1] = new_head(model.classifier[-1].in_features)

    model.head_type = head                                        # train_model reads this to pick the loss
    return model


def show_layers(model):
    """Top-level blocks and whether each one learns (Trainable), is locked (Frozen), or both (Partly)."""
    for name, block in model.named_children():
        params = list(block.parameters())
        if params:
            n = sum(p.numel() for p in params)
            t = sum(p.numel() for p in params if p.requires_grad)
            status = "Trainable" if t == n else ("Frozen" if t == 0 else f"Partly ({t:,} learn)")
            print(f"{name:12} {n:>12,} params  {status}")
