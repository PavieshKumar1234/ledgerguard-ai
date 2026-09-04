from app.detection.anomaly_detector import calculate_anomaly_score
from app.detection.rules_engine import evaluate_rules
from app.ml.feature_engineering import build_transaction_features
from app.ml.predict import predict_fraud


def calculate_risk(transaction: dict) -> dict:
    features = build_transaction_features(transaction)

    # Signal 1: ML fraud probability
    ml_result = predict_fraud(transaction)

    # Signal 2: deterministic rules
    rule_result = evaluate_rules(transaction)

    # Signal 3: behavioral anomaly detection
    anomaly_score = calculate_anomaly_score(
        transaction
    )

    ml_score = ml_result["risk_score"]
    rule_score = rule_result["rule_score"]

    # Multi-signal risk aggregation
    final_score = (
        (ml_score * 0.60)
        + (rule_score * 0.20)
        + (anomaly_score * 0.20)
    )

    final_score = min(
        round(final_score, 2),
        100,
    )

    # Final decision
    if final_score >= 80:
        decision = "BLOCK"
    elif final_score >= 50:
        decision = "REVIEW"
    else:
        decision = "ALLOW"

    return {
        "risk_score": final_score,
        "decision": decision,

        "fraud_probability": ml_result[
            "fraud_probability"
        ],

        "ml_risk_score": ml_score,

        "rule_score": rule_score,

        "anomaly_score": anomaly_score,

        "threshold": ml_result["threshold"],

        "triggered_rules": rule_result[
            "triggered_rules"
        ],

        "features": features,
    }