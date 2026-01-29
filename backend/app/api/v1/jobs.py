from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, HttpUrl
from typing import Optional
from app.models import User, Job, JobSource, JobStatus, get_db
from app.api.v1.schemas import (
    JobSearch, JobCreate, JobResponse, AdvancedJobSearch,
    JobType, WorkMode, TimeFilter, ExperienceLevel
)
from app.core.security import get_current_user
from app.services import ai_service
from app.scrapers import linkedin_scraper, indeed_scraper
from app.scrapers import (
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

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# Free sources mapping - 8 popular job boards
FREE_SOURCES = {
    "remotive": remotive_api,
    "remoteok": remoteok_api,
    "weworkremotely": weworkremotely_api,
    "arbeitnow": arbeitnow_api,
    "jobicy": jobicy_api,
    "himalayas": himalayas_api,
    "nodesk": nodesk_api,
    "findwork": findwork_api,
}


# Schema for URL import
class JobImportURL(BaseModel):
    url: str
    company_email: Optional[str] = None


def detect_source(url: str) -> str:
    """Detect job source from URL."""
    url_lower = url.lower()
    if "linkedin.com" in url_lower:
        return "linkedin"
    elif "indeed.com" in url_lower:
        return "indeed"
    elif "glassdoor.com" in url_lower:
        return "glassdoor"
    elif "naukri.com" in url_lower:
        return "naukri"
    return "manual"


@router.post("/search/advanced")
async def advanced_job_search(
    search: AdvancedJobSearch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Advanced job search with all filters.

    Example:
    ```json
    {
        "keywords": "Software Engineer",
        "country": "Canada",
        "city": "Toronto",
        "work_mode": "remote",
        "posted_within": "24h",
        "visa_sponsorship": true,
        "sources": ["linkedin", "indeed"]
    }
    ```
    """

    all_jobs = []

    # Build location string
    location = search.location or ""
    if search.city and search.country:
        location = f"{search.city}, {search.country}"
    elif search.country:
        location = search.country
    elif search.city:
        location = search.city

    # Search LinkedIn
    if "linkedin" in search.sources:
        try:
            async with linkedin_scraper as scraper:
                jobs = await scraper.search_jobs_advanced(
                    keywords=search.keywords,
                    location=location,
                    country=search.country,
                    city=search.city,
                    job_type=search.job_type.value,
                    work_mode=search.work_mode.value,
                    experience_level=search.experience_level.value,
                    posted_within=search.posted_within.value,
                    visa_sponsorship=search.visa_sponsorship,
                    limit=search.limit,
                )
                all_jobs.extend(jobs)
        except Exception as e:
            print(f"LinkedIn search error: {e}")

    # Search Indeed
    if "indeed" in search.sources:
        try:
            jobs = await indeed_scraper.search_jobs_advanced(
                keywords=search.keywords,
                location=location,
                country=search.country,
                city=search.city,
                job_type=search.job_type.value,
                work_mode=search.work_mode.value,
                experience_level=search.experience_level.value,
                posted_within=search.posted_within.value,
                visa_sponsorship=search.visa_sponsorship,
                limit=search.limit,
            )
            all_jobs.extend(jobs)
        except Exception as e:
            print(f"Indeed search error: {e}")

    # Save jobs to database
    saved_jobs = []
    for job_data in all_jobs:
        # Check if job already exists (by URL)
        if job_data.get("url"):
            existing = await db.execute(
                select(Job).where(
                    Job.user_id == current_user.id,
                    Job.source_url == job_data.get("url")
                )
            )
            if existing.scalar_one_or_none():
                continue

        job = Job(
            user_id=current_user.id,
            title=job_data.get("title", ""),
            company_name=job_data.get("company", ""),
            location=job_data.get("location", ""),
            source=JobSource(job_data.get("source", "manual")) if job_data.get("source") in ["linkedin", "indeed"] else JobSource.MANUAL,
            source_url=job_data.get("url", ""),
            source_job_id=job_data.get("source_job_id", ""),
        )
        db.add(job)
        saved_jobs.append({
            **job_data,
            "saved": True
        })

    await db.commit()

    return {
        "message": f"Found {len(all_jobs)} jobs, saved {len(saved_jobs)} new jobs",
        "search_criteria": {
            "keywords": search.keywords,
            "location": location,
            "work_mode": search.work_mode.value,
            "posted_within": search.posted_within.value,
            "visa_sponsorship": search.visa_sponsorship,
        },
        "total_found": len(all_jobs),
        "new_saved": len(saved_jobs),
        "jobs": all_jobs,
    }


# Schema for free sources search
class FreeSourceSearch(BaseModel):
    keywords: str
    sources: list[str] = ["remotive", "remoteok", "jobicy", "arbeitnow", "himalayas"]
    limit_per_source: int = 10
    save_to_db: bool = True


@router.post("/search/free")
async def search_free_sources(
    search: FreeSourceSearch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search jobs from FREE sources (no API key required).

    Available sources:
    - remotive: Remote jobs (tech focused)
    - remoteok: Remote jobs (all categories)
    - jobicy: Remote jobs
    - arbeitnow: EU/German jobs
    - himalayas: Remote jobs

    Example:
    ```json
    {
        "keywords": "react developer",
        "sources": ["remotive", "remoteok", "jobicy"],
        "limit_per_source": 10
    }
    ```
    """
    import asyncio

    all_jobs = []

    # Create tasks for selected sources
    tasks = []
    source_names = []

    for source_name in search.sources:
        if source_name in FREE_SOURCES:
            api = FREE_SOURCES[source_name]
            tasks.append(api.search_jobs(search.keywords, limit=search.limit_per_source))
            source_names.append(source_name)

    # Run all searches in parallel
    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(results):
            if isinstance(result, list):
                all_jobs.extend(result)
            else:
                print(f"{source_names[i]} error: {result}")

    # Save to database if requested
    saved_count = 0
    if search.save_to_db:
        for job_data in all_jobs:
            # Check if job already exists
            if job_data.get("url"):
                existing = await db.execute(
                    select(Job).where(
                        Job.user_id == current_user.id,
                        Job.source_url == job_data.get("url")
                    )
                )
                if existing.scalar_one_or_none():
                    continue

            job = Job(
                user_id=current_user.id,
                title=job_data.get("title", ""),
                company_name=job_data.get("company", ""),
                location=job_data.get("location", "Remote"),
                description=job_data.get("description", ""),
                salary_range=job_data.get("salary_range", ""),
                source=JobSource.MANUAL,  # Will be shown as source in response
                source_url=job_data.get("url", ""),
                source_job_id=job_data.get("source_job_id", ""),
            )
            db.add(job)
            saved_count += 1

        await db.commit()

    return {
        "message": f"Found {len(all_jobs)} jobs from {len(search.sources)} free sources",
        "sources_searched": search.sources,
        "total_found": len(all_jobs),
        "new_saved": saved_count,
        "jobs": all_jobs,
    }


@router.get("/sources/free")
async def list_free_sources():
    """List all available free job sources - 8 popular boards."""
    return {
        "sources": [
            {
                "id": "remotive",
                "name": "Remotive",
                "url": "https://remotive.com",
                "description": "Tech remote jobs - curated listings",
                "job_types": ["Remote"],
            },
            {
                "id": "remoteok",
                "name": "RemoteOK",
                "url": "https://remoteok.com",
                "description": "100,000+ remote jobs worldwide",
                "job_types": ["Remote"],
            },
            {
                "id": "weworkremotely",
                "name": "We Work Remotely",
                "url": "https://weworkremotely.com",
                "description": "Oldest & most trusted remote job board",
                "job_types": ["Remote"],
            },
            {
                "id": "jobicy",
                "name": "Jobicy",
                "url": "https://jobicy.com",
                "description": "Remote jobs",
                "job_types": ["Remote"],
            },
            {
                "id": "arbeitnow",
                "name": "Arbeitnow",
                "url": "https://arbeitnow.com",
                "description": "EU/German jobs",
                "job_types": ["Remote", "On-site"],
            },
            {
                "id": "himalayas",
                "name": "Himalayas",
                "url": "https://himalayas.app",
                "description": "Remote jobs with company profiles",
                "job_types": ["Remote"],
            },
            {
                "id": "nodesk",
                "name": "NoDesk",
                "url": "https://nodesk.co",
                "description": "Remote jobs with tech stack details",
                "job_types": ["Remote"],
            },
            {
                "id": "findwork",
                "name": "Findwork",
                "url": "https://findwork.dev",
                "description": "Developer jobs API",
                "job_types": ["Remote", "On-site"],
            },
        ]
    }


@router.post("/import-url")
async def import_job_from_url(
    data: JobImportURL,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import job directly from URL - scrape and parse automatically."""

    source = detect_source(data.url)
    job_details = {}

    # Scrape based on source
    if source == "linkedin":
        async with linkedin_scraper as scraper:
            job_details = await scraper.get_job_details(data.url)
    elif source == "indeed":
        job_details = await indeed_scraper.get_job_details(data.url)
    else:
        job_details = {"url": data.url, "source": source}

    if not job_details.get("title"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract job details from URL. Try manual entry.",
        )

    # Parse with AI for better structure
    if job_details.get("description"):
        parsed = await ai_service.parse_job_description(job_details["description"])
        job_details["required_skills"] = parsed.get("required_skills", [])
        job_details["ai_summary"] = parsed.get("summary", "")

    # Create job record
    job = Job(
        user_id=current_user.id,
        title=job_details.get("title", "Unknown Position"),
        company_name=job_details.get("company", "Unknown Company"),
        company_email=data.company_email,
        location=job_details.get("location", ""),
        description=job_details.get("description", ""),
        required_skills=job_details.get("required_skills", []),
        ai_summary=job_details.get("ai_summary", ""),
        source=JobSource(source) if source in ["linkedin", "indeed"] else JobSource.MANUAL,
        source_url=data.url,
    )

    # Calculate match score
    if job.required_skills and current_user.skills:
        match_result = await ai_service.calculate_match_score(
            job_requirements=job.required_skills,
            user_skills=current_user.skills,
            user_experience=current_user.experience_years or 0,
        )
        job.match_score = match_result.get("score", 0)

    db.add(job)
    await db.commit()
    await db.refresh(job)

    return {
        "message": "Job imported successfully",
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company_name,
            "location": job.location,
            "match_score": job.match_score,
            "required_skills": job.required_skills,
            "ai_summary": job.ai_summary,
            "is_remote": job_details.get("is_remote", False),
            "has_sponsorship": job_details.get("has_sponsorship", False),
        },
    }


@router.post("/search")
async def search_jobs(
    search: JobSearch,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Basic job search (backwards compatible)."""

    all_jobs = []

    if "linkedin" in search.sources:
        async with linkedin_scraper as scraper:
            jobs = await scraper.search_jobs(
                query=search.query,
                location=search.location,
                limit=search.limit,
            )
            all_jobs.extend(jobs)

    if "indeed" in search.sources:
        jobs = await indeed_scraper.search_jobs(
            query=search.query,
            location=search.location,
            limit=search.limit,
        )
        all_jobs.extend(jobs)

    # Save jobs to database
    saved_jobs = []
    for job_data in all_jobs:
        job = Job(
            user_id=current_user.id,
            title=job_data.get("title", ""),
            company_name=job_data.get("company", ""),
            location=job_data.get("location", ""),
            source=JobSource(job_data.get("source", "manual")),
            source_url=job_data.get("url", ""),
            source_job_id=job_data.get("source_job_id", ""),
        )
        db.add(job)
        saved_jobs.append(job)

    await db.commit()

    return {
        "message": f"Found {len(all_jobs)} jobs",
        "jobs": [
            {
                "title": j.title,
                "company": j.company_name,
                "location": j.location,
                "source": j.source.value,
            }
            for j in saved_jobs
        ],
    }


@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually add a job."""

    job = Job(
        user_id=current_user.id,
        title=job_data.title,
        company_name=job_data.company_name,
        company_email=job_data.company_email,
        location=job_data.location,
        description=job_data.description,
        requirements=job_data.requirements,
        source=JobSource.MANUAL,
        source_url=job_data.source_url,
    )

    # Parse job with AI if description provided
    if job_data.description:
        parsed = await ai_service.parse_job_description(job_data.description)
        job.required_skills = parsed.get("required_skills", [])
        job.ai_summary = parsed.get("summary", "")

    # Calculate match score
    if job.required_skills and current_user.skills:
        match_result = await ai_service.calculate_match_score(
            job_requirements=job.required_skills,
            user_skills=current_user.skills,
            user_experience=current_user.experience_years or 0,
        )
        job.match_score = match_result.get("score", 0)

    db.add(job)
    await db.commit()
    await db.refresh(job)

    return job


@router.get("/", response_model=list[JobResponse])
async def list_jobs(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all jobs for current user."""

    query = select(Job).where(Job.user_id == current_user.id)

    if status_filter:
        query = query.where(Job.status == JobStatus(status_filter))

    query = query.order_by(Job.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats")
async def get_job_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get application statistics."""

    from sqlalchemy import func

    total = await db.execute(
        select(func.count(Job.id)).where(Job.user_id == current_user.id)
    )

    by_status = await db.execute(
        select(Job.status, func.count(Job.id))
        .where(Job.user_id == current_user.id)
        .group_by(Job.status)
    )

    status_counts = {row[0].value: row[1] for row in by_status.all()}

    return {
        "total_jobs": total.scalar(),
        "new": status_counts.get("new", 0),
        "applied": status_counts.get("applied", 0),
        "interview": status_counts.get("interview", 0),
        "rejected": status_counts.get("rejected", 0),
        "offer": status_counts.get("offer", 0),
    }


@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update job application status."""

    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job.status = JobStatus(new_status)
    await db.commit()

    return {"message": f"Status updated to {new_status}"}


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get job details."""

    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return job
