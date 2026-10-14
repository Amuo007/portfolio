import { H2, PageHead, Table } from "../components";

const C = ({ children }) => <code>{children}</code>;

export default function Fixes() {
  return (
    <>
      <PageHead kicker="Reference" title="Fix errors fast">
        Find the error text on the left (⌘F / Ctrl+F), apply the fix on the right.
      </PageHead>

      <H2 id="python">Python / Jupyter</H2>
      <Table
        head={["Error", "Fix"]}
        rows={[
          [<C>ModuleNotFoundError: No module named 'x'</C>, <><C>%pip install x</C> then Kernel → Restart. Names differ: cv2 → opencv-python, sklearn → scikit-learn, skimage → scikit-image, PIL → pillow</>],
          [<C>NameError: name 'train_model' is not defined</C>, "A block was not run. Run the cells top to bottom (or paste the full script)."],
          [<C>numpy.core.multiarray failed to import / _ARRAY_API not found</C>, "Mixed NumPy versions (your old base env). Use the new exam environment."],
          [<C>FileNotFoundError</C>, <>Wrong folder. Check with <C>!ls</C> / <C>!ls dataset</C>; paths are relative to the notebook</>],
          ["Kernel dies / restarts", "Out of memory: smaller BATCH_SIZE, IMG_SIZE 160, resnet18."],
        ]}
      />

      <H2 id="torch">PyTorch</H2>
      <Table
        head={["Error", "Fix"]}
        rows={[
          [<C>mat1 and mat2 shapes cannot be multiplied (64x3136 and 2704x10)</C>, <>The Linear layer size is wrong. Use <C>make_cnn</C> (computes it) or set Linear input = channels × H × W after the last pool (the first number in the message)</>],
          [<C>Expected 4-dimensional input ... got 3-dimensional</C>, <>Single image: add a batch dimension with <C>x.unsqueeze(0)</C></>],
          [<C>Given groups=1, weight of size [16, 1, 3, 3], expected input to have 1 channels, but got 3</C>, <>in_channels mismatch: use <C>shape[0]</C> from load_builtin (CIFAR10 = 3, MNIST = 1)</>],
          [<C>Expected all tensors to be on the same device</C>, <>Move both: <C>x, y = x.to(DEVICE), y.to(DEVICE)</C> and <C>model.to(DEVICE)</C></>],
          [<C>Target 2 is out of bounds</C>, "num_classes too small: use num_classes=len(classes)."],
          [<C>Using a target size that is different to the input size</C>, <>BCE with 1 output needs <C>out.squeeze(1)</C> and float labels (train_model handles this)</>],
          [<C>The operator ... is not currently implemented for the MPS device</C>, <>Run this first: <C>import os; os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"</C>, or use <C>DEVICE = "cpu"</C></>],
          ["Accuracy stuck at 50% (2 classes)", "Learning rate too high (try 1e-4) or labels wrong; check show_batch."],
          ["Loss is nan", "Learning rate too high; lower it 10x."],
          ["Everything is trainable when it should be frozen", <>Check <C>show_layers(model)</C> and <C>count_params(model)</C>; use freeze=True</>],
          ["Very slow", <>Device should print <C>mps</C>; use resnet18, fewer epochs, smaller IMG_SIZE</>],
        ]}
      />

      <H2 id="keras">TensorFlow / Keras</H2>
      <Table
        head={["Error", "Fix"]}
        rows={[
          [<C>Input 0 of layer ... is incompatible: expected shape=(None, 224, 224, 3), found (None, 256, 256, 3)</C>, <>Use the same IMG_SIZE in <C>image_dataset_from_directory(image_size=...)</C> and the model</>],
          [<C>No such layer: conv1_1</C>, <>Keras names are <C>block1_conv1</C>; print <C>[l.name for l in model.layers]</C></>],
          [<C>logits and labels must have the same shape ((None, 1) vs (None, 2))</C>, <>sigmoid head needs <C>label_mode="binary"</C>; softmax head needs <C>label_mode="categorical"</C></>],
          ["Accuracy stays ~0.5 with a frozen base", <>Wrong preprocessing: use the model's own <C>preprocess_input</C> (the block does)</>],
        ]}
      />

      <H2 id="data">Data, Kaggle, images</H2>
      <Table
        head={["Error", "Fix"]}
        rows={[
          [<C>Couldn't find any class folder in ...</C>, <>ImageFolder needs <C>folder/class_name/image.jpg</C>. Point it one level deeper (use <C>find_dir</C>)</>],
          [<C>AssertionError: train/test class folders differ</C>, "Train and test have different class folder names; fix or merge."],
          ["Kaggle asks to log in", <>Public data: use kagglehub or <C>kaggle datasets download owner/name</C>. Private: <C>kaggle auth login</C></>],
          ["CIFAR-10 download takes forever", "Its server is very slow (30+ min in testing). Run the warm-up cell before the exam, or use MNIST / FashionMNIST."],
          ["Image looks blue", <>OpenCV is BGR: <C>cv2.cvtColor(img, cv2.COLOR_BGR2RGB)</C></>],
          [<C>cv2.imread returned None</C>, "Wrong file name/path (OpenCV doesn't raise an error itself)."],
          ["albumentations: unexpected keyword argument", <>Version 2 renamed things: <C>RandomResizedCrop(size=(224, 224))</C>, <C>GaussNoise(std_range=...)</C>, <C>Affine</C> instead of ShiftScaleRotate</>],
        ]}
      />

      <H2 id="llm">Ollama / LangChain</H2>
      <Table
        head={["Error", "Fix"]}
        rows={[
          [<C>Connection refused localhost:11434</C>, <>Ollama is not running: open the app or <C>ollama serve</C></>],
          [<C>model "mistral" not found</C>, <C>ollama pull mistral</C>],
          [<C>does not support tools</C>, "Use a tool-capable model: mistral, llama3.1, qwen2.5."],
          ["Camera unavailable", "macOS: System Settings → Privacy → Camera → allow your terminal/Jupyter app, then restart it."],
        ]}
      />
    </>
  );
}
