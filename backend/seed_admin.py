import asyncio
from datetime import datetime, timezone

from app.database import database
from app.security.password import hash_password


async def create_admin():
    email = "admin@ledgerguard.ai"
    password = "LedgerGuard@2026"

    existing_user = await database.users.find_one(
        {"email": email}
    )

    if existing_user:
        print("Admin user already exists.")
        return

    admin_user = {
        "name": "Arjun Kapoor",
        "email": email,
        "password_hash": hash_password(password),
        "role": "Merchant Admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    result = await database.users.insert_one(admin_user)

    print("Admin user created successfully.")
    print(f"User ID: {result.inserted_id}")
    print(f"Email: {email}")


if __name__ == "__main__":
    asyncio.run(create_admin())