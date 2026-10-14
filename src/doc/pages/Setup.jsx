import { Block, BlockSection, Callout, Code, H2, PageHead, Table, Term } from "../components";

const CONDA = `conda create -n exam python=3.12 -y
conda activate exam
pip install numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations
pip install jupyter ipykernel kagglehub
python -m ipykernel install --user --name exam --display-name "Python (exam)"
jupyter notebook`;

const VENV = `python3.12 -m venv ~/exam-env          # or: uv venv --python 3.12 ~/exam-env
source ~/exam-env/bin/activate
pip install numpy matplotlib pandas seaborn scikit-learn pillow opencv-python tqdm requests torch torchvision torchaudio tensorflow keras kaggle scikit-image albumentations jupyter ipykernel kagglehub`;

export default function Setup() {
  return (
    <>
      <PageHead kicker="Do this before the exam" title="Setup & downloads">
        A fresh environment with the professor's exact list, then download every dataset and model once so
        nothing big downloads during the 40 minutes.
      </PageHead>

      <Callout type="warn" title="Your current Anaconda base environment is broken for this">
        In <code>/opt/anaconda3</code> NumPy was upgraded to 2.x, and TensorFlow, pandas, scikit-learn and seaborn
        now fail to import there. Make the new environment below instead of using <code>base</code>.
      </Callout>

      <H2 id="checklist">Checklist</H2>
      <ol className="steps">
        <li><b>Create the environment</b> (below, ~5 min). Python 3.12 works with every package. This exact list was installed and tested.</li>
        <li><b>Run the check cell.</b> Every line should say OK and the Device should be <code>mps</code>.</li>
        <li><b>Run the warm-up cell</b> once (5–15 min). It downloads MNIST, Fashion-MNIST, CIFAR-10, horses vs camels and the pretrained weights.</li>
        <li><b>Start Ollama</b> only if you want the LLM page to work (<code>ollama pull mistral</code>, <code>ollama pull llava</code>).</li>
        <li><b>Bookmark this site.</b></li>
      </ol>

      <H2 id="env">Create the environment</H2>
      <p>Conda (what you used for the homeworks):</p>
      <Code code={CONDA} lang="bash" title="terminal" />
      <p>Or without conda:</p>
      <Code code={VENV} lang="bash" title="terminal" />
      <Callout type="tip">
        <code>kagglehub</code>, <code>jupyter</code> and <code>ipykernel</code> are not in the professor's list but the
        homeworks need them. Inside a notebook you can always install a missing package with{" "}
        <code>%pip install name</code>, then restart the kernel.
      </Callout>

      <BlockSection id="setup_check">
        <p>Run first. It prints every library version and picks the fastest <Term k="cuda">device</Term>.</p>
        <Block id="setup_check" />
      </BlockSection>

      <BlockSection id="warmup">
        <p>
          Pre-downloads everything into <code>~/datasets</code>, <code>~/.cache/torch</code> and <code>~/.keras</code>.
          CIFAR-10 comes from a very slow university server (about 10 minutes in testing), so do this before the exam.
        </p>
        <Block id="warmup" />
      </BlockSection>

      <H2 id="kaggle">Kaggle datasets</H2>
      <p>
        Public datasets download with no login. The <Term k="kaggle">slug</Term> is the{" "}
        <code>owner/name</code> part of the URL: kaggle.com/datasets/<b>akrsnv/horses-and-camels</b>.
      </p>
      <BlockSection id="kaggle_download">
        <Block id="kaggle_download" />
      </BlockSection>
      <Table
        head={["Way", "Command", "Notes"]}
        rows={[
          ["kagglehub (Python)", <code>kagglehub.dataset_download(slug, output_dir="dataset")</code>, "Used in HW03 and HW06. Needs pip install kagglehub."],
          ["kaggle (terminal)", <code>!kaggle datasets download owner/name -p dataset --unzip</code>, "In the exam list. Works without login for public data (tested)."],
          ["Browser", "Download button on the dataset page", "Unzip into a folder named dataset next to the notebook."],
          ["Private dataset / competition", <code>kaggle auth login</code>, "Only then is a login needed."],
        ]}
      />

      <H2 id="jupyter">Jupyter in 30 seconds</H2>
      <Table
        head={["Action", "How"]}
        rows={[
          ["Run a cell", <><kbd>Shift</kbd> + <kbd>Enter</kbd></>],
          ["New cell below", <><kbd>Esc</kbd> then <kbd>B</kbd></>],
          ["Split a big cell", <><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>-</kbd> at the cursor (JupyterLab)</>],
          ["Install a package", <code>%pip install albumentations</code>],
          ["Run a terminal command", <code>!ls dataset</code>],
          ["Something is weird", "Kernel → Restart & Run All"],
          ["Pick the exam environment", "Kernel → Change kernel → Python (exam)"],
          ["Export", "File → Save and Export Notebook As → HTML / PDF"],
        ]}
      />
    </>
  );
}
