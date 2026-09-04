from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.database import database
from app.models.chargeback import chargeback_document


async def create_chargeback(transaction_id: str, reason: str):
    transaction = await database.transactions.find_one(
        {"transaction_id": transaction_id}
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    existing = await database.chargebacks.find_one(
        {
            "transaction_id": transaction_id,
            "status": {"$in": ["OPEN", "UNDER_REVIEW"]},
        }
    )

    if existing:
        existing["_id"] = str(existing["_id"])
        return existing

    document = chargeback_document(
        transaction=transaction,
        reason=reason,
    )

    result = await database.chargebacks.insert_one(document)

    document["_id"] = str(result.inserted_id)

    return document


async def get_chargebacks(limit: int = 50):
    cursor = (
        database.chargebacks
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    chargebacks = await cursor.to_list(length=limit)

    for chargeback in chargebacks:
        chargeback["_id"] = str(chargeback["_id"])

    return chargebacks


async def get_chargeback(chargeback_id: str):
    try:
        object_id = ObjectId(chargeback_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid chargeback ID",
        )

    chargeback = await database.chargebacks.find_one(
        {"_id": object_id}
    )

    if not chargeback:
        raise HTTPException(
            status_code=404,
            detail="Chargeback not found",
        )

    chargeback["_id"] = str(chargeback["_id"])

    return chargeback


async def update_chargeback(
    chargeback_id: str,
    status: str,
    evidence_status: str | None,
    representment_status: str | None,
    recovered_amount: float,
):
    try:
        object_id = ObjectId(chargeback_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid chargeback ID",
        )

    chargeback = await database.chargebacks.find_one(
        {"_id": object_id}
    )

    if not chargeback:
        raise HTTPException(
            status_code=404,
            detail="Chargeback not found",
        )

    if recovered_amount > float(chargeback["amount"]):
        raise HTTPException(
            status_code=400,
            detail="Recovered amount cannot exceed chargeback amount",
        )

    update_data = {
        "status": status,
        "recovered_amount": recovered_amount,
        "updated_at": datetime.now(timezone.utc),
    }

    if evidence_status is not None:
        update_data["evidence_status"] = evidence_status

    if representment_status is not None:
        update_data["representment_status"] = representment_status

    await database.chargebacks.update_one(
        {"_id": object_id},
        {"$set": update_data},
    )

    updated = await database.chargebacks.find_one(
        {"_id": object_id}
    )

    updated["_id"] = str(updated["_id"])

    return updated