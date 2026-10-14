// Page list (sidebar order). likely = how probable this topic is, judged from the exam install list.
export const PAGES = [
  { id: "home", title: "Start here", group: "Guide" },
  { id: "setup", title: "Setup & downloads", group: "Guide" },
  {
    id: "transfer", nav: "Transfer learning", tag: "HW03", title: "Transfer learning", hw: "HW03", group: "Topics", likely: "most",
    why: "torch + torchvision + kaggle: pretrained ResNet50 on a Kaggle folder dataset",
  },
  {
    id: "binary", nav: "Binary metrics", tag: "HW06", title: "Binary metrics: BCE vs CCE", hw: "HW06 B", group: "Topics", likely: "most",
    why: "scikit-learn + seaborn: confusion matrix, precision, recall, specificity, ROC/AUC",
  },
  {
    id: "cnn", nav: "CNN from scratch", tag: "HW04", title: "CNN from scratch", hw: "HW04", group: "Topics", likely: "high",
    why: "torch: build a CNN for MNIST-style data, change layers / batch size / activation",
  },
  {
    id: "augment", nav: "Data augmentation", tag: "new", title: "Data augmentation", hw: "new: albumentations", group: "Topics", likely: "high",
    why: "albumentations is in the list but no homework used it: a likely add-on",
  },
  {
    id: "keras", nav: "Keras", tag: "HW05", title: "Keras: filters & transfer", hw: "HW05 · HW06 A", group: "Topics", likely: "mid",
    why: "tensorflow + keras: VGG16 filter visualization, Keras transfer learning",
  },
  {
    id: "images", nav: "Image basics", tag: "HW01", title: "Image basics (OpenCV)", hw: "HW01 · HW02 A", group: "Topics", likely: "mid",
    why: "opencv + scikit-image: channels, histograms, grayscale, threshold",
  },
  {
    id: "llm", nav: "LLM & LangChain", tag: "HW07", title: "LLM & LangChain", hw: "HW02 B · Harness · HW07", group: "Topics", likely: "low",
    why: "LangChain/Ollama are not in the list (requests is): kept just in case",
  },
  { id: "notebooks", title: "Original notebooks", group: "Reference" },
  { id: "fixes", title: "Fix errors fast", group: "Reference" },
  { id: "glossary", title: "Glossary", group: "Reference" },
];
