from sqlalchemy import Column, Integer, String, Text, JSON
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))

    # Profile Info
    phone = Column(String(50))
    linkedin_url = Column(String(500))
    portfolio_url = Column(String(500))

    # Professional Info
    resume_text = Column(Text)  # Parsed resume content
    skills = Column(JSON, default=list)  # ["Python", "FastAPI", "React"]
    experience_years = Column(Integer, default=0)
    current_role = Column(String(255))
    desired_roles = Column(JSON, default=list)  # ["Backend Developer", "Full Stack"]

    # Preferences
    preferred_locations = Column(JSON, default=list)
    salary_expectation = Column(String(100))

    # Settings
    email_signature = Column(Text)
    is_active = Column(Integer, default=1)
