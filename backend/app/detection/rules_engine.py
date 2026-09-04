def evaluate_rules(transaction: dict) -> dict:
    amount = float(transaction.get("amount", 0))
    location = transaction.get("location", "")
    device_id = transaction.get("device_id", "")

    rules = []
    score = 0

    if amount >= 50000:
        rules.append("HIGH_VALUE_TRANSACTION")
        score += 30

    if location.lower() == "unknown":
        rules.append("UNKNOWN_LOCATION")
        score += 20

    if device_id.upper().startswith("DEV-SUSPICIOUS"):
        rules.append("SUSPICIOUS_DEVICE")
        score += 35

    return {
        "rule_score": min(score, 100),
        "triggered_rules": rules,
    }