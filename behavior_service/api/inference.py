import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import numpy as np
from functools import lru_cache
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "assets" / "model_lstm.h5"

# LabelEncoder fit order (sklearn alphabetical sort)
ACTION_CLASSES = ["add_to_cart", "click", "purchase", "remove_from_cart", "review", "search", "view", "wishlist"]
ACTION_TO_IDX = {a: i for i, a in enumerate(ACTION_CLASSES)}

# Map predicted next-action → intent signal → recommended product ids
ACTION_INTENT = {
    "purchase":        {"intent": "high_purchase", "categories": ["Audio", "Laptop"]},
    "add_to_cart":     {"intent": "cart_intent",   "categories": ["Accessories", "Audio"]},
    "wishlist":        {"intent": "wishlist",       "categories": ["Laptop", "Monitor"]},
    "view":            {"intent": "browsing",       "categories": ["Audio", "Accessories"]},
    "click":           {"intent": "interest",       "categories": ["Monitor", "Storage"]},
    "search":          {"intent": "searching",      "categories": ["Laptop", "Audio"]},
    "review":          {"intent": "post_purchase",  "categories": ["Accessories"]},
    "remove_from_cart":{"intent": "reconsidering",  "categories": ["Audio", "Laptop"]},
}

CATEGORY_PRODUCTS = {
    "Audio":       [{"product_id": 1, "name": "Sony WH-1000XM5",        "reason": "Top audio pick"},
                    {"product_id": 9, "name": "JBL Flip 6",              "reason": "Portable audio"}],
    "Accessories": [{"product_id": 2, "name": "Keychron Q1",             "reason": "Productivity accessory"},
                    {"product_id": 3, "name": "Logitech MX Master 3S",   "reason": "Workflow accessory"},
                    {"product_id": 10,"name": "Rain Design mStand",       "reason": "Desk setup"}],
    "Laptop":      [{"product_id": 5, "name": "Dell XPS 13",             "reason": "Premium laptop"},
                    {"product_id": 6, "name": "MacBook Air M3",           "reason": "Apple ecosystem"}],
    "Monitor":     [{"product_id": 4, "name": "LG UltraGear 27",         "reason": "Display upgrade"}],
    "Storage":     [{"product_id": 8, "name": "Samsung T7 Shield 1TB",   "reason": "Portable storage"},
                    {"product_id": 7, "name": "Anker 737 Power Bank",     "reason": "Mobile power"}],
}


@lru_cache(maxsize=1)
def load_model():
    import tensorflow as tf
    try:
        return tf.keras.models.load_model(str(MODEL_PATH), compile=False)
    except Exception:
        # Fallback: rebuild architecture and load weights only
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(10, 1)),
            tf.keras.layers.LSTM(64),
            tf.keras.layers.Dense(8, activation="softmax"),
        ])
        model.load_weights(str(MODEL_PATH))
        return model


def _encode_sequence(recent_actions: list[str]) -> np.ndarray:
    """Convert list of action strings → padded sequence of shape (1, 10, 1)."""
    encoded = [ACTION_TO_IDX.get(a, ACTION_TO_IDX["view"]) for a in recent_actions]
    # pre-pad to length 10
    padded = ([0] * max(0, 10 - len(encoded)) + encoded)[-10:]
    return np.array(padded, dtype=np.float32).reshape(1, 10, 1)


def predict_products(payload: dict, top_k: int = 3) -> dict:
    recent_actions = payload.get("recent_actions") or ["view"] * 5
    model = load_model()

    seq = _encode_sequence(recent_actions)
    probs = model.predict(seq, verbose=0)[0]          # shape (8,)
    predicted_idx = int(np.argmax(probs))
    predicted_action = ACTION_CLASSES[predicted_idx]
    confidence = float(probs[predicted_idx])

    intent_info = ACTION_INTENT.get(predicted_action, ACTION_INTENT["view"])
    categories = intent_info["categories"]

    # Collect product recommendations from predicted categories
    recommendations = []
    seen = set()
    for cat in categories:
        for prod in CATEGORY_PRODUCTS.get(cat, []):
            if prod["product_id"] not in seen:
                recommendations.append({
                    "product_id": prod["product_id"],
                    "name": prod["name"],
                    "score": round(confidence, 4),
                    "reason": f"{prod['reason']} — predicted next action: {predicted_action}",
                })
                seen.add(prod["product_id"])
            if len(recommendations) >= top_k:
                break
        if len(recommendations) >= top_k:
            break

    return {
        "model_type": "lstm",
        "predicted_next_action": predicted_action,
        "confidence": round(confidence, 4),
        "intent": intent_info["intent"],
        "recommendations": recommendations,
        "input_sequence": recent_actions,
    }
