from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import database
from app.security.permissions import get_current_user
from app.services.risk_service import calculate_risk


router = APIRouter(
    prefix="/api/risk",
    tags=["Risk Engine"],
)


def get_risk_level(risk_score: float) -> str:
    """
    Convert a numerical risk score into a human-readable risk level.
    """

    score = float(risk_score)

    if score >= 80:
        return "CRITICAL"

    if score >= 50:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


async def store_risk_result(
    transaction_id: str,
    risk_result: dict,
) -> dict:
    """
    Persist the complete risk evaluation against the transaction.
    """

    risk_score = float(
        risk_result.get("risk_score", 0)
    )

    decision = risk_result.get(
        "decision",
        "ALLOW",
    )

    risk_level = get_risk_level(
        risk_score
    )

    evaluated_at = datetime.now(
        timezone.utc
    )

    explanation = risk_result.get(
        "explanation",
        {},
    )

    # -------------------------------------------------
    # Persist complete risk intelligence
    # -------------------------------------------------

    update = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "decision": decision,

        # Component scores
        "ml_probability": float(
            risk_result.get(
                "ml_probability",
                explanation.get(
                    "ml_probability",
                    0,
                ),
            )
        ),
        "ml_score": float(
            risk_result.get(
                "ml_score",
                explanation.get(
                    "ml_score",
                    0,
                ),
            )
        ),
        "rule_score": float(
            risk_result.get(
                "rule_score",
                explanation.get(
                    "rule_score",
                    0,
                ),
            )
        ),
        "anomaly_score": float(
            risk_result.get(
                "anomaly_score",
                explanation.get(
                    "anomaly_score",
                    0,
                ),
            )
        ),

        # Full Explainable AI payload
        "risk_explanation": explanation,

        # Evaluation metadata
        "risk_evaluated": True,
        "risk_evaluated_at": evaluated_at,
    }

    result = await database.transactions.update_one(
        {
            "transaction_id": transaction_id
        },
        {
            "$set": update
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction "
                f"{transaction_id} not found"
            ),
        )

    return update


async def create_workflow_if_needed(
    transaction_id: str,
    risk_score: float,
) -> bool:
    """
    Create investigation / alert / recovery
    workflow records for elevated-risk transactions.

    Returns True when at least one workflow record
    was newly created.
    """

    if float(risk_score) < 30:
        return False

    workflow_created = False

    # -------------------------------------------------
    # Investigation
    # -------------------------------------------------

    existing_investigation = (
        await database.investigations.find_one(
            {
                "transaction_id": transaction_id
            }
        )
    )

    if not existing_investigation:

        investigation_document = {
            "transaction_id": transaction_id,
            "risk_score": float(risk_score),
            "status": "OPEN",
            "created_at": datetime.now(
                timezone.utc
            ),
        }

        await database.investigations.insert_one(
            investigation_document
        )

        workflow_created = True

    # -------------------------------------------------
    # Alert
    # -------------------------------------------------

    existing_alert = (
        await database.alerts.find_one(
            {
                "transaction_id": transaction_id
            }
        )
    )

    if not existing_alert:

        alert_document = {
            "transaction_id": transaction_id,
            "risk_score": float(risk_score),
            "severity": (
                "CRITICAL"
                if risk_score >= 80
                else "HIGH"
                if risk_score >= 50
                else "MEDIUM"
            ),
            "status": "OPEN",
            "created_at": datetime.now(
                timezone.utc
            ),
        }

        await database.alerts.insert_one(
            alert_document
        )

        workflow_created = True

    # -------------------------------------------------
    # Recovery
    # -------------------------------------------------

    existing_recovery = (
        await database.recoveries.find_one(
            {
                "transaction_id": transaction_id
            }
        )
    )

    if not existing_recovery:

        transaction = (
            await database.transactions.find_one(
                {
                    "transaction_id": transaction_id
                }
            )
        )

        if transaction:

            amount = float(
                transaction.get(
                    "amount",
                    0,
                )
            )

            recovery_document = {
                "transaction_id": transaction_id,
                "original_amount": amount,
                "recovered_amount": 0,
                "outstanding_amount": amount,
                "status": "PENDING",
                "created_at": datetime.now(
                    timezone.utc
                ),
            }

            await database.recoveries.insert_one(
                recovery_document
            )

            workflow_created = True

    return workflow_created


