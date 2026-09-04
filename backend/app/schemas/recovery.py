from pydantic import BaseModel, Field


class RecoveryCompletionRequest(BaseModel):
    recovered_amount: float = Field(
        ge=0
    )