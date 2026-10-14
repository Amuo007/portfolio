import { Block, BlockSection, Callout, Code, Fns, H2, Ifs, PageHead, QA, RecipeBar, Settings, Table, Term } from "../components";

const PLUG_ALBU = `# In ANY folder-dataset script (transfer / binary), replace the load_folder_data(...) call with:
train_loader, val_loader, test_loader, classes = load_folder_data(
    train_dir, test_dir, size=224,
    train_transform=Albu(albu_train(224, "medium")),   # random changes, training only
    eval_transform=Albu(albu_eval(224)))               # validation/test: resize + normalize only`;

const PLUG_TV = `# torchvision only (no albumentations): just switch it on
train_loader, val_loader, test_loader, classes = load_folder_data(train_dir, test_dir, augment=True)

# or write your own list:
from torchvision import transforms
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),   # random zoom/crop
    transforms.RandomHorizontalFlip(),                     # mirror left-right (p=0.5)
    transforms.RandomRotation(15),                         # rotate up to +-15 degrees
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # lighting changes
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])`;

const PLUG_KERAS = `# Keras: layers that only act during model.fit()
augment = keras.Sequential([
    keras.layers.RandomFlip("horizontal"),
    keras.layers.RandomRotation(0.1),      # 0.1 = up to 10% of a full turn (36 degrees)
    keras.layers.RandomZoom(0.1),
    keras.layers.RandomContrast(0.2),
])
x = augment(inputs)                        # put right after keras.Input(...)`;

