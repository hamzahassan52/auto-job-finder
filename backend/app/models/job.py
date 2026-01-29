from sqlalchemy import Column, Integer, String, Text, JSON, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base


class JobSource(str, enum.Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"
    MANUAL = "manual"


class JobStatus(str, enum.Enum):
    NEW = "new"
    APPLIED = "applied"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    OFFER = "offer"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    # Job Info
    title = Column(String(500), nullable=False)
    company_name = Column(String(255), nullable=False)
    company_email = Column(String(255))  # HR/Contact email
    location = Column(String(255))
    job_type = Column(String(50))  # Full-time, Part-time, Contract

    # Details
    description = Column(Text)
    requirements = Column(JSON, default=list)  # Parsed requirements
    required_skills = Column(JSON, default=list)  # ["Python", "3+ years"]
    salary_range = Column(String(100))

    # Source
    source = Column(Enum(JobSource), default=JobSource.MANUAL)
    source_url = Column(String(1000))
    source_job_id = Column(String(255))  # External job ID

    # AI Analysis
    match_score = Column(Integer)  # 0-100 match with user profile
    ai_summary = Column(Text)  # AI-generated job summary

    # Status
    status = Column(Enum(JobStatus), default=JobStatus.NEW)

    # Relationships
    user = relationship("User", backref="jobs")
