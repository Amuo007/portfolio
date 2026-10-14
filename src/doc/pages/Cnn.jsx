import { Block, BlockSection, Callout, Fns, H2, Ifs, PageHead, QA, RecipeBar, Settings, Table, Term } from "../components";
import { OriginalLinks } from "./Notebooks";

export default function Cnn() {
  return (
    <>
      <PageHead kicker="HW04 · MNIST" title="CNN from scratch" likely="high">
        Build a small <Term k="cnn">CNN</Term> in PyTorch, train it on <Term k="mnist">MNIST</Term> (or Fashion-MNIST /
        CIFAR-10), then compare more layers, batch sizes and activations.
      </PageHead>

      <RecipeBar id="cnn" />
      <RecipeBar id="cnn_exp" />

      <H2 id="settings">Settings</H2>
      <Settings
        rows={[
          ["DATASET", "Which built-in dataset. Downloads automatically into ~/datasets.", <><code>"MNIST"</code>, <code>"FashionMNIST"</code>, <code>"CIFAR10"</code></>],
          ["VAL_FRACTION", <>Part of the 60,000 training images held out as <Term k="validation">validation</Term>. HW04 B: 10%.</>, "0.1"],
          ["BATCH_SIZE", <>Images per weight update (<Term k="batch">batch</Term>). HW04 B: 32.</>, "32, 64, 128, 256"],
          ["EPOCHS", <>Full passes over the training data (<Term k="epoch">epochs</Term>). HW04 B: 10.</>, "10 (1 to test)"],
          ["LR", <><Term k="lr">Learning rate</Term>.</>, "0.001"],
          ["OPTIMIZER", <>Weight-update rule (<Term k="optimizer">optimizer</Term>). HW04 B: Adam.</>, <><code>"adam"</code>, <code>"sgd"</code></>],
          ["DROPOUT", <>Fraction of neurons switched off while training (<Term k="dropout">dropout</Term>). HW04 B: 0.5.</>, "0.25, 0.5"],
          ["ACTIVATION", <><Term k="activation">Activation function</Term> after each conv layer. HW04 B: relu.</>, <><code>"relu"</code>, <code>"tanh"</code>, <code>"leaky_relu"</code>, <code>"elu"</code>, <code>"gelu"</code>, <code>"sigmoid"</code></>],
          ["CHANNELS", <>One number per <Term k="conv">conv layer</Term> = how many <Term k="filter">filters</Term> it has.</>, <><code>(16,)</code> 1 layer, <code>(16, 32)</code> 2, <code>(16, 32, 64)</code> 3</>],
        ]}
      />
      <Callout type="tip" title="Want the exact homework model?">
        Swap the <code>make_cnn(...)</code> line for <code>BaseCNN(...)</code> (Part A: Conv → MaxPool → Flatten → Dropout → FC) or{" "}
        <code>DeepCNN(...)</code> (Part B: two conv layers). Both are in the CNN models block.
      </Callout>

      <H2 id="shapes">Shape math (why 16 × 13 × 13)</H2>
      <p>
        Conv output size = <code>(input − kernel + 2·padding) / stride + 1</code>. A 2×2{" "}
        <Term k="maxpool">max pool</Term> halves it (rounding down).
      </p>
      <Table
        head={["Layer", "BaseCNN (no padding)", "DeepCNN / make_cnn (padding=1)"]}
        rows={[
          ["Input", "1 × 28 × 28", "1 × 28 × 28"],
          ["Conv 3×3, 16 filters", "16 × 26 × 26", "16 × 28 × 28"],
          ["MaxPool 2×2", "16 × 13 × 13", "16 × 14 × 14"],
          ["Conv 3×3, 32 filters", "—", "32 × 14 × 14"],
          ["MaxPool 2×2", "—", "32 × 7 × 7"],
          [<Term k="flatten">Flatten</Term>, "2,704 numbers", "1,568 numbers"],
          [<Term k="dense">Linear</Term>, "2704 → 10", "1568 → 10"],
        ]}
      />
      <p className="muted">
        <code>make_cnn</code> computes the flatten size itself, so the error "mat1 and mat2 shapes cannot be multiplied" cannot happen.
      </p>

      <H2 id="blocks">Building blocks</H2>
      <BlockSection id="train_eval">
        <Fns
          rows={[
            ["set_seed(42)", <>Same <Term k="seed">randomness</Term> every run.</>, "—"],
            ["train_model(model, train_loader, val_loader, epochs, lr, optimizer, patience)", "Trains, checks validation every epoch, keeps the best epoch's weights. patience = early stopping.", "history dict"],
            ["evaluate(model, loader)", "Loss + accuracy + all predictions, no learning.", "dict: loss, accuracy, y_true, y_pred, y_prob"],
            ["plot_history(history, title)", <><Term k="curve">Learning curves</Term>: loss and accuracy, train vs validation.</>, "—"],
            ["predict_image(model, path, transform, class_names)", "Classifies one image file.", "(label, confidence)"],
            ["count_params(model)", <>Total and trainable <Term k="params">parameters</Term>.</>, "(total, trainable)"],
          ]}
        />
        <p>
          The loss is picked automatically: 1 output → binary cross-entropy, several outputs → cross-entropy. Runs on the{" "}
          <Term k="cuda">Apple GPU (mps)</Term> when available.
        </p>
        <Block id="train_eval" />
      </BlockSection>

      <BlockSection id="data_builtin">
        <Fns
          rows={[["load_builtin(name, val_fraction, batch_size)", "Downloads MNIST / FashionMNIST / CIFAR10, splits off validation.", "train, val, test loaders, class_names, shape (C, H, W)"]]}
        />
        <Block id="data_builtin" />
      </BlockSection>

      <BlockSection id="cnn_models">
        <Fns
          rows={[
            ["BaseCNN(in_channels, num_classes, img_size)", "HW04 Part A model exactly.", "model"],
            ["DeepCNN(in_channels, num_classes, img_size)", "HW04 Part B deeper model exactly.", "model"],
            ["make_cnn(in_channels, num_classes, img_size, channels, activation, dropout, hidden, batchnorm)", <>Any depth from settings. <code>batchnorm=True</code> adds <Term k="batchnorm">batch normalization</Term>.</>, "model"],
          ]}
        />
        <Block id="cnn_models" />
      </BlockSection>

      <BlockSection id="cnn_recipe">
        <Block id="cnn_recipe" />
      </BlockSection>

      <BlockSection id="cnn_experiments">
        <p>Trains one fresh model per row and prints a comparison table. Add or delete rows in <code>EXPERIMENTS</code>.</p>
        <Block id="cnn_experiments" />
        <p>Results from a test run (MNIST, 1 epoch each, Apple GPU):</p>
        <Table
          head={["Experiment", "Test accuracy", "Seconds / epoch"]}
          rows={[
            ["base (1 conv, batch 32, relu)", "95.5%", "6.3"],
            ["2 conv layers", "97.7%", "6.3"],
            ["3 conv layers", "98.0%", "7.0"],
            ["batch 64", "94.4%", "3.3"],
            ["batch 128", "93.3%", "2.6"],
            ["batch 256", "92.1%", "2.1"],
            ["tanh", "93.6%", "4.8"],
            ["leaky_relu", "95.3%", "4.6"],
            ["sigmoid", "89.7%", "4.6"],
          ]}
        />
        <p className="muted">Your full 10-epoch homework runs: base CNN 98.13%, deep CNN 99.06%.</p>
      </BlockSection>

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Train for 10 epochs with 10% validation, batch 32, Adam, dropout 0.5, relu", "These are already the defaults"],
          ["Report confusion matrix + test accuracy", "Already printed at the end of the CNN script"],
          ["Add a hidden fully connected layer", <code>make_cnn(..., hidden=128)</code>],
          ["Add batch normalization", <code>make_cnn(..., batchnorm=True)</code>],
          ["Use 5×5 filters", <code>make_cnn(..., kernel_size=5, padding=2)</code>],
          ["Augment MNIST", <><code>load_builtin(..., train_transform=transforms.Compose([transforms.RandomRotation(10), transforms.ToTensor()]))</code> (no flips: a flipped 6 is not a 6)</>],
          ["Plot accuracy vs batch size", <code>table["Test accuracy"].plot.bar()</code>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="What is the difference between an epoch and a batch?">
        A batch is a small group of images (e.g. 32) used for one weight update. An epoch is one full pass over all
        training images, i.e. many batches: 54,000 / 32 ≈ 1,688 updates per epoch.
      </QA>
      <QA q="How does batch size affect training time and performance?">
        Bigger batches use the GPU better, so each epoch is faster (2.1 s at 256 vs 6.3 s at 32 above), but there are
        fewer weight updates per epoch, so after the same number of epochs accuracy is lower (92.1% vs 95.5%) and more
        epochs or a higher learning rate are needed. Small batches give noisier updates, which often generalize a bit
        better, but they are slower and use less memory per step.
      </QA>
      <QA q="What is the purpose of the max pooling layer?">
        It shrinks each feature map by keeping the strongest value in each 2×2 window. That cuts computation and
        parameters, keeps the most important signal, and makes the network less sensitive to small shifts of the digit.
      </QA>
      <QA q="What is the purpose of a validation set?">
        To check the model on images it never trained on after every epoch, so you can pick the best epoch/settings and
        spot overfitting, without touching the test set (which must stay unseen until the final evaluation).
      </QA>
      <QA q="Observations: more layers, activations">
        More conv layers increased accuracy (95.5% → 98.0% after 1 epoch; 98.13% → 99.06% after 10) because deeper
        layers combine edges into strokes and shapes. ReLU and Leaky ReLU learned fastest; tanh was slower; sigmoid was
        worst because its gradients become very small (vanishing gradients), so learning is slow.
      </QA>
      <QA q="What does dropout do?">
        It randomly switches off a fraction of neurons in each training step, so the network cannot rely on any single
        neuron. That reduces overfitting. It is automatically turned off by <code>model.eval()</code> when testing.
      </QA>

      <OriginalLinks topic="cnn" />
    </>
  );
}
