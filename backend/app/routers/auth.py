import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.core.deps import CurrentUser, DbSession
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserProfile,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

REFRESH_COOKIE = "helixa_refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=False,  # set True behind HTTPS in production
        samesite="strict",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/api/auth",
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.auth_rate_limit)
async def signup(request: Request, body: SignupRequest, response: Response, db: DbSession) -> AuthResponse:
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        date_of_birth=body.date_of_birth,
        phone=body.phone,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    _set_refresh_cookie(response, refresh_token)

    return AuthResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserProfile.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit(settings.auth_rate_limit)
async def login(request: Request, body: LoginRequest, response: Response, db: DbSession) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    _set_refresh_cookie(response, refresh_token)

    return AuthResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserProfile.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: DbSession) -> TokenResponse:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(str(user_id))
    new_refresh = create_refresh_token(str(user_id))
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(
        access_token=new_access,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserProfile)
async def me(current_user: CurrentUser) -> UserProfile:
    return UserProfile.model_validate(current_user)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.auth_rate_limit)
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: DbSession) -> dict:
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    # Always return 202 — do not leak whether the email exists
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.flush()
        # In production wire up an email provider here.
        # For now, the token is returned in the response body for local dev/testing.
        return {"message": "If that email is registered you will receive a reset link.", "dev_token": token}
    return {"message": "If that email is registered you will receive a reset link."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit(settings.auth_rate_limit)
async def reset_password(request: Request, body: ResetPasswordRequest, db: DbSession) -> dict:
    result = await db.execute(select(User).where(User.reset_token == body.token))
    user = result.scalar_one_or_none()
    if (
        user is None
        or user.reset_token_expires is None
        or datetime.now(timezone.utc) > user.reset_token_expires
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.flush()
    return {"message": "Password updated successfully"}


@router.put("/me", response_model=UserProfile)
async def update_profile(body: ProfileUpdateRequest, current_user: CurrentUser, db: DbSession) -> UserProfile:
    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password required to set new password")
        if not verify_password(body.current_password, current_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password incorrect")
        current_user.hashed_password = hash_password(body.new_password)

    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    if body.date_of_birth is not None:
        current_user.date_of_birth = body.date_of_birth
    if body.phone is not None:
        current_user.phone = body.phone
    if body.blood_group is not None:
        current_user.blood_group = body.blood_group
    if body.gender is not None:
        current_user.gender = body.gender
    if body.address is not None:
        current_user.address = body.address

    await db.flush()
    return UserProfile.model_validate(current_user)
