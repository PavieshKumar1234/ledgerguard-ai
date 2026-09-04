from datetime import datetime, timezone


def alert_document(investigation: dict) -> dict:
    risk_score = float(investigation.get("risk_score", 0))

    if risk_score >= 80:
        priority = "CRITICAL"
    elif risk_score >= 50:
        priority = "HIGH"
    elif risk_score >= 30:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    return {
        "transaction_id": investigation["transaction_id"],
        "customer_id": investigation["customer_id"],
        "merchant_id": investigation["merchant_id"],
        "risk_score": risk_score,
        "severity": investigation.get("severity", "LOW"),
        "priority": priority,
        "decision": investigation.get("decision", "ALLOW"),
        "title": f"{priority} risk detected",
        "message": (
            f"Transaction {investigation['transaction_id']} "
            f"has a risk score of {risk_score:.2f}."
        ),
        "evidence": investigation.get("evidence", []),
        "status": "UNREAD",
        "created_at": datetime.now(timezone.utc),
    }