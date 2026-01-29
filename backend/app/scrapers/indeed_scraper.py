import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlencode
from typing import Optional
import logging
import asyncio

logger = logging.getLogger(__name__)


class IndeedScraper:
    """Indeed job scraper with httpx (no browser required)."""

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

    TIME_FILTERS = {
        "24h": "1",
        "48h": "2",
        "1week": "7",
        "1month": "30",
        "any": "",
    }

    JOB_TYPE_FILTERS = {
        "full_time": "fulltime",
        "part_time": "parttime",
        "contract": "contract",
        "internship": "internship",
        "any": "",
    }

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "max-age=0",
            "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }

    @property
    def source_name(self) -> str:
        return "indeed"

    def _get_domain(self, country: Optional[str]) -> str:
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
        domain = self._get_domain(country)

        loc = location
        if city:
            loc = city
        elif country and not location:
            loc = country

        search_keywords = keywords
        if work_mode == "remote":
            search_keywords = f"{keywords} remote"

        if visa_sponsorship:
            search_keywords = f"{search_keywords} visa sponsorship"

        params = {
            "q": search_keywords,
            "l": loc,
            "sort": "date",
        }

        if posted_within != "any" and posted_within in self.TIME_FILTERS:
            params["fromage"] = self.TIME_FILTERS[posted_within]

        if job_type != "any" and job_type in self.JOB_TYPE_FILTERS:
            params["jt"] = self.JOB_TYPE_FILTERS[job_type]

        if work_mode == "remote":
            params["remotejob"] = "1"

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

            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                content = response.text

            soup = BeautifulSoup(content, "lxml")

            # Find job cards
            job_cards = soup.select(".job_seen_beacon, .jobsearch-ResultsList > li, .resultContent")[:limit]

            if not job_cards:
                # Try alternative selectors
                job_cards = soup.select("[data-testid='job-result'], .tapItem")[:limit]

            logger.info(f"Found {len(job_cards)} job cards")

            for card in job_cards:
                try:
                    title_elem = card.select_one(
                        ".jobTitle span, [data-testid='job-title'], .jcs-JobTitle, h2.jobTitle a"
                    )
                    company_elem = card.select_one(
                        "[data-testid='company-name'], .companyName, .company, span.css-92r8pb"
                    )
                    location_elem = card.select_one(
                        "[data-testid='text-location'], .companyLocation, .location"
                    )
                    link_elem = card.select_one("a.jcs-JobTitle, a[data-jk], h2.jobTitle a")
                    date_elem = card.select_one(".date, [data-testid='myJobsStateDate'], .css-1yxxt5t")

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

            await asyncio.sleep(2)  # Rate limiting

        except Exception as e:
            logger.error(f"Indeed search error: {e}")

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
        details = {}

        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=30.0) as client:
                response = await client.get(job_url)
                response.raise_for_status()
                content = response.text

            soup = BeautifulSoup(content, "lxml")

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

            await asyncio.sleep(2)  # Rate limiting

        except Exception as e:
            logger.error(f"Failed to get Indeed job details: {e}")

        return details


indeed_scraper = IndeedScraper()
