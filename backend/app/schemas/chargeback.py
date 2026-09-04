from pydantic import BaseModel, Field


class ChargebackCreateRequest(BaseModel):
    transaction_id: str
    reason: str = Field(min_length=3, max_length=500)


class ChargebackUpdateRequest(BaseModel):
    status: str
    evidence_status: str | None = None
    representment_status: str | None = None
    recovered_amount: float = Field(default=0, ge=0)