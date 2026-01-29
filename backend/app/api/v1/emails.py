from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr
from app.models import User, Job, Email, EmailStatus, EmailType, get_db
from app.core.security import get_current_user
from app.services import ai_service, email_service
import asyncio

router = APIRouter(prefix="/emails", tags=["Emails"])


# Schemas
class EmailGenerateBasic(BaseModel):
    job_id: int
    additional_context: Optional[str] = None


class EmailGenerateFromResume(BaseModel):
    """Option A: Resume + Job Description"""
    job_id: int
    resume_text: str
    custom_instructions: Optional[str] = None


class EmailGenerateFromContext(BaseModel):
    """Option B: Custom Context"""
    context: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    to_email: Optional[str] = None


class EmailGenerateAutomated(BaseModel):
    """Option C: Fully Automated"""
    job_id: int


class EmailCreate(BaseModel):
    job_id: Optional[int] = None
    to_email: EmailStr
    subject: str
    body: str
    resume_attached: bool = False


class EmailSchedule(BaseModel):
    email_id: int
    scheduled_at: datetime


class EmailBatchSend(BaseModel):
    email_ids: list[int]
    delay_seconds: int = 60  # Delay between emails


class EmailResponse(BaseModel):
    id: int
    job_id: Optional[int]
    to_email: str
    subject: str
    body: str
    status: str
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Email Generation Endpoints

