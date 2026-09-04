from pathlib import Path
from typing import Any
import math

import joblib


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

ML_DIR = (
    BASE_DIR
    / "app"
    / "ml"
    / "models"
)

MODEL_PATH = ML_DIR / "fraud_model.joblib"
THRESHOLD_PATH = ML_DIR / "threshold_config.joblib"


# =========================================================
# LAZY-LOADED ML ARTIFACTS
# =========================================================

_model = None
_threshold = None


def load_model():
    global _model

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Fraud model not found: {MODEL_PATH}"
            )

        _model = joblib.load(MODEL_PATH)

    return _model


def load_threshold():
    global _threshold

    if _threshold is None:

        if THRESHOLD_PATH.exists():
            config = joblib.load(
                THRESHOLD_PATH
            )

            if isinstance(config, dict):
                _threshold = float(
                    config.get(
                        "threshold",
                        0.5,
                    )
                )
            else:
                _threshold = float(config)

        else:
            _threshold = 0.5

    return _threshold


# =========================================================
# HELPERS
# =========================================================

def safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        return float(value)
    except (
        TypeError,
        ValueError,
    ):
        return default


def safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        return int(value)
    except (
        TypeError,
        ValueError,
    ):
        return default


def safe_log(
    value: float,
) -> float:
    return math.log1p(
        max(value, 0)
    )


def clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


# =========================================================
# FEATURE ENGINEERING
# =========================================================

def build_transaction_features(
    transaction: dict,
) -> dict[str, Any]:

    amount = safe_float(
        transaction.get(
            "amount",
            0,
        )
    )

    account_age_days = safe_int(
        transaction.get(
            "account_age_days",
            365,
        ),
        365,
    )

    device_age_days = safe_int(
        transaction.get(
            "device_age_days",
            180,
        ),
        180,
    )

    transactions_last_24h = safe_int(
        transaction.get(
            "transactions_last_24h",
            1,
        ),
        1,
    )

    previous_chargebacks = safe_int(
        transaction.get(
            "previous_chargebacks",
            0,
        ),
        0,
    )

    ip_risk = safe_float(
        transaction.get(
            "ip_risk",
            0,
        )
    )

    device_risk = safe_float(
        transaction.get(
            "device_risk",
            0,
        )
    )

    payment_method = str(
        transaction.get(
            "payment_method",
            "",
        )
    ).upper()

    location = str(
        transaction.get(
            "location",
            "",
        )
    ).lower()

    device_id = str(
        transaction.get(
            "device_id",
            "",
        )
    ).upper()

    features = {
        "amount": amount,

        "account_age_days":
            account_age_days,

        "device_age_days":
            device_age_days,

        "transactions_last_24h":
            transactions_last_24h,

        "previous_chargebacks":
            previous_chargebacks,

        "ip_risk":
            ip_risk,

        "device_risk":
            device_risk,

        "amount_log":
            safe_log(amount),

        "is_high_value":
            int(amount >= 50000),

        "is_card_payment":
            int(
                payment_method == "CARD"
            ),

        "is_upi_payment":
            int(
                payment_method == "UPI"
            ),

        "unknown_location":
            int(
                location == "unknown"
            ),

        "suspicious_device":
            int(
                device_id.startswith(
                    "DEV-SUSPICIOUS"
                )
            ),
    }

    return features


# =========================================================
# ML PREDICTION
# =========================================================

def get_ml_probability(
    transaction: dict,
) -> float:

    model = load_model()

    features = build_transaction_features(
        transaction
    )

    model_features = [
    "amount",
    "account_age_days",
    "device_age_days",
    "transactions_last_24h",
    "previous_chargebacks",
    "ip_risk",
    "device_risk",
    "unknown_location",
   ]

    values = [
        features[name]
        for name in model_features
    ]

    try:

        probability = model.predict_proba(
            [values]
        )[0][1]

        return clamp(
            float(probability),
            0.0,
            1.0,
        )

    except Exception:

        try:
            import pandas as pd

            frame = pd.DataFrame(
                [values],
                columns=model_features,
            )

            probability = model.predict_proba(
                frame
            )[0][1]

            return clamp(
                float(probability),
                0.0,
                1.0,
            )

        except Exception:
            return 0.0


# =========================================================
# RULE ENGINE
# =========================================================

