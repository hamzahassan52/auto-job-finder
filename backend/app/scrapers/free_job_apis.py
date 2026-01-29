"""
Free Job APIs - No API Key Required
Popular job boards with free public APIs
"""

import httpx
import asyncio
import logging
from typing import Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class RemotiveAPI:
    """Remotive.com - Free Remote Jobs API (Tech Focused)"""

    BASE_URL = "https://remotive.com/api/remote-jobs"

    CATEGORY_MAP = {
        "software": "software-dev",
        "developer": "software-dev",
        "frontend": "software-dev",
        "backend": "software-dev",
        "fullstack": "software-dev",
        "devops": "devops",
        "data": "data",
        "design": "design",
        "marketing": "marketing",
        "sales": "sales",
        "customer": "customer-support",
        "product": "product",
        "qa": "qa",
    }

    @property
    def source_name(self) -> str:
        return "remotive"

    def _detect_category(self, keywords: str) -> Optional[str]:
        keywords_lower = keywords.lower()
        for key, category in self.CATEGORY_MAP.items():
            if key in keywords_lower:
                return category
        return None

    async def search_jobs(self, keywords: str = "", category: Optional[str] = None, limit: int = 20) -> list[dict]:
        jobs = []
        try:
            params = {"limit": min(limit * 2, 100)}
            if not category:
                category = self._detect_category(keywords)
            if category:
                params["category"] = category

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

            all_jobs = data.get("jobs", [])
            keywords_lower = keywords.lower().split()

            for job in all_jobs:
                if len(jobs) >= limit:
                    break
                title = job.get("title", "").lower()
                company = job.get("company_name", "").lower()
                tags = " ".join(job.get("tags", [])).lower()

                if keywords_lower:
                    if not any(kw in title or kw in company or kw in tags for kw in keywords_lower):
                        continue

                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("company_name", ""),
                    "location": job.get("candidate_required_location", "Remote"),
                    "url": job.get("url", ""),
                    "description": job.get("description", "")[:500],
                    "salary_range": job.get("salary", ""),
                    "job_type": job.get("job_type", ""),
                    "posted_date": job.get("publication_date", ""),
                    "tags": job.get("tags", []),
                    "source": self.source_name,
                    "source_job_id": str(job.get("id", "")),
                    "is_remote": True,
                    "company_logo": job.get("company_logo", ""),
                })
            logger.info(f"Remotive: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"Remotive API error: {e}")
        return jobs


class RemoteOKAPI:
    """RemoteOK.com - 100,000+ Remote Jobs (All Categories)"""

    BASE_URL = "https://remoteok.com/api"

    @property
    def source_name(self) -> str:
        return "remoteok"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                response = await client.get(self.BASE_URL)
                response.raise_for_status()
                data = response.json()

            all_jobs = data[1:] if len(data) > 1 else []
            keywords_lower = keywords.lower().split() if keywords else []

            for job in all_jobs:
                if len(jobs) >= limit:
                    break
                if not isinstance(job, dict) or "position" not in job:
                    continue

                title = job.get("position", "").lower()
                company = job.get("company", "").lower()
                job_tags = " ".join(job.get("tags", [])).lower()

                if keywords_lower:
                    if not any(kw in title or kw in company or kw in job_tags for kw in keywords_lower):
                        continue

                slug = job.get("slug", "")
                job_url = f"https://remoteok.com/remote-jobs/{slug}" if slug else ""

                jobs.append({
                    "title": job.get("position", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", "Remote"),
                    "url": job_url,
                    "description": job.get("description", "")[:500] if job.get("description") else "",
                    "salary_range": f"${job.get('salary_min', '')}-${job.get('salary_max', '')}" if job.get('salary_min') else "",
                    "posted_date": job.get("date", ""),
                    "tags": job.get("tags", []),
                    "source": self.source_name,
                    "source_job_id": str(job.get("id", "")),
                    "is_remote": True,
                    "company_logo": job.get("company_logo", ""),
                })
            logger.info(f"RemoteOK: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"RemoteOK API error: {e}")
        return jobs


class WeWorkRemotelyAPI:
    """WeWorkRemotely.com - One of the oldest trusted remote job boards"""

    BASE_URL = "https://weworkremotely.com/remote-jobs.rss"

    @property
    def source_name(self) -> str:
        return "weworkremotely"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                response = await client.get(self.BASE_URL)
                response.raise_for_status()
                content = response.text

            soup = BeautifulSoup(content, "xml")
            items = soup.find_all("item")
            keywords_lower = keywords.lower().split() if keywords else []

            for item in items:
                if len(jobs) >= limit:
                    break

                title = item.find("title").text if item.find("title") else ""
                company = ""
                if ": " in title:
                    company, title = title.split(": ", 1)

                title_lower = title.lower()
                company_lower = company.lower()

                if keywords_lower:
                    if not any(kw in title_lower or kw in company_lower for kw in keywords_lower):
                        continue

                description = item.find("description").text if item.find("description") else ""
                link = item.find("link").text if item.find("link") else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") else ""

                jobs.append({
                    "title": title.strip(),
                    "company": company.strip(),
                    "location": "Remote",
                    "url": link,
                    "description": description[:500] if description else "",
                    "posted_date": pub_date,
                    "source": self.source_name,
                    "source_job_id": link.split("/")[-1] if link else "",
                    "is_remote": True,
                })
            logger.info(f"WeWorkRemotely: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"WeWorkRemotely error: {e}")
        return jobs


class ArbeitnowAPI:
    """Arbeitnow.com - EU/German Jobs"""

    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"

    @property
    def source_name(self) -> str:
        return "arbeitnow"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL)
                response.raise_for_status()
                data = response.json()

            all_jobs = data.get("data", [])
            keywords_lower = keywords.lower().split() if keywords else []

            for job in all_jobs:
                if len(jobs) >= limit:
                    break

                title = job.get("title", "").lower()
                company = job.get("company_name", "").lower()
                tags = " ".join(job.get("tags", [])).lower()

                if keywords_lower:
                    if not any(kw in title or kw in company or kw in tags for kw in keywords_lower):
                        continue

                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("company_name", ""),
                    "location": job.get("location", ""),
                    "url": job.get("url", ""),
                    "description": job.get("description", "")[:500] if job.get("description") else "",
                    "posted_date": job.get("created_at", ""),
                    "tags": job.get("tags", []),
                    "source": self.source_name,
                    "source_job_id": str(job.get("slug", "")),
                    "is_remote": job.get("remote", False),
                })
            logger.info(f"Arbeitnow: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"Arbeitnow API error: {e}")
        return jobs


class JobicyAPI:
    """Jobicy.com - Remote Jobs"""

    BASE_URL = "https://jobicy.com/api/v2/remote-jobs"

    @property
    def source_name(self) -> str:
        return "jobicy"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            params = {"count": min(limit * 2, 50)}
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

            all_jobs = data.get("jobs", [])
            keywords_lower = keywords.lower().split() if keywords else []

            for job in all_jobs:
                if len(jobs) >= limit:
                    break

                title = job.get("jobTitle", "").lower()
                company = job.get("companyName", "").lower()

                if keywords_lower:
                    if not any(kw in title or kw in company for kw in keywords_lower):
                        continue

                jobs.append({
                    "title": job.get("jobTitle", ""),
                    "company": job.get("companyName", ""),
                    "location": job.get("jobGeo", "Remote"),
                    "url": job.get("url", ""),
                    "description": job.get("jobExcerpt", ""),
                    "salary_range": f"${job.get('annualSalaryMin', '')}-${job.get('annualSalaryMax', '')}" if job.get('annualSalaryMin') else "",
                    "job_type": job.get("jobType", ""),
                    "posted_date": job.get("pubDate", ""),
                    "source": self.source_name,
                    "source_job_id": str(job.get("id", "")),
                    "is_remote": True,
                    "company_logo": job.get("companyLogo", ""),
                })
            logger.info(f"Jobicy: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"Jobicy API error: {e}")
        return jobs


class HimalayasAPI:
    """Himalayas.app - Remote Jobs"""

    BASE_URL = "https://himalayas.app/jobs/api"

    @property
    def source_name(self) -> str:
        return "himalayas"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            params = {"limit": min(limit * 2, 50)}
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

            all_jobs = data.get("jobs", [])
            keywords_lower = keywords.lower().split() if keywords else []

            for job in all_jobs:
                if len(jobs) >= limit:
                    break

                title = job.get("title", "").lower()
                company = job.get("companyName", "").lower()

                if keywords_lower:
                    if not any(kw in title or kw in company for kw in keywords_lower):
                        continue

                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("companyName", ""),
                    "location": job.get("locationRestrictions", ["Remote"])[0] if job.get("locationRestrictions") else "Remote",
                    "url": f"https://himalayas.app/jobs/{job.get('slug', '')}",
                    "description": job.get("description", "")[:500] if job.get("description") else "",
                    "salary_range": f"{job.get('salaryCurrency', '')} {job.get('minSalary', '')}" if job.get("minSalary") else "",
                    "posted_date": job.get("pubDate", ""),
                    "tags": job.get("categories", []),
                    "source": self.source_name,
                    "source_job_id": str(job.get("id", "")),
                    "is_remote": True,
                    "company_logo": job.get("companyLogo", ""),
                })
            logger.info(f"Himalayas: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"Himalayas API error: {e}")
        return jobs


class NoDeskAPI:
    """NoDesk.co - Remote Jobs with Tech Stack Details"""

    BASE_URL = "https://nodesk.co/api/job-board-api"

    @property
    def source_name(self) -> str:
        return "nodesk"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            # NoDesk uses RSS feed
            rss_url = "https://nodesk.co/remote-jobs/feed/"
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

            async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                response = await client.get(rss_url)
                response.raise_for_status()
                content = response.text

            soup = BeautifulSoup(content, "xml")
            items = soup.find_all("item")
            keywords_lower = keywords.lower().split() if keywords else []

            for item in items:
                if len(jobs) >= limit:
                    break

                title = item.find("title").text if item.find("title") else ""
                title_lower = title.lower()

                if keywords_lower:
                    if not any(kw in title_lower for kw in keywords_lower):
                        continue

                description = item.find("description").text if item.find("description") else ""
                link = item.find("link").text if item.find("link") else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") else ""

                jobs.append({
                    "title": title,
                    "company": "Via NoDesk",
                    "location": "Remote",
                    "url": link,
                    "description": description[:500] if description else "",
                    "posted_date": pub_date,
                    "source": self.source_name,
                    "source_job_id": link.split("/")[-2] if link else "",
                    "is_remote": True,
                })
            logger.info(f"NoDesk: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"NoDesk error: {e}")
        return jobs


class FindWorkAPI:
    """Findwork.dev - Developer Jobs API"""

    BASE_URL = "https://findwork.dev/api/jobs/"

    @property
    def source_name(self) -> str:
        return "findwork"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        jobs = []
        try:
            params = {"search": keywords} if keywords else {}
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

            async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

            all_jobs = data.get("results", [])

            for job in all_jobs[:limit]:
                jobs.append({
                    "title": job.get("role", ""),
                    "company": job.get("company_name", ""),
                    "location": job.get("location", "Remote"),
                    "url": job.get("url", ""),
                    "description": job.get("text", "")[:500] if job.get("text") else "",
                    "posted_date": job.get("date_posted", ""),
                    "tags": job.get("keywords", []),
                    "source": self.source_name,
                    "source_job_id": str(job.get("id", "")),
                    "is_remote": job.get("remote", False),
                    "company_logo": job.get("company_logo", ""),
                })
            logger.info(f"Findwork: Found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"Findwork error: {e}")
        return jobs


class GitHubJobsAPI:
    """GitHub Jobs alternatives via other sources"""

    @property
    def source_name(self) -> str:
        return "github"

    async def search_jobs(self, keywords: str = "", limit: int = 20) -> list[dict]:
        # GitHub Jobs is deprecated, return empty
        logger.info("GitHub Jobs API is deprecated")
        return []


# Initialize all API instances
remotive_api = RemotiveAPI()
remoteok_api = RemoteOKAPI()
weworkremotely_api = WeWorkRemotelyAPI()
arbeitnow_api = ArbeitnowAPI()
jobicy_api = JobicyAPI()
himalayas_api = HimalayasAPI()
nodesk_api = NoDeskAPI()
findwork_api = FindWorkAPI()


async def search_all_free_sources(keywords: str = "", limit_per_source: int = 10) -> list[dict]:
    """Search all free job sources in parallel."""
    tasks = [
        remotive_api.search_jobs(keywords, limit=limit_per_source),
        remoteok_api.search_jobs(keywords, limit=limit_per_source),
        weworkremotely_api.search_jobs(keywords, limit=limit_per_source),
        arbeitnow_api.search_jobs(keywords, limit=limit_per_source),
        jobicy_api.search_jobs(keywords, limit=limit_per_source),
        himalayas_api.search_jobs(keywords, limit=limit_per_source),
        nodesk_api.search_jobs(keywords, limit=limit_per_source),
        findwork_api.search_jobs(keywords, limit=limit_per_source),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)
        elif isinstance(result, Exception):
            logger.error(f"Source error: {result}")

    return all_jobs
