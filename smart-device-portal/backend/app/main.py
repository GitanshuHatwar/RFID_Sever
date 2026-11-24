from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routers import auth, devices, taps, tickets, dashboard, reader

app = FastAPI(title="RFID Technician Portal")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reader.router)
app.include_router(devices.router)
app.include_router(taps.router)
app.include_router(tickets.router)
app.include_router(dashboard.router)
