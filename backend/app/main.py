from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.risk import router as risk_router
from app.api.investigations import router as investigations_router
from app.api.alerts import router as alerts_router
from app.api.recovery import router as recovery_router
from app.api.chargebacks import router as chargebacks_router
from app.api.analytics import router as analytics_router


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated Revenue Recovery & Chargeback Defense",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Next.js development server
        "http://localhost:3000",
        "http://127.0.0.1:3000",

        # Alternative Next.js port
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(risk_router)
app.include_router(investigations_router)
app.include_router(alerts_router)
app.include_router(recovery_router)
app.include_router(chargebacks_router)
app.include_router(analytics_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():
    return {
        "service": "LedgerGuard API",
        "status": "operational",
        "version": settings.APP_VERSION,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ledgerguard-api",
    }