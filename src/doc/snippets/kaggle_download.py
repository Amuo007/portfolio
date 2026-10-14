# Download a Kaggle dataset. Public datasets need NO login with options 1 and 2.
# The "slug" is the part of the Kaggle URL after /datasets/  ->  owner/dataset-name
SLUG = "akrsnv/horses-and-camels"
OUT_DIR = "dataset"

# Option 1: kagglehub (pip install kagglehub)  - what the homeworks used
import kagglehub

path = kagglehub.dataset_download(SLUG, output_dir=OUT_DIR)
print("Downloaded to:", path)

# Option 2: kaggle command line (the "kaggle" package is in the exam install list).
# In Jupyter, put ! in front:
#   !kaggle datasets download akrsnv/horses-and-camels -p dataset --unzip
#
# Option 3: browser -> dataset page -> Download -> unzip into a folder named "dataset".

# See what is inside (you need to know where "train" and "test" are)
from pathlib import Path

for p in sorted(Path(OUT_DIR).rglob("*")):
    if p.is_dir():
        print(p, "->", len(list(p.glob("*"))), "items")
