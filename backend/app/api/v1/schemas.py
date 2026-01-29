from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


# Enums for filters
class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    ANY = "any"


class WorkMode(str, Enum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"
    ANY = "any"


class TimeFilter(str, Enum):
    LAST_24H = "24h"
    LAST_48H = "48h"
    LAST_WEEK = "1week"
    LAST_MONTH = "1month"
    ANY = "any"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    ANY = "any"


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserProfile(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_text: Optional[str] = None
    skills: list[str] = []
    experience_years: int = 0
    current_role: Optional[str] = None
    desired_roles: list[str] = []
    preferred_locations: list[str] = []
    salary_expectation: Optional[str] = None
    email_signature: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    skills: list[str]
    experience_years: int
    current_role: Optional[str]

    class Config:
        from_attributes = True


# Advanced Job Search Schema
class AdvancedJobSearch(BaseModel):
    """Advanced search with all filters"""
    # Required
    keywords: str  # "Software Engineer", "Python Developer"

    # Location
    country: Optional[str] = None  # "Canada", "USA", "UK"
    city: Optional[str] = None  # "Toronto", "Vancouver"
    location: Optional[str] = None  # Combined location string

    # Filters
    job_type: JobType = JobType.ANY
    work_mode: WorkMode = WorkMode.ANY  # Remote, On-site, Hybrid
    experience_level: ExperienceLevel = ExperienceLevel.ANY

    # Visa/Sponsorship
    visa_sponsorship: bool = False  # Only jobs offering visa

    # Time filter
    posted_within: TimeFilter = TimeFilter.ANY

    # Sources
    sources: list[str] = ["linkedin", "indeed"]  # Which sites to search

    # Pagination
    limit: int = 20


class JobSearch(BaseModel):
    query: str
    location: Optional[str] = ""
    sources: list[str] = ["linkedin", "indeed"]
    limit: int = 10


class JobCreate(BaseModel):
    title: str
    company_name: str
    company_email: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: list[str] = []
    source_url: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    company_name: str
    company_email: Optional[str]
    location: Optional[str]
    description: Optional[str]
    required_skills: list[str]
    match_score: Optional[int]
    status: str
    source: str
    source_url: Optional[str]
    salary_range: Optional[str]
    job_type: Optional[str]
    is_remote: Optional[bool]
    ai_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Email Schemas
class EmailGenerate(BaseModel):
    job_id: int
    additional_context: Optional[str] = None


class EmailCreate(BaseModel):
    job_id: Optional[int] = None
    to_email: EmailStr
    subject: str
    body: str


class EmailSend(BaseModel):
    email_id: int


class EmailResponse(BaseModel):
    id: int
    job_id: Optional[int]
    to_email: str
    subject: str
    body: str
    status: str
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
