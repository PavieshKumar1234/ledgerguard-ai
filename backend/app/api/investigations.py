from fastapi import APIRouter, Depends

from app.security.permissions import get_current_user

from app.services.investigation_service import (
    create_investigation,
    get_investigation,
    get_investigations,
    update_investigation_action,
)


router = APIRouter(
    prefix="/api/investigations",
    tags=["Investigations"],
)


# ============================================================
# LIST INVESTIGATIONS
# ============================================================

@router.get("/")
async def list_all(
    limit: int = 50,
    current_user=Depends(
        get_current_user
    ),
):
    return await get_investigations(
        limit
    )


# ============================================================
# CREATE INVESTIGATION
# ============================================================

@router.post("/{transaction_id}")
async def create(
    transaction_id: str,
    current_user=Depends(
        get_current_user
    ),
):
    return await create_investigation(
        transaction_id
    )


# ============================================================
# GET INVESTIGATION
# ============================================================

@router.get("/{transaction_id}")
async def get(
    transaction_id: str,
    current_user=Depends(
        get_current_user
    ),
):
    return await get_investigation(
        transaction_id
    )


# ============================================================
# UPDATE INVESTIGATION ACTION
# ============================================================

@router.patch("/{investigation_id}/action")
async def update_action(
    investigation_id: str,
    action: str,
    note: str | None = None,
    current_user=Depends(
        get_current_user
    ),
):
    analyst = current_user.get(
        "email",
        "system",
    )

    return await update_investigation_action(
        investigation_id=investigation_id,
        action=action,
        analyst=analyst,
        note=note,
    )