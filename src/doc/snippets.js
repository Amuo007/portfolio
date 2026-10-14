// Python code blocks live in ./snippets/*.py (real files, tested). This file names them
// and defines the "full scripts" = which blocks to paste, in order, for each task.
const files = import.meta.glob("./snippets/*.py", { query: "?raw", import: "default", eager: true });
const raw = (name) => files[`./snippets/${name}.py`];

export const BLOCKS = {
  setup_check: { title: "Check libraries + device", page: "setup" },
  kaggle_download: { title: "Download a Kaggle dataset", page: "setup" },
  warmup: { title: "Pre-download everything (run before the exam)", page: "setup" },
  image_basics: { title: "Image functions (OpenCV)", page: "images" },
  image_recipe: { title: "HW01 tasks a-i", page: "images" },
  image_skimage: { title: "Same with scikit-image", page: "images" },
  train_eval: { title: "Train & evaluate (PyTorch)", page: "cnn" },
  metrics: { title: "Metrics & plots", page: "binary" },
  data_builtin: { title: "Built-in datasets (MNIST, FashionMNIST, CIFAR10)", page: "cnn" },
  cnn_models: { title: "CNN models", page: "cnn" },
  cnn_recipe: { title: "Train a CNN (settings)", page: "cnn" },
  cnn_experiments: { title: "Experiments: layers, batch sizes, activations", page: "cnn" },
  folder_data: { title: "Folder dataset (ImageFolder)", page: "transfer" },
  pretrained: { title: "Pretrained model + new head", page: "transfer" },
  transfer_recipe: { title: "Compare fine-tuning configurations (settings)", page: "transfer" },
  binary_recipe: { title: "BCE vs CCE, frozen vs full (settings)", page: "binary" },
  augment: { title: "Augmentation functions (albumentations)", page: "augment" },
  augment_recipe: { title: "With vs without augmentation (settings)", page: "augment" },
  keras_filters: { title: "Filter visualization (settings)", page: "keras" },
  keras_feature_maps: { title: "Feature maps of a real image", page: "keras" },
  keras_transfer: { title: "Keras transfer learning + metrics (settings)", page: "keras" },
  keras_cnn: { title: "Keras CNN on MNIST (settings)", page: "keras" },
  llm_requests: { title: "Ollama with only requests", page: "llm" },
  llm_langchain: { title: "LangChain basics", page: "llm" },
  llm_tools: { title: "Tools (function calling)", page: "llm" },
  llm_intents: { title: "Intent router + accuracy", page: "llm" },
  llm_chatbot: { title: "Full chatbot (memory, web, vision)", page: "llm" },
};
for (const [id, b] of Object.entries(BLOCKS)) {
  b.id = id;
  b.code = (raw(id) || `# missing snippet ${id}`).trimEnd() + "\n";
  b.lines = b.code.split("\n").length - 1;
}

export const RECIPES = {
  image: { title: "Image basics (HW01)", blocks: ["image_basics", "image_recipe"] },
  cnn: { title: "CNN from scratch (HW04)", blocks: ["train_eval", "metrics", "data_builtin", "cnn_models", "cnn_recipe"] },
  cnn_exp: { title: "CNN experiments (HW04 Part B)", blocks: ["train_eval", "metrics", "data_builtin", "cnn_models", "cnn_experiments"] },
  transfer: { title: "Transfer learning (HW03)", blocks: ["train_eval", "metrics", "folder_data", "pretrained", "transfer_recipe"] },
  binary: { title: "Binary metrics, BCE vs CCE (HW06)", blocks: ["train_eval", "metrics", "folder_data", "pretrained", "binary_recipe"] },
  augment: { title: "Augmentation (albumentations)", blocks: ["train_eval", "metrics", "folder_data", "pretrained", "augment", "augment_recipe"] },
  keras_filters: { title: "Filter visualization (HW05)", blocks: ["keras_filters", "keras_feature_maps"] },
  keras_transfer: { title: "Keras transfer learning (HW06 in Keras)", blocks: ["metrics", "keras_transfer"] },
  keras_cnn: { title: "Keras CNN (HW04 in Keras)", blocks: ["metrics", "keras_cnn"] },
  llm_harness: { title: "Intent router (HW-Harness)", blocks: ["llm_langchain", "llm_intents"] },
  llm_chatbot: { title: "Chatbot (HW07)", blocks: ["llm_langchain", "llm_intents", "llm_chatbot"] },
};

export function recipeScript(id) {
  const r = RECIPES[id];
  return r.blocks
    .map((b, i) => `# ===== [${i + 1}/${r.blocks.length}] ${BLOCKS[b].title} =====\n${BLOCKS[b].code}`)
    .join("\n\n");
}

export function recipeLines(id) {
  return recipeScript(id).split("\n").length;
}

// Build a real Jupyter notebook (.ipynb) and download it.
export function downloadNotebook(filename, cells) {
  const toSource = (text) => text.replace(/\n+$/, "").split("\n").map((l, i, a) => (i < a.length - 1 ? l + "\n" : l));
  const nb = {
    cells: cells.map((c) =>
      c.type === "md"
        ? { cell_type: "markdown", metadata: {}, source: toSource(c.text) }
        : { cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: toSource(c.text) }
    ),
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python" },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
  const blob = new Blob([JSON.stringify(nb, null, 1)], { type: "application/x-ipynb+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadRecipe(id) {
  const r = RECIPES[id];
  const cells = [{ type: "md", text: `# ${r.title}\nRun the cells top to bottom. Change only the SETTINGS in the last cell.` }];
  r.blocks.forEach((b, i) => {
    cells.push({ type: "md", text: `## ${i + 1}. ${BLOCKS[b].title}` });
    cells.push({ type: "code", text: BLOCKS[b].code });
  });
  downloadNotebook(`${id}.ipynb`, cells);
}
