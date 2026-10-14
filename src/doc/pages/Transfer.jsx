import { Block, BlockSection, Callout, Fns, H2, Ifs, PageHead, QA, RecipeBar, Settings, Table, Term } from "../components";
import { href } from "../util";
import { OriginalLinks } from "./Notebooks";

export default function Transfer() {
  return (
    <>
      <PageHead kicker="HW03 · horses vs camels" title="Transfer learning" likely="most">
        Take a <Term k="pretrained">pretrained</Term> ResNet50, swap its last layer for your classes,{" "}
        <Term k="freeze">freeze</Term> most of it, and train the rest on a Kaggle folder dataset.
      </PageHead>

      <RecipeBar id="transfer" />

      <H2 id="settings">Settings (top of the last block)</H2>
      <Settings
        rows={[
          ["KAGGLE_SLUG", <>Which Kaggle dataset to download (<code>owner/name</code> from the URL).</>, <code>"akrsnv/horses-and-camels"</code>],
          ["DATA_DIR", "Folder the data goes into. If it already exists, nothing is downloaded.", <code>"dataset"</code>],
          ["MODEL_NAME", <>Which pretrained <Term k="backbone">base model</Term>. Smaller = faster.</>, <><code>"resnet18"</code> (fast), <code>"resnet50"</code>, <code>"vgg16"</code></>],
          ["IMG_SIZE", "Images are resized to this square. ImageNet models were trained at 224.", "224 (160 if slow)"],
          ["BATCH_SIZE", <>Images per weight update (<Term k="batch">batch</Term>).</>, "16, 32"],
          ["EPOCHS", <>Full passes over the training images (<Term k="epoch">epochs</Term>).</>, "1 to test, 5–15 for real"],
          ["LR", <><Term k="lr">Learning rate</Term>. Small, because pretrained weights are already good.</>, "1e-4 (fine-tune), 1e-3 (head only)"],
          ["VAL_SPLIT", <>How much of train becomes the <Term k="validation">validation set</Term>. A fraction, or an int = images per class.</>, "0.2, 0.1, 20"],
          ["AUGMENT", <>Random flips/rotations/colors on training images (<Term k="augmentation">augmentation</Term>).</>, "False / True"],
          ["CONFIGS", "Name → which blocks learn. Everything else stays frozen. One model is trained per entry.", <code>{'{"A": ("layer4",)}'}</code>],
        ]}
      />
      <Callout type="tip" title="Dataset without train/test folders?">
        Many Kaggle sets are just <code>class_a/</code>, <code>class_b/</code>. Then <code>find_dir</code> returns <code>None</code>,
        the whole folder is used, and <code>test_split=0.2</code> carves out a <Term k="stratified">stratified</Term> test set.
        Look inside first: <code>!ls dataset</code>.
      </Callout>

      <H2 id="layers">What can be frozen (layer names)</H2>
      <p>
        <code>train_layers</code> takes block names. Everything not listed stays frozen; the new head always learns.
      </p>
      <Table
        head={["Model", "Blocks (input → output)", "Fine-tune the top"]}
        rows={[
          [<code>resnet18/50</code>, <><code>conv1 bn1 layer1 layer2 layer3 layer4 fc</code></>, <code>("layer4",)</code>],
          [<code>vgg16</code>, <><code>features.0 … features.28</code> (13 conv layers), <code>classifier</code></>, <code>("features.24", "features.26", "features.28")</code>],
          [<code>mobilenet_v2</code>, <><code>features.0 … features.18</code>, <code>classifier</code></>, <code>("features.17", "features.18")</code>],
          [<code>efficientnet_b0</code>, <><code>features.0 … features.8</code>, <code>classifier</code></>, <code>("features.7", "features.8")</code>],
        ]}
      />
      <p className="muted">
        <code>show_layers(model)</code> prints every block as Frozen / Trainable / Partly; <code>count_params(model)</code> prints how many weights learn.
      </p>

      <H2 id="blocks">Building blocks</H2>
      <BlockSection id="folder_data">
        <Fns
          rows={[
            ["find_dir(root, \"train\")", "Finds a sub-folder by name anywhere inside (Kaggle zips nest folders).", "path or None"],
            ["get_transforms(size, imagenet, augment)", <>Resize → tensor → ImageNet <Term k="normalize">normalization</Term> (+ augmentation for train).</>, "(train_tf, eval_tf)"],
            ["load_folder_data(train_dir, test_dir, size, batch_size, val_split, test_split, augment)", "Loads the folders, makes balanced train/val/test splits, prints counts per class.", "train, val, test loaders, class_names"],
            ["show_batch(loader, class_names)", "Shows 8 images with their labels (sanity check).", "—"],
          ]}
        />
        <Block id="folder_data" />
      </BlockSection>

      <BlockSection id="pretrained">
        <Fns
          rows={[
            ["pretrained_model(name, num_classes, freeze, train_layers, head)", <>ImageNet weights + new <Term k="classifier">head</Term>. head = "logits", "sigmoid" or "softmax".</>, "model"],
            ["show_layers(model)", "Which blocks are Frozen / Trainable / Partly.", "—"],
          ]}
        />
        <Block id="pretrained" />
      </BlockSection>

      <BlockSection id="train_eval">
        <p>
          Same training block as the <a href={href("cnn", "block-train_eval")}>CNN page</a> (one loop for every PyTorch model).
        </p>
      </BlockSection>

      <BlockSection id="transfer_recipe">
        <Block id="transfer_recipe" />
      </BlockSection>

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Only train the new last layer (feature extraction)", <code>CONFIGS = {'{"head only": ()}'}</code>],
          ["Compare 3 configurations", <><code>{'{"head": (), "layer4": ("layer4",), "layer3+4": ("layer3", "layer4")}'}</code></>],
          ["Full fine-tuning", <><code>pretrained_model(MODEL_NAME, len(classes), freeze=False)</code> and <code>LR = 1e-5</code> to <code>1e-4</code></>],
          ["3+ classes", "Nothing changes: num_classes = len(classes) from the folder names"],
          ["Use the model's own preprocessing (as in HW03)", <><code>tf = models.ResNet50_Weights.DEFAULT.transforms()</code>, pass <code>train_transform=tf, eval_transform=tf</code></>],
          ["Test on a photo from the internet", <><code>requests.get(url).content</code> → save as <code>x.jpg</code> → <code>predict_image(model, "x.jpg", get_transforms()[1], classes)</code></>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="What is transfer learning?">
        Reusing a network trained on a huge dataset (ImageNet: 1.28 M images, 1,000 classes) for a new, smaller task.
        Its early layers already detect edges, textures and shapes, so we only replace and train the last layer(s).
        It needs far less data and time than training from scratch.
      </QA>
      <QA q="What is fine-tuning, and how is it different from feature extraction?">
        Feature extraction: the whole base is frozen and only the new classifier learns. Fine-tuning: also unfreeze
        the top blocks (e.g. <code>layer4</code>) and train them together with the new head using a small learning rate,
        so the high-level features adapt to horses/camels.
      </QA>
      <QA q="Why a small learning rate?">
        The pretrained weights are already good. Big steps would destroy what they learned on ImageNet.
      </QA>
      <QA q="Why freeze the early layers?">
        Early layers learn general things (edges, colors) that are useful for any image. Freezing them keeps that
        knowledge, trains faster, and reduces <Term k="overfit">overfitting</Term> when there are few images (here 288).
      </QA>
      <QA q="How do you choose the best configuration?">
        By validation accuracy (then validation loss, then fewer trainable parameters), never by the test set. The test
        set is only used once at the end for the final number. In HW03, configuration B (layer3 + layer4 + fc) won:
        98.61% validation, 95.00% test.
      </QA>
      <QA q="How do you check for overfitting?">
        Training accuracy much higher than validation accuracy (a growing gap in the learning curve), or validation loss
        rising while training loss keeps falling.
      </QA>

      <OriginalLinks topic="transfer" />
    </>
  );
}
