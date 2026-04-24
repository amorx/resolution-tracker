import pytest

from src import config


def test_defaults_when_env_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    for var in (
        "DB_PATH",
        "OLLAMA_URL",
        "OLLAMA_MODEL",
        "CORS_ORIGIN",
        "CHECKIN_HOURS",
    ):
        monkeypatch.delenv(var, raising=False)

    assert config.db_path() == config.DEFAULT_DB_PATH
    assert config.ollama_url() == config.DEFAULT_OLLAMA_URL
    assert config.ollama_model() == config.DEFAULT_OLLAMA_MODEL
    assert config.cors_origin() == config.DEFAULT_CORS_ORIGIN
    assert config.checkin_cron_hours() == "9,13,18"


def test_env_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DB_PATH", "/tmp/x.db")
    monkeypatch.setenv("OLLAMA_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "custom")
    monkeypatch.setenv("CORS_ORIGIN", "http://example.com")
    monkeypatch.setenv("CHECKIN_HOURS", "8")

    assert config.db_path() == "/tmp/x.db"
    assert config.ollama_url() == "http://localhost:11434"
    assert config.ollama_model() == "custom"
    assert config.cors_origin() == "http://example.com"
    assert config.checkin_cron_hours() == "8"


def test_default_model_is_gemma4_26b() -> None:
    assert config.DEFAULT_OLLAMA_MODEL == "gemma4:26b"
