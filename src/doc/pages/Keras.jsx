import { Block, BlockSection, Callout, H2, Ifs, PageHead, QA, RecipeBar, Settings, Table, Term } from "../components";
import { OriginalLinks } from "./Notebooks";

export default function Keras() {
  return (
    <>
      <PageHead kicker="HW05 · HW06 Part A" title="Keras: filters & transfer" likely="mid">
        <Term k="keras">TensorFlow/Keras</Term> versions: see what <Term k="vgg">VGG16</Term>'s{" "}
        <Term k="filter">filters</Term> look for, plus Keras transfer learning and a Keras CNN.
      </PageHead>

      <RecipeBar id="keras_filters" />

      <H2 id="filters">Filter visualization (HW05)</H2>
      <p>
        Start from a gray noise image, then repeatedly change its <b>pixels</b> in the direction that makes one filter
        fire more (<Term k="ascent">gradient ascent</Term>). The final image shows the pattern that filter detects. The
        model's weights never change.
      </p>
      <Settings
        rows={[
          ["MODEL_NAME", "Any keras.applications model.", <><code>"VGG16"</code>, <code>"ResNet50V2"</code> (the in-class ICA), <code>"VGG19"</code></>],
          ["LAYERS", "Layers to visualize. The block prints every conv layer name.", <code>["block1_conv1", …, "block5_conv1"]</code>],
          ["N_FILTERS", "Filters per layer (the first N).", "8"],
          ["IMG_SIZE", "Size of the generated image.", "128"],
          ["STEPS", "Gradient-ascent steps. More = clearer, slower.", "30"],
          ["STEP_SIZE", "How far the pixels move per step (the \"learning rate\" here).", "10.0"],
        ]}
      />
      <Table
        head={["Homework name", "Keras layer name"]}
        rows={[["conv1_1", "block1_conv1"], ["conv2_1", "block2_conv1"], ["conv3_1", "block3_conv1"], ["conv4_1", "block4_conv1"], ["conv5_1", "block5_conv1"]]}
      />
      <BlockSection id="keras_filters">
        <Block id="keras_filters" />
      </BlockSection>
      <Callout type="tip" title="The in-class ICA version (ResNet50V2, middle layer)">
        <code>MODEL_NAME = "ResNet50V2"</code>, <code>LAYERS = ["conv3_block4_out"]</code>. Tested.
      </Callout>
      <BlockSection id="keras_feature_maps">
        <p>
          The other view: feed a real photo and show each filter's output (<Term k="featuremap">feature map</Term>).
          Run after the filter block (it reuses <code>model</code>).
        </p>
        <Block id="keras_feature_maps" />
      </BlockSection>

      <H2 id="transfer">Keras transfer learning (HW06 in Keras)</H2>
      <RecipeBar id="keras_transfer" />
      <Settings
        rows={[
          ["TRAIN_DIR / TEST_DIR", "Folders with one sub-folder per class.", <code>"dataset/train"</code>],
          ["BASE", "Pretrained base.", <><code>"ResNet50"</code>, <code>"VGG16"</code>, <code>"MobileNetV2"</code>, <code>"EfficientNetB0"</code></>],
          ["HEAD", <><code>"sigmoid"</code> = Dense(1) + <Term k="bce">BCE</Term>; <code>"softmax"</code> = Dense(N) + <Term k="cce">CCE</Term> with one-hot labels.</>, ""],
          ["FINE_TUNE", "False: base frozen. True: everything learns (learning rate is divided by 10 automatically).", "False / True"],
          ["AUGMENT", "Random flip + rotation layers (training only).", "True"],
          ["EPOCHS", "Early stopping (patience 3) keeps the best epoch.", "10"],
        ]}
      />
      <BlockSection id="keras_transfer">
        <p>Needs the <a href="#/binary/block-metrics">Metrics block</a> first (for get_metrics, plot_confusion, plot_roc).</p>
        <Block id="keras_transfer" />
      </BlockSection>

      <H2 id="cnn">Keras CNN from scratch (HW04 in Keras)</H2>
      <RecipeBar id="keras_cnn" />
      <BlockSection id="keras_cnn">
        <Block id="keras_cnn" />
      </BlockSection>

      <H2 id="translate">PyTorch ↔ Keras</H2>
      <Table
        head={["Idea", "PyTorch", "Keras"]}
        rows={[
          ["Fully connected layer", <code>nn.Linear(2048, 1)</code>, <code>layers.Dense(1)</code>],
          ["Freeze", <code>p.requires_grad = False</code>, <code>base.trainable = False</code>],
          ["Train", "write the loop (train_model)", <code>model.fit(train_ds, validation_data=val_ds, epochs=10)</code>],
          ["Test", <code>evaluate(model, loader)</code>, <code>model.evaluate(test_ds)</code>],
          ["Predict", <code>model(x)</code>, <code>model.predict(x)</code>],
          ["Image shape", "[batch, channels, height, width]", "[batch, height, width, channels]"],
          ["Load folders", <code>datasets.ImageFolder</code>, <code>keras.utils.image_dataset_from_directory</code>],
          ["Pretrained model", <code>models.resnet50(weights="DEFAULT")</code>, <code>keras.applications.ResNet50(weights="imagenet", include_top=False)</code>],
          ["Save", <code>torch.save(model.state_dict(), "m.pt")</code>, <code>model.save("m.keras")</code>],
        ]}
      />

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Visualize the LAST conv of each block", <code>LAYERS = ["block1_conv2", "block2_conv2", "block3_conv3", "block4_conv3", "block5_conv3"]</code>],
          ["16 filters instead of 8", <code>N_FILTERS = 16</code>],
          ["Show the whole model / output shapes", <code>model.summary()</code>],
          ["Keras ResNet50 base only (HW06 A)", <code>keras.applications.ResNet50(weights="imagenet", include_top=False, input_shape=(224, 224, 3))</code>],
          ["Unfreeze only the last N layers", <><code>base.trainable = True</code> then <code>for l in base.layers[:-20]: l.trainable = False</code>, recompile</>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="What do you notice in the different filters? (HW05)">
        Filters become more complex the deeper the layer. block1 filters are plain colors and simple edges at different
        angles; block2–3 combine them into textures and repeated lines; block4–5 show complicated, abstract patterns that
        look like parts of objects.
      </QA>
      <QA q="What kind of information does each filter learn?">
        Early layers: edges, colors, lines (general for any image). Middle layers: textures, curves, simple shapes.
        Deep layers: combinations of those, close to object parts. The network builds a hierarchy: edges/colors →
        textures/shapes → complex abstract features.
      </QA>
      <QA q="How does the visualization algorithm work? (the ICA steps)">
        1) Load a pretrained CNN without its classification top. 2) Pick a layer and build a feature extractor that
        outputs it. 3) Pick a filter. 4) Start from a random noise image. 5) Feed it through and take the filter's mean
        activation as the "loss". 6) Compute the gradient of that activation with respect to the input pixels. 7)
        Normalize it and add it to the image (gradient ascent). 8) Repeat ~30 times. 9) Show the image: it is the pattern
        that filter responds to most.
      </QA>

      <OriginalLinks topic="keras" />
    </>
  );
}