@router.post("/predict")
async def predict_risk(
    payload: dict,
    current_user=Depends(
        get_current_user
    ),
):
    """
    Evaluate risk for one transaction,
    persist the complete result,
    and create the required response workflow.
    """

    transaction_id = payload.get(
        "transaction_id"
    )

    if not transaction_id:
        raise HTTPException(
            status_code=400,
            detail="transaction_id is required",
        )

    transaction = (
        await database.transactions.find_one(
            {
                "transaction_id": transaction_id
            }
        )
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction "
                f"{transaction_id} not found"
            ),
        )

    # -------------------------------------------------
    # Run the complete LedgerGuard risk engine
    # -------------------------------------------------

    risk_result = await calculate_risk(
        transaction
    )

    # -------------------------------------------------
    # Persist complete result
    # -------------------------------------------------

    stored = await store_risk_result(
        transaction_id,
        risk_result,
    )

    # -------------------------------------------------
    # Create response workflow
    # -------------------------------------------------

    workflow_created = (
        await create_workflow_if_needed(
            transaction_id,
            stored["risk_score"],
        )
    )

    # -------------------------------------------------
    # Return complete Explainable AI response
    # -------------------------------------------------

    return {
        "success": True,

        "transaction_id": transaction_id,

        "risk_score": stored[
            "risk_score"
        ],

        "risk_level": stored[
            "risk_level"
        ],

        "decision": stored[
            "decision"
        ],

        # Component scores
        "ml_probability": stored[
            "ml_probability"
        ],

        "ml_score": stored[
            "ml_score"
        ],

        "rule_score": stored[
            "rule_score"
        ],

        "anomaly_score": stored[
            "anomaly_score"
        ],

        # Explainable AI
        "explanation": stored[
            "risk_explanation"
        ],

        "risk_evaluated": True,

        "risk_evaluated_at": stored[
            "risk_evaluated_at"
        ],

        "workflow_created": workflow_created,
    }


@router.post("/evaluate-all")
async def evaluate_all_transactions(
    current_user=Depends(
        get_current_user
    ),
):
    """
    Evaluate every transaction in the database.

    Each transaction receives:

    - risk_score
    - risk_level
    - decision
    - ML score
    - rule score
    - anomaly score
    - explanation
    - risk_evaluated
    - risk_evaluated_at

    Elevated-risk transactions also receive
    investigation, alert, and recovery workflows.
    """

    transactions = (
        await database.transactions.find({})
        .sort("created_at", -1)
        .to_list(length=None)
    )

    total_transactions = len(
        transactions
    )

    evaluated = 0
    already_evaluated = 0

    flagged = 0
    blocked = 0
    review = 0
    allowed = 0

    results = []

    for transaction in transactions:

        transaction_id = transaction.get(
            "transaction_id"
        )

        if not transaction_id:
            continue

        # -------------------------------------------------
        # Existing evaluation
        # -------------------------------------------------

        existing_evaluation = (
            transaction.get(
                "risk_evaluated"
            )
            is True
            and transaction.get(
                "risk_score"
            )
            is not None
            and transaction.get(
                "decision"
            )
            is not None
        )

        if existing_evaluation:

            risk_score = float(
                transaction.get(
                    "risk_score",
                    0,
                )
            )

            decision = transaction.get(
                "decision",
                "ALLOW",
            )

            risk_level = get_risk_level(
                risk_score
            )

            # Keep the persisted level synchronized
            await database.transactions.update_one(
                {
                    "transaction_id":
                        transaction_id
                },
                {
                    "$set": {
                        "risk_level":
                            risk_level,
                        "risk_evaluated":
                            True,
                    }
                },
            )

            already_evaluated += 1

            if risk_score >= 30:
                flagged += 1

            if decision == "BLOCK":
                blocked += 1

            elif decision == "REVIEW":
                review += 1

            else:
                allowed += 1

            results.append(
                {
                    "transaction_id":
                        transaction_id,
                    "status":
                        "already_evaluated",
                    "risk_score":
                        risk_score,
                    "risk_level":
                        risk_level,
                    "decision":
                        decision,

                    "ml_score":
                        transaction.get(
                            "ml_score",
                            0,
                        ),

                    "rule_score":
                        transaction.get(
                            "rule_score",
                            0,
                        ),

                    "anomaly_score":
                        transaction.get(
                            "anomaly_score",
                            0,
                        ),

                    "explanation":
                        transaction.get(
                            "risk_explanation",
                            {},
                        ),
                }
            )

            continue

        # -------------------------------------------------
        # New evaluation
        # -------------------------------------------------

        risk_result = await calculate_risk(
            transaction
        )

        stored = await store_risk_result(
            transaction_id,
            risk_result,
        )

        risk_score = float(
            stored["risk_score"]
        )

        risk_level = stored[
            "risk_level"
        ]

        decision = stored[
            "decision"
        ]

        evaluated += 1

        if risk_score >= 30:
            flagged += 1

        if decision == "BLOCK":
            blocked += 1

        elif decision == "REVIEW":
            review += 1

        else:
            allowed += 1

        # -------------------------------------------------
        # Create workflow
        # -------------------------------------------------

        workflow_created = (
            await create_workflow_if_needed(
                transaction_id,
                risk_score,
            )
        )

        results.append(
            {
                "transaction_id":
                    transaction_id,

                "status":
                    "evaluated",

                "risk_score":
                    risk_score,

                "risk_level":
                    risk_level,

                "decision":
                    decision,

                "ml_score":
                    stored["ml_score"],

                "rule_score":
                    stored["rule_score"],

                "anomaly_score":
                    stored["anomaly_score"],

                "explanation":
                    stored[
                        "risk_explanation"
                    ],

                "workflow_created":
                    workflow_created,
            }
        )

    return {
        "success": True,

        "summary": {
            "total_transactions":
                total_transactions,

            "evaluated":
                evaluated,

            "already_evaluated":
                already_evaluated,

            "flagged":
                flagged,

            "blocked":
                blocked,

            "review":
                review,

            "allowed":
                allowed,
        },

        "results": results,
    }