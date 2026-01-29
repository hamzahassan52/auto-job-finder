from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base


class EmailStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    REPLIED = "replied"
    BOUNCED = "bounced"
    FAILED = "failed"


class EmailType(str, enum.Enum):
    APPLICATION = "application"
    FOLLOW_UP = "follow_up"
    THANK_YOU = "thank_you"
    CUSTOM = "custom"


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True, nullable=True)

    # Email Content
    to_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)

    # Attachments
    resume_attached = Column(Boolean, default=False)
    attachment_urls = Column(Text)  # JSON array of attachment URLs

    # Metadata
    email_type = Column(Enum(EmailType), default=EmailType.APPLICATION)
    status = Column(Enum(EmailStatus), default=EmailStatus.DRAFT)

    # Scheduling
    scheduled_at = Column(DateTime(timezone=True))  # When to send
    send_delay_seconds = Column(Integer, default=0)  # Delay between batch emails

    # Tracking
    sendgrid_message_id = Column(String(255))
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    replied_at = Column(DateTime(timezone=True))

    # Failure tracking
    failure_reason = Column(Text)
    retry_count = Column(Integer, default=0)

    # AI Generation
    prompt_used = Column(Text)
    generation_model = Column(String(50))
    generation_method = Column(String(50))  # resume_based, context_based, automated

    # Relationships
    user = relationship("User", backref="emails")
    job = relationship("Job", backref="emails")
