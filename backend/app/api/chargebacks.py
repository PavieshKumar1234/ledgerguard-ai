from fastapi import APIRouter, Depends

from app.schemas.chargeback import (
    ChargebackCreateRequest,
    ChargebackUpdateRequest,
)
from app.security.permissions import get_current_user
from app.services.chargeback_service import (
    create_chargeback,
    get_chargebacks,
    get_chargeback,
    update_chargeback,
)


router = APIRouter(
    prefix="/api/chargebacks",
    tags=["Chargebacks"],
)


@router.post("/")
async def create(
    request: ChargebackCreateRequest,
    current_user=Depends(get_current_user),
):
    return await create_chargeback(
        transaction_id=request.transaction_id,
        reason=request.reason,
    )


@router.get("/")
async def list_all(
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    return await get_chargebacks(limit)


@router.get("/{chargeback_id}")
async def get(
    chargeback_id: str,
    current_user=Depends(get_current_user),
):
    return await get_chargeback(chargeback_id)


@router.patch("/{chargeback_id}")
async def update(
    chargeback_id: str,
    request: ChargebackUpdateRequest,
    current_user=Depends(get_current_user),
):
    return await update_chargeback(
        chargeback_id=chargeback_id,
        status=request.status,
        evidence_status=request.evidence_status,
        representment_status=request.representment_status,
        recovered_amount=request.recovered_amount,
    )