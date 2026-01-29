from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, get_db
from app.api.v1.schemas import UserProfile, UserResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    profile: UserProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile."""

    update_data = profile.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.post("/me/resume")
async def upload_resume(
    resume_text: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and parse resume text."""
    from app.services import ai_service

    # Store raw resume
    current_user.resume_text = resume_text

    # AI could extract skills here (future enhancement)
    # For now, just store the text

    await db.commit()

    return {"message": "Resume uploaded successfully"}
