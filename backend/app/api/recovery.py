from fastapi import APIRouter, Depends

from app.schemas.recovery import (
    RecoveryCompletionRequest,
)
from app.security.permissions import get_current_user
from app.services.recovery_service import (
    create_recovery,
    get_recoveries,
    complete_recovery,
)

router = APIRouter(
    prefix="/api/recovery",
    tags=["Recovery"],
)


@router.post("/{transaction_id}")
async def create(
    transaction_id: str,
    current_user=Depends(get_current_user),
):
    return await create_recovery(
        transaction_id
    )


@router.get("/")
async def list_recoveries(
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    return await get_recoveries(limit)


@router.patch("/{recovery_id}/complete")
async def complete(
    recovery_id: str,
    request: RecoveryCompletionRequest,
    current_user=Depends(get_current_user),
):
    return await complete_recovery(
        recovery_id,
        request.recovered_amount,
    )