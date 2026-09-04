from fastapi import HTTPException, status

from app.database import database
from app.security.password import verify_password
from app.security.jwt import create_access_token


async def authenticate_user(email: str, password: str):
    user = await database.users.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "Merchant Admin"),
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }