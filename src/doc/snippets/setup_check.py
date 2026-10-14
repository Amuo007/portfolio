# Run this first. It checks every library and picks the fastest device.
import importlib

# import name -> pip name (they are not always the same)
LIBS = {
    "numpy": "numpy", "pandas": "pandas", "matplotlib": "matplotlib", "seaborn": "seaborn",
    "sklearn": "scikit-learn", "PIL": "pillow", "cv2": "opencv-python", "skimage": "scikit-image",
    "tqdm": "tqdm", "requests": "requests", "torch": "torch", "torchvision": "torchvision",
    "tensorflow": "tensorflow", "keras": "keras", "albumentations": "albumentations",
}
for name, pip_name in LIBS.items():
    try:
        module = importlib.import_module(name)
        print(f"OK       {name:15} {getattr(module, '__version__', '')}")
    except Exception as error:
        print(f"MISSING  {name:15} fix: pip install {pip_name}   ({type(error).__name__})")

import torch

DEVICE = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
print("\nDevice:", DEVICE, "(mps = Apple GPU, cuda = NVIDIA GPU, cpu = no GPU)")
