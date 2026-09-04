import os

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest


MODEL_PATH = "app/ml/models/anomaly_model.joblib"

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


def train_anomaly_model():
    data_path = "data/synthetic/transactions.csv"

    df = pd.read_csv(data_path)

    X = df[FEATURE_COLUMNS]

    model = IsolationForest(
        n_estimators=250,
        contamination=0.08,
        random_state=42,
    )

    model.fit(X)

    os.makedirs(
        os.path.dirname(MODEL_PATH),
        exist_ok=True,
    )

    joblib.dump(model, MODEL_PATH)

    print("Anomaly detection model trained.")
    print(f"Saved to: {MODEL_PATH}")


def calculate_anomaly_score(transaction: dict) -> float:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Anomaly model not found. "
            "Run: python -m app.detection.anomaly_detector"
        )

    model = joblib.load(MODEL_PATH)

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

    X = pd.DataFrame(
        [[features[column] for column in FEATURE_COLUMNS]],
        columns=FEATURE_COLUMNS,
    )

    # Isolation Forest:
    # -1 = anomaly
    #  1 = normal
    prediction = model.predict(X)[0]

    decision_score = model.decision_function(X)[0]

    # Convert anomaly signal into 0-100 risk.
    if prediction == -1:
        anomaly_score = 80 + min(
            abs(float(decision_score)) * 100,
            20,
        )
    else:
        anomaly_score = max(
            0,
            30 - (float(decision_score) * 100),
        )

    return round(
        min(anomaly_score, 100),
        2,
    )


if __name__ == "__main__":
    train_anomaly_model()