def calculate_rule_score(
    transaction: dict,
) -> float:

    score = 0.0

    amount = safe_float(
        transaction.get(
            "amount",
            0,
        )
    )

    location = str(
        transaction.get(
            "location",
            "",
        )
    ).lower()

    device_id = str(
        transaction.get(
            "device_id",
            "",
        )
    ).upper()

    ip_risk = safe_float(
        transaction.get(
            "ip_risk",
            0,
        )
    )

    device_risk = safe_float(
        transaction.get(
            "device_risk",
            0,
        )
    )

    if amount >= 50000:
        score += 30

    if location == "unknown":
        score += 20

    if device_id.startswith(
        "DEV-SUSPICIOUS"
    ):
        score += 35

    score += min(
        ip_risk * 10,
        10,
    )

    score += min(
        device_risk * 10,
        10,
    )

    return clamp(score)


# =========================================================
# ANOMALY ENGINE
# =========================================================

def calculate_anomaly_score(
    transaction: dict,
) -> float:

    score = 0.0

    amount = safe_float(
        transaction.get(
            "amount",
            0,
        )
    )

    transactions_last_24h = safe_int(
        transaction.get(
            "transactions_last_24h",
            1,
        ),
        1,
    )

    previous_chargebacks = safe_int(
        transaction.get(
            "previous_chargebacks",
            0,
        ),
        0,
    )

    ip_risk = safe_float(
        transaction.get(
            "ip_risk",
            0,
        )
    )

    device_risk = safe_float(
        transaction.get(
            "device_risk",
            0,
        )
    )

    if amount >= 50000:
        score += 35

    elif amount >= 25000:
        score += 20

    if transactions_last_24h >= 10:
        score += 30

    elif transactions_last_24h >= 5:
        score += 20

    if previous_chargebacks >= 3:
        score += 20

    elif previous_chargebacks >= 1:
        score += 10

    score += min(
        ip_risk * 10,
        10,
    )

    score += min(
        device_risk * 10,
        10,
    )

    return clamp(score)


# =========================================================
# EXPLAINABLE RULE DETAILS
# =========================================================

