from datetime import datetime, timezone


def chargeback_document(
    transaction: dict,
    reason: str,
    status: str = "OPEN",
) -> dict:
    amount = float(transaction.get("amount", 0))

    return {
        "transaction_id": transaction["transaction_id"],
        "customer_id": transaction["customer_id"],
        "merchant_id": transaction["merchant_id"],
        "amount": amount,
        "currency": transaction.get("currency", "INR"),
        "reason": reason,
        "status": status,
        "evidence_status": "PENDING",
        "representment_status": "NOT_STARTED",
        "recovered_amount": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }