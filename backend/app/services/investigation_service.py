from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.database import database
from app.detection.risk_engine import calculate_risk
from app.models.investigation import investigation_document


# ============================================================
# CREATE INVESTIGATION
# ============================================================

async def create_investigation(transaction_id: str):
    transaction = await database.transactions.find_one(
        {
            "transaction_id": transaction_id
        }
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    # Calculate complete risk analysis
    risk_result = calculate_risk(transaction)

    # Prevent duplicate investigation cases
    existing = await database.investigations.find_one(
        {
            "transaction_id": transaction_id
        }
    )

    if existing:
        existing["_id"] = str(
            existing["_id"]
        )

        return existing

    # Build investigation document
    document = investigation_document(
        transaction,
        risk_result,
    )

    # Add workflow metadata
    document["action"] = None
    document["analyst_note"] = None
    document["updated_at"] = datetime.now(
        timezone.utc
    )

    result = await database.investigations.insert_one(
        document
    )

    document["_id"] = str(
        result.inserted_id
    )

    return document


# ============================================================
# GET SINGLE INVESTIGATION
# ============================================================

async def get_investigation(
    transaction_id: str,
):
    investigation = await database.investigations.find_one(
        {
            "transaction_id": transaction_id
        }
    )

    if not investigation:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )

    investigation["_id"] = str(
        investigation["_id"]
    )

    return investigation


# ============================================================
# GET ALL INVESTIGATIONS
# ============================================================

async def get_investigations(
    limit: int = 50,
):
    cursor = (
        database.investigations
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    investigations = await cursor.to_list(
        length=limit
    )

    for investigation in investigations:
        investigation["_id"] = str(
            investigation["_id"]
        )

    return investigations


# ============================================================
# UPDATE INVESTIGATION ACTION
# ============================================================

async def update_investigation_action(
    investigation_id: str,
    action: str,
    analyst: str,
    note: str | None = None,
):
    # --------------------------------------------------------
    # Validate MongoDB ID
    # --------------------------------------------------------

    try:
        object_id = ObjectId(
            investigation_id
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid investigation ID",
        )


    # --------------------------------------------------------
    # Allowed actions
    # --------------------------------------------------------

    allowed_actions = {
        "APPROVE",
        "REJECT",
        "ESCALATE",
        "FALSE_POSITIVE",
        "REQUEST_MORE_EVIDENCE",
    }

    action = action.upper().strip()

    if action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid investigation action. "
                "Allowed actions: "
                "APPROVE, REJECT, ESCALATE, "
                "FALSE_POSITIVE, "
                "REQUEST_MORE_EVIDENCE"
            ),
        )


    # --------------------------------------------------------
    # Find investigation
    # --------------------------------------------------------

    investigation = await database.investigations.find_one(
        {
            "_id": object_id
        }
    )

    if not investigation:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )


    # --------------------------------------------------------
    # Current status
    # --------------------------------------------------------

    previous_status = investigation.get(
        "status",
        "OPEN",
    )


    # --------------------------------------------------------
    # Map action → status
    # --------------------------------------------------------

    status_map = {
        "APPROVE": "APPROVED",
        "REJECT": "REJECTED",
        "ESCALATE": "ESCALATED",
        "FALSE_POSITIVE": "FALSE_POSITIVE",
        "REQUEST_MORE_EVIDENCE": "EVIDENCE_REQUIRED",
    }

    new_status = status_map[action]


    # --------------------------------------------------------
    # Update investigation
    # --------------------------------------------------------

    update_document = {
        "action": action,
        "status": new_status,
        "analyst": analyst,
        "analyst_note": note,
        "previous_status": previous_status,
        "updated_at": datetime.now(
            timezone.utc
        ),
    }

    result = await database.investigations.update_one(
        {
            "_id": object_id
        },
        {
            "$set": update_document
        },
    )


    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found",
        )


    # --------------------------------------------------------
    # Return updated document
    # --------------------------------------------------------

    updated = await database.investigations.find_one(
        {
            "_id": object_id
        }
    )

    updated["_id"] = str(
        updated["_id"]
    )

    return updated