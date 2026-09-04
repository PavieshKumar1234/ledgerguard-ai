from pathlib import Path
from time import perf_counter

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "fraud_model.joblib"
TEST_RESULTS_PATH = MODEL_DIR / "test_metrics.joblib"
THRESHOLD_PATH = MODEL_DIR / "threshold_config.joblib"
MODEL_COMPARISON_PATH = MODEL_DIR / "model_comparison.joblib"
CURVES_PATH = MODEL_DIR / "evaluation_curves.joblib"


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


# ============================================================
# DATASET
# ============================================================

def create_synthetic_dataset(
    rows: int = 10000,
) -> pd.DataFrame:

    rng = np.random.default_rng(42)

    data = pd.DataFrame(
        {
            "amount": rng.lognormal(
                mean=8.0,
                sigma=1.0,
                size=rows,
            ),
            "account_age_days": rng.integers(
                1,
                1500,
                rows,
            ),
            "device_age_days": rng.integers(
                1,
                1000,
                rows,
            ),
            "transactions_last_24h": rng.integers(
                0,
                30,
                rows,
            ),
            "previous_chargebacks": rng.integers(
                0,
                5,
                rows,
            ),
            "ip_risk": rng.uniform(
                0,
                1,
                rows,
            ),
            "device_risk": rng.uniform(
                0,
                1,
                rows,
            ),
            "unknown_location": rng.integers(
                0,
                2,
                rows,
            ),
        }
    )

    fraud_score = (
        0.20
        * np.log1p(
            data["amount"]
        )
        + 0.18
        * data["ip_risk"]
        + 0.20
        * data["device_risk"]
        + 0.15
        * data["unknown_location"]
        + 0.12
        * (
            data[
                "transactions_last_24h"
            ]
            / 30
        )
        + 0.10
        * (
            data[
                "previous_chargebacks"
            ]
            / 5
        )
        + 0.05
        * (
            1
            - data[
                "account_age_days"
            ]
            / 1500
        )
    )

    probability = (
        1
        / (
            1
            + np.exp(
                -(
                    fraud_score
                    - fraud_score.mean()
                )
                * 4
            )
        )
    )

    data[TARGET_COLUMN] = (
        rng.random(rows)
        < probability
    ).astype(int)

    return data


# ============================================================
# THRESHOLD OPTIMIZATION
# ============================================================

def optimize_threshold(
    y_true,
    probabilities,
    false_positive_cost: float = 1.0,
    false_negative_cost: float = 3.0,
):

    best_threshold = 0.5
    best_cost = float("inf")

    for threshold in np.arange(
        0.10,
        0.91,
        0.01,
    ):

        predictions = (
            probabilities
            >= threshold
        ).astype(int)

        fp = np.sum(
            (predictions == 1)
            & (y_true == 0)
        )

        fn = np.sum(
            (predictions == 0)
            & (y_true == 1)
        )

        cost = (
            fp
            * false_positive_cost
            + fn
            * false_negative_cost
        )

        if cost < best_cost:
            best_cost = cost
            best_threshold = float(
                threshold
            )

    return {
        "threshold": round(
            best_threshold,
            2,
        ),
        "validation_cost": float(
            best_cost
        ),
        "false_positive_cost": float(
            false_positive_cost
        ),
        "false_negative_cost": float(
            false_negative_cost
        ),
    }


# ============================================================
# MODEL EVALUATION
# ============================================================

def evaluate_model(
    y_true,
    probabilities,
    threshold,
):

    predictions = (
        probabilities
        >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_true,
        predictions,
        labels=[0, 1],
    ).ravel()

    return {
        "accuracy": float(
            accuracy_score(
                y_true,
                predictions,
            )
        ),
        "precision": float(
            precision_score(
                y_true,
                predictions,
                zero_division=0,
            )
        ),
        "recall": float(
            recall_score(
                y_true,
                predictions,
                zero_division=0,
            )
        ),
        "f1": float(
            f1_score(
                y_true,
                predictions,
                zero_division=0,
            )
        ),
        "roc_auc": float(
            roc_auc_score(
                y_true,
                probabilities,
            )
        ),
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
        "threshold": float(
            threshold
        ),
    }


# ============================================================
# THRESHOLD TABLE
# ============================================================

