import numpy as np
import pandas as pd
import joblib

from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split


DATA_PATH = "data/synthetic/transactions.csv"
MODEL_PATH = "app/ml/models/fraud_model.joblib"

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

TARGET_COLUMN = "is_fraud"


def optimize_threshold():
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # Same split used during model evaluation
    _, X_test, _, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    model = joblib.load(MODEL_PATH)

    probabilities = model.predict_proba(X_test)[:, 1]

    results = []

    # False positives are expensive in fraud prevention.
    false_positive_cost = 1.0
    false_negative_cost = 3.0

    for threshold in np.arange(0.10, 0.91, 0.01):

        predictions = (
            probabilities >= threshold
        ).astype(int)

        tp = int(((predictions == 1) & (y_test == 1)).sum())
        fp = int(((predictions == 1) & (y_test == 0)).sum())
        fn = int(((predictions == 0) & (y_test == 1)).sum())

        cost = (
            fp * false_positive_cost
            + fn * false_negative_cost
        )

        precision = precision_score(
            y_test,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y_test,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y_test,
            predictions,
            zero_division=0,
        )

        results.append(
            {
                "threshold": round(float(threshold), 2),
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "false_positives": fp,
                "false_negatives": fn,
                "cost": cost,
            }
        )

    results_df = pd.DataFrame(results)

    best = results_df.loc[
        results_df["cost"].idxmin()
    ]

    print("\n================================")
    print("THRESHOLD OPTIMIZATION")
    print("================================")

    print(f"Best threshold : {best['threshold']:.2f}")
    print(f"Precision      : {best['precision']:.4f}")
    print(f"Recall         : {best['recall']:.4f}")
    print(f"F1 Score       : {best['f1']:.4f}")
    print(f"False Positives: {int(best['false_positives'])}")
    print(f"False Negatives: {int(best['false_negatives'])}")
    print(f"Estimated Cost : {best['cost']:.2f}")

    print("\nTop 10 thresholds by cost:")

    print(
        results_df
        .sort_values("cost")
        .head(10)
        .to_string(index=False)
    )

    # Save optimized threshold
    threshold_config = {
        "threshold": float(best["threshold"]),
        "precision": float(best["precision"]),
        "recall": float(best["recall"]),
        "f1": float(best["f1"]),
        "false_positive_cost": false_positive_cost,
        "false_negative_cost": false_negative_cost,
    }

    joblib.dump(
        threshold_config,
        "app/ml/models/threshold_config.joblib",
    )

    print(
        "\nThreshold configuration saved successfully."
    )


if __name__ == "__main__":
    optimize_threshold()