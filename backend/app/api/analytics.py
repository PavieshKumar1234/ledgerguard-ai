from pathlib import Path
from typing import Any

import joblib
from fastapi import APIRouter, Depends

from app.database import database
from app.security.permissions import get_current_user


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


# ============================================================
# ML ARTIFACT PATHS
# ============================================================

MODEL_DIR = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "models"
)

METRICS_PATH = MODEL_DIR / "test_metrics.joblib"
THRESHOLD_PATH = MODEL_DIR / "threshold_config.joblib"
MODEL_COMPARISON_PATH = MODEL_DIR / "model_comparison.joblib"
CURVES_PATH = MODEL_DIR / "evaluation_curves.joblib"


# ============================================================
# HELPERS
# ============================================================

def load_joblib(path: Path, default: Any):
    if not path.exists():
        return default

    try:
        return joblib.load(path)
    except Exception:
        return default


def safe_float(value: Any) -> float:
    try:
        if value is None:
            return 0.0

        if isinstance(value, str):
            value = value.replace(",", "").strip()

        return float(value)

    except (TypeError, ValueError):
        return 0.0


def safe_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def normalize(value: Any) -> str:
    return str(value or "").strip().upper()


# ============================================================
# LIVE BUSINESS ANALYTICS
# ============================================================

