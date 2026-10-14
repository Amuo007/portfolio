# HW04 Part B experiments: more layers, other batch sizes, other activations -> one table.
# Needs the same blocks as the CNN recipe. Each row trains a fresh model.
import pandas as pd

DATASET = "MNIST"
EPOCHS = 3              # keep small: every experiment trains a new model
BASE = dict(channels=(16,), batch_size=32, activation="relu")   # the starting model

EXPERIMENTS = {
    "base (1 conv)":     {},
    "2 conv layers":     {"channels": (16, 32)},
    "3 conv layers":     {"channels": (16, 32, 64)},
    "batch 64":          {"batch_size": 64},
    "batch 128":         {"batch_size": 128},
    "batch 256":         {"batch_size": 256},
    "tanh":              {"activation": "tanh"},
    "leaky_relu":        {"activation": "leaky_relu"},
    "sigmoid":           {"activation": "sigmoid"},
}

rows, loaders = [], {}
for name, change in EXPERIMENTS.items():
    cfg = {**BASE, **change}
    print(f"\n===== {name}: {cfg}")
    if cfg["batch_size"] not in loaders:                         # reuse loaders for the same batch size
        loaders[cfg["batch_size"]] = load_builtin(DATASET, batch_size=cfg["batch_size"])
    train_loader, val_loader, test_loader, classes, shape = loaders[cfg["batch_size"]]

    set_seed(42)
    model = make_cnn(shape[0], len(classes), shape[1], channels=cfg["channels"],
                     activation=cfg["activation"], dropout=0.5)
    history = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=1e-3)
    r = evaluate(model, test_loader)
    rows.append({"Experiment": name, "Test accuracy": r["accuracy"], "Best val accuracy": max(history["val_acc"]),
                 "Seconds per epoch": sum(history["seconds"]) / len(history["seconds"]),
                 "Parameters": sum(p.numel() for p in model.parameters())})

table = pd.DataFrame(rows).set_index("Experiment").round(4)
print(table)
table["Test accuracy"].plot.barh(title="Test accuracy per experiment", xlim=(table["Test accuracy"].min() - 0.01, 1))
plt.show()
