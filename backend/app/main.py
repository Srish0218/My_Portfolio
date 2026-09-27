import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Srishti Jaitly Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "data" / "portfolio.json"


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/portfolio")
def get_portfolio():
    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Portfolio data file not found: backend/app/data/portfolio.json",
        )
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "portfolio.json has invalid JSON "
                f"near line {error.lineno}, column {error.colno}."
            ),
        )