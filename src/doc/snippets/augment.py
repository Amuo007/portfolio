# Data augmentation with albumentations: random changes to TRAINING images so the model
# sees more variety (less overfitting). Validation/test images are only resized + normalized.
import numpy as np
import albumentations as A
import matplotlib.pyplot as plt
from albumentations.pytorch import ToTensorV2
from PIL import Image


def albu_train(size=224, strength="medium", imagenet=True):
    """strength: "light", "medium" or "strong". Each transform runs with probability p."""
    aug = [A.HorizontalFlip(p=0.5)]
    if strength in ("medium", "strong"):
        aug += [A.Affine(scale=(0.9, 1.1), translate_percent=(-0.05, 0.05), rotate=(-15, 15), p=0.7),
                A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5)]
    if strength == "strong":
        aug += [A.HueSaturationValue(p=0.3), A.GaussianBlur(blur_limit=(3, 5), p=0.2),
                A.CoarseDropout(num_holes_range=(1, 6), hole_height_range=(0.05, 0.15),
                                hole_width_range=(0.05, 0.15), p=0.3)]
    norm = [A.Normalize()] if imagenet else [A.Normalize(mean=0, std=1)]   # ImageNet colors, or 0..1
    return A.Compose([A.Resize(size, size), *aug, *norm, ToTensorV2()])


def albu_eval(size=224, imagenet=True):
    norm = [A.Normalize()] if imagenet else [A.Normalize(mean=0, std=1)]
    return A.Compose([A.Resize(size, size), *norm, ToTensorV2()])


class Albu:
    """Lets an albumentations pipeline be used anywhere a torchvision transform is expected
    (ImageFolder, load_folder_data, predict_image)."""
    def __init__(self, pipeline):
        self.pipeline = pipeline

    def __call__(self, img):
        return self.pipeline(image=np.array(img.convert("RGB")))["image"]


def show_augmented(image_path, pipeline, n=8):
    """Same photo, n random augmentations: check the changes still look realistic."""
    img = np.array(Image.open(image_path).convert("RGB"))
    show_pipe = A.Compose([t for t in pipeline.transforms if not isinstance(t, (A.Normalize, ToTensorV2))])
    cols = 4
    plt.figure(figsize=(3 * cols, 3 * ((n + cols - 1) // cols)))
    for i in range(n):
        plt.subplot((n + cols - 1) // cols, cols, i + 1)
        plt.imshow(show_pipe(image=img)["image"])
        plt.axis("off")
    plt.suptitle("Random augmentations of one image")
    plt.tight_layout()
    plt.show()
