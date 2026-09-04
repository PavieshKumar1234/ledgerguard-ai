def make_decision(risk_score: float) -> str:
    if risk_score >= 80:
        return "BLOCK"

    if risk_score >= 50:
        return "REVIEW"

    return "ALLOW"