from fastapi import APIRouter, Depends

from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import (
    create_transaction,
    get_transactions,
)
from app.security.permissions import get_current_user


router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"],
)


@router.post("/")
async def create(
    transaction: TransactionCreate,
    current_user=Depends(get_current_user),
):
    return await create_transaction(
        transaction.model_dump()
    )


@router.get("/")
async def list_transactions(
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    return await get_transactions(limit)