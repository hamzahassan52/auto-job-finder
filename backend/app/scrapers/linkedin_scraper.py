from app.scrapers.base_scraper import BaseScraper
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlencode
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class LinkedInScraper(BaseScraper):
    """LinkedIn job scraper with advanced filters."""

    BASE_URL = "https://www.linkedin.com/jobs/search"

    # LinkedIn filter mappings
    TIME_FILTERS = {
        "24h": "r86400",      # Past 24 hours
        "48h": "r172800",     # Past 48 hours (2 days)
        "1week": "r604800",   # Past week
        "1month": "r2592000", # Past month
        "any": "",
    }

    WORK_MODE_FILTERS = {
        "remote": "2",    # Remote
        "onsite": "1",    # On-site
        "hybrid": "3",    # Hybrid
        "any": "",
    }

    JOB_TYPE_FILTERS = {
        "full_time": "F",
        "part_time": "P",
        "contract": "C",
        "internship": "I",
        "any": "",
    }

    EXPERIENCE_FILTERS = {
        "entry": "2",      # Entry level
        "mid": "3",        # Associate
        "senior": "4",     # Mid-Senior
        "lead": "5",       # Director
        "any": "",
    }

    @property
    def source_name(self) -> str:
        return "linkedin"

    def _build_search_url(
        self,
        keywords: str,
        location: str = "",
        country: Optional[str] = None,
        city: Optional[str] = None,
        job_type: str = "any",
        work_mode: str = "any",
        experience_level: str = "any",
        posted_within: str = "any",
        visa_sponsorship: bool = False,
    ) -> str:
        """Build LinkedIn search URL with all filters."""

        # Build location string
        loc = location
        if city and country:
            loc = f"{city}, {country}"
        elif country:
            loc = country
        elif city:
            loc = city

        params = {
            "keywords": keywords,
            "location": loc,
        }

        # Add time filter
        if posted_within != "any" and posted_within in self.TIME_FILTERS:
            params["f_TPR"] = self.TIME_FILTERS[posted_within]

        # Add work mode filter (remote/onsite/hybrid)
        if work_mode != "any" and work_mode in self.WORK_MODE_FILTERS:
            params["f_WT"] = self.WORK_MODE_FILTERS[work_mode]

        # Add job type filter
        if job_type != "any" and job_type in self.JOB_TYPE_FILTERS:
            params["f_JT"] = self.JOB_TYPE_FILTERS[job_type]

        # Add experience level
        if experience_level != "any" and experience_level in self.EXPERIENCE_FILTERS:
            params["f_E"] = self.EXPERIENCE_FILTERS[experience_level]

        # Sort by most recent
        params["sortBy"] = "DD"

        # Build URL
        query_string = urlencode({k: v for k, v in params.items() if v})
        return f"{self.BASE_URL}?{query_string}"

    async def search_jobs_advanced(
        self,
        keywords: str,
        location: str = "",
        country: Optional[str] = None,
        city: Optional[str] = None,
        job_type: str = "any",
        work_mode: str = "any",
        experience_level: str = "any",
        posted_within: str = "any",
        visa_sponsorship: bool = False,
        limit: int = 20,
    ) -> list[dict]:
        """Advanced job search with all filters."""

        jobs = []
        page = await self.get_page()

        try:
            url = self._build_search_url(
                keywords=keywords,
                location=location,
                country=country,
                city=city,
                job_type=job_type,
                work_mode=work_mode,
                experience_level=experience_level,
                posted_within=posted_within,
                visa_sponsorship=visa_sponsorship,
            )

            logger.info(f"LinkedIn search URL: {url}")
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Scroll to load more jobs
            for _ in range(min(5, (limit // 10) + 1)):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(1500)

            # Parse HTML
            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            # Find job cards
            job_cards = soup.select(".base-card, .job-search-card")[:limit]

            for card in job_cards:
                try:
                    title_elem = card.select_one(".base-search-card__title, .job-search-card__title")
                    company_elem = card.select_one(".base-search-card__subtitle, .job-search-card__subtitle")
                    location_elem = card.select_one(".job-search-card__location")
                    link_elem = card.select_one("a.base-card__full-link, a.job-search-card__link")
                    time_elem = card.select_one("time")

                    # Check for sponsorship keywords in listing
                    card_text = card.get_text().lower()
                    has_sponsorship = any(kw in card_text for kw in [
                        "visa sponsor", "sponsorship", "sponsor visa",
                        "work permit", "immigration support"
                    ])

                    if visa_sponsorship and not has_sponsorship:
                        continue

                    if title_elem and company_elem:
                        job_data = {
                            "title": title_elem.get_text(strip=True),
                            "company": company_elem.get_text(strip=True),
                            "location": location_elem.get_text(strip=True) if location_elem else "",
                            "url": link_elem.get("href") if link_elem else "",
                            "posted_time": time_elem.get("datetime") if time_elem else "",
                            "source": self.source_name,
                            "has_sponsorship": has_sponsorship,
                            "work_mode": work_mode if work_mode != "any" else "unknown",
                        }
                        jobs.append(job_data)

                except Exception as e:
                    logger.warning(f"Failed to parse LinkedIn job card: {e}")
                    continue

            await self.rate_limit()

        except Exception as e:
            logger.error(f"LinkedIn advanced search failed: {e}")
        finally:
            await page.close()

        return jobs

    async def search_jobs(self, query: str, location: str = "", limit: int = 10) -> list[dict]:
        """Basic search (backwards compatible)."""
        return await self.search_jobs_advanced(
            keywords=query,
            location=location,
            limit=limit,
        )

    async def get_job_details(self, job_url: str) -> dict:
        """Get detailed job information from LinkedIn."""

        page = await self.get_page()
        details = {}

        try:
            await page.goto(job_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            # Extract details
            title = soup.select_one(".top-card-layout__title, .topcard__title")
            company = soup.select_one(".topcard__org-name-link, .topcard__flavor--black-link")
            location_elem = soup.select_one(".topcard__flavor--bullet")
            description = soup.select_one(".description__text, .show-more-less-html__markup")
            criteria = soup.select(".description__job-criteria-item")

            # Check for remote/sponsorship in description
            desc_text = description.get_text().lower() if description else ""

            details = {
                "title": title.get_text(strip=True) if title else "",
                "company": company.get_text(strip=True) if company else "",
                "location": location_elem.get_text(strip=True) if location_elem else "",
                "description": description.get_text(strip=True) if description else "",
                "url": job_url,
                "source": self.source_name,
                "is_remote": "remote" in desc_text,
                "has_sponsorship": any(kw in desc_text for kw in [
                    "visa sponsor", "sponsorship", "work permit"
                ]),
            }

            # Parse criteria (experience level, job type, etc.)
            for item in criteria:
                header = item.select_one(".description__job-criteria-subheader")
                value = item.select_one(".description__job-criteria-text")
                if header and value:
                    key = header.get_text(strip=True).lower().replace(" ", "_")
                    details[key] = value.get_text(strip=True)

            await self.rate_limit()

        except Exception as e:
            logger.error(f"Failed to get LinkedIn job details: {e}")
        finally:
            await page.close()

        return details


linkedin_scraper = LinkedInScraper()