async def get_live_business_analytics():

    # ========================================================
    # TRANSACTIONS
    # ========================================================

    transaction_cursor = (
        database.transactions
        .find({})
        .sort("created_at", -1)
        .limit(1000)
    )

    transactions = await transaction_cursor.to_list(
        length=1000
    )

    total_count = len(transactions)

    total_volume = 0.0

    blocked_count = 0
    review_count = 0
    allowed_count = 0

    fraud_exposure = 0.0

    risk_critical = 0
    risk_high = 0
    risk_medium = 0
    risk_low = 0

    recent_transactions = []

    # ========================================================
    # PROCESS TRANSACTIONS
    # ========================================================

    for transaction in transactions:

        amount = safe_float(
            transaction.get("amount", 0)
        )

        # ----------------------------------------------------
        # TOTAL TRANSACTION VOLUME
        # ----------------------------------------------------

        total_volume += amount

        # ----------------------------------------------------
        # STATUS / DECISION
        # ----------------------------------------------------

        decision = normalize(
            transaction.get("decision")
        )

        risk_decision = normalize(
            transaction.get("risk_decision")
        )

        status = normalize(
            transaction.get("status")
        )

        effective_decision = (
            decision
            or risk_decision
        )

        # ----------------------------------------------------
        # RISK SCORE
        # ----------------------------------------------------

        risk_score = safe_float(
            transaction.get(
                "risk_score",
                transaction.get(
                    "riskScore",
                    transaction.get(
                        "risk",
                        0,
                    ),
                ),
            )
        )

        # ----------------------------------------------------
        # DECISION COUNTS
        # ----------------------------------------------------

        if (
            effective_decision
            in {
                "BLOCK",
                "BLOCKED",
                "DECLINE",
                "DECLINED",
            }
            or status in {
                "BLOCKED",
                "DECLINED",
            }
        ):

            blocked_count += 1
            fraud_exposure += amount

        elif (
            effective_decision
            in {
                "REVIEW",
                "INVESTIGATE",
                "INVESTIGATING",
            }
            or status
            in {
                "REVIEW",
                "INVESTIGATING",
            }
        ):

            review_count += 1
            fraud_exposure += amount

        elif (
            effective_decision
            in {
                "ALLOW",
                "ALLOWED",
                "APPROVE",
                "APPROVED",
            }
            or status
            in {
                "COMPLETED",
                "COMPLETE",
                "SUCCESS",
                "SUCCEEDED",
            }
        ):

            allowed_count += 1

        # ----------------------------------------------------
        # RISK DISTRIBUTION
        # ----------------------------------------------------

        if risk_score >= 80:
            risk_critical += 1

        elif risk_score >= 60:
            risk_high += 1

        elif risk_score >= 30:
            risk_medium += 1

        else:
            risk_low += 1

        # ----------------------------------------------------
        # RECENT TRANSACTIONS
        # ----------------------------------------------------

        if len(recent_transactions) < 10:

            transaction_id = str(
                transaction.get(
                    "transaction_id",
                    transaction.get(
                        "_id",
                        "UNKNOWN",
                    ),
                )
            )

            customer_id = str(
                transaction.get(
                    "customer_id",
                    "UNKNOWN",
                )
            )

            if (
                effective_decision
                in {
                    "BLOCK",
                    "BLOCKED",
                    "DECLINE",
                    "DECLINED",
                }
                or status
                in {
                    "BLOCKED",
                    "DECLINED",
                }
            ):

                response_decision = "Decline"
                response_status = "Blocked"

            elif (
                effective_decision
                in {
                    "REVIEW",
                    "INVESTIGATE",
                    "INVESTIGATING",
                }
                or status
                in {
                    "REVIEW",
                    "INVESTIGATING",
                }
            ):

                response_decision = "Review"
                response_status = "Investigating"

            else:

                response_decision = "Approve"
                response_status = "Completed"

            recent_transactions.append(
                {
                    "id": transaction_id,
                    "customer": customer_id,
                    "amount": amount,
                    "currency": transaction.get(
                        "currency",
                        "INR",
                    ),
                    "riskScore": risk_score,
                    "decision": response_decision,
                    "status": response_status,
                    "paymentMethod": transaction.get(
                        "payment_method",
                        "UNKNOWN",
                    ),
                    "location": transaction.get(
                        "location",
                        "Unknown",
                    ),
                    "createdAt": transaction.get(
                        "created_at"
                    ),
                }
            )

    # ========================================================
    # INVESTIGATIONS
    # ========================================================

    investigation_count = (
        await database.investigations.count_documents({})
    )

    open_investigations = (
        await database.investigations.count_documents(
            {
                "status": {
                    "$in": [
                        "OPEN",
                        "PENDING",
                        "INVESTIGATING",
                        "REVIEW",
                        "open",
                        "pending",
                        "investigating",
                        "review",
                    ]
                }
            }
        )
    )

    closed_investigations = (
        await database.investigations.count_documents(
            {
                "status": {
                    "$in": [
                        "CLOSED",
                        "RESOLVED",
                        "APPROVED",
                        "REJECTED",
                        "closed",
                        "resolved",
                        "approved",
                        "rejected",
                    ]
                }
            }
        )
    )

    # ========================================================
    # RECOVERY
    # ========================================================

    recovery_documents = await (
        database.recoveries
        .find({})
        .to_list(length=1000)
    )

    recovery_count = len(
        recovery_documents
    )

    recovery_target = 0.0
    recovered_amount = 0.0
    recovered_count = 0

    for recovery in recovery_documents:

        target = safe_float(
            recovery.get(
                "amount",
                recovery.get(
                    "original_amount",
                    recovery.get(
                        "target_amount",
                        0,
                    ),
                ),
            )
        )

        recovered = safe_float(
            recovery.get(
                "recovered_amount",
                recovery.get(
                    "recovered",
                    0,
                ),
            )
        )

        recovery_target += target
        recovered_amount += recovered

        recovery_status = normalize(
            recovery.get("status")
        )

        if recovery_status in {
            "RECOVERED",
            "COMPLETED",
        }:
            recovered_count += 1

    recovery_rate = (
        recovered_amount / recovery_target * 100
        if recovery_target > 0
        else 0.0
    )

    # ========================================================
    # CHARGEBACKS
    # ========================================================

    chargeback_documents = await (
        database.chargebacks
        .find({})
        .to_list(length=1000)
    )

    chargeback_count = len(
        chargeback_documents
    )

    chargeback_amount = 0.0
    chargeback_recovered = 0.0

    for chargeback in chargeback_documents:

        chargeback_amount += safe_float(
            chargeback.get(
                "amount",
                0,
            )
        )

        chargeback_recovered += safe_float(
            chargeback.get(
                "recovered_amount",
                0,
            )
        )

    chargeback_rate = (
        chargeback_count / total_count * 100
        if total_count > 0
        else 0.0
    )

    # ========================================================
    # ALERTS
    # ========================================================

    alert_count = (
        await database.alerts.count_documents({})
    )

    critical_alerts = (
        await database.alerts.count_documents(
            {
                "severity": {
                    "$in": [
                        "CRITICAL",
                        "critical",
                    ]
                }
            }
        )
    )

    high_alerts = (
        await database.alerts.count_documents(
            {
                "severity": {
                    "$in": [
                        "HIGH",
                        "high",
                    ]
                }
            }
        )
    )

    medium_alerts = (
        await database.alerts.count_documents(
            {
                "severity": {
                    "$in": [
                        "MEDIUM",
                        "medium",
                    ]
                }
            }
        )
    )

    # ========================================================
    # RETURN LIVE BUSINESS DATA
    # ========================================================

    return {

        "transactions": {
            "total_count": total_count,
            "total_volume": total_volume,
            "blocked": blocked_count,
            "review": review_count,
            "allowed": allowed_count,
        },

        "risk": {
            "fraud_exposure": fraud_exposure,
            "critical": risk_critical,
            "high": risk_high,
            "medium": risk_medium,
            "low": risk_low,
        },

        "recovery": {
            "target": recovery_target,
            "recovered": recovered_amount,
            "recovery_rate": recovery_rate,
            "count": recovery_count,
            "recovered_count": recovered_count,
        },

        "chargebacks": {
            "count": chargeback_count,
            "amount": chargeback_amount,
            "recovered": chargeback_recovered,
            "rate": chargeback_rate,
        },

        "investigations": {
            "total": investigation_count,
            "open": open_investigations,
            "closed": closed_investigations,
        },

        "alerts": {
            "total": alert_count,
            "critical": critical_alerts,
            "high": high_alerts,
            "medium": medium_alerts,
        },

        "recent_transactions": recent_transactions,
    }


