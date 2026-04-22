import os
import random
from pathlib import Path

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import Bidirectional, Dense, Dropout, Input, LSTM, SimpleRNN
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.sequence import pad_sequences


SEED = 42
MAX_LEN = 10
DATA_PATH = Path(__file__).resolve().parent / "data_user500.csv"


def set_seed(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)


def load_dataset():
    df = pd.read_csv(DATA_PATH)
    if "category" not in df.columns:
        raise ValueError("data_user500.csv phải có cột 'category'.")

    action_encoder = LabelEncoder()
    category_encoder = LabelEncoder()

    df["action_encoded"] = action_encoder.fit_transform(df["action"])
    df["category_encoded"] = category_encoder.fit_transform(df["category"])

    action_sequences = []
    category_sequences = []
    labels = []

    for _, group in df.groupby("user_id"):
        group = group.sort_values("timestamp")
        actions = group["action_encoded"].tolist()
        categories = group["category_encoded"].tolist()

        for i in range(1, len(group)):
            action_sequences.append(actions[:i])
            category_sequences.append(categories[:i])
            labels.append(actions[i])

    x_action = pad_sequences(action_sequences, maxlen=MAX_LEN, padding="pre", truncating="pre")
    x_category = pad_sequences(category_sequences, maxlen=MAX_LEN, padding="pre", truncating="pre")
    x = np.stack([x_action, x_category], axis=-1).astype("float32")
    y = np.array(labels, dtype="int32")

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=SEED,
        stratify=y,
    )

    majority_baseline = float(pd.Series(y_test).value_counts(normalize=True).max())
    return x_train, x_test, y_train, y_test, action_encoder, category_encoder, majority_baseline


def build_model(kind: str, input_shape: tuple[int, int], num_classes: int) -> Sequential:
    if kind == "RNN":
        backbone = SimpleRNN(64)
    elif kind == "LSTM":
        backbone = LSTM(64)
    elif kind == "biLSTM":
        backbone = Bidirectional(LSTM(64))
    else:
        raise ValueError(f"Unsupported model kind: {kind}")

    model = Sequential(
        [
            Input(shape=input_shape),
            backbone,
            Dropout(0.2),
            Dense(32, activation="relu"),
            Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        loss="sparse_categorical_crossentropy",
        optimizer="adam",
        metrics=["accuracy"],
    )
    return model


def train_all_models(x_train, x_test, y_train, y_test, num_classes: int):
    histories = {}
    models = {}
    callbacks = [EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True)]

    for kind in ["RNN", "LSTM", "biLSTM"]:
        model = build_model(kind, (MAX_LEN, 2), num_classes)
        history = model.fit(
            x_train,
            y_train,
            validation_data=(x_test, y_test),
            epochs=12,
            batch_size=32,
            verbose=1,
            callbacks=callbacks,
        )
        histories[kind] = history
        models[kind] = model

    return models, histories


def plot_histories(histories):
    plt.figure(figsize=(12, 5))
    for kind, history in histories.items():
        plt.plot(history.history["accuracy"], label=f"{kind} train")
        plt.plot(history.history["val_accuracy"], linestyle="--", label=f"{kind} val")
    plt.title("Training vs Validation Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.show()

    best_scores = {kind: max(h.history["val_accuracy"]) for kind, h in histories.items()}
    plt.figure(figsize=(7, 4))
    plt.bar(best_scores.keys(), best_scores.values(), color=["#2563eb", "#16a34a", "#ea580c"])
    plt.title("Best Validation Accuracy Comparison")
    plt.ylabel("Best val_accuracy")
    plt.ylim(0, 1)
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.show()


def save_models(models):
    base_dir = Path(__file__).resolve().parent
    models["RNN"].save(base_dir / "model_rnn.h5")
    models["LSTM"].save(base_dir / "model_lstm.h5")
    models["biLSTM"].save(base_dir / "model_bilstm.h5")


def main():
    set_seed()
    x_train, x_test, y_train, y_test, action_encoder, category_encoder, baseline = load_dataset()
    print("Input shape:", x_train.shape)
    print("Majority baseline:", round(baseline, 4))
    print("Action classes:", list(action_encoder.classes_))
    print("Category classes:", list(category_encoder.classes_))

    models, histories = train_all_models(x_train, x_test, y_train, y_test, len(action_encoder.classes_))

    results = {kind: max(h.history["val_accuracy"]) for kind, h in histories.items()}
    print("Best validation accuracy:", {k: round(float(v), 4) for k, v in results.items()})

    plot_histories(histories)
    save_models(models)


if __name__ == "__main__":
    main()
