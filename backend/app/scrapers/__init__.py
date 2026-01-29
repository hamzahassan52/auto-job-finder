from app.scrapers.base_scraper import BaseScraper
from app.scrapers.linkedin_scraper import LinkedInScraper, linkedin_scraper
from app.scrapers.indeed_scraper import IndeedScraper, indeed_scraper
from app.scrapers.free_job_apis import (
    remotive_api,
    remoteok_api,
    weworkremotely_api,
    arbeitnow_api,
    jobicy_api,
    himalayas_api,
    nodesk_api,
    findwork_api,
    search_all_free_sources,
)

__all__ = [
    "BaseScraper",
    "LinkedInScraper",
    "linkedin_scraper",
    "IndeedScraper",
    "indeed_scraper",
    # Free APIs (no key required)
    "remotive_api",
    "remoteok_api",
    "weworkremotely_api",
    "arbeitnow_api",
    "jobicy_api",
    "himalayas_api",
    "nodesk_api",
    "findwork_api",
    "search_all_free_sources",
]
