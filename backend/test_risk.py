import asyncio

from app.database import database
from app.services.risk_service import (
    get_ml_probability,
    build_transaction_features,
)


async def test():
    transaction = await database.transactions.find_one(
        {"transaction_id": "TXN-10005"}
    )

    if not transaction:
        print("TXN-10005 NOT FOUND")
        return

    print("FEATURES:")
    print(build_transaction_features(transaction))

    print("\nML PROBABILITY:")
    print(get_ml_probability(transaction))


if __name__ == "__main__":
    asyncio.run(test())