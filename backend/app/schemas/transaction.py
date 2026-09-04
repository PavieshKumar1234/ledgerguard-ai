from datetime import datetime
from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float = Field(gt=0)
    currency: str = "INR"
    payment_method: str
    merchant_id: str
    device_id: str
    ip_address: str
    location: str
    status: str = "completed"


class TransactionResponse(TransactionCreate):
    created_at: datetime