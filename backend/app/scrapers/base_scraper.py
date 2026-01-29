from abc import ABC, abstractmethod
from playwright.async_api import async_playwright, Browser, Page
from app.core.config import settings
from typing import Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Base class for all job scrapers."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.delay = settings.SCRAPE_DELAY_SECONDS

    async def __aenter__(self):
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()

    async def get_page(self) -> Page:
        """Create new page with default settings."""
        context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            viewport={"width": 1920, "height": 1080},
        )
        return await context.new_page()

    async def rate_limit(self):
        """Apply rate limiting between requests."""
        await asyncio.sleep(self.delay)

    @abstractmethod
    async def search_jobs(self, query: str, location: str = "", limit: int = 10) -> list[dict]:
        """Search for jobs. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def get_job_details(self, job_url: str) -> dict:
        """Get detailed job information. Must be implemented by subclasses."""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return the source name (e.g., 'linkedin', 'indeed')."""
        pass