def build_rule_explanations(
    transaction: dict,
) -> list[dict]:

    explanations = []

    amount = safe_float(
        transaction.get(
            "amount",
            0,
        )
    )

    location = str(
        transaction.get(
            "location",
            "",
        )
    ).lower()

    device_id = str(
        transaction.get(
            "device_id",
            "",
        )
    ).upper()

    ip_risk = safe_float(
        transaction.get(
            "ip_risk",
            0,
        )
    )

    device_risk = safe_float(
        transaction.get(
            "device_risk",
            0,
        )
    )

    transactions_last_24h = safe_int(
        transaction.get(
            "transactions_last_24h",
            1,
        ),
        1,
    )

    previous_chargebacks = safe_int(
        transaction.get(
            "previous_chargebacks",
            0,
        ),
        0,
    )

    # -----------------------------------------------------
    # HIGH VALUE
    # -----------------------------------------------------

    if amount >= 50000:

        explanations.append(
            {
                "code": "HIGH_VALUE_TRANSACTION",
                "title": "High transaction value",
                "description": (
                    "Transaction amount exceeds "
                    "the high-value risk threshold."
                ),
                "impact": 30,
                "severity": "HIGH",
                "category": "RULE",
            }
        )

    elif amount >= 25000:

        explanations.append(
            {
                "code": "ELEVATED_VALUE",
                "title": "Elevated transaction value",
                "description": (
                    "Transaction amount is "
                    "significantly above the normal "
                    "monitoring range."
                ),
                "impact": 20,
                "severity": "MEDIUM",
                "category": "ANOMALY",
            }
        )

    # -----------------------------------------------------
    # UNKNOWN LOCATION
    # -----------------------------------------------------

    if location == "unknown":

        explanations.append(
            {
                "code": "UNKNOWN_LOCATION",
                "title": "Unknown transaction location",
                "description": (
                    "The transaction location could "
                    "not be confidently identified."
                ),
                "impact": 20,
                "severity": "HIGH",
                "category": "RULE",
            }
        )

    # -----------------------------------------------------
    # SUSPICIOUS DEVICE
    # -----------------------------------------------------

    if device_id.startswith(
        "DEV-SUSPICIOUS"
    ):

        explanations.append(
            {
                "code": "SUSPICIOUS_DEVICE",
                "title": "Suspicious device",
                "description": (
                    "The device identifier matches "
                    "a known suspicious-device pattern."
                ),
                "impact": 35,
                "severity": "CRITICAL",
                "category": "RULE",
            }
        )

    # -----------------------------------------------------
    # IP RISK
    # -----------------------------------------------------

    if ip_risk >= 0.7:

        explanations.append(
            {
                "code": "HIGH_IP_RISK",
                "title": "High IP risk",
                "description": (
                    "The originating IP carries "
                    "a high risk signal."
                ),
                "impact": round(
                    min(
                        ip_risk * 10,
                        10,
                    ),
                    2,
                ),
                "severity": "HIGH",
                "category": "RULE",
            }
        )

    elif ip_risk >= 0.3:

        explanations.append(
            {
                "code": "ELEVATED_IP_RISK",
                "title": "Elevated IP risk",
                "description": (
                    "The originating IP shows "
                    "an elevated risk signal."
                ),
                "impact": round(
                    min(
                        ip_risk * 10,
                        10,
                    ),
                    2,
                ),
                "severity": "MEDIUM",
                "category": "RULE",
            }
        )

    # -----------------------------------------------------
    # DEVICE RISK
    # -----------------------------------------------------

    if device_risk >= 0.7:

        explanations.append(
            {
                "code": "HIGH_DEVICE_RISK",
                "title": "High device risk",
                "description": (
                    "The device carries a high "
                    "risk signal."
                ),
                "impact": round(
                    min(
                        device_risk * 10,
                        10,
                    ),
                    2,
                ),
                "severity": "HIGH",
                "category": "RULE",
            }
        )

    elif device_risk >= 0.3:

        explanations.append(
            {
                "code": "ELEVATED_DEVICE_RISK",
                "title": "Elevated device risk",
                "description": (
                    "The device shows an elevated "
                    "risk signal."
                ),
                "impact": round(
                    min(
                        device_risk * 10,
                        10,
                    ),
                    2,
                ),
                "severity": "MEDIUM",
                "category": "RULE",
            }
        )

    # -----------------------------------------------------
    # VELOCITY
    # -----------------------------------------------------

    if transactions_last_24h >= 10:

        explanations.append(
            {
                "code": "HIGH_TRANSACTION_VELOCITY",
                "title": "High transaction velocity",
                "description": (
                    "The account has generated an "
                    "unusually high number of "
                    "transactions in 24 hours."
                ),
                "impact": 30,
                "severity": "HIGH",
                "category": "ANOMALY",
            }
        )

    elif transactions_last_24h >= 5:

        explanations.append(
            {
                "code": "ELEVATED_TRANSACTION_VELOCITY",
                "title": "Elevated transaction velocity",
                "description": (
                    "Transaction frequency is "
                    "above the normal monitoring range."
                ),
                "impact": 20,
                "severity": "MEDIUM",
                "category": "ANOMALY",
            }
        )

    # -----------------------------------------------------
    # PREVIOUS CHARGEBACKS
    # -----------------------------------------------------

    if previous_chargebacks >= 3:

        explanations.append(
            {
                "code": "REPEATED_CHARGEBACKS",
                "title": "Repeated chargebacks",
                "description": (
                    "The account has multiple previous "
                    "chargeback events."
                ),
                "impact": 20,
                "severity": "HIGH",
                "category": "ANOMALY",
            }
        )

    elif previous_chargebacks >= 1:

        explanations.append(
            {
                "code": "PREVIOUS_CHARGEBACK",
                "title": "Previous chargeback history",
                "description": (
                    "The account has a previous "
                    "chargeback event."
                ),
                "impact": 10,
                "severity": "MEDIUM",
                "category": "ANOMALY",
            }
        )

    return explanations


# =========================================================
# EXPLAINABLE AI SUMMARY
# =========================================================

