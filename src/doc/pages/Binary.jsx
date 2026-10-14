import { Block, BlockSection, Callout, Fns, H2, Ifs, PageHead, QA, RecipeBar, Settings, Table, Term } from "../components";
import { OriginalLinks } from "./Notebooks";

export default function Binary() {
  return (
    <>
      <PageHead kicker="HW06 Part B · horses vs camels" title="Binary metrics: BCE vs CCE" likely="most">
        Train ResNet50 four ways (<Term k="sigmoid">sigmoid</Term> + <Term k="bce">BCE</Term> or{" "}
        <Term k="softmax">softmax</Term> + <Term k="cce">CCE</Term>, frozen or full) and report every metric.
      </PageHead>

      <RecipeBar id="binary" />

      <H2 id="settings">Settings</H2>
      <Settings
        rows={[
          ["MODEL_NAME", "Pretrained base model.", <><code>"resnet50"</code>, <code>"resnet18"</code> (3x faster)</>],
          ["BATCH_SIZE", "Images per update.", "32"],
          ["EPOCHS", "Same for every model, so the comparison is fair. ~4 min total for 15 epochs on your Mac.", "15 (3 to test)"],
          ["LR", "Learning rate, same for all models.", "3e-4"],
          ["VAL_PER_CLASS", "Images per class moved from train to validation (HW06 says 20).", "20"],
          ["MODELS", <>Name → (<code>head</code>, <code>freeze</code>). head "sigmoid" = 1 output, "softmax" = 2 outputs with <Term k="onehot">one-hot</Term> labels. freeze True = only the head learns.</>, <code>("sigmoid", True)</code>],
        ]}
      />
      <Callout type="info" title="How the loss is chosen">
        <code>pretrained_model(..., head="sigmoid")</code> puts <code>Linear(2048, 1) + Sigmoid</code> on top and{" "}
        <code>train_model</code> uses binary cross-entropy. <code>head="softmax"</code> puts{" "}
        <code>Linear(2048, 2) + Softmax</code> and uses categorical cross-entropy with one-hot labels, exactly like the
        homework asks. Each model starts from fresh ImageNet weights.
      </Callout>

      <BlockSection id="metrics">
        <Fns
          rows={[
            ["get_metrics(y_true, y_pred, y_prob)", "Prints TP/TN/FP/FN, accuracy, precision, sensitivity, specificity, F1, AUC. 3+ classes: macro averages + per-class report.", "dict"],
            ["plot_confusion(y_true, y_pred, class_names)", <><Term k="confusion">Confusion matrix</Term> heatmap (seaborn).</>, "matrix"],
            ["plot_roc(y_true, y_prob)", <><Term k="roc">ROC curve</Term> with the <Term k="auc">AUC</Term> in the legend.</>, "AUC"],
            ["show_mistakes(y_true, y_pred, class_names)", "\"camel predicted as horse: 3\"", "—"],
            ["show_predictions(model, loader, class_names)", "Test images with predicted vs actual label (red = wrong).", "—"],
            ["results_table(results)", "{model name: metrics} → one table, best first.", "DataFrame"],
          ]}
        />
        <p>
          The inputs come from <code>r = evaluate(model, test_loader)</code>: <code>r["y_true"]</code>, <code>r["y_pred"]</code>,{" "}
          <code>r["y_prob"]</code> (probability of class 1).
        </p>
        <Block id="metrics" />
      </BlockSection>

      <BlockSection id="binary_recipe">
        <Block id="binary_recipe" />
      </BlockSection>

      <H2 id="formulas">Metric cheat sheet</H2>
      <p>
        Folders are sorted alphabetically: <b>camel = 0 (negative)</b>, <b>horse = 1 (positive)</b>.
      </p>
      <Table
        head={["", "Predicted camel", "Predicted horse"]}
        rows={[
          [<b>Actual camel</b>, "TN (true negative)", "FP (false positive, false alarm)"],
          [<b>Actual horse</b>, "FN (false negative, a miss)", "TP (true positive)"],
        ]}
      />
      <Table
        head={["Metric", "Formula", "Plain English"]}
        rows={[
          [<Term k="accuracy">Accuracy</Term>, <code>(TP + TN) / all</code>, "How many predictions were right."],
          [<Term k="precision">Precision</Term>, <code>TP / (TP + FP)</code>, "When it says horse, how often is it a horse?"],
          [<Term k="recall">Sensitivity (recall)</Term>, <code>TP / (TP + FN)</code>, "Of all horses, how many did it find?"],
          [<Term k="specificity">Specificity</Term>, <code>TN / (TN + FP)</code>, "Of all camels, how many did it call camel?"],
          [<Term k="f1">F1</Term>, <code>2·TP / (2·TP + FP + FN)</code>, "Balance of precision and recall."],
          [<Term k="auc">AUC</Term>, "area under ROC", "1 = perfect ranking, 0.5 = guessing."],
        ]}
      />

      <H2 id="curves">Reading a learning curve</H2>
      <Table
        head={["What you see", "Verdict", "Say this"]}
        rows={[
          ["Train and validation loss both still falling at the last epoch", <Term k="underfit">Underfitted</Term>, "Not converged yet; more epochs (or a higher learning rate) would help."],
          ["Train loss near 0, validation loss rising or jumping", <Term k="overfit">Overfitted</Term>, "It memorizes the training images; use augmentation, fewer epochs, freeze more, or early stopping."],
          ["Both flatten out low and close together", "Well-trained", <><Term k="convergence">Converged</Term> with a small train-validation gap.</>],
          ["Validation curve zig-zags", "Unstable", "Learning rate too high or too few validation images (each image = 2.5% of 40)."],
        ]}
      />

      <H2 id="compare">Comparison paragraph (your HW06 results)</H2>
      <Table
        head={["Model", "Accuracy", "Precision", "Sensitivity", "Specificity", "AUC"]}
        rows={[
          ["BCE frozen", "0.950", "0.909", "1.000", "0.900", "1.000"],
          ["CCE frozen", "0.975", "0.952", "1.000", "0.950", "1.000"],
          ["BCE full", "0.900", "0.833", "1.000", "0.800", "0.983"],
          ["CCE full", "0.950", "0.950", "0.950", "0.950", "0.997"],
        ]}
      />
      <QA q="BCE vs CCE (frozen, only the classifier trains)">
        Both trained smoothly and stayed close (stable, no overfitting). CCE converged faster: its loss was lower at
        every epoch (validation 0.15 vs 0.32 at epoch 15) and it was slightly better on test (0.975 vs 0.95). For two
        classes the math is almost the same; with softmax both output weights update together, so with the same learning
        rate the prediction moves about twice as fast. BCE mostly needed more epochs.
      </QA>
      <QA q="BCE vs CCE (full fine-tuning)">
        Both reached almost zero training loss in 2–3 epochs (fast convergence), but validation loss jumped around (less
        stable) because 23.5 M weights were trained on 320 images. BCE overfitted more (0.90 accuracy, 4 camels called
        horses); CCE did better (0.95, AUC 0.997). A smaller learning rate or early stopping would help.
      </QA>
      <QA q="Overall">
        Frozen training was slower but smooth and gave the best model (CCE frozen, 0.975). Full fine-tuning was fast but
        unstable and overfits with little data. The test set has 40 images, so one image = 2.5%.
      </QA>

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Change the decision threshold (e.g. 0.3)", <><code>y_pred = (r["y_prob"] &gt;= 0.3).astype(int)</code> then <code>get_metrics(r["y_true"], y_pred, r["y_prob"])</code></>],
          ["Make horse the negative class", "Rename the folders so horse sorts first, or swap: y = 1 - y"],
          ["Only two of the four models", "Delete lines from MODELS"],
          ["Report the metrics as a table", <><code>print(results_table(results))</code> (already at the end)</>],
          ["Metrics by hand with sklearn", <><code>precision_score, recall_score, f1_score, roc_auc_score</code> (imported in the block)</>],
          ["Do it in Keras", <a href="#/keras/block-keras_transfer">Keras transfer block</a>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="What is a confusion matrix?">
        A table comparing true labels (rows) with predicted labels (columns). For 2 classes it holds TP, TN, FP and FN, so
        it shows which kind of mistakes the model makes, not just how many.
      </QA>
      <QA q="What is accuracy and how is it measured?">The fraction of all predictions that are correct: (TP + TN) / (TP + TN + FP + FN).</QA>
      <QA q="What is precision and how is it measured?">Of everything predicted positive, the fraction that really is positive: TP / (TP + FP).</QA>
      <QA q="What is sensitivity and how is it measured?">Also called recall or true positive rate. Of all actual positives, the fraction the model found: TP / (TP + FN).</QA>
      <QA q="What is specificity and how is it measured?">Of all actual negatives, the fraction correctly predicted negative: TN / (TN + FP).</QA>
      <QA q="What is an ROC curve and how is it computed?">
        It plots the true positive rate (sensitivity) against the false positive rate (1 − specificity). Take the
        predicted probabilities, try every threshold from 1 down to 0, and compute TPR and FPR at each one; every
        threshold is one point. The area under it (AUC) is 1 for a perfect model and 0.5 for random guessing.
      </QA>
      <QA q="When to use softmax vs sigmoid in the last layer?">
        Softmax when each input belongs to exactly one of several classes (outputs add up to 1). Sigmoid for binary
        problems with one output, or multi-label problems where an input can have several classes at once. For two
        classes both give the same answer; one sigmoid output is simpler.
      </QA>

      <OriginalLinks topic="binary" />
    </>
  );
}
