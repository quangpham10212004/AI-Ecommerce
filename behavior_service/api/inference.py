import json
import math
from functools import lru_cache
from pathlib import Path


MODEL_PATH = Path(__file__).resolve().parent / "assets" / "lstm_model.json"

PRODUCT_CATALOG = {
    1: {"name": "Sony WH-1000XM5", "reason": "strong audio and premium-travel preference"},
    2: {"name": "Keychron Q1", "reason": "high productivity and accessories affinity"},
    3: {"name": "Logitech MX Master 3S", "reason": "workspace and productivity workflow fit"},
    4: {"name": "LG UltraGear 27", "reason": "monitor-upgrade intent detected"},
    5: {"name": "Dell XPS 13", "reason": "premium laptop shopping signal"},
    6: {"name": "MacBook Air M3", "reason": "high-value mobile computing interest"},
    7: {"name": "Anker 737 Power Bank", "reason": "mobility and accessory bundling opportunity"},
    8: {"name": "Samsung T7 Shield 1TB", "reason": "portable storage cross-sell potential"},
    9: {"name": "JBL Flip 6", "reason": "audio lifestyle signal with portable usage"},
    10: {"name": "Rain Design mStand", "reason": "desk setup and ergonomic accessory fit"},
}

CATEGORY_KEYWORDS = {
    "audio_interest": {"audio", "headphone", "tai nghe", "speaker", "loa"},
    "accessory_interest": {"accessory", "phu kien", "keyboard", "mouse", "stand"},
    "laptop_interest": {"laptop", "macbook", "xps", "notebook"},
    "monitor_interest": {"monitor", "display", "man hinh", "screen"},
}


def _sigmoid(value):
    return 1.0 / (1.0 + math.exp(-value))


def _vector_matrix_sum(input_vector, hidden_vector, gate_weights):
    outputs = []
    for input_weights, recurrent_weights, bias in zip(
        gate_weights["kernel"],
        gate_weights["recurrent_kernel"],
        gate_weights["bias"],
    ):
        total = bias
        total += sum(value * weight for value, weight in zip(input_vector, input_weights))
        total += sum(value * weight for value, weight in zip(hidden_vector, recurrent_weights))
        outputs.append(total)
    return outputs


def _softmax(logits):
    max_logit = max(logits)
    exps = [math.exp(logit - max_logit) for logit in logits]
    total = sum(exps)
    return [value / total for value in exps]


def _normalize_text(value):
    return str(value or "").strip().lower()


def _contains_any(value, keywords):
    normalized_value = _normalize_text(value)
    return any(keyword in normalized_value for keyword in keywords)


def _build_feature_sequence(features, model):
    return [
        [features[label] for label in timestep_labels]
        for timestep_labels in model["sequence_labels"]
    ]


def _run_lstm(sequence, model):
    hidden_state = [0.0] * model["hidden_size"]
    cell_state = [0.0] * model["hidden_size"]

    for timestep in sequence:
        forget_gate = [
            _sigmoid(value)
            for value in _vector_matrix_sum(timestep, hidden_state, model["forget_gate"])
        ]
        input_gate = [
            _sigmoid(value)
            for value in _vector_matrix_sum(timestep, hidden_state, model["input_gate"])
        ]
        candidate_gate = [
            math.tanh(value)
            for value in _vector_matrix_sum(timestep, hidden_state, model["candidate_gate"])
        ]
        output_gate = [
            _sigmoid(value)
            for value in _vector_matrix_sum(timestep, hidden_state, model["output_gate"])
        ]

        cell_state = [
            (forget_value * previous_cell) + (input_value * candidate_value)
            for forget_value, previous_cell, input_value, candidate_value in zip(
                forget_gate,
                cell_state,
                input_gate,
                candidate_gate,
            )
        ]
        hidden_state = [
            output_value * math.tanh(cell_value)
            for output_value, cell_value in zip(output_gate, cell_state)
        ]

    return hidden_state


@lru_cache(maxsize=1)
def load_model():
    with MODEL_PATH.open("r", encoding="utf-8") as model_file:
        return json.load(model_file)


def _build_feature_vector(payload):
    recent_views = payload.get("recent_views") or []
    preferred_category = payload.get("preferred_category", "")
    search_terms = payload.get("search_terms", "")
    combined_text = " ".join([preferred_category, search_terms, " ".join(str(item) for item in recent_views)])

    cart_value = float(payload.get("cart_value", 0) or 0)
    recent_views_count = len(recent_views)

    features = {
        "cart_value_norm": min(cart_value / 40000000.0, 1.0),
        "recent_views_count_norm": min(recent_views_count / 10.0, 1.0),
        "audio_interest": 1.0 if _contains_any(combined_text, CATEGORY_KEYWORDS["audio_interest"]) else 0.0,
        "accessory_interest": 1.0 if _contains_any(combined_text, CATEGORY_KEYWORDS["accessory_interest"]) else 0.0,
        "laptop_interest": 1.0 if _contains_any(combined_text, CATEGORY_KEYWORDS["laptop_interest"]) else 0.0,
        "monitor_interest": 1.0 if _contains_any(combined_text, CATEGORY_KEYWORDS["monitor_interest"]) else 0.0,
        "premium_intent": min(float(payload.get("premium_intent", 0) or 0), 1.0),
        "productivity_intent": min(float(payload.get("productivity_intent", 0) or 0), 1.0),
        "mobility_intent": min(float(payload.get("mobility_intent", 0) or 0), 1.0),
        "support_intent": min(float(payload.get("support_intent", 0) or 0), 1.0),
    }
    return features


def predict_products(payload, top_k=3):
    model = load_model()
    features = _build_feature_vector(payload)
    sequence = _build_feature_sequence(features, model)
    hidden_layer = _run_lstm(sequence, model)
    logits = [
        sum(weight * hidden_value for weight, hidden_value in zip(weights, hidden_layer)) + bias
        for weights, bias in zip(model["output_weights"], model["output_biases"])
    ]
    probabilities = _softmax(logits)

    ranked_predictions = sorted(
        zip(model["output_labels"], probabilities),
        key=lambda item: item[1],
        reverse=True,
    )[:top_k]

    recommendations = []
    for product_id, score in ranked_predictions:
        catalog_entry = PRODUCT_CATALOG[product_id]
        recommendations.append(
            {
                "product_id": product_id,
                "name": catalog_entry["name"],
                "score": round(score, 4),
                "reason": catalog_entry["reason"],
            }
        )

    return {
        "model_type": "lstm",
        "input_features": features,
        "sequence_steps": sequence,
        "recommendations": recommendations,
    }
