import { Callout, H2, Ifs, PageHead, Table, Term, Badge } from "../components";
import { href } from "../util";
import { PAGES } from "../pageMeta";

const L = ({ to, sub, children }) => <a href={href(to, sub)}>{children}</a>;

export default function Home() {
  const topics = PAGES.filter((p) => p.likely);
  return (
    <>
      <PageHead kicker="Physical Computing · code docs" title="Start here">
        Every homework turned into tested copy-paste code. Find the task, copy the full script,
        change the settings at the top, run.
      </PageHead>

      <Callout type="info" title="How to read this site">
        Hover (or tap) any <Term k="epoch">dotted word</Term> for a plain-English meaning. Press{" "}
        <kbd>⌘</kbd> <kbd>K</kbd> (Mac) or <kbd>Ctrl</kbd> <kbd>K</kbd> to search everything: pages, functions, settings, words.
      </Callout>

      <H2 id="plan">40-minute game plan</H2>
      <ol className="steps">
        <li>
          <b>0–3 min · Match the task.</b> Use the table below or the "Most likely" list. Open that page.
        </li>
        <li>
          <b>3–6 min · Get the code.</b> Click <i>Copy full script</i> (paste into one Jupyter cell) or{" "}
          <i>Download .ipynb</i> (cells already split). Run once with <code>EPOCHS = 1</code> to check it works.
        </li>
        <li>
          <b>6–25 min · Change the SETTINGS block, then run for real.</b> Only the lines between the dashed
          comment lines need edits: dataset, model, epochs, head, etc.
        </li>
        <li>
          <b>25–35 min · Results + answers.</b> Plots and metrics print automatically. Written questions? Each
          page ends with ready answers ("Theory answers").
        </li>
        <li>
          <b>35–40 min · Save + submit.</b> File → Save, then export as PDF/HTML if asked.
        </li>
      </ol>

      <H2 id="likely">What will probably be asked</H2>
      <p>
        The professor said to pre-install{" "}
        <code>numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations</code>.
        Reading that list:
      </p>
      <div className="cards">
        {topics.map((p, i) => (
          <a key={p.id} className="card" href={href(p.id)}>
            <div className="card-top">
              <span className="card-rank">{i + 1}</span>
              <Badge level={p.likely} />
            </div>
            <div className="card-title">{p.title}</div>
            <div className="card-hw">{p.hw}</div>
            <div className="card-why">{p.why}</div>
          </a>
        ))}
      </div>

      <Table
        head={["Library in the list", "What it points to", "Page"]}
        rows={[
          [<code>torch, torchvision</code>, "PyTorch CNNs and pretrained models (HW03, HW04, HW06)", <L to="transfer">Transfer</L>],
          [<code>kaggle</code>, "Downloading a Kaggle dataset: horses vs camels again, or a new one", <L to="setup" sub="kaggle">Setup</L>],
          [<code>scikit-learn, seaborn</code>, "Train/val split, confusion matrix, precision, recall, ROC/AUC (HW06)", <L to="binary">Metrics</L>],
          [<code>albumentations</code>, "Data augmentation. No homework used it, so it is the most likely new twist", <L to="augment">Augmentation</L>],
          [<code>tensorflow, keras</code>, "Keras models: filter visualization (HW05), Keras ResNet50 (HW06 A)", <L to="keras">Keras</L>],
          [<code>opencv-python, scikit-image, pillow</code>, "Loading and processing images (HW01)", <L to="images">Images</L>],
          [<code>pandas, tqdm, matplotlib</code>, "Results tables, progress bars, plots (used everywhere)", "—"],
          [<code>requests</code>, "Download a file/image from a URL, or call Ollama's web API without LangChain", <L to="llm" sub="requests">LLM</L>],
          [<code>torchaudio</code>, "Part of the standard PyTorch install line; audio work is unlikely", "—"],
          [<span className="muted">not listed: langchain, ollama, faiss</span>, "The LLM homeworks (HW02 B, Harness, HW07) are unlikely, but covered just in case", <L to="llm">LLM</L>],
        ]}
      />

      <H2 id="quick">If the task says… → do this</H2>
      <p className="muted">Variables in <code>CAPS</code> are in the SETTINGS block at the top of each script.</p>
      <Ifs
        rows={[
          ["Use another Kaggle dataset", <>Change <code>KAGGLE_SLUG</code> (the <code>owner/name</code> part of the URL). No test folder? It is split off automatically. <L to="transfer" sub="settings">→</L></>],
          ["Use VGG16 / ResNet18 / MobileNet / EfficientNet", <><code>MODEL_NAME = "vgg16"</code>. Layer names differ per model: <L to="transfer" sub="layers">see the table</L>.</>],
          ["Freeze everything except the last layer", <><code>freeze=True, train_layers=()</code></>],
          ["Unfreeze / fine-tune the top block", <><code>train_layers=("layer4",)</code> (ResNet) or <code>("features.28",)</code> (VGG16)</>],
          ["Train the full model", <><code>freeze=False</code> with a small <code>LR = 1e-4</code></>],
          ["Single output + sigmoid + binary cross-entropy", <><code>head="sigmoid"</code> <L to="binary">→</L></>],
          ["Two outputs + softmax + categorical cross-entropy (one-hot)", <><code>head="softmax"</code> <L to="binary">→</L></>],
          ["Report precision / recall / specificity / F1 / AUC", <><code>get_metrics(y_true, y_pred, y_prob)</code> <L to="binary" sub="block-metrics">→</L></>],
          ["Plot confusion matrix / ROC curve", <><code>plot_confusion(...)</code>, <code>plot_roc(...)</code></>],
          ["Learning curve + say if over/underfitted", <><code>plot_history(history)</code>, then <L to="binary" sub="curves">read it like this</L></>],
          ["Validation = 20 images per class / 10% / 20%", <><code>VAL_SPLIT = 20</code> (int = per class) or <code>0.1</code> / <code>0.2</code> (fraction)</>],
          ["Add data augmentation", <><code>AUGMENT = True</code> (quick) or the albumentations block <L to="augment">→</L></>],
          ["Change batch size / epochs / learning rate / optimizer", <><code>BATCH_SIZE</code>, <code>EPOCHS</code>, <code>LR</code>, <code>OPTIMIZER = "sgd"</code></>],
          ["Add more conv layers", <><code>CHANNELS = (16, 32, 64)</code> <L to="cnn">→</L></>],
          ["Try other activation functions", <><code>ACTIVATION = "tanh"</code> (or leaky_relu, elu, gelu, sigmoid)</>],
          ["Use Fashion-MNIST or CIFAR-10", <><code>DATASET = "FashionMNIST"</code> / <code>"CIFAR10"</code> (CIFAR downloads slowly: <L to="setup" sub="warmup">pre-download</L>)</>],
          ["Stop early when validation stops improving", <><code>train_model(..., patience=3)</code></>],
          ["Save / load the model", <><code>torch.save(model.state_dict(), "m.pt")</code> · <code>model.load_state_dict(torch.load("m.pt"))</code></>],
          ["Predict one image file", <><code>predict_image(model, "photo.jpg", eval_tf, classes)</code></>],
          ["Visualize filters of another layer/model", <><code>LAYERS</code>, <code>MODEL_NAME</code> in the Keras filter block <L to="keras">→</L></>],
          ["Do it in Keras instead of PyTorch", <L to="keras">Keras page</L>],
          ["Histogram / grayscale / threshold / Otsu", <L to="images">Image basics</L>],
          ["More than 2 classes", "Nothing to change: the class count comes from the folders; metrics switch to per-class averages"],
          ["Compare models in a table", <><code>results_table(results)</code></>],
          ["It is too slow", <><code>MODEL_NAME = "resnet18"</code>, <code>EPOCHS = 3</code>, <code>IMG_SIZE = 160</code>; check Device says <code>mps</code></>],
        ]}
      />

      <H2 id="pages">All pages</H2>
      <div className="cards cards-small">
        {PAGES.filter((p) => p.id !== "home").map((p) => (
          <a key={p.id} className="card" href={href(p.id)}>
            <div className="card-title">{p.title}</div>
            <div className="card-hw">{p.hw || p.group}</div>
          </a>
        ))}
      </div>
    </>
  );
}
