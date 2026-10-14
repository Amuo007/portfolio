import { PAGES } from "./pageMeta";
import { BLOCKS } from "./snippets";
import { GLOSSARY } from "./glossary";
import NB_INDEX from "./data/notebooks/index.json";

// Extra entry points: common task wording -> where to go.
const TASKS = [
  ["Confusion matrix", "binary", "block-metrics", "plot_confusion heatmap seaborn"],
  ["Precision, recall, sensitivity, specificity, F1", "binary", "formulas", "metrics formula TP TN FP FN"],
  ["ROC curve and AUC", "binary", "block-metrics", "plot_roc roc_auc_score"],
  ["Learning curve: overfitting or underfitting?", "binary", "curves", "loss vs epochs discuss well-trained"],
  ["Sigmoid + BCE vs softmax + CCE", "binary", "settings", "head one-hot single output two outputs"],
  ["Freeze layers / fine-tune layer4", "transfer", "layers", "requires_grad train_layers unfreeze"],
  ["Layer names for VGG16, MobileNet, EfficientNet", "transfer", "layers", "features classifier"],
  ["Use a different Kaggle dataset", "transfer", "settings", "KAGGLE_SLUG download"],
  ["Dataset without train/test folders", "transfer", "settings", "split test_split"],
  ["Shape math / flatten size", "cnn", "shapes", "mat1 mat2 2704 1568 padding"],
  ["Batch size experiment", "cnn", "block-cnn_experiments", "64 128 256"],
  ["More conv layers / activation functions", "cnn", "block-cnn_experiments", "tanh relu sigmoid deeper"],
  ["Epoch vs batch", "cnn", "theory", "difference"],
  ["Max pooling purpose", "cnn", "theory", "pool"],
  ["Validation set purpose", "cnn", "theory", "why validation"],
  ["Data augmentation with albumentations", "augment", "blocks", "flip rotate brightness"],
  ["albumentations transform names (v2)", "augment", "cheatsheet", "Affine RandomResizedCrop GaussNoise CoarseDropout"],
  ["Visualize VGG16 filters", "keras", "filters", "gradient ascent block1_conv1"],
  ["Feature maps of a real image", "keras", "block-keras_feature_maps", "activations"],
  ["PyTorch vs Keras translation", "keras", "translate", "Dense Linear fit"],
  ["Histogram of R G B channels", "images", "block-image_basics", "calcHist"],
  ["Binary threshold / Otsu", "images", "block-image_basics", "threshold 127"],
  ["Grayscale vs one channel", "images", "theory", "weights"],
  ["Ask Ollama without LangChain", "llm", "requests", "requests api chat"],
  ["LLM tool for the current time", "llm", "block-llm_tools", "@tool get_current_time"],
  ["Intent classification accuracy", "llm", "block-llm_intents", "router harness"],
  ["Chatbot memory FAISS web search LLaVA", "llm", "block-llm_chatbot", "HW07"],
  ["Create the exam environment", "setup", "env", "conda pip install"],
  ["Pre-download datasets and weights", "setup", "block-warmup", "CIFAR slow"],
  ["Save / load a model", "cnn", "block-train_eval", "torch.save load_state_dict"],
  ["Predict a single image", "cnn", "block-train_eval", "predict_image"],
  ["Early stopping", "cnn", "block-train_eval", "patience"],
];

function buildIndex() {
  const items = [];
  for (const p of PAGES) items.push({ type: "Page", title: p.title, sub: p.hw || p.group, text: p.why || "", to: [p.id] });
  for (const [title, page, anchor, kw] of TASKS) items.push({ type: "Task", title, sub: PAGES.find((p) => p.id === page).title, text: kw, to: [page, anchor] });
  for (const b of Object.values(BLOCKS)) {
    items.push({ type: "Code block", title: b.title, sub: PAGES.find((p) => p.id === b.page).title, text: b.id, to: [b.page, "block-" + b.id] });
    for (const m of b.code.matchAll(/^(?:def|class) (\w+)\s*\(([^)]*)\)?/gm)) {
      if (m[1].startsWith("_")) continue;
      items.push({ type: "Function", title: `${m[1]}(${m[2].length > 40 ? m[2].slice(0, 40) + "…" : m[2]})`, sub: b.title, text: m[1], to: [b.page, "block-" + b.id] });
    }
    for (const m of b.code.matchAll(/^([A-Z][A-Z_]{2,}) = (.+?)(?:\s+#\s*(.*))?$/gm)) {
      items.push({ type: "Setting", title: m[1], sub: m[3] || b.title, text: m[2], to: [b.page, "block-" + b.id] });
    }
  }
  for (const [k, [term, def]] of Object.entries(GLOSSARY)) items.push({ type: "Word", title: term, sub: def, text: "", to: ["glossary", k] });
  for (const n of NB_INDEX) items.push({ type: "Notebook", title: n.title, sub: n.desc, text: n.file, to: ["notebooks", n.id] });
  return items;
}

let INDEX;
const ORDER = { Task: 0, Page: 1, Function: 2, Setting: 3, "Code block": 4, Word: 5, Notebook: 6 };

export function search(query, limit = 40) {
  INDEX ||= buildIndex();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out = [];
  for (const it of INDEX) {
    const title = it.title.toLowerCase();
    const all = `${title} ${(it.sub || "").toLowerCase()} ${it.text.toLowerCase()}`;
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (title.startsWith(w)) score += 6;
      else if (title.includes(w)) score += 4;
      else if (all.includes(w)) score += 1;
      else { ok = false; break; }
    }
    if (ok) out.push({ ...it, score: score - ORDER[it.type] * 0.3 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