def build_threshold_table(
    y_true,
    probabilities,
):

    thresholds = [
        0.10,
        0.20,
        0.30,
        0.40,
        0.50,
        0.60,
        0.70,
        0.80,
        0.90,
    ]

    rows = []

    for threshold in thresholds:

        predictions = (
            probabilities
            >= threshold
        ).astype(int)

        tn, fp, fn, tp = (
            confusion_matrix(
                y_true,
                predictions,
                labels=[0, 1],
            ).ravel()
        )

        precision = precision_score(
            y_true,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y_true,
            predictions,
            zero_division=0,
        )

        rows.append(
            {
                "threshold": threshold,
                "precision": float(
                    precision
                ),
                "recall": float(
                    recall
                ),
                "false_positive": int(
                    fp
                ),
                "false_negative": int(
                    fn
                ),
                "true_positive": int(
                    tp
                ),
                "true_negative": int(
                    tn
                ),
            }
        )

    return rows


# ============================================================
# MODEL BENCHMARK
# ============================================================

def benchmark_model(
    name,
    model,
    X_train,
    y_train,
    X_test,
    y_test,
    threshold=0.5,
):

    start = perf_counter()

    model.fit(
        X_train,
        y_train,
    )

    elapsed = (
        perf_counter()
        - start
    )

    prediction_start = perf_counter()

    probabilities = (
        model.predict_proba(
            X_test
        )[:, 1]
    )

    prediction_elapsed = (
        perf_counter()
        - prediction_start
    )

    inference_ms = (
        prediction_elapsed
        / len(X_test)
        * 1000
    )

    metrics = evaluate_model(
        y_test,
        probabilities,
        threshold,
    )

    return (
        model,
        {
            "model": name,
            "precision": metrics[
                "precision"
            ],
            "recall": metrics[
                "recall"
            ],
            "f1": metrics["f1"],
            "roc_auc": metrics[
                "roc_auc"
            ],
            "accuracy": metrics[
                "accuracy"
            ],
            "false_positive_rate": (
                metrics[
                    "false_positive"
                ]
                / (
                    metrics[
                        "false_positive"
                    ]
                    + metrics[
                        "true_negative"
                    ]
                )
                if (
                    metrics[
                        "false_positive"
                    ]
                    + metrics[
                        "true_negative"
                    ]
                )
                > 0
                else 0
            ),
            "false_negative_rate": (
                metrics[
                    "false_negative"
                ]
                / (
                    metrics[
                        "false_negative"
                    ]
                    + metrics[
                        "true_positive"
                    ]
                )
                if (
                    metrics[
                        "false_negative"
                    ]
                    + metrics[
                        "true_positive"
                    ]
                )
                > 0
                else 0
            ),
            "inference_ms": float(
                inference_ms
            ),
            "training_seconds": float(
                elapsed
            ),
        },
    )


# ============================================================
# MAIN TRAINING PIPELINE
# ============================================================

