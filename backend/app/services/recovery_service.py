from bson import ObjectId
from fastapi import HTTPException

from app.database import database
from app.models.recovery import recovery_document
from app.services.investigation_service import create_investigation


async def create_recovery(transaction_id: str):
    transaction = await database.transactions.find_one(
        {"transaction_id": transaction_id}
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    investigation = await create_investigation(
        transaction_id
    )

    existing = await database.recoveries.find_one(
        {"transaction_id": transaction_id}
    )

    if existing:
        existing["_id"] = str(existing["_id"])
        return existing

    document = recovery_document(
        transaction,
        investigation,
    )

    result = await database.recoveries.insert_one(
        document
    )

    document["_id"] = str(result.inserted_id)

    return document


async def get_recoveries(limit: int = 50):
    cursor = (
        database.recoveries
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    recoveries = await cursor.to_list(
        length=limit
    )

    for recovery in recoveries:
        recovery["_id"] = str(recovery["_id"])

    return recoveries


async def complete_recovery(
    recovery_id: str,
    recovered_amount: float,
):
    try:
        object_id = ObjectId(recovery_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid recovery ID",
        )

    recovery = await database.recoveries.find_one(
        {"_id": object_id}
    )

    if not recovery:
        raise HTTPException(
            status_code=404,
            detail="Recovery case not found",
        )

    if recovered_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Recovered amount cannot be negative",
        )

    if recovered_amount > recovery["original_amount"]:
        raise HTTPException(
            status_code=400,
            detail="Recovered amount cannot exceed original amount",
        )

    result = await database.recoveries.update_one(
        {"_id": object_id},
        {
            "$set": {
                "recovered_amount": recovered_amount,
                "status": "RECOVERED",
            }
        },
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Recovery update failed",
        )

    return {
        "success": True,
        "recovery_id": recovery_id,
        "status": "RECOVERED",
        "recovered_amount": recovered_amount,
    }