export default function Augment() {
  return (
    <>
      <PageHead kicker="albumentations · not in any homework yet" title="Data augmentation" likely="high">
        <Term k="augmentation">Augmentation</Term> randomly changes each training image every epoch (flip, rotate,
        brighten…), so a small dataset looks bigger and the model <Term k="overfit">overfits</Term> less.
      </PageHead>

      <Callout type="exam" title="Why this page exists">
        <Term k="albumentations">albumentations</Term> is in the professor's install list, but none of the homeworks
        used it. The likely twist: "train the horses vs camels model with augmentation and compare."
      </Callout>

      <RecipeBar id="augment" />

      <H2 id="rules">Three rules</H2>
      <ol className="steps">
        <li><b>Only training images.</b> Validation and test images are just resized + normalized, otherwise the scores are not comparable.</li>
        <li><b>Changes must keep the label true.</b> A flipped horse is still a horse. A flipped "6" can look like a "9": no flips for digits.</li>
        <li><b>Normalize and ToTensorV2 go last</b> in an albumentations pipeline.</li>
      </ol>

      <H2 id="settings">Settings</H2>
      <Settings
        rows={[
          ["STRENGTH", "How aggressive the random changes are.", <><code>"light"</code> flip only · <code>"medium"</code> + move/zoom/rotate/brightness · <code>"strong"</code> + color, blur, cut-out holes</>],
          ["MODEL_NAME", "Pretrained model (layer4 must exist, so a ResNet).", <><code>"resnet18"</code>, <code>"resnet50"</code></>],
          ["EPOCHS", "Augmented models usually need a few more epochs.", "5–10"],
          ["p (in each transform)", "Probability that this change is applied to an image.", "0.2–0.7"],
          ["rotate=(-15, 15)", "Random rotation range in degrees.", "(-10, 10) to (-30, 30)"],
          ["brightness_limit=0.2", "Up to ±20% brighter/darker.", "0.1–0.3"],
        ]}
      />

      <H2 id="blocks">Building blocks</H2>
      <BlockSection id="augment">
        <Fns
          rows={[
            ["albu_train(size, strength)", "Training pipeline: resize + random changes + normalize + tensor.", "A.Compose"],
            ["albu_eval(size)", "Validation/test pipeline: resize + normalize + tensor.", "A.Compose"],
            ["Albu(pipeline)", "Wrapper so an albumentations pipeline works in ImageFolder / load_folder_data / predict_image.", "transform"],
            ["show_augmented(image_path, pipeline)", "One photo, 8 random versions (check they still look real).", "—"],
          ]}
        />
        <Block id="augment" />
      </BlockSection>
      <BlockSection id="augment_recipe">
        <Block id="augment_recipe" />
        <p className="muted">
          Test run (resnet18, 2 epochs): augmentation OFF 92.5% test accuracy, ON (strong) 95.0%, and the train-validation gap
          shrank. Expect small differences with 40 test images.
        </p>
      </BlockSection>

      <H2 id="plug">Plug augmentation into other scripts</H2>
      <Code code={PLUG_ALBU} title="albumentations in the transfer / binary scripts" />
      <Code code={PLUG_TV} title="torchvision version" />
      <Code code={PLUG_KERAS} title="Keras version" />

      <H2 id="cheatsheet">albumentations cheat sheet (version 2.x names)</H2>
      <Table
        head={["Transform", "What it does", "Example"]}
        rows={[
          [<code>A.HorizontalFlip(p=0.5)</code>, "Mirror left-right", "almost always safe for photos"],
          [<code>A.VerticalFlip(p=0.5)</code>, "Upside down", "only for top-down images (cells, satellite)"],
          [<code>A.Rotate(limit=15)</code>, "Rotate up to ±15°", ""],
          [<code>A.Affine(scale=(0.9, 1.1), translate_percent=(-0.05, 0.05), rotate=(-15, 15))</code>, "Zoom, shift and rotate in one", "replaces the old ShiftScaleRotate"],
          [<code>A.RandomResizedCrop(size=(224, 224), scale=(0.8, 1.0))</code>, "Random crop then resize", <>v2 uses <code>size=</code>, not height/width</>],
          [<code>A.RandomBrightnessContrast(0.2, 0.2)</code>, "Lighting changes", ""],
          [<code>A.HueSaturationValue()</code>, "Color shifts", ""],
          [<code>A.GaussianBlur(blur_limit=(3, 5))</code>, "Blur", ""],
          [<code>A.GaussNoise(std_range=(0.02, 0.1))</code>, "Grainy noise", <>v2 uses <code>std_range</code></>],
          [<code>A.CoarseDropout(num_holes_range=(1, 6), hole_height_range=(0.05, 0.15), hole_width_range=(0.05, 0.15))</code>, "Black rectangles (forces looking at the whole object)", "v2 argument names"],
          [<code>A.Resize(224, 224)</code>, "Fixed size", "always first"],
          [<code>A.Normalize()</code>, "ImageNet mean/std scaling", "second to last"],
          [<code>ToTensorV2()</code>, "numpy H×W×C → torch C×H×W", "always last"],
        ]}
      />

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Use albumentations on MNIST", <>Gray images: <code>A.Compose([A.Rotate(limit=10), A.Normalize(mean=0, std=1), ToTensorV2()])</code> and convert with <code>np.array(img)</code> (no <code>.convert("RGB")</code>)</>],
          ["Show augmented images in a grid", <code>show_augmented("dataset/train/horse/xxx.jpg", albu_train(224, "strong"))</code>],
          ["Different augmentations per experiment", <>Loop over <code>["light", "medium", "strong"]</code> and call <code>albu_train(224, s)</code></>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="What is data augmentation and why use it?">
        Creating new training examples by applying random, label-preserving changes (flips, rotations, crops, color
        changes) to the existing images. The model sees more variety, so it learns the object instead of memorizing
        exact pixels: less overfitting and better accuracy on new images, especially with small datasets.
      </QA>
      <QA q="Why not augment the validation and test sets?">
        They must measure performance on real, unchanged images, and stay the same every epoch so results are comparable.
      </QA>
      <QA q="What is the effect on the learning curve?">
        Training accuracy rises more slowly (the task is harder) and the gap between training and validation shrinks.
        It may need a few more epochs to converge.
      </QA>
    </>
  );
}