@router.post("/generate/basic")
async def generate_email_basic(
    data: EmailGenerateBasic,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate email from job + user profile."""

    result = await db.execute(
        select(Job).where(Job.id == data.job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    email_content = await ai_service.generate_application_email(
        job_title=job.title,
        company_name=job.company_name,
        job_description=job.description or "",
        job_requirements=job.required_skills or [],
        user_name=current_user.full_name or "Applicant",
        user_skills=current_user.skills or [],
        user_experience=f"{current_user.experience_years} years" if current_user.experience_years else "Entry level",
        user_current_role=current_user.current_role or "Professional",
        additional_context=data.additional_context,
        resume_text=current_user.resume_text,
    )

    if current_user.email_signature:
        email_content["body"] += f"\n\n{current_user.email_signature}"

    return {
        "job_id": job.id,
        "company": job.company_name,
        "position": job.title,
        "suggested_email": job.company_email,
        "generated": email_content,
        "method": "basic",
    }


@router.post("/generate/resume-based")
async def generate_email_from_resume(
    data: EmailGenerateFromResume,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Option A: Generate from resume + job description."""

    result = await db.execute(
        select(Job).where(Job.id == data.job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    email_content = await ai_service.generate_email_from_resume(
        resume_text=data.resume_text,
        job_description=job.description or f"{job.title} at {job.company_name}",
        user_name=current_user.full_name or "Applicant",
        custom_instructions=data.custom_instructions,
    )

    if current_user.email_signature:
        email_content["body"] += f"\n\n{current_user.email_signature}"

    return {
        "job_id": job.id,
        "company": job.company_name,
        "position": job.title,
        "suggested_email": job.company_email,
        "generated": email_content,
        "method": "resume_based",
    }


@router.post("/generate/context-based")
async def generate_email_from_context(
    data: EmailGenerateFromContext,
    current_user: User = Depends(get_current_user),
):
    """Option B: Generate from custom context/instructions."""

    email_content = await ai_service.generate_email_from_context(
        user_name=current_user.full_name or "Applicant",
        context=data.context,
        job_title=data.job_title,
        company_name=data.company_name,
    )

    if current_user.email_signature:
        email_content["body"] += f"\n\n{current_user.email_signature}"

    return {
        "job_title": data.job_title,
        "company": data.company_name,
        "suggested_email": data.to_email,
        "generated": email_content,
        "method": "context_based",
    }


@router.post("/generate/automated")
async def generate_email_automated(
    data: EmailGenerateAutomated,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Option C: Fully automated AI generation."""

    result = await db.execute(
        select(Job).where(Job.id == data.job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_data = {
        "title": job.title,
        "company": job.company_name,
        "description": job.description,
        "requirements": job.required_skills,
        "location": job.location,
    }

    user_profile = {
        "name": current_user.full_name,
        "current_role": current_user.current_role,
        "skills": current_user.skills,
        "experience_years": current_user.experience_years,
        "resume_summary": current_user.resume_text[:500] if current_user.resume_text else None,
    }

    email_content = await ai_service.generate_fully_automated_email(
        job_data=job_data,
        user_profile=user_profile,
    )

    if current_user.email_signature:
        email_content["body"] += f"\n\n{current_user.email_signature}"

    return {
        "job_id": job.id,
        "company": job.company_name,
        "position": job.title,
        "suggested_email": job.company_email,
        "generated": email_content,
        "method": "automated",
    }


# Email CRUD

@router.post("/", response_model=EmailResponse)
async def create_email(
    data: EmailCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save email as draft."""

    email = Email(
        user_id=current_user.id,
        job_id=data.job_id,
        to_email=data.to_email,
        subject=data.subject,
        body=data.body,
        resume_attached=data.resume_attached,
        email_type=EmailType.APPLICATION,
        status=EmailStatus.DRAFT,
    )

    db.add(email)
    await db.commit()
    await db.refresh(email)

    return email


@router.post("/{email_id}/send", response_model=EmailResponse)
async def send_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a single email immediately."""

    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == current_user.id)
    )
    email = result.scalar_one_or_none()

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    if email.status in [EmailStatus.SENT, EmailStatus.DELIVERED]:
        raise HTTPException(status_code=400, detail=f"Email already {email.status.value}")

    email.status = EmailStatus.SENDING

    send_result = await email_service.send_email(
        to_email=email.to_email,
        subject=email.subject,
        body=email.body,
        from_name=current_user.full_name,
    )

    if send_result["success"]:
        email.status = EmailStatus.SENT
        email.sent_at = datetime.utcnow()
        email.sendgrid_message_id = send_result.get("message_id")

        # Update job status
        if email.job_id:
            job_result = await db.execute(select(Job).where(Job.id == email.job_id))
            job = job_result.scalar_one_or_none()
            if job:
                from app.models import JobStatus
                job.status = JobStatus.APPLIED
    else:
        email.status = EmailStatus.FAILED
        email.failure_reason = send_result.get("error")
        email.retry_count += 1

    await db.commit()
    await db.refresh(email)

    if not send_result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed: {send_result.get('error')}")

    return email


@router.post("/{email_id}/schedule")
async def schedule_email(
    email_id: int,
    scheduled_at: datetime,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule email for later."""

    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == current_user.id)
    )
    email = result.scalar_one_or_none()

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    email.status = EmailStatus.SCHEDULED
    email.scheduled_at = scheduled_at

    await db.commit()

    return {"message": f"Email scheduled for {scheduled_at}", "email_id": email_id}


@router.post("/batch-send")
async def batch_send_emails(
    data: EmailBatchSend,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send multiple emails with delay (avoid spam)."""

    result = await db.execute(
        select(Email).where(
            Email.id.in_(data.email_ids),
            Email.user_id == current_user.id,
            Email.status.in_([EmailStatus.DRAFT, EmailStatus.QUEUED]),
        )
    )
    emails = result.scalars().all()

    if not emails:
        raise HTTPException(status_code=404, detail="No valid emails found")

    # Queue all emails
    for email in emails:
        email.status = EmailStatus.QUEUED
        email.send_delay_seconds = data.delay_seconds

    await db.commit()

    # Start background sending
    background_tasks.add_task(
        send_emails_with_delay,
        [e.id for e in emails],
        data.delay_seconds,
        current_user.id,
        current_user.full_name,
    )

    return {
        "message": f"Queued {len(emails)} emails for sending",
        "delay_seconds": data.delay_seconds,
        "email_ids": [e.id for e in emails],
    }


async def send_emails_with_delay(
    email_ids: list[int],
    delay_seconds: int,
    user_id: int,
    user_name: str,
):
    """Background task to send emails with delay."""

    from app.models.base import async_session

    async with async_session() as db:
        for i, email_id in enumerate(email_ids):
            if i > 0:
                await asyncio.sleep(delay_seconds)

            result = await db.execute(
                select(Email).where(Email.id == email_id)
            )
            email = result.scalar_one_or_none()

            if email and email.status == EmailStatus.QUEUED:
                email.status = EmailStatus.SENDING

                send_result = await email_service.send_email(
                    to_email=email.to_email,
                    subject=email.subject,
                    body=email.body,
                    from_name=user_name,
                )

                if send_result["success"]:
                    email.status = EmailStatus.SENT
                    email.sent_at = datetime.utcnow()
                    email.sendgrid_message_id = send_result.get("message_id")
                else:
                    email.status = EmailStatus.FAILED
                    email.failure_reason = send_result.get("error")

                await db.commit()


# Email Listing with Filters

@router.get("/", response_model=list[EmailResponse])
async def list_emails(
    status_filter: Optional[str] = None,
    hours_ago: Optional[int] = None,  # 24 or 48
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List emails with optional filters."""

    query = select(Email).where(Email.user_id == current_user.id)

    if status_filter:
        query = query.where(Email.status == EmailStatus(status_filter))

    if hours_ago:
        cutoff = datetime.utcnow() - timedelta(hours=hours_ago)
        query = query.where(Email.created_at >= cutoff)

    query = query.order_by(Email.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/recent/{hours}")
async def get_recent_emails(
    hours: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get emails from last X hours (24/48)."""

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    result = await db.execute(
        select(Email)
        .where(Email.user_id == current_user.id, Email.created_at >= cutoff)
        .order_by(Email.created_at.desc())
    )
    emails = result.scalars().all()

    return {
        "hours": hours,
        "count": len(emails),
        "emails": [
            {
                "id": e.id,
                "to_email": e.to_email,
                "subject": e.subject,
                "status": e.status.value,
                "sent_at": e.sent_at,
                "created_at": e.created_at,
            }
            for e in emails
        ],
    }


@router.get("/stats")
async def get_email_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get email statistics."""

    from sqlalchemy import func

    # Total by status
    result = await db.execute(
        select(Email.status, func.count(Email.id))
        .where(Email.user_id == current_user.id)
        .group_by(Email.status)
    )

    status_counts = {row[0].value: row[1] for row in result.all()}

    # Last 24 hours
    last_24h = datetime.utcnow() - timedelta(hours=24)
    sent_24h = await db.execute(
        select(func.count(Email.id)).where(
            Email.user_id == current_user.id,
            Email.status == EmailStatus.SENT,
            Email.sent_at >= last_24h,
        )
    )

    return {
        "total_drafts": status_counts.get("draft", 0),
        "total_sent": status_counts.get("sent", 0),
        "total_failed": status_counts.get("failed", 0),
        "total_scheduled": status_counts.get("scheduled", 0),
        "sent_last_24h": sent_24h.scalar(),
    }


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get email details."""

    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == current_user.id)
    )
    email = result.scalar_one_or_none()

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    return email


@router.delete("/{email_id}")
async def delete_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete draft email."""

    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == current_user.id)
    )
    email = result.scalar_one_or_none()

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    if email.status == EmailStatus.SENT:
        raise HTTPException(status_code=400, detail="Cannot delete sent email")

    await db.delete(email)
    await db.commit()

    return {"message": "Email deleted"}
