from typing import Any


def build_transaction_features(transaction: dict) -> dict[str, Any]:
    amount = float(transaction.get("amount", 0))

    features = {
        "amount": amount,
        "amount_log": _safe_log(amount),
        "is_high_value": int(amount >= 50000),
        "is_card_payment": int(
            transaction.get("payment_method", "").upper() == "CARD"
        ),
        "is_upi_payment": int(
            transaction.get("payment_method", "").upper() == "UPI"
        ),
        "unknown_location": int(
            transaction.get("location", "").lower() == "unknown"
        ),
    }

    return features


def _safe_log(value: float) -> float:
    import math

    return math.log1p(max(value, 0))