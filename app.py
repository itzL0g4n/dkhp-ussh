from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

from sniper_service import SniperEngine

app = FastAPI()

# Initialize Sniper Engine
sniper = SniperEngine()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Data Models
class TargetModel(BaseModel):
    ten_goi_nho: str
    ma_lop_hp: str
    ma_mon: str
    ten_mon_full: str

class ConfigModel(BaseModel):
    cookie: str
    config_id: str
    nam_hoc: str
    hoc_ky: str
    targets: List[TargetModel]
    delay: float

# Routes
@app.get("/")
async def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/status")
async def get_status():
    return {
        "is_running": sniper.is_running,
        "config": sniper.config
    }

@app.post("/api/start")
async def start_sniper():
    if not sniper.config.get("cookie"):
        return JSONResponse(status_code=400, content={"message": "Chưa có Cookie!"})
    
    success = sniper.start()
    return {"message": "Sniper started", "is_running": success}

@app.post("/api/stop")
async def stop_sniper():
    success = sniper.stop()
    return {"message": "Sniper stopped", "is_running": not success}

@app.post("/api/config")
async def update_config(config: ConfigModel):
    # Convert Pydantic model to dict
    config_dict = config.dict()
    sniper.update_config(config_dict)
    return {"message": "Configuration updated", "config": sniper.config}

@app.get("/api/logs")
async def get_logs():
    return {"logs": sniper.get_logs()}

@app.get("/api/console-script")
async def get_console_script():
    try:
        with open("dan_vao_console.js", "r", encoding="utf-8") as f:
            content = f.read()
            return {"content": content}
    except Exception as e:
        return {"content": "// Could not load file: " + str(e)}

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True, access_log=False)
