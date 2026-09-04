import joblib
import pandas as pd

MODEL_PATH = "app/ml/models/fraud_model.joblib"
THRESHOLD_PATH = "app/ml/models/threshold_config.joblib"

FEATURE_COLUMNS = [
    "amount",
    "account_age_days",
    "device_age_days",
    "transactions_last_24h",
    "previous_chargebacks",
    "ip_risk",
    "device_risk",
    "unknown_location",
]


def load_model():
    return joblib.load(MODEL_PATH)


def load_threshold():
    config = joblib.load(THRESHOLD_PATH)
    return float(config["threshold"])


def build_ml_features(transaction: dict) -> pd.DataFrame:
    features = {
        "amount": float(transaction.get("amount", 0)),
        "account_age_days": float(
            transaction.get("account_age_days", 365)
        ),
        "device_age_days": float(
            transaction.get("device_age_days", 180)
        ),
        "transactions_last_24h": float(
            transaction.get("transactions_last_24h", 1)
        ),
        "previous_chargebacks": float(
            transaction.get("previous_chargebacks", 0)
        ),
        "ip_risk": float(
            transaction.get("ip_risk", 0.1)
        ),
        "device_risk": float(
            transaction.get("device_risk", 0.1)
        ),
        "unknown_location": int(
            str(transaction.get("location", "")).lower()
            == "unknown"
        ),
    }

    return pd.DataFrame(
        [[features[column] for column in FEATURE_COLUMNS]],
        columns=FEATURE_COLUMNS,
    )


def predict_fraud(transaction: dict) -> dict:
    model = load_model()
    threshold = load_threshold()

    features = build_ml_features(transaction)

    probability = float(
        model.predict_proba(features)[0][1]
    )

    if probability >= threshold:
        decision = "BLOCK"
    elif probability >= threshold * 0.60:
        decision = "REVIEW"
    else:
        decision = "ALLOW"

    return {
        "fraud_probability": round(probability, 4),
        "risk_score": round(probability * 100, 2),
        "threshold": threshold,
        "decision": decision,
    }