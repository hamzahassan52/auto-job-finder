from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, TrackingSettings, OpenTracking
from app.core.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = settings.FROM_EMAIL

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> dict:
        """Send email via SendGrid."""

        message = Mail(
            from_email=(from_email or self.from_email, from_name),
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )

        # Enable tracking
        tracking = TrackingSettings()
        tracking.open_tracking = OpenTracking(enable=True)
        message.tracking_settings = tracking

        try:
            response = self.client.send(message)

            # Extract message ID from headers
            message_id = None
            if response.headers:
                message_id = response.headers.get("X-Message-Id")

            return {
                "success": True,
                "status_code": response.status_code,
                "message_id": message_id,
            }

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return {
                "success": False,
                "error": str(e),
            }

    async def send_bulk_emails(self, emails: list[dict]) -> list[dict]:
        """Send multiple emails."""
        results = []
        for email_data in emails:
            result = await self.send_email(
                to_email=email_data["to_email"],
                subject=email_data["subject"],
                body=email_data["body"],
                from_name=email_data.get("from_name"),
            )
            result["email_id"] = email_data.get("id")
            results.append(result)
        return results


email_service = EmailService()
