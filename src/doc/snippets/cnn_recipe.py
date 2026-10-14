# HW04: CNN from scratch. Needs blocks: Train & evaluate, Metrics, Built-in data, CNN models.
# ---------------- SETTINGS: change these ----------------
DATASET = "MNIST"       # "MNIST", "FashionMNIST" or "CIFAR10"
VAL_FRACTION = 0.1      # 10% of the training images are used for validation
BATCH_SIZE = 32         # images per weight update (try 64, 128, 256)
EPOCHS = 10             # full passes over the training images
LR = 0.001              # learning rate: size of each learning step
OPTIMIZER = "adam"      # "adam" or "sgd"
DROPOUT = 0.5           # fraction of neurons switched off during training
ACTIVATION = "relu"     # "relu", "leaky_relu", "elu", "gelu", "tanh", "sigmoid"
CHANNELS = (16, 32)     # one number per conv layer: (16,) = 1 layer, (16, 32, 64) = 3 layers
# --------------------------------------------------------

set_seed(42)
train_loader, val_loader, test_loader, classes, shape = load_builtin(
    DATASET, val_fraction=VAL_FRACTION, batch_size=BATCH_SIZE)

model = make_cnn(in_channels=shape[0], num_classes=len(classes), img_size=shape[1],
                 channels=CHANNELS, activation=ACTIVATION, dropout=DROPOUT)
# model = BaseCNN(in_channels=shape[0], num_classes=len(classes), img_size=shape[1])  # exact HW04 Part A model
print(model)
count_params(model)

history = train_model(model, train_loader, val_loader, epochs=EPOCHS, lr=LR, optimizer=OPTIMIZER)
plot_history(history, f"{DATASET} CNN")

r = evaluate(model, test_loader)
print(f"\nTest accuracy: {r['accuracy']:.2%}")
get_metrics(r["y_true"], r["y_pred"], class_names=classes)
plot_confusion(r["y_true"], r["y_pred"], classes, f"{DATASET} confusion matrix")
show_mistakes(r["y_true"], r["y_pred"], classes)
show_predictions(model, test_loader, classes, n=8, imagenet=False)
