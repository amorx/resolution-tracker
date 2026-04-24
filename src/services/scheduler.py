from collections.abc import Awaitable, Callable
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.config import checkin_cron_hours


def build_scheduler(
    job: Callable[[], Awaitable[object]],
    hours: Optional[str] = None,
    job_id: str = "checkin",
) -> AsyncIOScheduler:
    """Return a configured (but not yet started) scheduler.

    Separated from startup wiring so tests can assert configuration without
    needing a running event loop.
    """
    scheduler = AsyncIOScheduler(timezone="UTC")
    cron_hour = hours or checkin_cron_hours()
    scheduler.add_job(
        job,
        CronTrigger(hour=cron_hour, minute=0),
        id=job_id,
        replace_existing=True,
    )
    return scheduler
