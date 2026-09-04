from datetime import datetime, timezone


def transaction_document(data: dict) -> dict:
    return {
        "transaction_id": data["transaction_id"],
        "customer_id": data["customer_id"],
        "amount": data["amount"],
        "currency": data["currency"],
        "payment_method": data["payment_method"],
        "merchant_id": data["merchant_id"],
        "device_id": data["device_id"],
        "ip_address": data["ip_address"],
        "location": data["location"],
        "status": data["status"],
        "created_at": datetime.now(timezone.utc),
    }