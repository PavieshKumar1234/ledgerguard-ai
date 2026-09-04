from fastapi import APIRouter, Depends

from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import authenticate_user
from app.security.permissions import get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    return await authenticate_user(
        request.email,
        request.password,
    )


@router.get("/me")
async def get_me(
    current_user=Depends(get_current_user),
):
    return {
        "authenticated": True,
        "user": current_user,
    }