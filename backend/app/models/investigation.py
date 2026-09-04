from datetime import datetime, timezone


def investigation_document(
    transaction: dict,
    risk_result: dict,
) -> dict:
    risk_score = float(risk_result["risk_score"])

    if risk_score >= 80:
        severity = "CRITICAL"
    elif risk_score >= 50:
        severity = "HIGH"
    elif risk_score >= 30:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    evidence = []

    if risk_result.get("ml_risk_score", 0) >= 70:
        evidence.append(
            "Machine-learning model detected elevated fraud probability"
        )

    if risk_result.get("anomaly_score", 0) >= 70:
        evidence.append(
            "Behavioral anomaly detected"
        )

    if risk_result.get("rule_score", 0) >= 50:
        evidence.append(
            "Multiple deterministic risk rules triggered"
        )

    for rule in risk_result.get("triggered_rules", []):
        evidence.append(f"Rule triggered: {rule}")

    if not evidence:
        evidence.append(
            "No significant risk indicators detected"
        )

    if risk_score >= 80:
        recommended_action = "BLOCK_TRANSACTION"
    elif risk_score >= 50:
        recommended_action = "MANUAL_REVIEW"
    else:
        recommended_action = "ALLOW_TRANSACTION"

    return {
        "transaction_id": transaction["transaction_id"],
        "customer_id": transaction["customer_id"],
        "merchant_id": transaction["merchant_id"],
        "risk_score": risk_score,
        "decision": risk_result["decision"],
        "severity": severity,
        "fraud_probability": risk_result.get(
            "fraud_probability", 0
        ),
        "ml_risk_score": risk_result.get(
            "ml_risk_score", 0
        ),
        "rule_score": risk_result.get(
            "rule_score", 0
        ),
        "anomaly_score": risk_result.get(
            "anomaly_score", 0
        ),
        "triggered_rules": risk_result.get(
            "triggered_rules", []
        ),
        "evidence": evidence,
        "recommended_action": recommended_action,
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc),
    }