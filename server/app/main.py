import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .routers import execute, models, workflows, proxy, devices, upload, test

app = FastAPI(title="AIUI Server", version="0.1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://aiui.skeletor").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute.router)
app.include_router(models.router)
app.include_router(workflows.router)
app.include_router(proxy.router)
app.include_router(devices.router)
app.include_router(upload.router)
app.include_router(test.router)

@app.on_event("startup")
async def startup():
    import asyncio
    from ._device_registry import refresh_workers
    from ._workflow_sync import heartbeat
    await refresh_workers()
    asyncio.create_task(heartbeat())

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
