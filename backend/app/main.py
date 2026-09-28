import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = REPOSITORY_ROOT / "frontend" / "public" / "portfolio.json"

app = FastAPI(
    title="Srishti Jaitly Portfolio API",
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:5173",
                "https://srishti-jaitly-portfolio.vercel.app",
            ],
            allow_methods=["GET"],
            allow_headers=["*"],
        )
    ],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/portfolio")
def get_portfolio():
    try:
        with DATA_FILE.open("r", encoding="utf-8") as portfolio_file:
            return json.load(portfolio_file)
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Portfolio data file not found: {DATA_FILE}",
        ) from error
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "portfolio.json has invalid JSON "
                f"near line {error.lineno}, column {error.colno}."
            ),
        ) from error
