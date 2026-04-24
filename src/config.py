import os
from typing import Final


DEFAULT_DB_PATH: Final[str] = "/data/resolution.db"
DEFAULT_OLLAMA_URL: Final[str] = "http://host.docker.internal:11434"
DEFAULT_OLLAMA_MODEL: Final[str] = "gemma4:26b"
DEFAULT_CORS_ORIGIN: Final[str] = "http://localhost:5173"


def db_path() -> str:
    return os.getenv("DB_PATH", DEFAULT_DB_PATH)


def ollama_url() -> str:
    return os.getenv("OLLAMA_URL", DEFAULT_OLLAMA_URL)


def ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)


def cors_origin() -> str:
    return os.getenv("CORS_ORIGIN", DEFAULT_CORS_ORIGIN)


def checkin_cron_hours() -> str:
    return os.getenv("CHECKIN_HOURS", "9,13,18")
