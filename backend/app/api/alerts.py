from fastapi import APIRouter, Depends

from app.security.permissions import get_current_user
from app.services.alert_service import (
    create_alert,
    get_alerts,
    mark_alert_read,
)

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"],
)


@router.post("/{transaction_id}")
async def create(
    transaction_id: str,
    current_user=Depends(get_current_user),
):
    return await create_alert(transaction_id)


@router.get("/")
async def list_alerts(
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    return await get_alerts(limit)


@router.patch("/{alert_id}/read")
async def mark_read(
    alert_id: str,
    current_user=Depends(get_current_user),
):
    return await mark_alert_read(alert_id)