from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    password_hash: str
    role: str = "Merchant Admin"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)