import pytest
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.services.scheduler import build_scheduler


async def dummy_job() -> None:
    return None


def test_build_scheduler_registers_job(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CHECKIN_HOURS", "8,20")
    scheduler = build_scheduler(dummy_job)
    jobs = scheduler.get_jobs()
    assert len(jobs) == 1
    assert jobs[0].id == "checkin"


def test_build_scheduler_uses_explicit_hours() -> None:
    scheduler = build_scheduler(dummy_job, hours="6", job_id="morning")
    assert isinstance(scheduler, AsyncIOScheduler)
    jobs = scheduler.get_jobs()
    assert jobs[0].id == "morning"