def train():

    print(
        "\n=== LEDGERGUARD ML TRAINING ==="
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # 1. Create dataset
    # --------------------------------------------------------

    dataset = create_synthetic_dataset()

    X = dataset[
        FEATURE_COLUMNS
    ]

    y = dataset[
        TARGET_COLUMN
    ]

    # --------------------------------------------------------
    # 2. Train/Test split
    # --------------------------------------------------------

    (
        X_train_full,
        X_test,
        y_train_full,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    # --------------------------------------------------------
    # 3. Train/Validation split
    # --------------------------------------------------------

    (
        X_train,
        X_validation,
        y_train,
        y_validation,
    ) = train_test_split(
        X_train_full,
        y_train_full,
        test_size=0.20,
        random_state=42,
        stratify=y_train_full,
    )

    print(
        f"Training samples   : {len(X_train)}"
    )

    print(
        f"Validation samples : {len(X_validation)}"
    )

    print(
        f"Test samples       : {len(X_test)}"
    )

    # --------------------------------------------------------
    # 4. XGBoost production model
    # --------------------------------------------------------

    xgb_model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
    )

    print(
        "\nTraining XGBoost..."
    )

    xgb_model.fit(
        X_train,
        y_train,
    )

    # --------------------------------------------------------
    # 5. Validation threshold optimization
    # --------------------------------------------------------

    validation_probabilities = (
        xgb_model.predict_proba(
            X_validation
        )[:, 1]
    )

    threshold_config = optimize_threshold(
        y_validation,
        validation_probabilities,
    )

    threshold = threshold_config[
        "threshold"
    ]

    print(
        f"\nOptimized threshold : {threshold}"
    )

    print(
        f"Validation cost     : "
        f"{threshold_config['validation_cost']:.2f}"
    )

    # --------------------------------------------------------
    # 6. Untouched held-out test
    # --------------------------------------------------------

    test_probabilities = (
        xgb_model.predict_proba(
            X_test
        )[:, 1]
    )

    test_metrics = evaluate_model(
        y_test,
        test_probabilities,
        threshold,
    )

    print(
        "\n=== XGBOOST TEST RESULTS ==="
    )

    print(
        f"Accuracy  : "
        f"{test_metrics['accuracy']:.4f}"
    )

    print(
        f"Precision : "
        f"{test_metrics['precision']:.4f}"
    )

    print(
        f"Recall    : "
        f"{test_metrics['recall']:.4f}"
    )

    print(
        f"F1 Score  : "
        f"{test_metrics['f1']:.4f}"
    )

    print(
        f"ROC-AUC   : "
        f"{test_metrics['roc_auc']:.4f}"
    )

    print(
        "\nConfusion Matrix"
    )

    print(
        f"TN={test_metrics['true_negative']} "
        f"FP={test_metrics['false_positive']} "
        f"FN={test_metrics['false_negative']} "
        f"TP={test_metrics['true_positive']}"
    )

    # --------------------------------------------------------
    # 7. Candidate model comparison
    # --------------------------------------------------------

    print(
        "\n=== MODEL COMPARISON ==="
    )

    logistic_model = LogisticRegression(
        max_iter=1000,
        random_state=42,
    )

    random_forest_model = RandomForestClassifier(
        n_estimators=250,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )

    comparison = []

    _, logistic_metrics = benchmark_model(
        "Logistic Regression",
        logistic_model,
        X_train,
        y_train,
        X_test,
        y_test,
        threshold=0.5,
    )

    comparison.append(
        logistic_metrics
    )

    _, rf_metrics = benchmark_model(
        "Random Forest",
        random_forest_model,
        X_train,
        y_train,
        X_test,
        y_test,
        threshold=0.5,
    )

    comparison.append(
        rf_metrics
    )

    xgb_start = perf_counter()

    xgb_probabilities = (
        xgb_model.predict_proba(
            X_test
        )[:, 1]
    )

    xgb_prediction_time = (
        perf_counter()
        - xgb_start
    )

    xgb_inference_ms = (
        xgb_prediction_time
        / len(X_test)
        * 1000
    )

    comparison.append(
        {
            "model": "XGBoost",
            "precision": test_metrics[
                "precision"
            ],
            "recall": test_metrics[
                "recall"
            ],
            "f1": test_metrics[
                "f1"
            ],
            "roc_auc": test_metrics[
                "roc_auc"
            ],
            "accuracy": test_metrics[
                "accuracy"
            ],
            "false_positive_rate": (
                test_metrics[
                    "false_positive"
                ]
                / (
                    test_metrics[
                        "false_positive"
                    ]
                    + test_metrics[
                        "true_negative"
                    ]
                )
                if (
                    test_metrics[
                        "false_positive"
                    ]
                    + test_metrics[
                        "true_negative"
                    ]
                )
                > 0
                else 0
            ),
            "false_negative_rate": (
                test_metrics[
                    "false_negative"
                ]
                / (
                    test_metrics[
                        "false_negative"
                    ]
                    + test_metrics[
                        "true_positive"
                    ]
                )
                if (
                    test_metrics[
                        "false_negative"
                    ]
                    + test_metrics[
                        "true_positive"
                    ]
                )
                > 0
                else 0
            ),
            "inference_ms": float(
                xgb_inference_ms
            ),
            "selected": True,
        }
    )

    for item in comparison:
        if "selected" not in item:
            item["selected"] = False

    comparison_df = pd.DataFrame(
        comparison
    )

    print(
        comparison_df[
            [
                "model",
                "precision",
                "recall",
                "f1",
                "roc_auc",
                "accuracy",
                "inference_ms",
            ]
        ].to_string(
            index=False
        )
    )

    # --------------------------------------------------------
    # 8. ROC curve
    # --------------------------------------------------------

    fpr, tpr, roc_thresholds = (
        roc_curve(
            y_test,
            test_probabilities,
        )
    )

    roc_points = []

    for i in range(
        len(fpr)
    ):

        roc_points.append(
            {
                "fpr": float(
                    fpr[i]
                ),
                "tpr": float(
                    tpr[i]
                ),
                "threshold": float(
                    roc_thresholds[i]
                )
                if np.isfinite(
                    roc_thresholds[i]
                )
                else None,
            }
        )

    # Keep chart payload compact
    if len(roc_points) > 150:

        indices = np.linspace(
            0,
            len(roc_points) - 1,
            150,
            dtype=int,
        )

        roc_points = [
            roc_points[i]
            for i in indices
        ]

    # --------------------------------------------------------
    # 9. Precision / Recall curve
    # --------------------------------------------------------

    precision_curve, recall_curve, pr_thresholds = (
        precision_recall_curve(
            y_test,
            test_probabilities,
        )
    )

    pr_points = []

    for i in range(
        len(precision_curve)
    ):

        threshold_value = None

        if i < len(
            pr_thresholds
        ):
            threshold_value = float(
                pr_thresholds[i]
            )

        pr_points.append(
            {
                "recall": float(
                    recall_curve[i]
                ),
                "precision": float(
                    precision_curve[i]
                ),
                "threshold": threshold_value,
            }
        )

    if len(pr_points) > 150:

        indices = np.linspace(
            0,
            len(pr_points) - 1,
            150,
            dtype=int,
        )

        pr_points = [
            pr_points[i]
            for i in indices
        ]

    # --------------------------------------------------------
    # 10. Threshold optimization table
    # --------------------------------------------------------

    threshold_table = (
        build_threshold_table(
            y_test,
            test_probabilities,
        )
    )

    # --------------------------------------------------------
    # 11. Held-out evaluation information
    # --------------------------------------------------------

    held_out_evaluation = {
        "total_dataset": int(
            len(dataset)
        ),
        "training_set": int(
            len(X_train)
        ),
        "validation_set": int(
            len(X_validation)
        ),
        "held_out_test_set": int(
            len(X_test)
        ),
        "test_sample_count": int(
            len(X_test)
        ),
        "fraud_samples": int(
            y_test.sum()
        ),
        "legitimate_samples": int(
            len(y_test)
            - y_test.sum()
        ),
    }

    # --------------------------------------------------------
    # 12. Save model
    # --------------------------------------------------------

    joblib.dump(
        xgb_model,
        MODEL_PATH,
    )

    # --------------------------------------------------------
    # 13. Save threshold
    # --------------------------------------------------------

    joblib.dump(
        threshold_config,
        THRESHOLD_PATH,
    )

    # --------------------------------------------------------
    # 14. Save complete test metrics
    # --------------------------------------------------------

    test_metrics[
        "dataset"
    ] = held_out_evaluation

    test_metrics[
        "production_model"
    ] = "XGBoost"

    test_metrics[
        "algorithm"
    ] = "XGBoost"

    joblib.dump(
        test_metrics,
        TEST_RESULTS_PATH,
    )

    # --------------------------------------------------------
    # 15. Save model comparison
    # --------------------------------------------------------

    joblib.dump(
        comparison,
        MODEL_COMPARISON_PATH,
    )

    # --------------------------------------------------------
    # 16. Save evaluation curves
    # --------------------------------------------------------

    curves = {
        "roc_auc": float(
            test_metrics[
                "roc_auc"
            ]
        ),
        "roc_curve": roc_points,
        "precision_recall_curve": pr_points,
        "threshold_table": threshold_table,
    }

    joblib.dump(
        curves,
        CURVES_PATH,
    )

    # --------------------------------------------------------
    # 17. Print saved files
    # --------------------------------------------------------

    print(
        "\n=== MODEL ARTIFACTS SAVED ==="
    )

    print(
        f"Model:"
    )

    print(
        MODEL_PATH
    )

    print(
        "\nThreshold:"
    )

    print(
        THRESHOLD_PATH
    )

    print(
        "\nTest metrics:"
    )

    print(
        TEST_RESULTS_PATH
    )

    print(
        "\nModel comparison:"
    )

    print(
        MODEL_COMPARISON_PATH
    )

    print(
        "\nEvaluation curves:"
    )

    print(
        CURVES_PATH
    )

    print(
        "\n=== TRAINING COMPLETE ==="
    )


if __name__ == "__main__":
    train()