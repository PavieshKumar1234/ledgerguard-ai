import asyncio
from datetime import datetime, timezone

from app.database import database


TRANSACTIONS = [
    # ============================================================
    # NORMAL TRANSACTIONS
    # ============================================================

    {
        "transaction_id": "TXN-10001",
        "customer_id": "CUS-5001",
        "amount": 4599,
        "currency": "INR",
        "payment_method": "UPI",
        "merchant_id": "MER-001",
        "device_id": "DEV-1001",
        "ip_address": "103.25.67.21",
        "location": "Chennai, India",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10002",
        "customer_id": "CUS-5002",
        "amount": 2499,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-001",
        "device_id": "DEV-1002",
        "ip_address": "103.26.71.14",
        "location": "Coimbatore, India",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10003",
        "customer_id": "CUS-5003",
        "amount": 7999,
        "currency": "INR",
        "payment_method": "UPI",
        "merchant_id": "MER-002",
        "device_id": "DEV-1003",
        "ip_address": "49.36.82.41",
        "location": "Bangalore, India",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10004",
        "customer_id": "CUS-5004",
        "amount": 12500,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-002",
        "device_id": "DEV-1004",
        "ip_address": "106.51.93.22",
        "location": "Mumbai, India",
        "status": "completed",
    },

    # ============================================================
    # MEDIUM / SUSPICIOUS
    # ============================================================

    {
        "transaction_id": "TXN-10005",
        "customer_id": "CUS-5005",
        "amount": 42000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-001",
        "device_id": "DEV-2001",
        "ip_address": "185.22.91.10",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10006",
        "customer_id": "CUS-5006",
        "amount": 55000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-003",
        "device_id": "DEV-SUSPICIOUS-01",
        "ip_address": "185.22.91.11",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10007",
        "customer_id": "CUS-5007",
        "amount": 67000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-003",
        "device_id": "DEV-SUSPICIOUS-02",
        "ip_address": "185.22.91.12",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10008",
        "customer_id": "CUS-5008",
        "amount": 89000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-004",
        "device_id": "DEV-SUSPICIOUS-03",
        "ip_address": "185.22.91.13",
        "location": "Unknown",
        "status": "completed",
    },

    # ============================================================
    # HIGH VALUE / CRITICAL
    # ============================================================

    {
        "transaction_id": "TXN-10009",
        "customer_id": "CUS-5009",
        "amount": 95000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-001",
        "device_id": "DEV-SUSPICIOUS",
        "ip_address": "185.22.91.10",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10010",
        "customer_id": "CUS-5010",
        "amount": 125000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-003",
        "device_id": "DEV-SUSPICIOUS",
        "ip_address": "185.22.91.14",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10011",
        "customer_id": "CUS-5011",
        "amount": 175000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-004",
        "device_id": "DEV-SUSPICIOUS-05",
        "ip_address": "185.22.91.15",
        "location": "Unknown",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10012",
        "customer_id": "CUS-5012",
        "amount": 210000,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-004",
        "device_id": "DEV-SUSPICIOUS",
        "ip_address": "185.22.91.16",
        "location": "Unknown",
        "status": "completed",
    },

    # ============================================================
    # ADDITIONAL NORMAL ACTIVITY
    # ============================================================

    {
        "transaction_id": "TXN-10013",
        "customer_id": "CUS-5013",
        "amount": 1599,
        "currency": "INR",
        "payment_method": "UPI",
        "merchant_id": "MER-002",
        "device_id": "DEV-1013",
        "ip_address": "117.96.22.14",
        "location": "Madurai, India",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10014",
        "customer_id": "CUS-5014",
        "amount": 3499,
        "currency": "INR",
        "payment_method": "CARD",
        "merchant_id": "MER-001",
        "device_id": "DEV-1014",
        "ip_address": "117.96.25.18",
        "location": "Salem, India",
        "status": "completed",
    },
    {
        "transaction_id": "TXN-10015",
        "customer_id": "CUS-5015",
        "amount": 18999,
        "currency": "INR",
        "payment_method": "UPI",
        "merchant_id": "MER-002",
        "device_id": "DEV-1015",
        "ip_address": "122.164.31.21",
        "location": "Hyderabad, India",
        "status": "completed",
    },
]


async def seed_transactions():
    collection = database.transactions

    inserted = 0
    skipped = 0

    for transaction in TRANSACTIONS:
        transaction_id = transaction["transaction_id"]

        existing = await collection.find_one(
            {"transaction_id": transaction_id}
        )

        if existing:
            skipped += 1
            print(
                f"SKIP   {transaction_id} "
                f"(already exists)"
            )
            continue

        document = {
            **transaction,
            "created_at": datetime.now(timezone.utc),
        }

        await collection.insert_one(document)

        inserted += 1

        print(
            f"INSERT {transaction_id} "
            f"₹{transaction['amount']:,}"
        )

    print()
    print("=" * 60)
    print("LEDGERGUARD DEMO DATA SEED COMPLETE")
    print("=" * 60)
    print(f"Inserted : {inserted}")
    print(f"Skipped  : {skipped}")
    print(f"Total    : {inserted + skipped}")


async def main():
    try:
        await seed_transactions()
    finally:
        if database.client:
            database.client.close()


if __name__ == "__main__":
    asyncio.run(main())