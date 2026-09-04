from datetime import datetime, timezone


def recovery_document(
    transaction: dict,
    investigation: dict,
) -> dict:
    amount = float(transaction.get("amount", 0))
    risk_score = float(investigation.get("risk_score", 0))

    if risk_score >= 80:
        action = "PAYMENT_BLOCK"
    elif risk_score >= 50:
        action = "MANUAL_REVIEW"
    else:
        action = "MONITOR"

    return {
        "transaction_id": transaction["transaction_id"],
        "customer_id": transaction["customer_id"],
        "merchant_id": transaction["merchant_id"],
        "original_amount": amount,
        "recovery_amount": amount if risk_score >= 50 else 0,
        "risk_score": risk_score,
        "action": action,
        "status": "PENDING",
        "recovered_amount": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }