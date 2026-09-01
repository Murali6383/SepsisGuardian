from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.db.database import Base, engine
from app.db import models

from app.api.auth import r as auth
from app.api.dashboard import r as dashboard
from app.api.patients import router as patient_router
from app.api.vitals import router as vitals_router
from app.api.labs import router as labs_router
from app.api import ai_prediction
from app.api.nurse import router as nurse_router

# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="SepsisGuardian AI API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth)

app.include_router(dashboard)

app.include_router(patient_router)

app.include_router(vitals_router)

app.include_router(labs_router)

app.include_router(
    ai_prediction.router
)
app.include_router(nurse_router)


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    print("========================================")
    print("Starting SepsisGuardian AI API")
    print("========================================")

    Base.metadata.create_all(
        bind=engine
    )

    print("Database tables checked/created")
    print("========================================")


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "SepsisGuardian AI API"
    }


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "SepsisGuardian AI API is running",
        "docs": "/docs"
    }