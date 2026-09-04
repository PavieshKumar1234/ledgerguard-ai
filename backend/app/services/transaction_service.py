from fastapi import HTTPException

from app.database import database
from app.models.transaction import transaction_document


async def create_transaction(data: dict):
    existing = await database.transactions.find_one(
        {"transaction_id": data["transaction_id"]}
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Transaction already exists",
        )

    document = transaction_document(data)

    result = await database.transactions.insert_one(document)

    document["_id"] = str(result.inserted_id)

    return document


async def get_transactions(limit: int = 50):
    cursor = (
        database.transactions
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    transactions = await cursor.to_list(length=limit)

    for transaction in transactions:
        transaction["_id"] = str(transaction["_id"])

    return transactions