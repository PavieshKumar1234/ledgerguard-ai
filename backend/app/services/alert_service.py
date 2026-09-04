from fastapi import HTTPException

from app.database import database
from app.models.alert import alert_document
from app.services.investigation_service import create_investigation


async def create_alert(transaction_id: str):
    investigation = await create_investigation(
        transaction_id
    )

    # Only create alerts for actionable risk.
    if investigation["risk_score"] < 30:
        return {
            "alert_created": False,
            "message": "Risk level does not require an alert.",
            "risk_score": investigation["risk_score"],
        }

    existing = await database.alerts.find_one(
        {
            "transaction_id": transaction_id,
            "status": {"$in": ["UNREAD", "OPEN"]},
        }
    )

    if existing:
        existing["_id"] = str(existing["_id"])

        return {
            "alert_created": False,
            "message": "Active alert already exists.",
            "alert": existing,
        }

    document = alert_document(investigation)

    result = await database.alerts.insert_one(
        document
    )

    document["_id"] = str(result.inserted_id)

    return {
        "alert_created": True,
        "alert": document,
    }


async def get_alerts(limit: int = 50):
    cursor = (
        database.alerts
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    alerts = await cursor.to_list(length=limit)

    for alert in alerts:
        alert["_id"] = str(alert["_id"])

    return alerts


async def mark_alert_read(alert_id: str):
    from bson import ObjectId

    try:
        object_id = ObjectId(alert_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID",
        )

    result = await database.alerts.update_one(
        {"_id": object_id},
        {"$set": {"status": "READ"}},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return {
        "success": True,
        "message": "Alert marked as read",
    }