def build_explanation(
    transaction: dict,
    risk_score: float,
    risk_level: str,
    decision: str,
    ml_probability: float,
    ml_score: float,
    rule_score: float,
    anomaly_score: float,
) -> dict:

    rule_explanations = (
        build_rule_explanations(
            transaction
        )
    )

    # Highest-impact signals first.
    rule_explanations.sort(
        key=lambda item: safe_float(
            item.get(
                "impact",
                0,
            )
        ),
        reverse=True,
    )

    # -----------------------------------------------------
    # Component contributions
    # -----------------------------------------------------

    ml_contribution = (
        ml_score * 0.60
    )

    rule_contribution = (
        rule_score * 0.20
    )

    anomaly_contribution = (
        anomaly_score * 0.20
    )

    # -----------------------------------------------------
    # Human-readable summary
    # -----------------------------------------------------

    if decision == "BLOCK":

        summary = (
            "Multiple high-risk signals "
            "combined to exceed the blocking "
            "threshold. The transaction should "
            "be prevented and investigated."
        )

    elif decision == "REVIEW":

        summary = (
            "The transaction contains elevated "
            "risk signals and requires analyst "
            "review before final disposition."
        )

    else:

        summary = (
            "No sufficiently strong risk pattern "
            "was detected. The transaction can "
            "proceed under normal monitoring."
        )

    # -----------------------------------------------------
    # Top risk drivers
    # -----------------------------------------------------

    top_drivers = []

    for explanation in rule_explanations[:5]:

        top_drivers.append(
            {
                "title":
                    explanation["title"],

                "impact":
                    explanation["impact"],

                "severity":
                    explanation["severity"],

                "category":
                    explanation["category"],
            }
        )

    return {
        "summary":
            summary,

        "risk_level":
            risk_level,

        "decision":
            decision,

        "top_risk_drivers":
            top_drivers,

        "rule_explanations":
            rule_explanations,

        "component_contributions": {
            "ml": round(
                ml_contribution,
                2,
            ),
            "rules": round(
                rule_contribution,
                2,
            ),
            "anomaly": round(
                anomaly_contribution,
                2,
            ),
        },

        "signal_count":
            len(rule_explanations),

        "ml_probability":
            round(
                ml_probability,
                4,
            ),

        "ml_score":
            round(
                ml_score,
                2,
            ),

        "rule_score":
            round(
                rule_score,
                2,
            ),

        "anomaly_score":
            round(
                anomaly_score,
                2,
            ),

        "explainability_method":
            "LedgerGuard hybrid ML + rule + anomaly attribution",
    }


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(
    risk_score: float,
) -> str:

    score = float(
        risk_score
    )

    if score >= 80:
        return "CRITICAL"

    if score >= 50:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


# =========================================================
# FINAL DECISION
# =========================================================

def get_decision(
    risk_score: float,
) -> str:

    score = float(
        risk_score
    )

    if score >= 80:
        return "BLOCK"

    if score >= 50:
        return "REVIEW"

    return "ALLOW"


# =========================================================
# MAIN RISK ENGINE
# =========================================================

async def calculate_risk(
    transaction: dict,
) -> dict:

    # -----------------------------------------------------
    # ML
    # -----------------------------------------------------

    ml_probability = (
        get_ml_probability(
            transaction
        )
    )

    ml_score = (
        ml_probability * 100
    )

    # -----------------------------------------------------
    # RULES
    # -----------------------------------------------------

    rule_score = (
        calculate_rule_score(
            transaction
        )
    )

    # -----------------------------------------------------
    # ANOMALY
    # -----------------------------------------------------

    anomaly_score = (
        calculate_anomaly_score(
            transaction
        )
    )

    # -----------------------------------------------------
    # WEIGHTED RISK SCORE
    #
    # ML       = 60%
    # Rules    = 20%
    # Anomaly  = 20%
    # -----------------------------------------------------

    risk_score = (
        (ml_score * 0.60)
        + (rule_score * 0.20)
        + (anomaly_score * 0.20)
    )

    risk_score = clamp(
        risk_score
    )

    # -----------------------------------------------------
    # DECISION
    # -----------------------------------------------------

    risk_level = get_risk_level(
        risk_score
    )

    decision = get_decision(
        risk_score
    )

    threshold = load_threshold()

    # -----------------------------------------------------
    # EXPLAINABILITY
    # -----------------------------------------------------

    explanation = (
        build_explanation(
            transaction=transaction,
            risk_score=risk_score,
            risk_level=risk_level,
            decision=decision,
            ml_probability=ml_probability,
            ml_score=ml_score,
            rule_score=rule_score,
            anomaly_score=anomaly_score,
        )
    )

    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    return {
        "risk_score":
            round(
                risk_score,
                2,
            ),

        "risk_level":
            risk_level,

        "decision":
            decision,

        "ml_probability":
            round(
                ml_probability,
                4,
            ),

        "ml_score":
            round(
                ml_score,
                2,
            ),

        "rule_score":
            round(
                rule_score,
                2,
            ),

        "anomaly_score":
            round(
                anomaly_score,
                2,
            ),

        "threshold":
            threshold,

        "features":
            build_transaction_features(
                transaction
            ),

        # -------------------------------------------------
        # NEW: EXPLAINABLE AI
        # -------------------------------------------------

        "explanation":
            explanation,
    }