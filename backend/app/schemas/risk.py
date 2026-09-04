from pydantic import BaseModel


class RiskPredictionRequest(BaseModel):
    transaction_id: str


class RiskPredictionResponse(BaseModel):
    transaction_id: str
    risk_score: float
    decision: str
    triggered_rules: list[str]
    features: dict