# ============================================================
# ANALYTICS OVERVIEW
# ============================================================

@router.get("/overview")
async def analytics_overview(
    current_user=Depends(
        get_current_user
    ),
):

    # ========================================================
    # LOAD ML ARTIFACTS
    # ========================================================

    metrics = load_joblib(
        METRICS_PATH,
        {},
    )

    threshold = load_joblib(
        THRESHOLD_PATH,
        {},
    )

    model_comparison = load_joblib(
        MODEL_COMPARISON_PATH,
        [],
    )

    curves = load_joblib(
        CURVES_PATH,
        {},
    )

    dataset = metrics.get(
        "dataset",
        {},
    )

    # ========================================================
    # LIVE BUSINESS DATA
    # ========================================================

    business = (
        await get_live_business_analytics()
    )

    # ========================================================
    # MODEL COMPARISON
    # ========================================================

    formatted_models = []

    for model in model_comparison:

        formatted_models.append(
            {
                "model": model.get(
                    "model",
                    "Unknown",
                ),

                "precision": safe_float(
                    model.get(
                        "precision",
                        0,
                    )
                ),

                "recall": safe_float(
                    model.get(
                        "recall",
                        0,
                    )
                ),

                "f1": safe_float(
                    model.get(
                        "f1",
                        0,
                    )
                ),

                "roc_auc": safe_float(
                    model.get(
                        "roc_auc",
                        0,
                    )
                ),

                "accuracy": safe_float(
                    model.get(
                        "accuracy",
                        0,
                    )
                ),

                "false_positive_rate": safe_float(
                    model.get(
                        "false_positive_rate",
                        0,
                    )
                ),

                "false_negative_rate": safe_float(
                    model.get(
                        "false_negative_rate",
                        0,
                    )
                ),

                "inference_ms": safe_float(
                    model.get(
                        "inference_ms",
                        0,
                    )
                ),

                "training_seconds": safe_float(
                    model.get(
                        "training_seconds",
                        0,
                    )
                ),

                "selected": bool(
                    model.get(
                        "selected",
                        False,
                    )
                ),
            }
        )

    # ========================================================
    # CURVES
    # ========================================================

    roc_curve = curves.get(
        "roc_curve",
        [],
    )

    precision_recall_curve = curves.get(
        "precision_recall_curve",
        [],
    )

    threshold_table = curves.get(
        "threshold_table",
        [],
    )

    # ========================================================
    # FALSE-POSITIVE ECONOMICS
    # ========================================================

    false_positive_count = safe_int(
        metrics.get(
            "false_positive",
            0,
        )
    )

    estimated_legitimate_value_per_fp = 460.0
    estimated_customer_friction_per_fp = 93.0
    estimated_manual_review_per_case = 132.0
    estimated_recovery_rate = 0.20

    lost_legitimate_revenue = (
        false_positive_count
        * estimated_legitimate_value_per_fp
    )

    customer_friction_cost = (
        false_positive_count
        * estimated_customer_friction_per_fp
    )

    manual_review_cost = (
        false_positive_count
        * estimated_manual_review_per_case
    )

    expected_recovery = (
        lost_legitimate_revenue
        * estimated_recovery_rate
    )

    net_financial_impact = (
        lost_legitimate_revenue
        + customer_friction_cost
        + manual_review_cost
        - expected_recovery
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        # ----------------------------------------------------
        # LIVE BUSINESS
        # ----------------------------------------------------

        "transactions": business[
            "transactions"
        ],

        "risk": business[
            "risk"
        ],

        "recovery": business[
            "recovery"
        ],

        "chargebacks": business[
            "chargebacks"
        ],

        "investigations": business[
            "investigations"
        ],

        "alerts": business[
            "alerts"
        ],

        "recent_transactions": business[
            "recent_transactions"
        ],

        # ----------------------------------------------------
        # MODEL
        # ----------------------------------------------------

        "model": {
            "name": (
                "LedgerGuard Fraud Detection Model"
            ),

            "algorithm": metrics.get(
                "algorithm",
                "XGBoost",
            ),

            "production_model": metrics.get(
                "production_model",
                "XGBoost",
            ),

            "status": "ACTIVE",
        },

        # ----------------------------------------------------
        # METRICS
        # ----------------------------------------------------

        "metrics": {
            "accuracy": metrics.get(
                "accuracy",
                0,
            ),

            "precision": metrics.get(
                "precision",
                0,
            ),

            "recall": metrics.get(
                "recall",
                0,
            ),

            "f1": metrics.get(
                "f1",
                0,
            ),

            "roc_auc": metrics.get(
                "roc_auc",
                0,
            ),

            "true_negative": metrics.get(
                "true_negative",
                0,
            ),

            "false_positive": metrics.get(
                "false_positive",
                0,
            ),

            "false_negative": metrics.get(
                "false_negative",
                0,
            ),

            "true_positive": metrics.get(
                "true_positive",
                0,
            ),
        },

        # ----------------------------------------------------
        # THRESHOLD
        # ----------------------------------------------------

        "threshold": {
            "value": threshold.get(
                "threshold",
                metrics.get(
                    "threshold",
                    0.5,
                ),
            ),

            "validation_cost": threshold.get(
                "validation_cost",
                0,
            ),

            "false_positive_cost": threshold.get(
                "false_positive_cost",
                1,
            ),

            "false_negative_cost": threshold.get(
                "false_negative_cost",
                3,
            ),
        },

        # ----------------------------------------------------
        # MODEL COMPARISON
        # ----------------------------------------------------

        "model_comparison": formatted_models,

        # ----------------------------------------------------
        # CONFUSION MATRIX
        # ----------------------------------------------------

        "confusion_matrix": {
            "true_positive": metrics.get(
                "true_positive",
                0,
            ),

            "false_negative": metrics.get(
                "false_negative",
                0,
            ),

            "false_positive": metrics.get(
                "false_positive",
                0,
            ),

            "true_negative": metrics.get(
                "true_negative",
                0,
            ),
        },

        # ----------------------------------------------------
        # ROC
        # ----------------------------------------------------

        "roc": {
            "auc": curves.get(
                "roc_auc",
                metrics.get(
                    "roc_auc",
                    0,
                ),
            ),

            "points": roc_curve,
        },

        # ----------------------------------------------------
        # PRECISION / RECALL
        # ----------------------------------------------------

        "precision_recall": {
            "points": precision_recall_curve,
        },

        # ----------------------------------------------------
        # THRESHOLD OPTIMIZATION
        # ----------------------------------------------------

        "threshold_optimization": (
            threshold_table
        ),

        # ----------------------------------------------------
        # DATASET EVALUATION
        # ----------------------------------------------------

        "evaluation": {
            "total_dataset": dataset.get(
                "total_dataset",
                0,
            ),

            "training_set": dataset.get(
                "training_set",
                0,
            ),

            "validation_set": dataset.get(
                "validation_set",
                0,
            ),

            "held_out_test_set": dataset.get(
                "held_out_test_set",
                0,
            ),

            "test_sample_count": dataset.get(
                "test_sample_count",
                0,
            ),

            "fraud_samples": dataset.get(
                "fraud_samples",
                0,
            ),

            "legitimate_samples": dataset.get(
                "legitimate_samples",
                0,
            ),
        },

        # ----------------------------------------------------
        # FALSE-POSITIVE ECONOMICS
        # ----------------------------------------------------

        "false_positive_economics": {

            "false_positives": (
                false_positive_count
            ),

            "lost_legitimate_revenue": (
                float(
                    lost_legitimate_revenue
                )
            ),

            "customer_friction_cost": (
                float(
                    customer_friction_cost
                )
            ),

            "manual_review_cost": (
                float(
                    manual_review_cost
                )
            ),

            "expected_recovery": (
                float(
                    expected_recovery
                )
            ),

            "net_financial_impact": (
                float(
                    net_financial_impact
                )
            ),

            "assumptions": {

                "legitimate_value_per_fp": (
                    estimated_legitimate_value_per_fp
                ),

                "customer_friction_per_fp": (
                    estimated_customer_friction_per_fp
                ),

                "manual_review_per_case": (
                    estimated_manual_review_per_case
                ),

                "recovery_rate": (
                    estimated_recovery_rate
                ),
            },
        },
    }