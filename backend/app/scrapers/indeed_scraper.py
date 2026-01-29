from app.scrapers.base_scraper import BaseScraper
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlencode
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class IndeedScraper(BaseScraper):
    """Indeed job scraper with advanced filters."""

    # Country-specific Indeed domains
    COUNTRY_DOMAINS = {
        "canada": "ca.indeed.com",
        "usa": "www.indeed.com",
        "uk": "uk.indeed.com",
        "australia": "au.indeed.com",
        "india": "www.indeed.co.in",
        "germany": "de.indeed.com",
        "pakistan": "pk.indeed.com",
        "uae": "www.indeed.ae",
        "default": "www.indeed.com",
    }

    # Indeed filter mappings
    TIME_FILTERS = {
        "24h": "1",       # Last 24 hours
        "48h": "2",       # Last 2 days
        "1week": "7",     # Last 7 days
        "1month": "30",   # Last 30 days
        "any": "",
    }

    JOB_TYPE_FILTERS = {
        "full_time": "fulltime",
        "part_time": "parttime",
        "contract": "contract",
        "internship": "internship",
        "any": "",
    }

    @property
    def source_name(self) -> str:
        return "indeed"

    def _get_domain(self, country: Optional[str]) -> str:
        """Get Indeed domain for country."""
        if not country:
            return self.COUNTRY_DOMAINS["default"]
        return self.COUNTRY_DOMAINS.get(country.lower(), self.COUNTRY_DOMAINS["default"])

    def _build_search_url(
        self,
        keywords: str,
        location: str = "",
        country: Optional[str] = None,
        city: Optional[str] = None,
        job_type: str = "any",
        work_mode: str = "any",
        posted_within: str = "any",
        visa_sponsorship: bool = False,
    ) -> str:
        """Build Indeed search URL with all filters."""

        domain = self._get_domain(country)

        # Build location string
        loc = location
        if city:
            loc = city
        elif country and not location:
            loc = country

        # Add remote to keywords if searching for remote jobs
        search_keywords = keywords
        if work_mode == "remote":
            search_keywords = f"{keywords} remote"

        # Add visa sponsorship keywords
        if visa_sponsorship:
            search_keywords = f"{search_keywords} visa sponsorship"

        params = {
            "q": search_keywords,
            "l": loc,
            "sort": "date",  # Sort by date (most recent)
        }

        # Add time filter
        if posted_within != "any" and posted_within in self.TIME_FILTERS:
            params["fromage"] = self.TIME_FILTERS[posted_within]

        # Add job type filter
        if job_type != "any" and job_type in self.JOB_TYPE_FILTERS:
            params["jt"] = self.JOB_TYPE_FILTERS[job_type]

        # Add remote filter
        if work_mode == "remote":
            params["remotejob"] = "1"

        # Build URL
        query_string = urlencode({k: v for k, v in params.items() if v})
        return f"https://{domain}/jobs?{query_string}"

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
                posted_within=posted_within,
                visa_sponsorship=visa_sponsorship,
            )

            logger.info(f"Indeed search URL: {url}")
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Parse HTML
            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            # Find job cards (Indeed has multiple card formats)
            job_cards = soup.select(".job_seen_beacon, .jobsearch-ResultsList > li")[:limit]

            for card in job_cards:
                try:
                    # Multiple selectors for different Indeed layouts
                    title_elem = card.select_one(
                        ".jobTitle span, [data-testid='job-title'], .jcs-JobTitle"
                    )
                    company_elem = card.select_one(
                        "[data-testid='company-name'], .companyName, .company"
                    )
                    location_elem = card.select_one(
                        "[data-testid='text-location'], .companyLocation, .location"
                    )
                    link_elem = card.select_one("a.jcs-JobTitle, a[data-jk]")
                    date_elem = card.select_one(".date, [data-testid='myJobsStateDate']")

                    # Check for sponsorship/remote keywords
                    card_text = card.get_text().lower()
                    has_sponsorship = any(kw in card_text for kw in [
                        "visa sponsor", "sponsorship", "sponsor visa",
                        "work authorization", "immigration"
                    ])
                    is_remote = "remote" in card_text

                    if visa_sponsorship and not has_sponsorship:
                        continue

                    if title_elem and company_elem:
                        job_id = ""
                        job_url = ""
                        if link_elem:
                            job_id = link_elem.get("data-jk", "")
                            href = link_elem.get("href", "")
                            if href.startswith("/"):
                                domain = self._get_domain(country)
                                job_url = f"https://{domain}{href}"
                            else:
                                job_url = href

                        job_data = {
                            "title": title_elem.get_text(strip=True),
                            "company": company_elem.get_text(strip=True),
                            "location": location_elem.get_text(strip=True) if location_elem else "",
                            "url": job_url,
                            "source_job_id": job_id,
                            "posted_time": date_elem.get_text(strip=True) if date_elem else "",
                            "source": self.source_name,
                            "has_sponsorship": has_sponsorship,
                            "is_remote": is_remote,
                            "work_mode": "remote" if is_remote else work_mode,
                        }
                        jobs.append(job_data)

                except Exception as e:
                    logger.warning(f"Failed to parse Indeed job card: {e}")
                    continue

            await self.rate_limit()

        except Exception as e:
            logger.error(f"Indeed advanced search failed: {e}")
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
        """Get detailed job information from Indeed."""

        page = await self.get_page()
        details = {}

        try:
            await page.goto(job_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            # Extract details with multiple selectors
            title = soup.select_one(
                "[data-testid='jobsearch-JobInfoHeader-title'], .jobsearch-JobInfoHeader-title"
            )
            company = soup.select_one(
                "[data-testid='inlineHeader-companyName'], .jobsearch-InlineCompanyRating-companyHeader"
            )
            location_elem = soup.select_one(
                "[data-testid='inlineHeader-companyLocation'], .jobsearch-JobInfoHeader-subtitle"
            )
            description = soup.select_one("#jobDescriptionText, .jobsearch-jobDescriptionText")
            salary = soup.select_one("#salaryInfoAndJobType, [data-testid='attribute_snippet_testid']")

            # Check for remote/sponsorship
            desc_text = description.get_text().lower() if description else ""

            details = {
                "title": title.get_text(strip=True) if title else "",
                "company": company.get_text(strip=True) if company else "",
                "location": location_elem.get_text(strip=True) if location_elem else "",
                "description": description.get_text(strip=True) if description else "",
                "salary_range": salary.get_text(strip=True) if salary else "",
                "url": job_url,
                "source": self.source_name,
                "is_remote": "remote" in desc_text,
                "has_sponsorship": any(kw in desc_text for kw in [
                    "visa sponsor", "sponsorship", "work authorization"
                ]),
            }

            await self.rate_limit()

        except Exception as e:
            logger.error(f"Failed to get Indeed job details: {e}")
        finally:
            await page.close()

        return details


indeed_scraper = IndeedScraper()
