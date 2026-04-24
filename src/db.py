from pathlib import Path
from typing import Final, Optional

import aiosqlite

from src.config import db_path as resolve_db_path


SCHEMA: Final[str] = """
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    count INTEGER NOT NULL CHECK(count >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    priority INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'active',
    ai_reason TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    encrypted_text TEXT NOT NULL,
    sentiment TEXT,
    score REAL,
    summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_progress_date ON progress_notes(date);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    due_at TEXT NOT NULL,
    read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_due ON notifications(due_at);
"""


def _ensure_parent(path: str) -> None:
    parent = Path(path).parent
    if str(parent) not in ("", "."):
        parent.mkdir(parents=True, exist_ok=True)


async def open_connection(path: Optional[str] = None) -> aiosqlite.Connection:
    target = path or resolve_db_path()
    _ensure_parent(target)
    conn = await aiosqlite.connect(target)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON")
    return conn


async def init_db(path: Optional[str] = None) -> None:
    conn = await open_connection(path)
    try:
        await conn.executescript(SCHEMA)
        await conn.commit()
    finally:
        await conn.close()
