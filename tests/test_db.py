from pathlib import Path

import aiosqlite
import pytest

from src import db


async def test_init_db_creates_tables(tmp_path: Path) -> None:
    path = str(tmp_path / "fresh.db")
    await db.init_db(path)
    conn = await aiosqlite.connect(path)
    try:
        cursor = await conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        rows = await cursor.fetchall()
        names = {row[0] for row in rows}
    finally:
        await conn.close()
    assert {"activities", "goals", "progress_notes", "notifications"}.issubset(
        names
    )


async def test_init_db_uses_env_default(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    target = tmp_path / "via_env.db"
    monkeypatch.setenv("DB_PATH", str(target))
    await db.init_db()
    assert target.exists()


async def test_open_connection_row_factory(tmp_path: Path) -> None:
    path = str(tmp_path / "rows.db")
    await db.init_db(path)
    conn = await db.open_connection(path)
    try:
        assert conn.row_factory is aiosqlite.Row
    finally:
        await conn.close()


def test_ensure_parent_handles_root_like_path(tmp_path: Path) -> None:
    bare_path = str(tmp_path / "noparent.db")
    db._ensure_parent(bare_path)
    assert Path(bare_path).parent.exists()


def test_ensure_parent_skips_empty_parent() -> None:
    db._ensure_parent("inplace.db")  # parent resolves to '.' - nothing to create
